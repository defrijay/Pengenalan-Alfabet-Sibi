# SIBI Translator Frontend

Antarmuka web untuk menerjemahkan alfabet SIBI secara real-time lewat kamera,
dibangun dengan **React + TypeScript + Vite**, menggunakan **MediaPipe Hands**
untuk deteksi landmark tangan di browser dan berkomunikasi dengan backend
FastAPI untuk inferensi model GCN.

## Penjelasan Proyek

Frontend ini adalah **mata & antarmuka** dari sistem SIBI Translator bagian
yang menangkap gambar dari kamera pengguna, mengekstrak landmark tangan, dan
menampilkan hasil terjemahan huruf secara real-time.

Peran spesifiknya dalam keseluruhan sistem:

- **Menangkap video dari kamera** lewat `navigator.mediaDevices.getUserMedia`,
  ditampilkan di elemen `<video>` sebagai sumber input.
- **Menjalankan MediaPipe Hands langsung di browser** (via CDN, WASM) untuk
  mengekstrak 21 titik landmark tangan per frame proses ini berat secara
  komputasi sehingga sengaja dijalankan di client, bukan dikirim sebagai
  gambar mentah ke backend.
- **Memvalidasi area & jarak tangan** (ROI: *region of interest*) sebelum
  mengirim landmark tangan harus berada dalam kotak target di layar dan
  dalam skala jarak yang wajar ("Ideal") supaya prediksi lebih stabil.
- **Mengumpulkan buffer frame** (0–30) sebelum memicu prediksi, untuk
  menghindari spam request ke backend setiap frame.
- **Mengelola siklus sesi**: memanggil `POST /sessions/start` saat kamera
  dinyalakan dan `POST /sessions/end` saat kamera dimatikan, supaya riwayat
  translasi di backend tergroup per sesi pemakaian.
- **Mengirim landmark ke backend** lewat `POST /predict` beserta metrik
  pendukung (fps, latency, memory, lux, hand scale), lalu menampilkan huruf
  hasil prediksi dan confidence-nya secara real-time.
- **Merangkai huruf jadi kalimat** di kotak teks yang bisa diedit manual, dan
  membacakannya lewat Web Speech API (`speechSynthesis`, bahasa Indonesia).

Singkatnya: **frontend ini** menangkap gambar & mengekstrak landmark → mengirim
landmark ke **backend** lewat `/predict` → backend menjalankan GCN dan
mengembalikan huruf prediksi → frontend menampilkan huruf tersebut dan
merangkainya jadi kalimat yang bisa dibacakan.

## Daftar Isi

