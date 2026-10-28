// main.cpp
// Entry point firmware ESP32 untuk purwarupa antarmuka IoT SIBI Translator
// Menghubungkan WiFi, memantau kondisi sensor (jarak & cahaya), melakukan polling
// hasil prediksi backend cloud, serta mengaktifkan umpan balik audio dan haptik.

#include <Arduino.h>
#include "config.h"
#include "sensors/ultrasonic.h"
#include "sensors/light_sensor.h"
#include "actuators/speaker.h"
#include "actuators/vibration.h"
#include "api_client.h"

// ID translasi terakhir yang sudah dieksekusi aktuator (agar tidak berulang)
static int lastExecutedTranslationId = -1;
static unsigned long lastPollTime = 0;
static unsigned long lastSensorPrintTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println(F("\n============================================"));
    Serial.println(F("PURWARUPA IOT SIBI TRANSLATOR (ESP32)"));
    Serial.println(F("MediaPipe + Spatial-GCN Dual-Interface"));
    Serial.println(F("============================================"));

    // 1. Inisialisasi sensor input
    Serial.println(F("[Init] Menyiapkan sensor ultrasonik HC-SR04..."));
    ultrasonicInit();

    Serial.println(F("[Init] Menyiapkan sensor cahaya LDR & LED bantu..."));
    lightSensorInit();

    // 2. Inisialisasi aktuator output
    Serial.println(F("[Init] Menyiapkan motor getar haptik..."));
    vibrationInit();

    Serial.println(F("[Init] Menyiapkan modul audio DFPlayer Mini..."));
    speakerInit();

    // 3. Tes getar startup pendek
    vibrationPulseShort();

    // 4. Inisialisasi koneksi WiFi
    apiClientInitWiFi();

    Serial.println(F("[Ready] Sistem IoT siap beroperasi.\n"));
}

void loop() {
    unsigned long currentMillis = millis();

    // 1. Pembaruan otomatis sensor bantu pencahayaan
    // Jika ruangan redup (< LUX_THRESHOLD), LED bantu otomatis menyala menerangi tangan
    lightSensorAutoUpdate();

    // 2. Logging status sensor jarak berkala (setiap 2 detik ke Serial Monitor)
    if (currentMillis - lastSensorPrintTime >= 2000) {
        lastSensorPrintTime = currentMillis;
        float dist = ultrasonicReadDistanceCm();
        float lux = lightSensorReadLux();
        bool ideal = ultrasonicIsDistanceIdeal();

        Serial.printf("[Sensor] Jarak: %.1f cm (%s) | Cahaya: %.0f Lux\n",
                      dist, ideal ? "Ideal" : "Di Luar Jangkauan", lux);
    }

    // 3. Polling hasil inferensi dari backend cloud
    if (currentMillis - lastPollTime >= API_POLL_INTERVAL) {
        lastPollTime = currentMillis;

        PredictionRecord rec = apiClientGetLatestPrediction();
        if (rec.success && rec.translationId != lastExecutedTranslationId) {
            lastExecutedTranslationId = rec.translationId;

            Serial.printf("[Aktuasi] Huruf Baru Diterima: '%c' | Confidence: %.2f (ID: %d)\n",
                          rec.predictedClass, rec.confidence, rec.translationId);

            // A. Umpan balik haptik untuk pengisyarat (Tunarungu)
            vibrationFeedbackByConfidence(rec.confidence);

            // B. Keluaran suara speaker untuk lawan bicara (Mendengar)
            if (rec.confidence >= CONFIDENCE_THRESHOLD) {
                speakerPlayLetter(rec.predictedClass);
            }
        }
    }
}
