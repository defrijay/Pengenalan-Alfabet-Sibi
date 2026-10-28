import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

from app.core.inference_service import predict
from app.core.model_loader import ModelBundle, get_model
from app.crud import translation as crud
from app.db.database import get_db
from app.db.schemas import (
    FeedbackRequest,
    LatestPredictionResponse,
    PredictRequest,
    PredictResponse,
)

router = APIRouter(tags=["inference"])


@router.post("/predict", response_model=PredictResponse)
def predict_sign(
    payload: PredictRequest,
    db: DBSession = Depends(get_db),
    bundle: ModelBundle = Depends(get_model),
):
    landmarks = [(lm.x, lm.y, lm.z) for lm in payload.landmarks]

    try:
        pred_letter, confidence, top_k = predict(bundle, landmarks)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    active_model = crud.get_active_model(db)

    log = crud.log_translation(
        db,
        session_id=payload.session_id,
        predicted_class=pred_letter,
        confidence=confidence,
        model_version_id=active_model.id if active_model else None,
        fps=payload.fps,
        latency_ms=payload.latency_ms,
        memory_mb=payload.memory_mb,
        lux=payload.lux,
        hand_scale=payload.hand_scale,
    )

    return PredictResponse(
        predicted_class=pred_letter,
        confidence=confidence,
        top_k=top_k,
        translation_id=log.id,
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
