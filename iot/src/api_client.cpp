// api_client.cpp
// Implementasi HTTP client ke backend FastAPI
#include "api_client.h"
#include "config.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void apiClientInitWiFi() {
    Serial.printf("[WiFi] Menghubungkan ke SSID: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Terhubung! IP ESP32: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println(F("\n[WiFi] Gagal terhubung ke WiFi."));
    }
}

bool apiClientEnsureWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return true;
    }
    Serial.println(F("[WiFi] Koneksi terputus, mencoba rekoneksi..."));
    WiFi.reconnect();
    return (WiFi.status() == WL_CONNECTED);
}

PredictionRecord apiClientGetLatestPrediction() {
    PredictionRecord record = {false, -1, ' ', 0.0f};

    if (!apiClientEnsureWiFi()) {
        return record;
    }

    HTTPClient http;
    String endpoint = String(API_BASE_URL) + "/predict/latest";
    http.begin(endpoint);
    http.setTimeout(1500); // 1.5 detik timeout

    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();

        // Parse JSON respons: {"translation_id": 12, "predicted_class": "A", "confidence": 0.95}
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error && !doc["translation_id"].isNull()) {
            record.success = true;
            record.translationId = doc["translation_id"].as<int>();
            const char* letterStr = doc["predicted_class"];
            if (letterStr && strlen(letterStr) > 0) {
                record.predictedClass = letterStr[0];
            }
            record.confidence = doc["confidence"].as<float>();
        }
    } else {
        // Serial.printf("[HTTP] GET /predict/latest gagal, code: %d\n", httpCode);
    }

    http.end();
    return record;
}
