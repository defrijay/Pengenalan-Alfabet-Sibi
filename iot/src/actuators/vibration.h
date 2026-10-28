// vibration.h
// Modul motor getar haptik untuk umpan balik fisik kepada penyandang tunarungu
#pragma once

#include <Arduino.h>

/**
 * Inisialisasi pin pengendali motor getar haptik.
 */
void vibrationInit();

/**
 * Getaran pendek (~150ms): Menandakan gesture berhasil dikenali dengan confidence tinggi.
 */
void vibrationPulseShort();

/**
 * Getaran panjang (~600ms): Menandakan gesture ambigu/confidence rendah, pengisyarat perlu mengulang.
 */
void vibrationPulseLong();

/**
 * Memilih pola getar secara otomatis berdasarkan skor confidence model.
 */
void vibrationFeedbackByConfidence(float confidence);
