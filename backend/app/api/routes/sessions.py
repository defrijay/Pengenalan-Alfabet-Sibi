from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.crud import translation as crud
from app.db.database import get_db
from app.db.schemas import (
    SessionEndRequest,
    SessionEndResponse,
    SessionStartResponse,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionStartResponse)
def start_session(db: DBSession = Depends(get_db)):
    session = crud.create_session(db)
    return SessionStartResponse(session_id=session.id, started_at=session.started_at)


@router.post("/end", response_model=SessionEndResponse)
def end_session(payload: SessionEndRequest, db: DBSession = Depends(get_db)):
    session = crud.end_session(db, payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")

    total = crud.count_translations(db, session.id)
    return SessionEndResponse(
        session_id=session.id, ended_at=session.ended_at, total_translations=total
    )
