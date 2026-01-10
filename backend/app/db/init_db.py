from sqlalchemy.orm import Session
from app.core import security
from app.db import models
from app.db.session import engine, SessionLocal

def init_db():
    # Only run if no users exist
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            admin_user = models.User(
                username="admin",
                full_name="System Administrator",
                hashed_password=security.get_password_hash("admin123"),
                role="ADMIN"
            )
            db.add(admin_user)
            analyst_user = models.User(
                username="analyst",
                full_name="Gov Analyst",
                hashed_password=security.get_password_hash("analyst123"),
                role="ANALYST"
            )
            db.add(analyst_user)
            db.commit()
            print("--- Auth: Initialized admin and analyst accounts ---")
        else:
            print("--- Auth: Initial admin already exists ---")
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    init_db()
