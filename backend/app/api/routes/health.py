from fastapi import APIRouter

from app.core.model_loader import get_model

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    try:
        bundle = get_model()
        model_ok = True
        num_classes = bundle.num_classes()
    except RuntimeError:
        model_ok = False
        num_classes = 0

    return {
        "status": "ok" if model_ok else "model_not_loaded",
        "model_loaded": model_ok,
        "num_classes": num_classes,
    }
