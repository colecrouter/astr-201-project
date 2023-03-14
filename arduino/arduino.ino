#include <SoftwareSerial.h>

#define RX_PIN 2
#define TX_PIN 3

SoftwareSerial bluetooth(RX_PIN, TX_PIN, false);

void setup() {
    bluetooth.begin(9600);
}

void loop() {
    while (bluetooth.available() > 0) {
        // Input data?
    }
    while (Serial.available() > 0) {
        // Send data
        // bluetooth.write("test");
    }
}
