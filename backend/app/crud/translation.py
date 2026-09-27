import uuid
from datetime import datetime

from sqlalchemy.orm import Session as DBSession

from app.db import models


def create_session(db: DBSession, device_info: str | None = None) -> models.Session:
    session = models.Session(device_info=device_info)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def end_session(db: DBSession, session_id: uuid.UUID) -> models.Session | None:
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if session is None:
        return None
    session.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def count_translations(db: DBSession, session_id: uuid.UUID) -> int:
    return (
        db.query(models.Translation)
        .filter(models.Translation.session_id == session_id)
        .count()
    )


def log_translation(
    db: DBSession,
    session_id: uuid.UUID,
    predicted_class: str,
    confidence: float,
    model_version_id: int | None = None,
    fps: int | None = None,
    latency_ms: int | None = None,
    memory_mb: int | None = None,
    lux: int | None = None,
    hand_scale: str | None = None,
) -> models.Translation:
    translation = models.Translation(
        session_id=session_id,
        model_version_id=model_version_id,
        predicted_class=predicted_class,
        confidence=confidence,
        fps=fps,
        latency_ms=latency_ms,
        memory_mb=memory_mb,
        lux=lux,
        hand_scale=hand_scale,
    )
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation


def get_active_model(db: DBSession) -> models.ModelRegistry | None:
    return (
        db.query(models.ModelRegistry)
        .filter(models.ModelRegistry.is_active.is_(True))
        .order_by(models.ModelRegistry.deployed_at.desc())
        .first()
    )


def save_feedback(
    db: DBSession, translation_id: int, is_correct: bool, corrected_label: str | None
) -> models.Feedback:
    feedback = models.Feedback(
        translation_id=translation_id,
        is_correct=is_correct,
        corrected_label=corrected_label,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
