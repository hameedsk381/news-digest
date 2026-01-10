from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from app.schemas.ocr import BoundingBox

class SegmentType(str, Enum):
    HEADLINE = "headline"
    BODY = "body"
    HEADER = "header" # specific newspaper headers
    UNKNOWN = "unknown"

class LayoutSegment(BaseModel):
    id: str
    type: SegmentType
    text: str
    box: BoundingBox
    page_number: int

class Article(BaseModel):
    headline: str
    body: str
    segments: List[LayoutSegment] # Keep track of source segments
    confidence: float
    department: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    topic_cluster_id: Optional[str] = None

class LayoutResult(BaseModel):
    articles: List[Article]
    unassigned_segments: List[LayoutSegment]
