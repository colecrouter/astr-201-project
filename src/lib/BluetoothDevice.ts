import { declination, hourAngle, localSolarTime, apparentSolarTime, eqnOfTime, localSiderealTime } from "$lib/SunMath";
import { writable, type Readable, type Writable } from "svelte/store";

export interface SundialData {
    // TODO
    correctedTime: Date;
    apparentTime: Date;
    siderealTime: Date;
    declination: number;
    azimuth: number;
    elevation: number;
    latitude: number;
    hourAngle: number;
    equationOfTime: number;
    // analemma: number;
}

const POLLING_INTERVAL = 1000; // ms

export class BluetoothSundial {
    private _data: Writable<SundialData | undefined>;
    private _device: BluetoothDevice | undefined;
    private _connected: Writable<boolean>;
    private _interval: number | undefined;

    constructor() {
        this._data = writable();
        this._device = undefined;
        this._connected = writable(false);
    }

    private async eventHandler(event: Event) {
        // 17:05
        // const azimuth = -109.34;
        // const altitude = 8.99;

        // 1 PM
        // const azimuth = -170.77;
        // const altitude = 31.70;

        // Noon
        const azimuth = 171.62;
        const altitude = 31.76;

        // 9 AM
        // const azimuth = 124.20;
        // const altitude = 17.80;

        // TEST LAT LONG 50.43560173881614, -104.5553877673448
        const latitude = 50.4356017388161;
        const longitude = -104.5553877673448;

        // Date will get stripped of time in the functions below
        const date = new Date();

        const d = declination({ latitude, longitude, date });
        const ha = hourAngle({ latitude, longitude, azimuth, altitude, declination: d });
        const equationOfTime = eqnOfTime({ date, latitude, longitude });
        const ast = apparentSolarTime({ date, azimuth, altitude, hourAngle: ha });
        const lst = localSolarTime({ latitude, longitude, date, azimuth, altitude, hourAngle: ha });
        const siderealTime = localSiderealTime({ localSolarTime: lst });

        // TEST DATA
        this._data.set({
            apparentTime: ast,
            correctedTime: lst,
            siderealTime: siderealTime,
            declination: d,
            azimuth: azimuth,
            elevation: altitude,
            latitude: latitude,
            hourAngle: ha,
            equationOfTime: equationOfTime,
        });
    }

    async connect() {
        if ("bluetooth" in navigator === false) {
            alert("Bluetooth not supported in this browser");
            throw new Error("Bluetooth not supported");
        }

        const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['environmental_sensing'] }] });

        if (device === null) {
            alert("No device selected");
            throw new Error("No device selected");
        }

        if (device.gatt === undefined) {
            alert("No GATT connection");
            throw new Error("No GATT connection");
        }

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService("environmental_sensing"); // 0x181A
        const characteristic = await service.getCharacteristic("solar"); // 0x21

        // Start polling for data
        this._interval = setInterval(async () => {
            const data = await characteristic.readValue();
            console.log(new Uint8Array(data.buffer));
            // TODO
        }, POLLING_INTERVAL);

        this._device = device;
        this._connected.set(true);
    }

    async disconnect() {
        // Stop polling for data
        clearInterval(this._interval);

        this._device = undefined;
        this._connected.set(false);
    }

    get connected(): Readable<boolean> {
        return this._connected;
    }

    get data(): Readable<SundialData | undefined> {
        return this._data;
    }

};