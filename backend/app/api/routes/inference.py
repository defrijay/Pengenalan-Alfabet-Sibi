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
    IoTDashboardResponse,
    IoTTelemetryItem,
    IoTTelemetryRequest,
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


@router.post("/iot/telemetry", response_model=IoTTelemetryItem)
def post_iot_telemetry(
    payload: IoTTelemetryRequest,
    db: DBSession = Depends(get_db),
):
    """
    Menerima laporan telemetri dari perangkat ESP32 atau panel pengujian IoT:
    - Sensor jarak HC-SR04 (aktual vs terbaca) & status LED indikator
    - Sensor cahaya LDR (Lux) & status LED bantu
    - Output speaker DFPlayer Mini, pola motor getar haptik, dan rincian latensi end-to-end
    """
    data = payload.model_dump()

    # Otomatis lengkapi status rentang jarak ideal (20-60 cm) bila belum diisi
    if data.get("measured_distance_cm") is not None and data.get("distance_in_range") is None:
        dist = data["measured_distance_cm"]
        in_range = 20.0 <= dist <= 60.0
        data["distance_in_range"] = in_range
        if not data.get("led_indicator_status"):
            data["led_indicator_status"] = "Hijau (Ideal)" if in_range else "Merah (Di Luar Rentang)"

    # Otomatis lengkapi status LED bantu cahaya bila belum diisi
    if data.get("measured_lux") is not None and not data.get("helper_led_status"):
        thresh = data.get("lux_threshold") or 150.0
        data["helper_led_status"] = "Menyala" if data["measured_lux"] < thresh else "Mati"

    # Otomatis hitung total_e2e_ms bila ada komponen latensi
    if data.get("total_e2e_ms") is None:
        api_l = data.get("api_latency_ms") or 0.0
        wifi_l = data.get("wifi_latency_ms") or 0.0
        act_l = data.get("actuation_latency_ms") or 0.0
        if api_l > 0 or wifi_l > 0 or act_l > 0:
            data["total_e2e_ms"] = round(api_l + wifi_l + act_l, 2)

    rec = crud.log_iot_telemetry(db, data)
    return IoTTelemetryItem(
        id=rec.id,
        translation_id=rec.translation_id,
        device_id=rec.device_id,
        actual_distance_cm=rec.actual_distance_cm,
        measured_distance_cm=rec.measured_distance_cm,
        distance_in_range=rec.distance_in_range,
        led_indicator_status=rec.led_indicator_status,
        light_condition=rec.light_condition,
        measured_lux=rec.measured_lux,
        lux_threshold=rec.lux_threshold,
        helper_led_status=rec.helper_led_status,
        target_letter=rec.target_letter,
        predicted_letter=rec.predicted_letter,
        confidence=rec.confidence,
        speaker_output=rec.speaker_output,
        vibration_pattern=rec.vibration_pattern,
        is_output_matched=rec.is_output_matched,
        api_latency_ms=rec.api_latency_ms,
        wifi_latency_ms=rec.wifi_latency_ms,
        actuation_latency_ms=rec.actuation_latency_ms,
        total_e2e_ms=rec.total_e2e_ms,
        created_at=rec.created_at,
    )


@router.get("/iot/telemetry", response_model=IoTDashboardResponse)
def get_iot_telemetry(
    limit: int = Query(100, ge=1, le=500),
    db: DBSession = Depends(get_db),
):
    from datetime import datetime, timedelta

    rows = crud.get_iot_telemetry_logs(db, limit=limit)
    items: list[IoTTelemetryItem] = []

    api_lats: list[float] = []
    wifi_lats: list[float] = []
    act_lats: list[float] = []
    e2e_lats: list[float] = []

    for r in rows:
        if r.api_latency_ms is not None and r.api_latency_ms > 0:
            api_lats.append(float(r.api_latency_ms))
        if r.wifi_latency_ms is not None and r.wifi_latency_ms > 0:
            wifi_lats.append(float(r.wifi_latency_ms))
        if r.actuation_latency_ms is not None and r.actuation_latency_ms > 0:
            act_lats.append(float(r.actuation_latency_ms))
        if r.total_e2e_ms is not None and r.total_e2e_ms > 0:
            e2e_lats.append(float(r.total_e2e_ms))

        items.append(
            IoTTelemetryItem(
                id=r.id,
                translation_id=r.translation_id,
                device_id=r.device_id,
                actual_distance_cm=r.actual_distance_cm,
                measured_distance_cm=r.measured_distance_cm,
                distance_in_range=r.distance_in_range,
                led_indicator_status=r.led_indicator_status,
                light_condition=r.light_condition,
                measured_lux=r.measured_lux,
                lux_threshold=r.lux_threshold,
                helper_led_status=r.helper_led_status,
                target_letter=r.target_letter,
                predicted_letter=r.predicted_letter,
                confidence=r.confidence,
                speaker_output=r.speaker_output,
                vibration_pattern=r.vibration_pattern,
                is_output_matched=r.is_output_matched,
                api_latency_ms=r.api_latency_ms,
                wifi_latency_ms=r.wifi_latency_ms,
                actuation_latency_ms=r.actuation_latency_ms,
                total_e2e_ms=r.total_e2e_ms,
                created_at=r.created_at,
            )
        )

    latest = items[0] if items else None
    esp32_online = False
    if latest and latest.created_at:
        esp32_online = (datetime.utcnow() - latest.created_at) < timedelta(seconds=30)

    return IoTDashboardResponse(
        esp32_online=esp32_online,
        last_seen_at=latest.created_at if latest else None,
        latest_distance_cm=latest.measured_distance_cm if latest else None,
        latest_lux=latest.measured_lux if latest else None,
        helper_led_status=latest.helper_led_status if latest else None,
        avg_api_latency_ms=round(float(np.mean(api_lats)), 2) if api_lats else 0.0,
        avg_wifi_latency_ms=round(float(np.mean(wifi_lats)), 2) if wifi_lats else 0.0,
        avg_actuation_latency_ms=round(float(np.mean(act_lats)), 2) if act_lats else 0.0,
        avg_total_e2e_ms=round(float(np.mean(e2e_lats)), 2) if e2e_lats else 0.0,
        records=items,
    )


@router.delete("/iot/telemetry")
def delete_iot_telemetry(db: DBSession = Depends(get_db)):
    deleted = crud.clear_iot_telemetry_logs(db)
    return {"status": "cleared", "deleted_count": deleted}
