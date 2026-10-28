// vibration.cpp
// Implementasi umpan balik haptik untuk pengisyarat tunarungu
#include "vibration.h"
#include "config.h"

void vibrationInit() {
    pinMode(PIN_VIBRATION_MOTOR, OUTPUT);
    digitalWrite(PIN_VIBRATION_MOTOR, LOW);
}

void vibrationPulseShort() {
    digitalWrite(PIN_VIBRATION_MOTOR, HIGH);
    delay(150);
    digitalWrite(PIN_VIBRATION_MOTOR, LOW);
}

void vibrationPulseLong() {
    // Pola getar panjang atau double-pulse peringatan
    digitalWrite(PIN_VIBRATION_MOTOR, HIGH);
    delay(500);
    digitalWrite(PIN_VIBRATION_MOTOR, LOW);
}

void vibrationFeedbackByConfidence(float confidence) {
    if (confidence >= CONFIDENCE_THRESHOLD) {
        vibrationPulseShort();
    } else {
        vibrationPulseLong();
    }
}
