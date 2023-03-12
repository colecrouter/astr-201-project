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

export class BluetoothSundial {
    private _data: Writable<SundialData | undefined>;
    private _connected: boolean;

    constructor() {
        this._connected = false;
        // this._data = writable(undefined);
        this._data = writable();

        this.scan();
    }

    async scan() {
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

        // Get noon today
        const date = new Date();
        // date.setHours(12, 0, 0, 0);

        const d = declination({ latitude, longitude, date });
        const ha = hourAngle({ latitude, longitude, azimuth, altitude, declination: d });
        // console.log(ha);

        const equationOfTime = eqnOfTime({ date, latitude, longitude });

        const ast = apparentSolarTime({ date, azimuth, altitude, hourAngle: ha });

        const lst = localSolarTime({ latitude, longitude, date, azimuth, altitude, hourAngle: ha });
        // console.log(ast, '\n', lst);

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

    // TODO mostly
    async connect() {
        // TODO
        if ("hid" in navigator === false) {
            alert("Bluetooth not supported in this browser");
            throw new Error("Bluetooth not supported");
        }

        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
        });
        console.log(device);
    }

    async disconnect() {
        // TODO
    }

    get connected(): boolean {
        return this._connected;
    }

    get data(): Readable<SundialData | undefined> {
        return this._data;
    }

};