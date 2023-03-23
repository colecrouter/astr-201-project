#include <ArduinoBLE.h>

/*
    List of assigned numbers/UUIDs for Bluetooth SIG-defined services:
    https://btprodspecificationrefs.blob.core.windows.net/assigned-numbers/Assigned%20Number%20Types/Assigned%20Numbers.pdf

    As of 2023-03-16:
     - 3.4 GATT Services (page 68)
     - 3.5 Units (page 72)
     - 3.8 Characteristics (page 82)
*/

BLEService sundialService("181A");                                           // Environmental Sensing service
BLEFloatCharacteristic azimuthCharacteristic("2BE1", BLERead | BLENotify);   // Light Distribution ¯\_(ツ)_/¯
BLEFloatCharacteristic altitudeCharacteristic("2A6C", BLERead | BLENotify);  // Elevation

BLEService locationService("1819");                                          // Location and Navigation service
BLEFloatCharacteristic magneticDeclinationCharacteristic("2AB0", BLEWrite);  // Local North Coordinate

void setup() {
    // Freeze if Bluetooth initialization fails
    if (!BLE.begin()) {
        while (1) {
        }
    }

    BLE.setLocalName("Sundial");
    BLE.setAdvertisedService(sundialService);

    sundialService.addCharacteristic(azimuthCharacteristic);
    sundialService.addCharacteristic(altitudeCharacteristic);
    BLE.addService(sundialService);

    // Optional, for true north alignment
    // locationService.addCharacteristic(magneticDeclinationCharacteristic);
    // BLE.addService(locationService);

    BLE.advertise();
}

void loop() {
    // Get connected device
    BLEDevice central = BLE.central();

    // Example
    float azimuth = -11.7;
    float altitude = 0.0;

    if (central) {
        // On initial connection, send current values
        azimuthCharacteristic.writeValueLE(azimuth);
        altitudeCharacteristic.writeValueLE(altitude);

        while (central.connected()) {
            // Read characteristics, update variables
            // TODO

            // TODO uncomment these when values are actually changing
            // Check if characteristic has changed
            // if (azimuthCharacteristic.valueLE() != azimuth) {
            azimuthCharacteristic.writeValueLE(azimuth);
            // }
            // if (altitudeCharacteristic.valueLE() != altitude) {
            altitudeCharacteristic.writeValueLE(altitude);
            // }

            delay(1000);
        }
    }

    delay(1000);
}
