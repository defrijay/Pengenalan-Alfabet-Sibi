# SIBI Translator Backend

Backend ini adalah **otak inferensi** dari sistem SIBI Translator bagian yang
menerima data landmark tangan, menjalankan model GCN, lalu mengembalikan huruf
hasil prediksi ke frontend secara real-time.

Peran spesifiknya dalam keseluruhan sistem:

- **Tidak memproses gambar/kamera langsung.** Deteksi 21 landmark tangan (via
  MediaPipe Hands) dilakukan di sisi **frontend** (browser, lewat WASM), bukan
  di backend ini. Backend hanya menerima array koordinat landmark yang sudah
  jadi lewat `POST /predict`.
- **Menjalankan model `LightweightGCN`** yang sudah dilatih dan diverifikasi di
  notebook eksperimen (`notebook/`), diekspor sebagai file standalone
  `sibi_gcn_model_standalone.pt` yang memuat bobot model, konfigurasi, mapping
  kelas, dan struktur graf sekaligus jadi backend tidak perlu tahu detail
  training, cukup memuat dan menjalankan file ini.
- **Mengelola sesi & mencatat riwayat** setiap kali pengguna membuka/menutup
  kamera (`sessions`) dan setiap hasil prediksi huruf (`translations`), termasuk
  metrik seperti latency dan confidence data ini juga berguna sebagai bahan
  evaluasi tambahan untuk laporan skripsi (BAB IV).
- **Menyediakan mekanisme feedback** (`POST /feedback`) supaya pengguna atau
  peneliti bisa menandai prediksi yang salah, membuka kemungkinan analisis
  kesalahan atau *fine-tuning* di masa depan.
- **Berjalan independen dari frontend**, diekspos sebagai REST API standar
  (FastAPI) sehingga bisa di-deploy terpisah ke Railway, diuji lewat Swagger UI,
  atau bahkan dikonsumsi klien lain selain frontend React yang ada saat ini.

Singkatnya: `frontend/` menangkap gambar dan mengekstrak landmark → **backend
ini** menerima landmark tersebut, mengubahnya jadi graf, menjalankan GCN, dan
mengembalikan hasil prediksi + menyimpannya ke database → hasil itu ditampilkan
kembali ke pengguna di frontend (dan opsional dipicu ke purwarupa IoT ESP32).

## Daftar Isi

