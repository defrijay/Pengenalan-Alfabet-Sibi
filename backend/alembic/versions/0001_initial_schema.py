"""initial schema: sessions, model_registry, translations, feedback

Revision ID: 0001
Revises:
Create Date: 2026-09-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("device_info", sa.String(), nullable=True),
    )

    op.create_table(
        "model_registry",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
        sa.Column("test_acc", sa.Float(), nullable=True),
        sa.Column("cross_domain_acc", sa.Float(), nullable=True),
        sa.Column("stress_acc", sa.Float(), nullable=True),
        sa.Column("framework_versions", postgresql.JSONB(), nullable=True),
        sa.Column("deployed_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "translations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id"),
            nullable=False,
        ),
        sa.Column(
            "model_version_id",
            sa.Integer(),
            sa.ForeignKey("model_registry.id"),
            nullable=True,
        ),
        sa.Column("predicted_class", sa.String(length=1), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("fps", sa.Integer(), nullable=True),
        sa.Column("memory_mb", sa.Integer(), nullable=True),
        sa.Column("lux", sa.Integer(), nullable=True),
        sa.Column("hand_scale", sa.String(length=10), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_translations_session_id", "translations", ["session_id"])

    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "translation_id",
            sa.Integer(),
            sa.ForeignKey("translations.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("corrected_label", sa.String(length=1), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_index("ix_translations_session_id", table_name="translations")
    op.drop_table("translations")
    op.drop_table("model_registry")
    op.drop_table("sessions")
