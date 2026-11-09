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


class IoTTelemetry(Base):
    """Rekaman pengujian modul IoT ESP32 (sensor jarak, cahaya, speaker, motor getar, dan latensi fisik)."""

    __tablename__ = "iot_telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    translation_id = Column(Integer, ForeignKey("translations.id"), nullable=True)
    device_id = Column(String(64), default="esp32-sibi-01", nullable=False)

    # Sensor Input (Tabel 4.18)
    actual_distance_cm = Column(Float, nullable=True)
    measured_distance_cm = Column(Float, nullable=True)
    distance_in_range = Column(Boolean, nullable=True)
    led_indicator_status = Column(String(32), nullable=True)

    light_condition = Column(String(32), nullable=True)  # Terang / Redup / Gelap
    measured_lux = Column(Float, nullable=True)
    lux_threshold = Column(Float, default=150.0, nullable=True)
    helper_led_status = Column(String(32), nullable=True)  # Mati / Menyala

    # Aktuator Output & Latensi End-to-End (Tabel 4.16 & 4.17)
    target_letter = Column(String(1), nullable=True)
    predicted_letter = Column(String(1), nullable=True)
    confidence = Column(Float, nullable=True)
    speaker_output = Column(String(64), nullable=True)
    vibration_pattern = Column(String(32), nullable=True)  # Pendek / Panjang
    is_output_matched = Column(Boolean, nullable=True)

    api_latency_ms = Column(Float, nullable=True)
    wifi_latency_ms = Column(Float, nullable=True)
    actuation_latency_ms = Column(Float, nullable=True)
    total_e2e_ms = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
