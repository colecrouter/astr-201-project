type SkyPeriod = 'Sunrise' | 'Day' | 'Sunset' | 'Night';
type SkyColour = [number, number, number];
const SkyColours: Record<SkyPeriod, SkyColour> = {
    Sunrise: [255, 192, 140],
    Day: [150, 237, 248],
    Sunset: [255, 87, 51],
    Night: [8, 0, 150],
};

// Return a colour that represent the color of the sky at the given azimuth
export const getSkyColour = (altitude: number, hourAngle: number) => {
    // Return the colour of the sky at the given azimuth
    if (altitude <= -10) {
        return SkyColours.Night;
    } else if (altitude > 20) {
        return SkyColours.Day;
    } else {
        if (hourAngle < 0) {
            return SkyColours.Sunrise;
        }
        return SkyColours.Sunset;
    }
};

export const isNight = (azimuth: number) => {
    return azimuth > 270;
};