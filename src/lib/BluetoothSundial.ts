import { apparentSolarTime, declination, eqnOfTime, hourAngle, localSiderealTime, localSolarTime, magneticDeclination } from "$lib/SunMath";
import { get, writable, type Readable, type Writable } from "svelte/store";

export interface ComputedSundialData {
    // TODO
    correctedTime: Date;
    apparentTime: Date;
    siderealTime: Date;
    declination: number;
    azimuth: number;
    elevation: number;
    longitude: number;
    latitude: number;
    hourAngle: number;
    equationOfTime: number;
    magneticDeclination: number;
    // analemma: number;
}

export const enum DeviceState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    READY,
}

const POLLING_INTERVAL = 3000; // ms

const SUNDIAL_SERVICE_UUID = 0x181A satisfies BluetoothServiceUUID;
const LOCATION_SERVICE_UUID = 0x1819 satisfies BluetoothServiceUUID;
const AZIMUTH_CHARACTERISTIC_UUID = 0x2BE1 satisfies BluetoothCharacteristicUUID;
const ALTITUDE_CHARACTERISTIC_UUID = 0x2A6C satisfies BluetoothCharacteristicUUID;
const NORTH_CHARACTERISTIC_UUID = 0x2AB0 satisfies BluetoothCharacteristicUUID;

export class BluetoothSundial {
    private _data: Writable<ComputedSundialData | undefined>;
    private _connected: Writable<DeviceState>;
    private _server: BluetoothRemoteGATTServer | undefined;
    private _location: Readable<GeolocationPosition>;
    private _characteristics: Map<BluetoothCharacteristicUUID, BluetoothRemoteGATTCharacteristic>;

    constructor(location: Readable<GeolocationPosition>) {
        this._data = writable();
        this._connected = writable(DeviceState.DISCONNECTED);
        this._location = location;
        this._characteristics = new Map();
    }

    private async readHandler() {
        // 17:05
        // const azimuth = -109.34;
        // const altitude = 8.99;

        // 1 PM
        // const azimuth = -170.77;
        // const altitude = 31.70;

        // Noon
        // const azimuth = 171.62;
        // const altitude = 31.76;

        // 9 AM
        // const azimuth = 124.20;
        // const altitude = 17.80;

        // TEST LAT LONG 50.43560173881614, -104.5553877673448
        // const latitude = 50.4356017388161;
        // const longitude = -104.5553877673448;

        if (get(this._connected) === DeviceState.DISCONNECTED) {
            // The event loop should exit after this, so we just return
            return;
        } else if (!this._server) {
            throw new Error("No server");
        } else if (this._location === undefined) {
            throw new Error("No location");
        } else if (!this._server.connected) {
            // Sometimes the device disconnects, so we need to reconnect
            console.debug("Reconnecting...");
            await this._server.connect();
        }

        console.debug("Polling...");

        // Extract long and lat from our device location
        const coords = (({ latitude, longitude }: GeolocationCoordinates) => ({ latitude, longitude }))(get(this._location).coords);

        // Grabs characteristics from map, saved in map by connect()
        let azimuthChar = this._characteristics.get(AZIMUTH_CHARACTERISTIC_UUID);
        let altitudeChar = this._characteristics.get(ALTITUDE_CHARACTERISTIC_UUID);
        let northChar = this._characteristics.get(NORTH_CHARACTERISTIC_UUID);

        // Extract the azimuth and altitude from the characteristics; we can't read to northChar
        // NOTE: readValue() seems to not work on mobile, which is why we're using notify
        const [azimuth, altitude] = await Promise.all([azimuthChar, altitudeChar]
            .map(async (char) => (char!.value) // char won't be undefined, because sunService is guaranteed to exist
                ?.getFloat32(0, true)));

        // If we can't read the azimuth or altitude, return and try again later
        if (azimuth === undefined || altitude === undefined) { return; }

        // Date will get stripped of time in the functions below
        const date = new Date();

        const d = declination({ ...coords, date });
        const ha = hourAngle({ ...coords, azimuth, altitude, declination: d });
        const equationOfTime = eqnOfTime({ ...coords, date });
        const ast = apparentSolarTime({ date, azimuth, altitude, hourAngle: ha });
        const lst = localSolarTime({ ...coords, date, azimuth, altitude, hourAngle: ha });
        const siderealTime = localSiderealTime({ localSolarTime: lst });
        const magDec = magneticDeclination(coords);

        // TEST DATA
        this._data.set({
            apparentTime: ast,
            correctedTime: lst,
            siderealTime: siderealTime,
            declination: d,
            azimuth: azimuth,
            elevation: altitude,
            longitude: coords.longitude,
            latitude: coords.latitude,
            hourAngle: ha,
            equationOfTime: equationOfTime,
            magneticDeclination: magDec
        });
    }

