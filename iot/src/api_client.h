// api_client.h
// Deklarasi fungsi untuk memanggil endpoint backend (POST /predict)
#pragma once

void apiClientInit();
bool apiClientPredict(float landmarks[21][3], String 
