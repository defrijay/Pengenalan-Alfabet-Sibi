import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Session(Base):
    """Satu sesi penerjemahan: dari kamera dinyalakan sampai dimatikan."""

    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    device_info = Column(String, nullable=True)

    translations = relationship(
        "Translation", back_populates="session", cascade="all, delete-orphan"
    )


class ModelRegistry(Base):
    """Riwayat/versi model yang pernah di-deploy (model registry sederhana)."""

    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String, nullable=False)  # mis. "LightweightGCN"
    version = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    test_acc = Column(Float, nullable=True)
    cross_domain_acc = Column(Float, nullable=True)
    stress_acc = Column(Float, nullable=True)
    framework_versions = Column(JSONB, nullable=True)

    deployed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    translations = relationship("Translation", back_populates="model_version")


class Translation(Base):
    """Log satu hasil deteksi tanda (satu huruf), sesuai metrik yang tampil di dashboard frontend."""

    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    model_version_id = Column(
        Integer, ForeignKey("model_registry.id"), nullable=True
    )

    predicted_class = Column(String(1), nullable=False)  # A-Z
    confidence = Column(Float, nullable=False)

    latency_ms = Column(Integer, nullable=True)
    fps = Column(Integer, nullable=True)
    memory_mb = Column(Integer, nullable=True)
    lux = Column(Integer, nullable=True)
    hand_scale = Column(String(10), nullable=True)  # "Jauh" | "Ideal" | "Dekat"

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("Session", back_populates="translations")
    model_version = relationship("ModelRegistry", back_populates="translations")
    feedback = relationship(
        "Feedback", back_populates="translation", uselist=False, cascade="all, delete-orphan"
    )


class Feedback(Base):
    """Koreksi manual atas satu hasil translasi (opsional, buat evaluasi/BAB IV skripsi)."""

    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    translation_id = Column(
        Integer, ForeignKey("translations.id"), nullable=False, unique=True
    )
    is_correct = Column(Boolean, nullable=False)
    corrected_label = Column(String(1), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    translation = relationship("Translation", back_populates="feedback")
