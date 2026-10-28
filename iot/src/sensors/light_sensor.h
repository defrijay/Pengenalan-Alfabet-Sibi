// light_sensor.h
// Modul sensor intensitas cahaya sekitar (LDR/ADC) dan kendali otomatis LED bantu
#pragma once

#include <Arduino.h>

/**
 * Inisialisasi pin analog sensor cahaya dan pin digital LED bantu penerang.
 */
void lightSensorInit();

/**
 * Membaca intensitas cahaya sekitar dan mengonversinya ke perkiraan nilai Lux.
 */
float lightSensorReadLux();

/**
 * Mengontrol status LED bantu secara manual.
 */
void lightSensorSetHelperLed(bool on);

/**
 * Memeriksa intensitas cahaya dan secara otomatis mengaktifkan LED bantu
 * jika lux < LUX_THRESHOLD untuk menjamin kondisi pengambilan gambar.
 * Mengembalikan true jika LED bantu menyala.
 */
bool lightSensorAutoUpdate();
