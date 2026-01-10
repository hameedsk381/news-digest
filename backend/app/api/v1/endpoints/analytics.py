from fastapi import APIRouter, Depends
from app.schemas.analytics import AnalyticsResponse, SentimentStats
from app.db.session import get_db
from app.db.models import DBFile, DBArticle
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

router = APIRouter()

@router.get("/", response_model=AnalyticsResponse)
async def get_analytics(db: Session = Depends(get_db)):
    
    # Efficient Count using DB queries
    total_files = db.query(DBFile).count()
    total_articles = db.query(DBArticle).count()
    
    # Sentiment Distribution
    pos_count = db.query(DBArticle).filter(DBArticle.sentiment_label == "Positive").count()
    neg_count = db.query(DBArticle).filter(DBArticle.sentiment_label == "Negative").count()
    neu_count = db.query(DBArticle).filter((DBArticle.sentiment_label == "Neutral") | (DBArticle.sentiment_label == None)).count()
    
    # Department Distribution - Requires grouping
    # SQLAlchemy grouping
    dept_stats = db.query(DBArticle.department, func.count(DBArticle.id)).group_by(DBArticle.department).all()
    department_counts = {dept if dept else "General": count for dept, count in dept_stats}
    
    return AnalyticsResponse(
        total_files=total_files,
        total_articles=total_articles,
        sentiment_distribution=SentimentStats(
            positive=pos_count,
            negative=neg_count,
            neutral=neu_count
        ),
        department_distribution=department_counts
    )
from app.db.models import DBFile, DBArticle, AuditLog, User
from app.api import deps

@router.get("/logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_staff_user)
):
    """Fetch recent system audit logs for administrators."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [{
        "id": log.id,
        "action": log.action,
        "details": log.details,
        "timestamp": log.timestamp,
        "ip_address": log.ip_address,
        "user": log.user.username if log.user else "System"
    } for log in logs]
