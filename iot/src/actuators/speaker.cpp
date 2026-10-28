// speaker.cpp
// Implementasi DFPlayer Mini audio player
#include "speaker.h"
#include "config.h"
#include <DFRobotDFPlayerMini.h>

static HardwareSerial dfSerial(2); // Menggunakan UART2 ESP32
static DFRobotDFPlayerMini dfPlayer;
static bool dfPlayerReady = false;

bool speakerInit() {
    // Inisialisasi UART2: RX di pin 16, TX di pin 17, baud rate 9600 standar DFPlayer
    dfSerial.begin(9600, SERIAL_8N1, PIN_DFPLAYER_RX, PIN_DFPLAYER_TX);
    delay(200);

    if (!dfPlayer.begin(dfSerial)) {
        Serial.println(F("[DFPlayer] Gagal terhubung ke modul DFPlayer Mini. Cek kabel & SD card."));
        dfPlayerReady = false;
        return false;
    }

    dfPlayerReady = true;
    dfPlayer.volume(DFPLAYER_VOLUME);
    dfPlayer.EQ(DFPLAYER_EQ_NORMAL);
    dfPlayer.outputDevice(DFPLAYER_DEVICE_SD);

    Serial.println(F("[DFPlayer] Berhasil diinisialisasi."));
    return true;
}

void speakerPlayLetter(char letter) {
    if (!dfPlayerReady) {
        Serial.println(F("[DFPlayer] Warning: Modul belum siap, audio dilewati."));
        return;
    }

    // Normalisasi ke huruf kapital
    char upper = toupper(letter);
    if (upper >= 'A' && upper <= 'Z') {
        int trackNumber = (upper - 'A') + 1; // 1 s.d. 26
        Serial.printf("[DFPlayer] Memutar audio untuk huruf '%c' (Track: %d)\n", upper, trackNumber);
        dfPlayer.play(trackNumber);
    } else {
        Serial.printf("[DFPlayer] Karakter '%c' di luar alfabet A-Z.\n", letter);
    }
}

void speakerSetVolume(uint8_t volume) {
    if (dfPlayerReady && volume <= 30) {
        dfPlayer.volume(volume);
    }
}
