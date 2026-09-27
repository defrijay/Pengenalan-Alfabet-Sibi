// main.cpp
// Entry point firmware ESP32: setup() dan loop() utama.
// Menghubungkan WiFi, membaca sensor, memanggil API backend, dan
// mengendalikan speaker (DFPlayer Mini) serta motor getar.

#include <Arduino.h>
#include "config.h"

void setup() {
  Serial.begin(115200);
  // TODO: init WiFi, sensor, dan aktuator
}

void loop() {
  // TODO: baca sensor -> panggil API -> trigger speaker/motor getar
}
