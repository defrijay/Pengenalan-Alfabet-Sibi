"""
Jalankan dengan: pytest
Butuh MODEL_PATH valid di .env dan DB yang bisa diakses (atau ganti get_db
dengan SQLite in-memory kalau mau test tanpa Postgres).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["model_loaded"] is True
    assert body["num_classes"] == 26  # A-Z


def test_predict_rejects_wrong_landmark_count():
    session = client.post("/sessions/start").json()
    payload = {
        "session_id": session["session_id"],
        "landmarks": [{"x": 0.1, "y": 0.1, "z": 0.0}] * 10,  # sengaja kurang dari 21
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
