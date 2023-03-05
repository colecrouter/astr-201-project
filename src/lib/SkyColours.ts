import type { SundialData } from "./BluetoothDevice";

type SkyPeriod = 'Sunrise' | 'Day' | 'Sunset' | 'Night';
type SkyColour = [number, number, number];
const SkyColours: Record<SkyPeriod, SkyColour> = {
    Sunrise: [255, 192, 140],
    Day: [150, 237, 248],
    Sunset: [255, 87, 51],
    Night: [8, 0, 150],
};

// Return a colour that represent the color of the sky at the given azimuth
export const GetSkyColour = (azimuth: SundialData['azimuth']) => {
    // Return the colour of the sky at the given azimuth
    if (azimuth <= 90) {
        return SkyColours.Sunrise;
    } else if (azimuth <= 180) {
        return SkyColours.Day;
    } else if (azimuth <= 270) {
        return SkyColours.Sunset;
    }
    return SkyColours.Night;
};

export const IsNight = (azimuth: SundialData['azimuth']) => {
    return azimuth > 270;
};