    private async writeHandler() {
        if (get(this._connected) === DeviceState.DISCONNECTED) {
            // The event loop should exit after this, so we just return
            return;
        } else if (!this._server) {
            throw new Error("No server");
        } else if (this._location === undefined) {
            throw new Error("No location");
        } else if (!this._server.connected) {
            // Sometimes the device disconnects, so we need to reconnect
            console.debug("Reconnecting...");
            await this._server.connect();
        }

        // Extract long and lat from our device location
        const coords = (({ latitude, longitude }: GeolocationCoordinates) => ({ latitude, longitude }))(get(this._location).coords);

        // Grabs characteristics from map, saved in map by connect()
        let northChar = this._characteristics.get(NORTH_CHARACTERISTIC_UUID);
        if (!northChar) { return; }

        // If the sundial supports magnetic declination, send it to the device so the user can align the sundial
        const magDec = magneticDeclination(coords);
        await northChar.writeValue(new Float32Array([magDec]))
            .catch(() => undefined);
    }

    async connect() {
        if ("bluetooth" in navigator === false) {
            alert("Bluetooth not supported in this browser");
            throw new Error("Bluetooth not supported");
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SUNDIAL_SERVICE_UUID] }
            ],
            optionalServices: [LOCATION_SERVICE_UUID]
        });

        if (device === null) {
            alert("No device selected");
            throw new Error("No device selected");
        }

        if (device.gatt === undefined) {
            alert("No GATT connection");
            throw new Error("No GATT connection");
        }

        try {
            console.debug("Connecting to GATT Server...");
            this._connected.set(DeviceState.CONNECTING);
            this._server = await device.gatt.connect();
            this._connected.set(DeviceState.CONNECTED);

            // Grab characteristics from the sundial service
            // Get services we need from the server
            const [sunService, locService] = await Promise.all([
                this._server.getPrimaryService(SUNDIAL_SERVICE_UUID),
                this._server.getPrimaryService(LOCATION_SERVICE_UUID).catch(() => undefined)
            ]);

            console.debug("Got services: ", sunService, locService);

            // Get all the characteristics we need from the corresponding services
            const serviceCharsMap = new Map([
                [sunService, [AZIMUTH_CHARACTERISTIC_UUID, ALTITUDE_CHARACTERISTIC_UUID]],
                [locService, [NORTH_CHARACTERISTIC_UUID]]
            ]);
            const chars = await Promise.all(
                [...serviceCharsMap.entries()]
                    .map(async ([service, uuids]) => await Promise.all(uuids
                        .map(async (uuid) => {
                            const a = await service?.getCharacteristic(uuid);
                            a && this._characteristics.set(uuid, a);
                            return a;
                        }))))
                .then((charArrays) => charArrays.flat());

            // Add event listeners for azimuth and altitude
            const [azimuthChar, altitudeChar] = chars;
            azimuthChar?.addEventListener("characteristicvaluechanged", this.readHandler.bind(this));
            altitudeChar?.addEventListener("characteristicvaluechanged", this.readHandler.bind(this));
            await azimuthChar?.startNotifications();
            await altitudeChar?.startNotifications();

            // Add event listener for location
            const [northChar] = chars;
            northChar && this._location.subscribe(() => this.writeHandler.bind(this));

            console.debug("Got characteristics: ", ...chars);
            this._connected.set(DeviceState.READY);
        } catch (e) {
            console.error(e);
            alert("Error connecting to device");
            this.disconnect();
        }
    }

    async disconnect() {
        this._server?.disconnect();
        this._server = undefined;
        this._connected.set(DeviceState.DISCONNECTED);
    }

    get connected(): Readable<DeviceState> {
        return this._connected;
    }

    get data(): Readable<ComputedSundialData | undefined> {
        return this._data;
    }
};