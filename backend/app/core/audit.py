from sqlalchemy.orm import Session
from app.db.models import AuditLog
from typing import Optional

def log_audit(
    db: Session, 
    action: str, 
    user_id: Optional[str] = None, 
    details: Optional[str] = None, 
    ip_address: Optional[str] = None
):
    """Utility to record an audit entry in the database."""
    try:
        new_log = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"FAILED TO WRITE AUDIT LOG: {e}")
        db.rollback()
