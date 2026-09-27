import torch

from app.config import settings
from app.models.lightweight_gcn import LightweightGCN


class ModelBundle:
    """Wadah model + metadata yang ikut tersimpan di sibi_gcn_model_standalone.pt."""

    def __init__(self, checkpoint_path: str, device: str = "cpu"):
        ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)

        self.device = device
        self.model = LightweightGCN(**ckpt["model_config"]).to(device)
        self.model.load_state_dict(ckpt["model_state_dict"])
        self.model.eval()

        self.idx_to_class: dict[int, str] = {
            int(k): v for k, v in ckpt["class_mapping"]["idx_to_class"].items()
        }
        self.model_type: str = ckpt.get("model_type", "LightweightGCN")
        self.metrics: dict = ckpt.get("metrics", {})
        self.framework_versions: dict = ckpt.get("framework_versions", {})

    def num_classes(self) -> int:
        return len(self.idx_to_class)


_bundle: ModelBundle | None = None


def load_model() -> ModelBundle:
    """Dipanggil sekali saat startup (lihat app/main.py lifespan)."""
    global _bundle
    if _bundle is None:
        _bundle = ModelBundle(settings.model_path, device=settings.device)
    return _bundle


def get_model() -> ModelBundle:
    """Dependency FastAPI untuk route yang butuh model. Panggil load_model() dulu di startup."""
    if _bundle is None:
        raise RuntimeError("Model belum dimuat. Pastikan load_model() dipanggil saat startup.")
    return _bundle
