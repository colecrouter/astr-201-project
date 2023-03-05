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
    _data: Writable<SundialData | undefined>;
    _connected: boolean;

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
        const azimuth = (179.30);
        const altitude = 33.49;

        // TEST LAT LONG 50.43560173881614, -104.5553877673448
        const latitude = 50.4356017388161;
        const longitude = -104.5553877673448;

        // Get noon today
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        // Get date as days of year (1-366)
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const G = dayOfYear * 2 * Math.PI / 365;
        // const declination = (23.45) * Math.cos((360 / 365) * (dayOfYear + 10) * 0.0175); // Don't forget to convert to radians
        const declination = (0.006918 - 0.399912 * Math.cos(G) + 0.070257 * Math.sin(G) - 0.006758 * Math.cos(2 * G) + 0.000907 * Math.sin(2 * G) - 0.002697 * Math.cos(3 * G) + 0.00148 * Math.sin(3 * G)) * 180 / Math.PI;
        console.log(declination);

        // const solarAngle = (Math.sin(altitude) - (Math.sin(latitude) * Math.sin(declination))) / (Math.cos(latitude) * Math.cos(declination));
        // console.log(solarAngle);

        const eqnOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(G) - 0.032077 * Math.sin(G) - 0.014615 * Math.cos(2 * G) - 0.040849 * Math.sin(2 * G));
        const timeOffset = eqnOfTime - (4 * longitude) - (60 * date.getTimezoneOffset());
        const trueSolarTime = (date.getTime() / 60 / 60 / 60) + timeOffset;
        console.log(trueSolarTime);

        const solarHourAngle = (Math.sin(altitude) - (Math.sin(latitude) * Math.sin(declination))) / (Math.cos(latitude));
        console.log(solarHourAngle);

        const EoT = 229.18 * (0.000075 + 0.001868 * Math.cos(G) - 0.032077 * Math.sin(G) - 0.014615 * Math.cos(2 * G) - 0.040849 * Math.sin(2 * G));

        const TC = 4 * (10) + EoT;
        // const localSolarTime;

        // const solarAngle = (Math.sin(altitude) - (Math.sin(latitude) * Math.sin(declination))) / (Math.cos(latitude) * Math.cos(declination));
        // const JD = 367 * date.getFullYear() - Math.floor(7 * (date.getFullYear() + Math.floor((date.getMonth() + 9) / 12)) / 4) + Math.floor(275 * date.getMonth() / 9) + date.getDate() + 1721013.5;
        // const D = JD - Math.floor(JD);
        // const localSolarSeconds = (12 * 60 * 60) + ((4 * (longitude / 2) + EoT + eqnOfTime) / 60);
        // const localSolarTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        // localSolarTime.setSeconds(localSolarSeconds);
        const newTime = new Date();

        console.log(newTime);

        // TEST DATA
        this._data.set({
            time: newTime,
            declination: declination,
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