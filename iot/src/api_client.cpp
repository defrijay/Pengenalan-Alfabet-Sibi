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
    PredictionRecord record = {false, -1, ' ', 0.0f, 0};

    if (!apiClientEnsureWiFi()) {
        return record;
    }

    HTTPClient http;
    String endpoint = String(API_BASE_URL) + "/predict/latest";
    http.begin(endpoint);
    http.setTimeout(1500); // 1.5 detik timeout

    unsigned long tStart = millis();
    int httpCode = http.GET();
    unsigned long rttMs = millis() - tStart;

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
            record.wifiLatencyMs = rttMs;
        }
    } else {
        // Serial.printf("[HTTP] GET /predict/latest gagal, code: %d\n", httpCode);
    }

    http.end();
    return record;
}

bool apiClientPostTelemetry(
    int translationId,
    float distanceCm,
    float lux,
    bool helperLedOn,
    char predictedLetter,
    float confidence,
    unsigned long wifiLatencyMs,
    unsigned long actuationLatencyMs
) {
    if (!apiClientEnsureWiFi()) {
        return false;
    }

    HTTPClient http;
    String endpoint = String(API_BASE_URL) + "/iot/telemetry";
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(1500);

    bool inRange = (distanceCm >= DISTANCE_MIN_CM && distanceCm <= DISTANCE_MAX_CM);
    const char* lightCond = (lux >= 250.0f) ? "Terang" : ((lux >= LUX_THRESHOLD) ? "Redup" : "Gelap");

    JsonDocument doc;
    doc["device_id"] = "esp32-sibi-01";
    if (translationId > 0) {
        doc["translation_id"] = translationId;
    }
    doc["measured_distance_cm"] = distanceCm;
    doc["distance_in_range"] = inRange;
    doc["led_indicator_status"] = inRange ? "Hijau (Ideal)" : "Merah (Di Luar Rentang)";
    doc["light_condition"] = lightCond;
    doc["measured_lux"] = lux;
    doc["lux_threshold"] = LUX_THRESHOLD;
    doc["helper_led_status"] = helperLedOn ? "Menyala" : "Mati";

    if (predictedLetter != ' ' && predictedLetter != '\0') {
        char letterBuf[2] = {predictedLetter, '\0'};
        doc["predicted_letter"] = letterBuf;
        doc["target_letter"] = letterBuf;
        doc["confidence"] = confidence;
        doc["speaker_output"] = (confidence >= CONFIDENCE_THRESHOLD)
                                    ? (String("Track '") + letterBuf + "' (DFPlayer)")
                                    : String("Tidak Diputar (Conf Rendah)");
        doc["vibration_pattern"] = (confidence >= CONFIDENCE_THRESHOLD) ? "Pendek" : "Panjang";
        doc["is_output_matched"] = true;
        doc["wifi_latency_ms"] = wifiLatencyMs;
        doc["actuation_latency_ms"] = actuationLatencyMs;
    }

    String body;
    serializeJson(doc, body);
    int httpCode = http.POST(body);
    http.end();
    return (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED);
}
