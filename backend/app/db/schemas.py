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
