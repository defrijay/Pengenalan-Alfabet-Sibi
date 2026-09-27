# SIBI Translator — Backend

FastAPI service untuk inference model `LightweightGCN` (SIBI alphabet, 26 kelas)
dan penyimpanan log translasi ke PostgreSQL.

## 1. Setup lokal (tanpa Docker)

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

## 2. Setup dengan Docker (lebih simpel)

```bash
docker compose up --build
```

Ini otomatis menjalankan Postgres + API. Migrasi `alembic upgrade head` tetap
perlu dijalankan sekali secara manual (bisa lewat `docker compose exec api alembic upgrade head`).

## 3. Alur endpoint

1. `POST /sessions/start` → dapat `session_id`, panggil saat kamera dinyalakan di frontend.
2. `POST /predict` → kirim `session_id` + 21 landmark `{x,y,z}` dari MediaPipe Hands
   (persis array yang sudah dihasilkan `hands.onResults()` di `App.tsx`).
   Response: huruf prediksi, confidence, top-3, dan `translation_id` untuk feedback.
3. `POST /feedback` (opsional) → tandai `translation_id` benar/salah + label koreksi,
   berguna untuk data evaluasi di BAB IV skripsi.
4. `POST /sessions/end` → tutup sesi saat kamera dimatikan.

## 4. Kenapa modelnya begini

- Model yang dimuat: `sibi_gcn_model_standalone.pt` (bukan `gcn_results.pt`) — file ini
  self-contained: state_dict + config + class mapping + graph structure, lihat
  `app/core/model_loader.py`.
- `app/models/lightweight_gcn.py` dan `app/core/graph_builder.py` adalah porting
  1:1 dari notebook (`class LightweightGCN`, `build_graph()`, `HAND_CONNECTIONS`,
  `PALM_LANDMARK_IDX`) — **jangan diubah** tanpa mengubah juga cara training,
  karena bobot model hanya valid untuk representasi fitur & topologi graf ini persis.
- Backend menerima **landmark array**, bukan gambar/frame mentah, sesuai keputusan
  arsitektur hybrid: MediaPipe Hands jalan di browser (WASM), backend cuma menerima
  hasil landmark-nya untuk inference GCN.
- `hand_landmarker.task` ikut disertakan di `app/models/artifacts/` tapi **belum
  dipakai** oleh kode ini — itu model MediaPipe Tasks API versi Python, untuk
  skenario alternatif kalau nanti kamu mau backend juga bisa menerima gambar
  langsung (bukan cuma landmark dari client). Kalau tidak perlu, boleh dihapus.

## 5. Skema database

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

## 6. Struktur folder

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
