// api_client.h
// Modul komunikasi HTTP client ke backend FastAPI
#pragma once

#include <Arduino.h>

struct PredictionRecord {
    bool success;
    int translationId;
    char predictedClass;
    float confidence;
    unsigned long wifiLatencyMs;
};

/**
 * Inisialisasi koneksi WiFi ESP32 ke Access Point lokal.
 */
void apiClientInitWiFi();

/**
 * Menjaga dan memulihkan koneksi WiFi jika terputus.
 */
bool apiClientEnsureWiFi();

/**
 * Polling ke endpoint FastAPI (GET /predict/latest) untuk mengambil prediksi translasi terbaru.
 */
PredictionRecord apiClientGetLatestPrediction();

/**
 * Mengirim telemetri sensor (jarak HC-SR04, cahaya LDR) dan aktuasi (speaker, motor getar, latensi)
 * ke endpoint POST /iot/telemetry agar langsung tampil di Dashboard Web Bab IV Skripsi.
 */
bool apiClientPostTelemetry(
    int translationId,
    float distanceCm,
    float lux,
    bool helperLedOn,
    char predictedLetter,
    float confidence,
    unsigned long wifiLatencyMs,
    unsigned long actuationLatencyMs
);
