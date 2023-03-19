# ASTR-201-project
###### Final project by Cole Crouter & Braden Breit

## Summary

This project uses an Arduino to create a digital sundial that can be read via computer or smartphone. When the user goes to the website, they are prompted for their location, and to connect and align the sundial. The website then displays relevant information to the Sun's current position in the sky.

This project consists of two parts; the Arduino code and the website. The Arduino code is located in the `arduino` folder, and the website is located in the root directory.

> Note: Only Google Chrome and Microsoft Edge are supported for the website. The website uses the Web Bluetooth API, which is only supported in these browsers.

## Hardware

The hardware used for this project is as follows:

- BLE enabled Arduino (Arduino Nano 33 BLE, ESP32, etc.)
- XX GL5516 photoresistors (50mm)
- TODO: (Optional) name of compass module
- TODO

\*Insert wiring diagram\*

## Software

### Arduino

> This sketch takes advantage of the ArduinoBLE library, which is not included in the Arduino IDE by default. To install it, open the Arduino IDE, go to `Tools > Manage Libraries...`, search for `ArduinoBLE`, and install the latest version.

Downlod the sketch from the `arduino` folder and upload it to your Arduino.

### Website

##### The latest version of the website is hosted at https://mexican-man.github.io/astr-201-project/.

The website is build with SvelteKit, but compiles to a static site. To run the website locally, clone this repository and run the following commands:

```bash
npm install
npm run preview
```

> Note: Chrome disables the Web Bluetooth API on insecure origins. To connect to the Arduino, you must either be on `localhost` or use HTTPS (or enable the `#enable-experimental-web-platform-features` flag).

## Images

\*Insert images of the sundial\*