- [1. Tech Stack](#1-tech-stack)
- [2. Prasyarat](#2-prasyarat)
- [3. Setup Lokal](#3-setup-lokal)
- [4. Environment / Konfigurasi API](#4-environment--konfigurasi-api)
- [5. Cara Menjalankan](#5-cara-menjalankan)
- [6. Alur Kerja Aplikasi](#6-alur-kerja-aplikasi)
- [7. Integrasi dengan Backend](#7-integrasi-dengan-backend)
- [8. Struktur Folder](#8-struktur-folder)
- [9. Build untuk Production](#9-build-untuk-production)
- [10. Troubleshooting](#10-troubleshooting)

## 1. Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Ikon | lucide-react |
| Computer Vision | MediaPipe Hands (dimuat via CDN di `index.html`) |
| Text-to-Speech | Web Speech API (`speechSynthesis`) bawaan browser |
| Linting | ESLint |

## 2. Prasyarat

- Node.js 18+ dan npm
- Browser modern yang mendukung `getUserMedia` dan `SpeechSynthesis` (Chrome/Edge direkomendasikan)
- Backend (`../backend/`) sudah berjalan, karena frontend memanggil endpoint `/sessions/start`, `/predict`, dan `/sessions/end` secara langsung
- Akses kamera diizinkan oleh browser saat aplikasi dibuka

## 3. Setup Lokal

```bash
cd frontend
npm install
```

Pastikan skrip MediaPipe Hands sudah dimuat lewat tag `<script>` di `index.html`
(dari CDN `jsdelivr`) komponen `App.tsx` mengambil class `Hands` dari
`window`, bukan lewat `import` npm, jadi tanpa script ini deteksi tangan tidak
akan berjalan.

## 4. Environment / Konfigurasi API

Saat ini base URL backend di-hardcode di `App.tsx`:

```ts
const API_BASE = "http://localhost:8000";
```

Untuk deployment atau lingkungan berbeda, sebaiknya pindahkan ke environment
variable Vite, misalnya:

```bash
# .env
VITE_API_BASE=http://localhost:8000
```

lalu ganti pemanggilannya menjadi `import.meta.env.VITE_API_BASE`. Selama
masih hardcode, ubah nilai `API_BASE` langsung di kode sebelum build ke
lingkungan lain (mis. saat backend sudah live di Railway).

## 5. Cara Menjalankan

### A. Mode development

```bash
npm run dev
```

Server dev Vite biasanya jalan di `http://localhost:5173`. Buka URL tersebut
di browser, izinkan akses kamera saat diminta.

### B. Menjalankan bersama backend

Backend harus sudah aktif di `http://localhost:8000` (atau sesuai `API_BASE`)
sebelum menekan tombol "Mulai Kamera", karena aplikasi langsung memanggil
`POST /sessions/start` saat kamera dinyalakan. Pastikan juga `CORS_ORIGINS` di
backend sudah mengizinkan origin dev server ini (`http://localhost:5173`).

### C. Verifikasi berjalan normal

- Kamera menyala dan preview video tampil.
- Indikator "SCANNING..." berubah jadi "HAND DETECTED" saat tangan masuk area target.
- Setelah buffer frame terisi, huruf hasil prediksi & confidence muncul di panel kanan.

## 6. Alur Kerja Aplikasi

1. Pengguna menekan **Mulai Kamera** → `getUserMedia` mengaktifkan stream video,
   dan `POST /sessions/start` dipanggil untuk membuka sesi baru di backend.
2. **MediaPipe Hands** memproses setiap frame video (via `requestAnimationFrame`)
   dan mengekstrak 21 landmark tangan bila terdeteksi.
3. Landmark divalidasi terhadap **area target (ROI)** dan **skala jarak tangan**
   (Jauh/Ideal/Dekat) hanya landmark dalam kondisi ideal yang disimpan untuk prediksi.
4. Setiap ~1 detik, buffer frame bertambah; setelah mencapai batas (30),
   `predictSign()` dipanggil untuk mengirim landmark terakhir ke backend.
5. `POST /predict` mengirim `session_id`, 21 landmark `{x, y, z}`, dan metrik
   pendukung (fps, latency, memory, lux, hand_scale) ke backend.
6. Respons backend (`predicted_class`, `confidence`) ditampilkan di panel
   "Deteksi Saat Ini", dan hurufnya ditambahkan ke kotak "Kalimat Terjemahan".
7. Pengguna bisa mengedit teks secara manual, menghapusnya, atau menekan
   **Bacakan Teks** untuk mendengar hasil terjemahan lewat text-to-speech.
8. Saat pengguna menekan **Matikan Kamera**, stream video dihentikan dan
   `POST /sessions/end` dipanggil untuk menutup sesi di backend.

## 7. Integrasi dengan Backend

| Endpoint | Kapan Dipanggil | Payload Utama |
|---|---|---|
| `POST /sessions/start` | Saat kamera dinyalakan | – |
| `POST /predict` | Setiap buffer frame penuh & tangan terdeteksi di area target | `session_id`, `landmarks[21]`, `fps`, `latency_ms`, `memory_mb`, `lux`, `hand_scale` |
| `POST /sessions/end` | Saat kamera dimatikan | `session_id` |

Detail schema request/response lengkap ada di Swagger UI backend
(`/docs`) lihat `backend/README.md` untuk penjelasan lebih lanjut.

> Catatan: metrik `fps`, `latency`, `memory`, dan `lux` pada kode saat ini
> masih berupa nilai simulasi (random) untuk keperluan tampilan dashboard,
> belum diambil dari pengukuran hardware/sensor sungguhan.

## 8. Struktur Folder

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/            # hero.png, react.svg, vite.svg
│   ├── App.tsx            # komponen utama: kamera, MediaPipe, panggilan API
│   ├── App.css            # entry Tailwind untuk App
│   ├── index.css          # entry Tailwind global + dark mode variant
│   └── main.tsx           # entry point React (createRoot, StrictMode)
├── index.html              # memuat script MediaPipe Hands via CDN
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

## 9. Build untuk Production

```bash
npm run build
```

Hasil build statis akan ada di folder `dist/`, siap di-deploy ke layanan
static hosting (Vercel, Netlify, Railway static, dsb.). Pastikan `API_BASE`
(atau `VITE_API_BASE` bila sudah dipindah ke env var) menunjuk ke URL backend
production sebelum build.

Untuk preview hasil build secara lokal:

```bash
npm run preview
```

## 10. Troubleshooting

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Kamera tidak menyala / izin ditolak | Browser belum diberi izin akses kamera | Cek pengaturan izin kamera di browser, pastikan situs berjalan di `localhost` atau HTTPS |
| `Hands` undefined / deteksi tangan tidak jalan | Script MediaPipe Hands dari CDN belum termuat | Pastikan tag `<script>` MediaPipe ada di `index.html` dan koneksi internet aktif |
| Prediksi tidak muncul / error di console saat `predictSign` | Backend belum jalan atau `API_BASE` salah | Pastikan backend aktif di URL yang sesuai, cek juga `CORS_ORIGINS` di backend |
| Status tetap "SCANNING..." meski tangan sudah di depan kamera | Tangan berada di luar area target (ROI) yang ditentukan di kode | Posisikan tangan sesuai kotak target di layar, jaga jarak ideal ke kamera |
| Tombol "Bacakan Teks" tidak bersuara | Browser belum memuat daftar voice TTS, atau tidak mendukung `id-ID` | Coba di Chrome/Edge, pastikan `speechSynthesis.onvoiceschanged` sempat terpanggil |