- [1. Tech Stack](#1-tech-stack)
- [2. Prasyarat](#2-prasyarat)
- [3. Setup Lokal (tanpa Docker)](#3-setup-lokal-tanpa-docker)
- [4. Setup dengan Docker](#4-setup-dengan-docker)
- [5. Environment Variables](#5-environment-variables)
- [6. Cara Menjalankan](#6-cara-menjalankan)
- [7. Alur Endpoint](#7-alur-endpoint)
- [8. Kenapa Modelnya Begini](#8-kenapa-modelnya-begini)
- [9. Skema Database](#9-skema-database)
- [10. Struktur Folder](#10-struktur-folder)
- [11. Testing](#11-testing)
- [12. Deployment (Railway)](#12-deployment-railway)
- [13. Troubleshooting](#13-troubleshooting)

## 1. Tech Stack

| Kategori | Teknologi |
|---|---|

| Framework API | FastAPI + Uvicorn |
| Deep Learning | PyTorch, PyTorch Geometric |
| Database | PostgreSQL + SQLAlchemy |
| Migrasi Skema | Alembic |
| Containerization | Docker, Docker Compose |
| Deployment | Railway |
| Testing | Pytest |

## 2. Prasyarat

- Python 3.10+
- PostgreSQL 14+ (lokal, atau lewat Docker Compose)
- Docker & Docker Compose (opsional, kalau tidak mau setup manual)
- Bobot model `sibi_gcn_model_standalone.pt` sudah tersedia di `app/models/artifacts/`

## 3. Setup Lokal (tanpa Docker)

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # lalu sesuaikan DATABASE_URL kalau perlu

# pastikan Postgres jalan, lalu buat schema:
alembic upgrade head

uvicorn app.main:app --reload
```

Buka `http://localhost:8000/docs` untuk Swagger UI.

## 4. Setup dengan Docker (lebih simpel)

```bash
docker compose up --build
```

Ini otomatis menjalankan Postgres + API. Migrasi `alembic upgrade head` tetap
perlu dijalankan sekali secara manual (bisa lewat `docker compose exec api alembic upgrade head`).

## 5. Environment Variables

Isi lengkap ada di `.env.example` sesuaikan sebelum copy ke `.env`. Variabel inti yang perlu diperhatikan:

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/sibi_db` |
| `MODEL_PATH` | Path ke bobot model aktif | `app/models/artifacts/sibi_gcn_model_standalone.pt` |
| `APP_ENV` | Mode aplikasi | `development` / `production` |
| `CORS_ORIGINS` | Origin yang diizinkan mengakses API (untuk frontend) | `http://localhost:5173` |

> Sesuaikan tabel ini dengan variabel aktual di `.env.example` jika ada tambahan (mis. secret key, port, dsb.).

## 6. Cara Menjalankan

Ringkasan langkah menjalankan aplikasi setelah setup (bagian 3 atau 4) selesai.

### A. Mode lokal (tanpa Docker)

```bash
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

- `--reload` otomatis restart server saat ada perubahan kode (dipakai saat development saja).
- Server jalan default di `http://localhost:8000`.
- Untuk production/tanpa auto-reload:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
  ```

### B. Mode Docker

```bash
docker compose up --build      # jalankan pertama kali / setelah ada perubahan dependency
docker compose up              # jalankan biasa (tanpa rebuild image)
docker compose up -d           # jalankan di background (detached)
```

Untuk menghentikan:

```bash
docker compose down            # stop & hapus container (data Postgres tetap ada di volume)
```

### C. Verifikasi server sudah jalan

```bash
curl http://localhost:8000/health
```

Atau langsung buka di browser:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Kalau endpoint `/health` (atau endpoint root) merespons `200 OK`, berarti API
sudah siap menerima request dari frontend.

### D. Menjalankan frontend bersamaan (opsional)

Backend ini dikonsumsi oleh `frontend/` (React + Vite). Untuk pengujian end-to-end
secara lokal, jalankan backend seperti di atas, lalu di terminal terpisah:

```bash
cd ../frontend
npm install
npm run dev
```

Pastikan `CORS_ORIGINS` di `.env` backend sudah mencakup origin dev server frontend
(default Vite: `http://localhost:5173`).

## 7. Alur Endpoint

1. `POST /sessions/start` → dapat `session_id`, panggil saat kamera dinyalakan di frontend.
2. `POST /predict` → kirim `session_id` + 21 landmark `{x,y,z}` dari MediaPipe Hands
   (persis array yang sudah dihasilkan `hands.onResults()` di `App.tsx`).
   Response: huruf prediksi, confidence, top-3, dan `translation_id` untuk feedback.
3. `POST /feedback` (opsional) → tandai `translation_id` benar/salah + label koreksi,
   berguna untuk data evaluasi di BAB IV skripsi.
4. `POST /sessions/end` → tutup sesi saat kamera dimatikan.

Dokumentasi interaktif seluruh endpoint (request/response schema) otomatis tersedia
lewat Swagger UI di `/docs` atau ReDoc di `/redoc` setelah server jalan.

## 8. Kenapa Modelnya Begini

- Model yang dimuat: `sibi_gcn_model_standalone.pt` (bukan `gcn_results.pt`) file ini
  self-contained: state_dict + config + class mapping + graph structure, lihat
  `app/core/model_loader.py`.
- `app/models/lightweight_gcn.py` dan `app/core/graph_builder.py` adalah porting
  1:1 dari notebook (`class LightweightGCN`, `build_graph()`, `HAND_CONNECTIONS`,
  `PALM_LANDMARK_IDX`) **jangan diubah** tanpa mengubah juga cara training,
  karena bobot model hanya valid untuk representasi fitur & topologi graf ini persis.
- Backend menerima **landmark array**, bukan gambar/frame mentah, sesuai keputusan
  arsitektur hybrid: MediaPipe Hands jalan di browser (WASM), backend cuma menerima
  hasil landmark-nya untuk inference GCN.
- `hand_landmarker.task` ikut disertakan di `app/models/artifacts/` tapi **belum
  dipakai** oleh kode ini itu model MediaPipe Tasks API versi Python, untuk
  skenario alternatif kalau nanti kamu mau backend juga bisa menerima gambar
  langsung (bukan cuma landmark dari client). Kalau tidak perlu, boleh dihapus.

## 9. Skema Database

| Tabel | Fungsi |
|---|---|
| `sessions` | satu sesi kamera on → off |
| `translations` | log tiap hasil deteksi huruf + metrik (fps, latency, dst) |
| `model_registry` | riwayat versi model yang pernah aktif |
| `feedback` | koreksi manual atas satu hasil translasi (opsional) |

Migrasi awal ada di `alembic/versions/0001_initial_schema.py`.

Untuk mendaftarkan model aktif ke `model_registry` (supaya `translations.model_version_id`
terisi), insert manual sekali setelah deploy, misalnya lewat `psql` atau skrip kecil:

```python
from app.db.database import SessionLocal
from app.db.models import ModelRegistry

db = SessionLocal()
db.add(ModelRegistry(
    model_name="LightweightGCN",
    version="v1",
    file_path="app/models/artifacts/sibi_gcn_model_standalone.pt",
    test_acc=0.9733,
    cross_domain_acc=0.8407,
    stress_acc=0.8094,
    framework_versions={"torch": "2.10.0+cu128", "torch_geometric": "2.8.0.post1"},
    is_active=True,
))
db.commit()
```

Untuk membuat migrasi baru setelah mengubah model SQLAlchemy di `app/db/models.py`:

```bash
alembic revision --autogenerate -m "deskripsi perubahan"
alembic upgrade head
```

## 10. Struktur Folder

```
app/
├── main.py                # entrypoint + lifespan (load model saat startup)
├── config.py               # env settings
├── api/routes/             # health, sessions, inference
├── core/                   # model_loader, graph_builder, inference_service
├── models/                 # class LightweightGCN + artefak .pt/.task
├── db/                     # SQLAlchemy models, schemas, engine
└── crud/                   # helper query DB
alembic/                    # migrasi DB
tests/                      # pytest
```

## 11. Testing

Jalankan unit test dengan:

```bash
pytest app/tests/
```

Test utama saat ini mencakup `test_inference.py`, yang memverifikasi bahwa
`inference_service` menghasilkan output valid (huruf terdeteksi, confidence
dalam rentang 0–1) dari sample landmark. Tambahkan test baru di folder yang
sama mengikuti konvensi penamaan `test_*.py` agar otomatis terdeteksi pytest.

## 12. Deployment (Railway)

Backend di-deploy sebagai container lewat `Dockerfile` yang sudah disediakan.

1. Push image/branch ke Railway (lewat GitHub integration atau Railway CLI).
2. Set seluruh environment variable dari `.env.example` di dashboard Railway
   (khususnya `DATABASE_URL` gunakan instance PostgreSQL yang disediakan Railway).
3. Jalankan migrasi sekali setelah deploy pertama:
   ```bash
   railway run alembic upgrade head
   ```
4. Pastikan `MODEL_PATH` menunjuk ke lokasi bobot model di dalam container
   (bobot model perlu ikut ter-bundle di image, cek `Dockerfile`).

> Catatan: pengujian latensi, throughput, dan estimasi biaya operasional di
> Railway masih perlu dilengkapi (lihat bagian Rekomendasi di README utama
> repository).

## 13. Troubleshooting

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `ModuleNotFoundError: torch_geometric` | Dependency belum lengkap terpasang | `pip install -r requirements.txt` ulang di venv aktif |
| Error koneksi database saat startup | `DATABASE_URL` salah atau Postgres belum jalan | Cek `.env`, pastikan service Postgres aktif |
| `/predict` selalu mengembalikan confidence rendah/salah | Format landmark tidak sesuai urutan 21 titik MediaPipe | Cocokkan payload dengan output `hands.onResults()` di frontend |
| Migrasi Alembic gagal (`target database is not up to date`) | Ada migrasi tertunda | Jalankan `alembic upgrade head` sebelum revisi baru |