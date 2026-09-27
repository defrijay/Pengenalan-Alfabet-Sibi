// config.example.h
// Salin file ini menjadi config.h lalu isi kredensial asli.
// config.h TIDAK di-commit (lihat .gitignore).
#pragma once

#define WIFI_SSID     "ganti_dengan_ssid"
#define WIFI_PASSWORD "ganti_dengan_password"
#define API_BASE      "http://192.168.1.100:8000"

// Pin mapping
#define PIN_ULTRASONIC_TRIG   5
#define PIN_ULTRASONIC_ECHO   18
#define PIN_LIGHT_SENSOR      34
#define PIN_LED_HELPER        4
#define PIN_VIBRATION_MOTOR   19
#define PIN_DFPLAYER_RX       16
#define PIN_DFPLAYER_TX       17

// Ambang batas
#define DISTANCE_MIN_CM   20
#define DISTANCE_MAX_CM   60
#define LUX_THRESHOLD     100
