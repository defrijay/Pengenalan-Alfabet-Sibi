// ultrasonic.cpp
// Implementasi pembacaan pulsa sensor ultrasonik HC-SR04
#include "ultrasonic.h"
#include "config.h"

void ultrasonicInit() {
    pinMode(PIN_ULTRASONIC_TRIG, OUTPUT);
    pinMode(PIN_ULTRASONIC_ECHO, INPUT);
    digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
}

float ultrasonicReadDistanceCm() {
    // Bersihkan trigger pin
    digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
    delayMicroseconds(2);

    // Kirim pulsa trigger 10 us
    digitalWrite(PIN_ULTRASONIC_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_ULTRASONIC_TRIG, LOW);

    // Baca durasi pulsa pantulan (timeout 30ms ~ maks jarak ~5 meter)
    unsigned long durationUs = pulseIn(PIN_ULTRASONIC_ECHO, HIGH, 30000);

    if (durationUs == 0) {
        return -1.0f; // Timeout atau tidak ada pantulan
    }

    // Kecepatan suara di udara ~ 343 m/s = 0.0343 cm/us
    // Jarak = (durasi * 0.0343) / 2
    float distanceCm = (durationUs * 0.0343f) / 2.0f;
    return distanceCm;
}

bool ultrasonicIsDistanceIdeal() {
    float d = ultrasonicReadDistanceCm();
    if (d < 0) return false;
    return (d >= DISTANCE_MIN_CM && d <= DISTANCE_MAX_CM);
}
