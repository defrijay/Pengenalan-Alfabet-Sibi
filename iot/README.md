# SIBI Translator IoT Prototype

Modul ini adalah **antarmuka fisik** dari sistem SIBI Translator bagian yang
menjembatani hasil prediksi model GCN di cloud dengan dua pihak yang
berkomunikasi: penyandang tunarungu yang sedang berisyarat, dan lawan bicara
yang tidak paham SIBI.

Masalah yang coba dijawab modul ini: sebuah layanan cloud yang cepat dan
akurat tetap mengharuskan seseorang membaca hasil prediksi dari layar.
Pengisyarat sulit membaca layar sambil membentuk gestur tangan, dan lawan
bicara tetap harus melihat perangkat untuk memahami huruf yang dimaksud.
ESP32 di sini menghilangkan ketergantungan itu dengan menyampaikan hasil
lewat suara (untuk lawan bicara) dan getaran (untuk pengisyarat), tanpa
keduanya perlu menatap layar.

Peran spesifiknya dalam keseluruhan sistem:

- **Bukan menjalankan model apa pun.** ESP32 tidak melakukan inferensi GCN
  atau ekstraksi landmark. Perannya murni sebagai **klien** yang memanggil
  endpoint `POST /predict` yang sama persis dengan yang dipanggil frontend
  web, lalu menindaklanjuti hasilnya lewat perangkat output fisik.
- **Membantu kondisi capture lewat sensor input**, merespons temuan skripsi
  bahwa detection rate MediaPipe turun tajam di latar belakang rumit dan
  pencahayaan tidak stabil. Sensor ultrasonic memandu jarak tangan ke kamera,
  sensor cahaya mendeteksi kondisi pencahayaan dan menyalakan LED bantu bila
  perlu keduanya bekerja **sebelum** foto diambil, bukan sebagai metode
  deteksi gestur.
- **Menyampaikan hasil prediksi lewat dua saluran fisik**: speaker (DFPlayer
  Mini) mengucapkan huruf hasil deteksi untuk lawan bicara yang mendengar,
  dan motor getar memberi umpan balik haptik untuk pengisyarat sendiri
  getar pendek untuk confidence tinggi, getar panjang sebagai isyarat untuk
  mengulang gestur.
- **Berjalan independen dari frontend web**, mengonsumsi API cloud yang sama
  sehingga bisa dipakai bersamaan atau terpisah dari antarmuka React.

Singkatnya: sensor ultrasonic & cahaya membantu memastikan kondisi capture
ideal → pengguna berisyarat di depan kamera (lewat frontend) → **backend**
menjalankan GCN dan mengembalikan huruf prediksi → **modul IoT ini** (lewat
polling atau penerusan hasil, tergantung implementasi) mengucapkan huruf itu
lewat speaker dan memberi umpan balik getar ke pengisyarat.

> 📓 **Status:** modul ini masih berupa purwarupa fungsional. Pengujian yang
> dilakukan bersifat deskriptif (perangkat menyala dan merespons sesuai hasil
> prediksi), bukan pengujian ketahanan hardware jangka panjang, sertifikasi
> keselamatan listrik, atau kelayakan produksi massal.

## Daftar Isi

