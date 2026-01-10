from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.agents.search_agent import search_agent
from typing import List, Optional, Dict, Any
from app.api import deps
from app.db import models

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    use_web: Optional[bool] = False

class SearchResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] # Changed to list of dicts for metadata

from app.core.audit import log_audit
from fastapi import Request
from sqlalchemy.orm import Session
from app.db.session import get_db

@router.post("/query", response_model=SearchResponse)
async def perform_search(
    request: SearchRequest,
    req_raw: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    try:
        log_audit(
            db, 
            "SEARCH_QUERY", 
            user_id=current_user.id, 
            details=f"Query: {request.query} | Use Web: {request.use_web}",
            ip_address=req_raw.client.host
        )
        result = await search_agent.query(request.query, use_web=request.use_web)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
