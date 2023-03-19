#include <ArduinoBLE.h>

/*
    List of assigned numbers/UUIDs for Bluetooth SIG-defined services:
    https://btprodspecificationrefs.blob.core.windows.net/assigned-numbers/Assigned%20Number%20Types/Assigned%20Numbers.pdf

    As of 2023-03-16:
     - 3.4 GATT Services (page 68)
     - 3.5 Units (page 72)
     - 3.8 Characteristics (page 82)
*/

BLEService sundialService("181A");                               // Environmental Sensing service
BLEFloatCharacteristic azimuthCharacteristic("2BE1", BLERead);   // Light Distribution ¯\_(ツ)_/¯
BLEFloatCharacteristic altitudeCharacteristic("2A6C", BLERead);  // Elevation

// TODO: make it work with BLENotify

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

    if (central) {
        while (central.connected()) {
            // Read characteristics
            // TODO

            // Example
            azimuthCharacteristic.writeValueLE(-11.7);
            altitudeCharacteristic.writeValueLE(0.0);

            delay(1000);
        }
    }
}
