"""Re-export dependency injection functions supaya route tinggal `from app.api.deps import ...`"""

from app.core.model_loader import get_model  # noqa: F401
from app.db.database import get_db  # noqa: F401
