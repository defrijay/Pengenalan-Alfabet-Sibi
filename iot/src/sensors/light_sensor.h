// light_sensor.h
// Deklarasi fungsi sensor cahaya (LDR / BH1750) + kontrol LED bantu
#pragma once

void lightSensorInit();
float lightSensorReadLux();
void lightSensorSetHelperLed(bool on);
