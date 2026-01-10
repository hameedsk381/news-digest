from pydantic import BaseModel
from typing import List, Optional

class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int

class TextBlock(BaseModel):
    text: str
    confidence: float
    box: BoundingBox

class PageOCRResult(BaseModel):
    page_number: int
    width: int
    height: int
    blocks: List[TextBlock]
    full_text: str

class OCRProcessingResult(BaseModel):
    file_id: str
    pages: List[PageOCRResult]
    total_pages: int
    processing_time_seconds: float
