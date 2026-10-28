# Aset Audio DFPlayer Mini (A-Z)

Direktori ini digunakan untuk menyimpan file rekaman suara huruf alfabet Sistem Isyarat Bahasa Indonesia (SIBI) yang diputar oleh speaker via modul **DFPlayer Mini**.

## Standar Penamaan File DFPlayer Mini

Modul DFPlayer Mini membaca file audio dari kartu MicroSD dengan aturan penamaan indeks track 4-digit:
- Simpan berkas di dalam folder bernama `mp3` pada root kartu MicroSD.
- Penamaan file harus berurutan:
  - `0001.mp3` -> Suara huruf **A**
  - `0002.mp3` -> Suara huruf **B**
  - ...
  - `0026.mp3` -> Suara huruf **Z**

## Cara Membuat File Audio Otomatis

Telah disediakan skrip generator otomatis di direktori ini:
```bash
pip install gTTS
python generate_audio_assets.py
```
Skrip ini akan mengunduh ucapan ejaan bahasa Indonesia yang jernih dan otomatis menamainya `0001.mp3` s.d. `0026.mp3` di dalam subfolder `mp3/`.
Cukup salin folder `mp3/` tersebut ke kartu MicroSD Anda.
