// ultrasonic.h
// Modul sensor HC-SR04 untuk panduan jarak tangan ke kamera
#pragma once

#include <Arduino.h>

/**
 * Inisialisasi pin Trigger dan Echo untuk sensor ultrasonik HC-SR04.
 */
void ultrasonicInit();

/**
 * Membaca jarak objek (tangan) dalam satuan sentimeter (cm).
 * Mengembalikan nilai jarak dalam cm, atau -1.0 jika pembacaan timeout.
 */
float ultrasonicReadDistanceCm();

/**
 * Mengevaluasi apakah posisi tangan berada dalam rentang ideal capture (20 - 60 cm).
 */
bool ultrasonicIsDistanceIdeal();