- [1. Tech Stack](#1-tech-stack)
- [2. Komponen Hardware](#2-komponen-hardware)
- [3. Prasyarat](#3-prasyarat)
- [4. Setup & Konfigurasi](#4-setup--konfigurasi)
- [5. Cara Build & Upload Firmware](#5-cara-build--upload-firmware)
- [6. Alur Kerja Perangkat](#6-alur-kerja-perangkat)
- [7. Integrasi dengan Backend](#7-integrasi-dengan-backend)
- [8. Struktur Folder](#8-struktur-folder)
- [9. Wiring / Pin Mapping](#9-wiring--pin-mapping)
- [10. Troubleshooting](#10-troubleshooting)

## 1. Tech Stack

| Kategori | Teknologi |
|---|---|
| Mikrokontroler | ESP32 DevKit (WiFi 802.11 b/g/n, dual-core) |
| Firmware Framework | Arduino Framework (via PlatformIO) |
| Build Tool | PlatformIO |
| Komunikasi ke Backend | HTTP (WiFiClient / HTTPClient) ke endpoint FastAPI |
| Output Audio | DFPlayer Mini (kontrol via UART) |
| Library Audio | DFRobotDFPlayerMini |
| Data Exchange | JSON (ArduinoJson) |

## 2. Komponen Hardware

| Komponen | Fungsi |
|---|---|
| ESP32 DevKit | Edge hub menerima hasil prediksi, mengendalikan seluruh sensor & aktuator |
| Sensor ultrasonic (HC-SR04) | Mengukur jarak tangan pengguna ke kamera, jangkauan efektif hingga 100 cm |
| Sensor cahaya (LDR / BH1750) + LED bantu | Mendeteksi kondisi pencahayaan sekitar, menyalakan LED bantu bila terlalu redup |
| Modul DFPlayer Mini + speaker | Memutar file audio huruf hasil prediksi, untuk didengar lawan bicara |
| Motor getar mini (3–5V) | Umpan balik haptik untuk pengisyarat: getar pendek/panjang |

## 3. Prasyarat

- [PlatformIO](https://platformio.org/) (lewat VS Code extension atau PlatformIO Core CLI)
- Board ESP32 DevKit dan kabel USB data (bukan kabel charge-only)
- Kartu microSD berisi file audio huruf A–Z dalam format yang didukung DFPlayer Mini (lihat folder `audio/`)
- Backend (`../backend/`) sudah berjalan dan bisa diakses dari jaringan WiFi yang sama dengan ESP32
- Driver USB-to-serial terpasang (CP2102 / CH340, tergantung board)

## 4. Setup & Konfigurasi

1. Salin file konfigurasi contoh:
   ```bash
   cp include/config.example.h include/config.h
   ```
2. Buka `include/config.h`, isi kredensial dan pin sesuai wiring fisikmu:
   ```cpp
   #define WIFI_SSID     "nama_wifi_kamu"
   #define WIFI_PASSWORD "password_wifi_kamu"
   #define API_BASE      "http://192.168.1.100:8000"   // IP backend di jaringan lokal
   ```
3. **`config.h` sengaja tidak di-commit** (sudah masuk `.gitignore`), karena berisi kredensial WiFi asli hanya `config.example.h` yang jadi template di repository.
4. Salin file audio huruf (format & penomoran sesuai ketentuan DFPlayer Mini, biasanya `0001.mp3`, `0002.mp3`, dst.) ke kartu microSD, lalu pasang ke modul DFPlayer Mini.

## 5. Cara Build & Upload Firmware

### Lewat PlatformIO CLI

```bash
cd iot
pio run                     # build firmware
pio run --target upload     # upload ke ESP32 (pastikan board terhubung via USB)
pio device monitor          # buka serial monitor untuk debug (baud 115200)
```

### Lewat VS Code + PlatformIO extension

1. Buka folder `iot/` sebagai project PlatformIO.
2. Klik ikon ✓ (Build) di status bar, lalu ikon → (Upload).
3. Buka Serial Monitor (ikon plug) untuk melihat log koneksi WiFi dan status sensor.

### Verifikasi berhasil

Setelah upload, buka Serial Monitor firmware seharusnya menampilkan status
koneksi WiFi berhasil dan siap membaca sensor. Jika ESP32 berhasil terhubung
ke backend, log request ke `/predict` juga akan tampil di sana.

## 6. Alur Kerja Perangkat

1. **Boot & koneksi WiFi** ESP32 menyala, terhubung ke jaringan WiFi sesuai `config.h`.
2. **Pemantauan sensor sebelum capture** sensor ultrasonic memantau jarak
   tangan pengguna ke kamera (ideal: 20–60 cm); sensor cahaya membaca
   intensitas cahaya sekitar dan menyalakan LED bantu bila di bawah ambang
   batas yang ditentukan.
3. **Pengambilan hasil prediksi** ESP32 memanggil (atau menerima hasil yang
   diteruskan dari) endpoint `POST /predict` yang sama dengan yang dipakai
   frontend web, mendapat huruf hasil prediksi beserta confidence score-nya.
4. **Keluaran audio** DFPlayer Mini memutar file audio sesuai huruf yang
   diterima, sehingga lawan bicara yang tidak paham SIBI bisa mendengar
   hasilnya secara langsung.
5. **Umpan balik haptik** motor getar memberi getar pendek bila confidence
   tinggi (gestur terdeteksi dengan baik), atau getar panjang sebagai
   isyarat bagi pengisyarat untuk mengulang gestur.

## 7. Integrasi dengan Backend

| Endpoint | Dipanggil Oleh | Payload Utama | Catatan |
|---|---|---|---|
| `POST /predict` | Frontend web **dan** modul IoT ini | `session_id`, `landmarks[21]`, metrik pendukung | Endpoint identik untuk kedua klien tidak ada endpoint khusus IoT |

Sesuai rancangan arsitektur di skripsi, ESP32 **tidak menjalankan inferensi
apa pun**; ia murni klien HTTP yang mengonsumsi hasil dari layanan cloud yang
sama dengan frontend. Ini berarti backend tidak perlu tahu jenis klien mana
yang memanggilnya cukup satu kontrak API untuk semua antarmuka.

Detail schema request/response lengkap ada di Swagger UI backend (`/docs`)
lihat `backend/README.md` untuk penjelasan lebih lanjut.

## 8. Struktur Folder

```
iot/
├── src/
│   ├── main.cpp              # entry point: setup() & loop()
│   ├── api_client.h/.cpp     # HTTP client ke endpoint POST /predict backend
│   ├── sensors/
│   │   ├── ultrasonic.h/.cpp     # HC-SR04: baca jarak tangan ke kamera
│   │   └── light_sensor.h/.cpp   # LDR/BH1750: baca cahaya + kontrol LED bantu
│   └── actuators/
│       ├── speaker.h/.cpp        # kontrol DFPlayer Mini
│       └── vibration.h/.cpp      # kontrol motor getar
├── include/
│   ├── config.h               # kredensial & pin mapping asli (tidak di-commit)
│   └── config.example.h       # template konfigurasi
├── audio/                     # file audio huruf A–Z untuk SD card DFPlayer Mini
├── lib/                       # library pihak ketiga lokal (opsional)
├── platformio.ini             # konfigurasi board & dependency PlatformIO
└── .gitignore                 # mengecualikan config.h dari commit
```

## 9. Wiring / Pin Mapping

Pin default mengikuti `config.example.h` sesuaikan dengan wiring fisikmu:

| Komponen | Pin ESP32 (default) |
|---|---|
| HC-SR04 Trig | GPIO 5 |
| HC-SR04 Echo | GPIO 18 |
| Sensor Cahaya (LDR/BH1750) | GPIO 34 |
| LED Bantu Pencahayaan | GPIO 4 |
| Motor Getar | GPIO 19 |
| DFPlayer Mini RX | GPIO 16 |
| DFPlayer Mini TX | GPIO 17 |

Ambang batas yang dipakai firmware:
- Jarak ideal tangan ke kamera: **20–60 cm**
- Ambang batas cahaya redup: sesuai `LUX_THRESHOLD` di `config.h`

## 10. Troubleshooting

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| ESP32 tidak terhubung WiFi | SSID/password salah, atau sinyal terlalu lemah | Cek ulang `config.h`, pastikan ESP32 dan backend berada di jaringan yang sama |
| Upload firmware gagal / port tidak terdeteksi | Driver USB-to-serial belum terpasang, atau kabel charge-only | Install driver CP2102/CH340 sesuai board, ganti kabel data |
| Request ke `/predict` gagal / timeout | `API_BASE` salah, backend belum jalan, atau backend tidak bisa diakses dari jaringan ESP32 | Pastikan backend aktif dan bisa di-ping dari perangkat lain di jaringan yang sama |
| Speaker tidak bersuara | Kartu microSD belum terpasang, format file salah, atau wiring RX/TX terbalik | Cek format & penomoran file audio, cek wiring DFPlayer Mini |
| Motor getar tidak bergetar | Pin salah, atau tegangan tidak cukup | Cek `PIN_VIBRATION_MOTOR` di `config.h`, pastikan suplai tegangan 3–5V sesuai spesifikasi motor |
| Sensor ultrasonic membaca nilai tidak stabil | Permukaan pantul tidak rata, atau jarak di luar jangkauan efektif (>100 cm) | Pastikan tangan berada dalam jangkauan efektif sensor, hindari permukaan yang menyerap gelombang suara |