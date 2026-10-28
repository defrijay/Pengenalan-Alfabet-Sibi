// speaker.h
// Modul pengendali DFPlayer Mini untuk keluaran suara alfabet ke lawan bicara
#pragma once

#include <Arduino.h>

/**
 * Inisialisasi komunikasi serial UART2 dan konfigurasi awal DFPlayer Mini.
 */
bool speakerInit();

/**
 * Memutar file suara huruf alfabet (A-Z) dari MicroSD DFPlayer Mini.
 * Format mapping:
 *   'A' -> Track 1
 *   'B' -> Track 2
 *   ...
 *   'Z' -> Track 26
 */
void speakerPlayLetter(char letter);

/**
 * Mengatur level volume speaker (0 sampai 30).
 */
void speakerSetVolume(uint8_t volume);
