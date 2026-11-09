import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------- Inference ----------

class Landmark(BaseModel):
    x: float
    y: float
    z: float


class PredictRequest(BaseModel):
    """21 landmark tangan dari MediaPipe Hands (hasil ekstraksi di sisi client)."""

    session_id: uuid.UUID
    landmarks: list[Landmark] = Field(..., min_length=21, max_length=21)

    # metrik opsional dari dashboard frontend, ikut disimpan untuk monitoring
    fps: int | None = None
    latency_ms: int | None = None
    memory_mb: int | None = None
    lux: int | None = None
    hand_scale: str | None = None


class PredictResponse(BaseModel):
    predicted_class: str
    confidence: float
    top_k: list[tuple[str, float]]
    translation_id: int
    inference_ms: float | None = None
    server_memory_mb: float | None = None


class TranslationLogItem(BaseModel):
    id: int
    session_id: uuid.UUID
    predicted_class: str
    confidence: float
    latency_ms: int | None = None
    fps: int | None = None
    memory_mb: int | None = None
    lux: int | None = None
    hand_scale: str | None = None
    created_at: datetime
    is_correct: bool | None = None
    corrected_label: str | None = None


class MonitoringStatsResponse(BaseModel):
    total_logs: int
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    avg_confidence: float
    server_memory_mb: float
    logs: list[TranslationLogItem]


class LatestPredictionResponse(BaseModel):
    """Hasil deteksi translasi paling mutakhir untuk dikonsumsi modul IoT (ESP32)."""

    translation_id: int | None = None
    predicted_class: str | None = None
    confidence: float | None = None
    created_at: datetime | None = None



# ---------- Sessions ----------

class SessionStartResponse(BaseModel):
    session_id: uuid.UUID
    started_at: datetime


class SessionEndRequest(BaseModel):
    session_id: uuid.UUID


class SessionEndResponse(BaseModel):
    session_id: uuid.UUID
    ended_at: datetime
    total_translations: int


# ---------- Feedback ----------

class FeedbackRequest(BaseModel):
    translation_id: int
    is_correct: bool
    corrected_label: str | None = None


# ---------- IoT Telemetry & Pengujian (Tabel 4.16, 4.17, 4.18) ----------

class IoTTelemetryRequest(BaseModel):
    translation_id: int | None = None
    device_id: str = "esp32-sibi-01"

    actual_distance_cm: float | None = None
    measured_distance_cm: float | None = None
    distance_in_range: bool | None = None
    led_indicator_status: str | None = None

    light_condition: str | None = None
    measured_lux: float | None = None
    lux_threshold: float | None = 150.0
    helper_led_status: str | None = None

    target_letter: str | None = None
    predicted_letter: str | None = None
    confidence: float | None = None
    speaker_output: str | None = None
    vibration_pattern: str | None = None
    is_output_matched: bool | None = None

    api_latency_ms: float | None = None
    wifi_latency_ms: float | None = None
    actuation_latency_ms: float | None = None
    total_e2e_ms: float | None = None


class IoTTelemetryItem(IoTTelemetryRequest):
    id: int
    created_at: datetime


class IoTDashboardResponse(BaseModel):
    esp32_online: bool
    last_seen_at: datetime | None = None
    latest_distance_cm: float | None = None
    latest_lux: float | None = None
    helper_led_status: str | None = None
    avg_api_latency_ms: float
    avg_wifi_latency_ms: float
    avg_actuation_latency_ms: float
    avg_total_e2e_ms: float
    records: list[IoTTelemetryItem]
