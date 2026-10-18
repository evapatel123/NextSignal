from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_session
from ..schemas import SyncRequest, SyncResponse
from ..services.sync import run_sync


router = APIRouter()


@router.post("/admin/sync", response_model=SyncResponse)
def admin_sync(payload: SyncRequest | None = None, db: Session = Depends(get_session)) -> SyncResponse:
    body = payload or SyncRequest()
    result = run_sync(db, force=body.force)
    return SyncResponse(
        started=True,
        job_id=result["job_id"],
        events_processed=result["events"],
        sources_synced=result["sources"],
    )
