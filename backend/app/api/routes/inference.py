import os
import time
import uuid
import numpy as np

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

try:
    import psutil
except ImportError:
    psutil = None

from app.core.inference_service import predict
from app.core.model_loader import ModelBundle, get_model
from app.crud import translation as crud
from app.db.database import get_db
from app.db.schemas import (
    FeedbackRequest,
    LatestPredictionResponse,
    MonitoringStatsResponse,
    PredictRequest,
    PredictResponse,
    TranslationLogItem,
)

router = APIRouter(tags=["inference"])


def _get_server_memory_mb() -> float:
    if psutil is not None:
        try:
            proc = psutil.Process(os.getpid())
            return round(proc.memory_info().rss / (1024 * 1024), 1)
        except Exception:
            pass
    return 128.0


@router.post("/predict", response_model=PredictResponse)
def predict_sign(
    payload: PredictRequest,
    db: DBSession = Depends(get_db),
    bundle: ModelBundle = Depends(get_model),
):
    landmarks = [(lm.x, lm.y, lm.z) for lm in payload.landmarks]

    t0 = time.perf_counter()
    try:
        pred_letter, confidence, top_k = predict(bundle, landmarks)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    inference_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    server_mem_mb = _get_server_memory_mb()

    effective_latency = payload.latency_ms if payload.latency_ms is not None else int(round(inference_ms))
    effective_memory = payload.memory_mb if payload.memory_mb is not None else int(round(server_mem_mb))

    translation_id = 0
    try:
        active_model = crud.get_active_model(db)
        log = crud.log_translation(
            db,
            session_id=payload.session_id,
            predicted_class=pred_letter,
            confidence=confidence,
            model_version_id=active_model.id if active_model else None,
            fps=payload.fps,
            latency_ms=effective_latency,
            memory_mb=effective_memory,
            lux=payload.lux,
            hand_scale=payload.hand_scale,
        )
        translation_id = log.id
    except Exception as e:
        print(f"[Warning] Gagal log translation ke DB: {e}")

    return PredictResponse(
        predicted_class=pred_letter,
        confidence=confidence,
        top_k=top_k,
        translation_id=translation_id,
        inference_ms=inference_ms,
        server_memory_mb=server_mem_mb,
    )


@router.get("/latest", response_model=LatestPredictionResponse)
@router.get("/predict/latest", response_model=LatestPredictionResponse)
def get_latest_sign(
    session_id: uuid.UUID | None = Query(None, description="Filter opsional per session"),
    db: DBSession = Depends(get_db),
):
    """
    Endpoint polling untuk perangkat edge / IoT (ESP32).
    Mengembalikan huruf prediksi paling mutakhir agar ESP32 dapat membunyikan speaker
    dan mengaktifkan motor getar haptik tanpa perlu menjalankan model di mikrokontroler.
    """
    latest = crud.get_latest_translation(db, session_id=session_id)
    if not latest:
        return LatestPredictionResponse()

    return LatestPredictionResponse(
        translation_id=latest.id,
        predicted_class=latest.predicted_class,
        confidence=latest.confidence,
        created_at=latest.created_at,
    )



@router.post("/feedback")
def submit_feedback(payload: FeedbackRequest, db: DBSession = Depends(get_db)):
    fb = crud.save_feedback(
        db,
        translation_id=payload.translation_id,
        is_correct=payload.is_correct,
        corrected_label=payload.corrected_label,
    )
    return {"status": "saved", "feedback_id": fb.id}


@router.get("/logs", response_model=MonitoringStatsResponse)
def get_monitoring_logs(
    session_id: uuid.UUID | None = Query(None, description="Filter opsional per session"),
    limit: int = Query(100, ge=1, le=500),
    db: DBSession = Depends(get_db),
):
    """
    Mengembalikan riwayat log inferensi beserta statistik ringkasan (Rata-rata, p50, p95, RAM)
    untuk dokumentasi pengujian Cloud (RM4) & evaluasi real-time di Bab IV Skripsi.
    """
    records = crud.get_translation_logs(db, session_id=session_id, limit=limit)

    items: list[TranslationLogItem] = []
    latencies: list[float] = []
    confidences: list[float] = []

    for r in records:
        if r.latency_ms is not None and r.latency_ms > 0:
            latencies.append(float(r.latency_ms))
        if r.confidence is not None:
            confidences.append(float(r.confidence))

        fb = r.feedback
        items.append(
            TranslationLogItem(
                id=r.id,
                session_id=r.session_id,
                predicted_class=r.predicted_class,
                confidence=r.confidence,
                latency_ms=r.latency_ms,
                fps=r.fps,
                memory_mb=r.memory_mb,
                lux=r.lux,
                hand_scale=r.hand_scale,
                created_at=r.created_at,
                is_correct=fb.is_correct if fb else None,
                corrected_label=fb.corrected_label if fb else None,
            )
        )

    if latencies:
        lat_arr = np.array(latencies)
        avg_lat = round(float(np.mean(lat_arr)), 2)
        p50_lat = round(float(np.percentile(lat_arr, 50)), 2)
        p95_lat = round(float(np.percentile(lat_arr, 95)), 2)
    else:
        avg_lat, p50_lat, p95_lat = 0.0, 0.0, 0.0

    avg_conf = round(float(np.mean(confidences)), 4) if confidences else 0.0

    return MonitoringStatsResponse(
        total_logs=len(items),
        avg_latency_ms=avg_lat,
        p50_latency_ms=p50_lat,
        p95_latency_ms=p95_lat,
        avg_confidence=avg_conf,
        server_memory_mb=_get_server_memory_mb(),
        logs=items,
    )


@router.delete("/logs")
def delete_monitoring_logs(
    session_id: uuid.UUID | None = Query(None, description="Filter opsional per session"),
    db: DBSession = Depends(get_db),
):
    deleted = crud.clear_translation_logs(db, session_id=session_id)
    return {"status": "cleared", "deleted_count": deleted}
