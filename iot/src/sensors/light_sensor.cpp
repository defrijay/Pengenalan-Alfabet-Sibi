// light_sensor.cpp
// Implementasi pembacaan ADC LDR dan kendali LED bantu penerangan
#include "light_sensor.h"
#include "config.h"

void lightSensorInit() {
    pinMode(PIN_LIGHT_SENSOR, INPUT);
    pinMode(PIN_LED_HELPER, OUTPUT);
    digitalWrite(PIN_LED_HELPER, LOW);
}

float lightSensorReadLux() {
    // ESP32 ADC resolusi 12-bit (0 - 4095)
    int rawAdc = analogRead(PIN_LIGHT_SENSOR);

    // Konversi pendekatan non-linear LDR menjadi estimasi Lux
    // Pada rangkaian pembagi tegangan 10K Ohm dengan LDR:
    // Tegangan tinggi (ADC tinggi) = LDR resistansi rendah = cahaya terang
    float normalized = (float)rawAdc / 4095.0f;
    float lux = normalized * 1000.0f; // Skala perkiraan 0 - 1000 Lux

    return lux;
}

void lightSensorSetHelperLed(bool on) {
    digitalWrite(PIN_LED_HELPER, on ? HIGH : LOW);
}

bool lightSensorAutoUpdate() {
    float currentLux = lightSensorReadLux();
    bool shouldTurnOn = (currentLux < LUX_THRESHOLD);
    lightSensorSetHelperLed(shouldTurnOn);
    return shouldTurnOn;
}
