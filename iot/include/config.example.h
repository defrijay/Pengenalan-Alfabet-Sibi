// config.example.h
// Salin file ini menjadi config.h lalu sesuaikan konfigurasi WiFi, IP server, dan pin mapping.
#pragma once

// ==========================================
// 1. Kredensial WiFi & Backend Endpoint
// ==========================================
#define WIFI_SSID         "ganti_dengan_ssid"
#define WIFI_PASSWORD     "ganti_dengan_password"
#define API_BASE_URL      "http://192.168.1.100:8000"  // IP host backend FastAPI di jaringan lokal
#define API_POLL_INTERVAL 400                          // Interval polling API dalam milidetik

// ==========================================
// 2. Pin Mapping Perangkat Keras
// ==========================================
// Sensor Ultrasonik HC-SR04
#define PIN_ULTRASONIC_TRIG   5
#define PIN_ULTRASONIC_ECHO   18

// Sensor Cahaya & LED Bantu
#define PIN_LIGHT_SENSOR      34   // ADC pin (LDR)
#define PIN_LED_HELPER        4    // Digital output LED penerang tangan

// Aktuator Haptik (Motor Getar)
#define PIN_VIBRATION_MOTOR   19   // Digital output / PWM transistor switch

// Modul Audio DFPlayer Mini (Hardware Serial 2 ESP32)
#define PIN_DFPLAYER_RX       16   // Ke pin TX DFPlayer Mini
#define PIN_DFPLAYER_TX       17   // Ke pin RX DFPlayer Mini (disarankan seri resistor 1K)
#define DFPLAYER_VOLUME       25   // Volume audio (0 - 30)

// ==========================================
// 3. Ambang Batas Parameter Fisik
// ==========================================
#define DISTANCE_MIN_CM       20.0f
#define DISTANCE_MAX_CM       60.0f
#define LUX_THRESHOLD         150.0f  // Jika intensitas di bawah nilai ini, LED bantu aktif
#define CONFIDENCE_THRESHOLD  0.70f   // Ambang minimal confidence untuk getar pendek & pemutaran audio
