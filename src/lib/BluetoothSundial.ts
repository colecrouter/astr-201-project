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

const POLLING_INTERVAL = 1000; // ms

const SUNDIAL_SERVICE_UUID: BluetoothServiceUUID = 0x181A;
const LOCATION_SERVICE_UUID: BluetoothServiceUUID = 0x1819;
const AZIMUTH_CHARACTERISTIC_UUID: BluetoothCharacteristicUUID = 0x2BE1;
const ALTITUDE_CHARACTERISTIC_UUID: BluetoothCharacteristicUUID = 0x2A6C;
const NORTH_CHARACTERISTIC_UUID: BluetoothCharacteristicUUID = 0x2AB0;

export class BluetoothSundial {
    private _data: Writable<ComputedSundialData | undefined>;
    private _connected: Writable<boolean>;
    private _server: BluetoothRemoteGATTServer | undefined;
    private _location: Readable<GeolocationPosition>;

    constructor(location: Readable<GeolocationPosition>) {
        this._data = writable();
        this._connected = writable(false);
        this._location = location;
    }

    private async eventHandler() {
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

        if (this._server === undefined) {
            throw new Error("No server");
        } else if (this._location === undefined) {
            throw new Error("No location");
        } else if (!this._server.connected) {
            throw new Error("Not connected");
        }

        // Extract long and lat from our device location
        const coords = (({ latitude, longitude }: GeolocationCoordinates) => ({ latitude, longitude }))(get(this._location).coords);

        // Get services we need from the server
        const sunService = await this._server.getPrimaryService(SUNDIAL_SERVICE_UUID);
        const locService = await this._server.getPrimaryService(LOCATION_SERVICE_UUID)
            .catch(() => undefined);

        // Get all the characteristics we need from the corresponding services
        const serviceCharsMap = new Map([
            [sunService, [AZIMUTH_CHARACTERISTIC_UUID, ALTITUDE_CHARACTERISTIC_UUID]],
            [locService, [NORTH_CHARACTERISTIC_UUID]]
        ]);
        const [azimuthChar, altitudeChar, northChar] = await Promise.all(
            [...serviceCharsMap.entries()]
                .map(async ([service, uuids]) => await Promise.all(uuids
                    .map(async (uuid) => await service?.getCharacteristic(uuid)))))
            .then((charArrays) => charArrays.flat());

        // Extract the azimuth and altitude from the characteristics; we can't read to northChar 
        const [azimuth, altitude] = await Promise.all([azimuthChar, altitudeChar]
            .map(async (char) => (await char!.readValue()).getFloat32(0, true))); // char won't be undefined, because sunService is guaranteed to exist

        // If the sundial supports magnetic declination, send it to the device so the user can align the sundial
        const magDec = magneticDeclination(coords);
        northChar?.writeValue(new Float32Array([magDec]));

        // Date will get stripped of time in the functions below
        const date = new Date();

        const d = declination({ ...coords, date });
        const ha = hourAngle({ ...coords, azimuth, altitude, declination: d });
        const equationOfTime = eqnOfTime({ ...coords, date });
        const ast = apparentSolarTime({ date, azimuth, altitude, hourAngle: ha });
        const lst = localSolarTime({ ...coords, date, azimuth, altitude, hourAngle: ha });
        const siderealTime = localSiderealTime({ localSolarTime: lst });

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

    async connect() {
        if ("bluetooth" in navigator === false) {
            alert("Bluetooth not supported in this browser");
            throw new Error("Bluetooth not supported");
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SUNDIAL_SERVICE_UUID] }
            ]
        });

        if (device === null) {
            alert("No device selected");
            throw new Error("No device selected");
        }

        if (device.gatt === undefined) {
            alert("No GATT connection");
            throw new Error("No GATT connection");
        }

        this._server = await device.gatt.connect();
        this._connected.set(true);

        // Start polling for data
        (async () => {
            while (this._server?.connected) {
                await new Promise((resolve) => setTimeout(async () => {
                    await this.eventHandler();
                    resolve(true);
                }, POLLING_INTERVAL));
            }
        })();
    }

    async disconnect() {
        this._server = undefined;
        this._connected.set(false);
    }

    get connected(): Readable<boolean> {
        return this._connected;
    }

    get data(): Readable<ComputedSundialData | undefined> {
        return this._data;
    }
};