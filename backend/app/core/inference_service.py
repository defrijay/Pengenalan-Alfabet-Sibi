import torch
import torch.nn.functional as F

from app.core.graph_builder import build_batch
from app.core.model_loader import ModelBundle


def predict(bundle: ModelBundle, landmarks: list[tuple[float, float, float]], top_k: int = 3):
    """
    landmarks: 21 tuple (x, y, z) dari MediaPipe Hands.
    Return: (pred_letter, confidence, top_k_list[(letter, prob), ...])
    """
    batch = build_batch(landmarks).to(bundle.device)

    with torch.no_grad():
        logits = bundle.model(batch)
        probs = F.softmax(logits, dim=1).cpu().numpy()[0]

    order = probs.argsort()[::-1]
    pred_idx = int(order[0])
    pred_letter = bundle.idx_to_class[pred_idx]
    confidence = float(probs[pred_idx])

    top_k_result = [
        (bundle.idx_to_class[int(i)], float(probs[i])) for i in order[:top_k]
    ]

    return pred_letter, confidence, top_k_result
