from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_session
from ..schemas import SourceOut, SourcesResponse


router = APIRouter()


@router.get("/sources", response_model=SourcesResponse)
def list_sources(db: Session = Depends(get_session)) -> SourcesResponse:
    rows = crud.list_sources(db)
    return SourcesResponse(sources=[SourceOut.model_validate(r) for r in rows])
