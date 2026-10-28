"""
test_inference.py
Unit test FastAPI backend SIBI Translation.
Menggunakan SQLite in-memory untuk pengujian independen tanpa dependensi Postgres eksternal.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Dukungan SQLite untuk tipe PostgreSQL JSONB saat testing
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


from app.db.database import Base, get_db
from app.main import app

# Setup database SQLite in-memory untuk testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    # Menggunakan context manager agar event lifespan (load_model) FastAPI dieksekusi
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["model_loaded"] is True
    assert body["num_classes"] == 26  # A-Z


def test_predict_rejects_wrong_landmark_count(client):
    session = client.post("/sessions/start").json()
    payload = {
        "session_id": session["session_id"],
        "landmarks": [{"x": 0.1, "y": 0.1, "z": 0.0}] * 10,  # Kurang dari 21
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_and_get_latest(client):
    # 1. Mulai sesi baru
    session = client.post("/sessions/start").json()
    session_id = session["session_id"]

    # 2. Kirim 21 landmark valid
    dummy_landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)]
    payload = {
        "session_id": session_id,
        "landmarks": dummy_landmarks,
        "fps": 30,
        "latency_ms": 40,
        "memory_mb": 120,
        "lux": 450,
        "hand_scale": "Ideal",
    }
    pred_res = client.post("/predict", json=payload)
    assert pred_res.status_code == 200
    data = pred_res.json()
    assert "predicted_class" in data
    assert "confidence" in data
    assert len(data["top_k"]) == 3

    # 3. Uji endpoint polling IoT (GET /predict/latest)
    latest_res = client.get("/predict/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["translation_id"] == data["translation_id"]
    assert latest_data["predicted_class"] == data["predicted_class"]
