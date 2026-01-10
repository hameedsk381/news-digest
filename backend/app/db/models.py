from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="ANALYST") # ADMIN or ANALYST
    is_active = Column(Integer, default=1)

class DBFile(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    articles = relationship("DBArticle", back_populates="file")

class DBArticle(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True, default=generate_uuid)
    file_id = Column(String, ForeignKey("files.id"))
    
    headline = Column(Text)
    body = Column(Text)
    confidence = Column(Float)
    
    department = Column(String, nullable=True)
    sentiment_label = Column(String, nullable=True)
    sentiment_confidence = Column(Float, nullable=True)
    topic_cluster_id = Column(String, nullable=True)
    
    file = relationship("DBFile", back_populates="articles")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String) # e.g., "LOGIN", "SEARCH", "GENERATE_BRIEFING", "EXPORT_DATA"
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
