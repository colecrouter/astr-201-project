#include <ArduinoBLE.h>
#include <QMC5883LCompass.h>

/*
    List of assigned numbers/UUIDs for Bluetooth SIG-defined services:
    https://btprodspecificationrefs.blob.core.windows.net/assigned-numbers/Assigned%20Number%20Types/Assigned%20Numbers.pdf

    As of 2023-03-16:
     - 3.4 GATT Services (page 68)
     - 3.5 Units (page 72)
     - 3.8 Characteristics (page 82)
*/

#define WEST_PIN 0
#define NORTH_PIN 0
#define EAST_PIN 0
#define NORTH_THRESHOLD 5 // DEG

BLEService sundialService("181A");                                           // Environmental Sensing service
BLEFloatCharacteristic azimuthCharacteristic("2BE1", BLERead | BLENotify);   // Light Distribution ¯\_(ツ)_/¯
BLEFloatCharacteristic altitudeCharacteristic("2A6C", BLERead | BLENotify);  // Elevation

BLEService locationService("1819");                                          // Location and Navigation service
BLEFloatCharacteristic magneticDeclinationCharacteristic("2AB0", BLEWrite);  // Local North Coordinate

QMC5883LCompass compass;

#define SIGNAL 36

#define NUM_PHOTORESISTORS 26
#define NUM_PHOTORESISTORGROUPS 13
#define NUM_PINS 4

uint8_t azimuthPins[NUM_PHOTORESISTORGROUPS] = {
  // 36,
  // 39,
  // 34,
  // 35,
  32,
  33,
  25,
  // 26,
  // 27,
  // 14,
  // 12,
  // 13,
  // 4,
};

bool* getDarkSensors() {
  // Find our dark threshold
  // int16_t darkest = 4095;
  // int16_t lightest = 0;
  // for (uint8_t i = 0; i < num_sensors; i++) {
  //   int16_t value = analogRead(azimuthPins[i]);
  //   if (value == 4095 || value == 0) { continue; }

  //   lightest = lightest > value ? value : lightest;
  //   darkest = darkest < value ? value : darkest;
  // }

  // Test
  int16_t darkest = 300;
  int16_t lightest = 3000;

  // Cut in delta half, that'll be o;ur threshold
  uint16_t delta = (lightest-darkest);
  uint16_t lowerThreshold = darkest+(delta/3);
  uint16_t upperThreshold = lightest-(delta/3);

  // Figure out which pins are dark

  for (uint8_t i = 0; i < NUM_PHOTORESISTORS; i++) {
    for (uint8_t j = 0; j < NUM_PINS; j++) {
      digitalWrite(azimuthPins[j], bitRead(i, j));
    }

    uint16_t value = analogRead(SIGNAL); 
    Serial.printf("SENSOR %d: %d\n", i, value);
    if (value <= lowerThreshold) { 
      // Serial.printf("PIN %d: LIGHT\n", i);
      status[(i*2)]=false;
      status[(i*2)+1]=false;
      continue;
    } else if (value >= upperThreshold){
      status[(i*2)]=true;
      status[(i*2)+1]=true;
    } else if (value > lowerThreshold && value < upperThreshold) {
      if (i > 0 && status[(i-1) == false]) {
        status[(i*2)]=true;
        status[(i*2)+1]=false;
      } else {
        status[(i*2)]=false;
        status[(i*2)+1]=true;
      }
      continue;
    } else { 
      Serial.println("ruh roh");
    }
    // Serial.printf("PIN %d: DARK\n", i);
  }
  Serial.println();

  return status;
}

bool status[NUM_PHOTORESISTORS];

void setup() {
    // Setup pins
    for (uint8_t i = 0; i < NUM_PHOTORESISTORGROUPS; i++) {
      pinMode(azimuthPins[i], OUTPUT);
    }
    pinMode(SIGNAL, INPUT);


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
    locationService.addCharacteristic(magneticDeclinationCharacteristic);
    BLE.addService(locationService);

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

        float offset;
        float sundialAngle;
        while (central.connected()) {
            // Read characteristics, update variables
            offset = magneticDeclinationCharacteristic.valueLE();
            
            // Convert from magnetic north to true north
            sundialAngle = compass.getAzimuth() + offset;

            // Light up LEDs to help the user align the sundial
            digitalWrite(WEST_PIN, (sundialAngle - NORTH_THRESHOLD > 0));
            digitalWrite(NORTH_PIN, (sundialAngle - NORTH_THRESHOLD <= 0 && sundialAngle + NORTH_THRESHOLD >= 0));
            digitalWrite(EAST_PIN, (sundialAngle + NORTH_THRESHOLD < 0));

            // Read values
            getDarkSensors();
            for (uint8_t i = 0; i < NUM_PHOTORESISTORS; i++) {
              // Serial.print(status[i] ? 1 : 0);
            }

            // Calculate the Sun's azimuth based on status[]
            int litCount = 0;
            for (int i = 0; i < NUM_PHOTORESISTORS; i++) {
              if (status[i] == false) {
                litCount++;
              }
            }

            azimuth = (360) * (litCount / NUM_PHOTORESISTORS);

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
