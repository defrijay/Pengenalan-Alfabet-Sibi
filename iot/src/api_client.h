// api_client.h
// Modul komunikasi HTTP client ke backend FastAPI
#pragma once

#include <Arduino.h>

struct PredictionRecord {
    bool success;
    int translationId;
    char predictedClass;
    float confidence;
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
