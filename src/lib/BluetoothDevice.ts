import { declination, hourAngle, localSolarTime, apparentSolarTime } from "$lib/SunMath";
import { writable, type Readable, type Writable } from "svelte/store";

export interface SundialData {
    // TODO
    time: Date;
    declination: number;
    azimuth: number;
    elevation: number;
    latitude: number;
}

export class BluetoothSundial {
    private _data: Writable<SundialData | undefined>;
    private _connected: boolean;

    constructor() {
        this._connected = false;
        // this._data = writable(undefined);
        this._data = writable();

        // Test
        setTimeout(() => {
            // Increase azimuth by 1 every 5 seconds
            this._data.update((data) => {
                if (data) {
                    data.azimuth += 1;
                    if (data.azimuth > 360) {
                        data.azimuth = 0;
                    }
                }
                return data;

            },);
        }, 3000);

        this.scan();
    }

    async scan() {
        // 17:05
        const azimuth = -119.35;
        const altitude = 14.53;

        // 1 PM
        // const azimuth = 176.32;
        // const altitude = 33.43;

        // Noon
        // const azimuth = 158.83;
        // const altitude = 31.35;

        // TEST LAT LONG 50.43560173881614, -104.5553877673448
        const latitude = 50.4356017388161;
        const longitude = -104.5553877673448;

        // Get noon today
        const date = new Date();
        // date.setHours(12, 0, 0, 0);

        const d = declination({ latitude, longitude, date });
        const ha = hourAngle({ latitude, longitude, azimuth, altitude, declination: d });
        console.log(ha);

        const ast = apparentSolarTime({ date, azimuth, altitude, hourAngle: ha });

        const lst = localSolarTime({ latitude, longitude, date, azimuth, altitude, hourAngle: ha });
        console.log(ast, '\n', lst);

        // TEST DATA
        this._data.set({
            time: lst,
            declination: d,
            azimuth: 270,
            elevation: altitude,
            latitude: latitude,
        });
    }

    // TODO mostly
    async connect() {
        // TODO
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

}