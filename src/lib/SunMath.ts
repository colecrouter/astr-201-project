type BasicParams = {
    latitude: number;
    longitude: number;
};

type TimeParams = {
    date: Date;
};

type SolarParams = {
    azimuth: number;
    altitude: number;
};

const stripTime = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const toRadians = (degrees: number) => {
    return degrees * Math.PI / 180;
};

const toDegrees = (radians: number) => {
    return radians * 180 / Math.PI;
};

export const declination: (params: BasicParams & TimeParams) => number = (params) => {
    const date = stripTime(params.date);

    // Get date as days of year (1-366)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);

    // Calculate the declination of the sun
    const angle = toRadians(-23.45) * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
    return toDegrees(angle);
};

export const hourAngle = (params: BasicParams & SolarParams & { declination: number; }) => {
    // Radians
    const latitude = toRadians(params.latitude);
    const altitude = toRadians(params.altitude);
    const declination = toRadians(params.declination);
    const azimuth = toRadians(params.azimuth);

    // Test by recreating the altitude
    // const alt = Math.sin(declination) * Math.sin(latitude) + Math.cos(declination) * Math.cos(latitude) * Math.cos(0);
    // console.log(toDegrees(Math.asin(alt)), params.altitude);

    // Derive α = sin^(−1)[sinδ*sinϕ + cosδ*cosϕ*cosγ] to get γ
    const cosHA = (Math.sin(altitude) - (Math.sin(latitude) * Math.sin(declination))) / (Math.cos(latitude) * Math.cos(declination));

    // Determine if HA should be positive or negative
    const HA = -Math.sign(azimuth) * Math.acos(Math.min(Math.max(cosHA, -1), 1));

    return toDegrees(HA);
};

export const eqnOfTime = (params: BasicParams & TimeParams) => {
    const date = stripTime(params.date);

    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const G = (dayOfYear - 81) * ((2 * Math.PI) / 365);
    const EoT = 9.87 * Math.sin(2 * G) - 7.53 * Math.cos(G) - 1.5 * Math.sin(G);

    return EoT;
};

// export const analemma: (params: BasicParams & TimeParams) => number[] = (params) => {

// };

export const apparentSolarTime: (params: TimeParams & SolarParams & { hourAngle: number; }) => Date = (params) => {
    const date = stripTime(params.date);

    const ast = (params.hourAngle + 180) * 4;
    return new Date(date.getTime() + ast * 60 * 1000);
};

export const localSolarTime: (params: BasicParams & TimeParams & SolarParams & { hourAngle: number; }) => Date = (params) => {
    const date = stripTime(params.date);
    const longitude = Math.abs(params.longitude);
    const ast = apparentSolarTime(params).getTime();

    // Calculate time offset
    const EoT = eqnOfTime(params);

    // Calculate time correction via Local Standard Time Meridian
    // const lstm = 15 * params.date.getTimezoneOffset() / 60; // I can't figure the proper equation out, but the equation below works
    const tc = (4 * longitude) - params.date.getTimezoneOffset() - EoT;

    // Calculate the actual approximate time
    // Get the minutes in the day from ast
    const astMinutes = Math.floor(ast / 1000 / 60);
    const lst = astMinutes + tc;

    return new Date(lst * 60 * 1000);
};