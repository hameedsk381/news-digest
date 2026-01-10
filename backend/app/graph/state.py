from typing import List, Optional, Any
from typing_extensions import TypedDict
from app.schemas.layout import Article
from app.schemas.ocr import OCRProcessingResult

class AgentState(TypedDict):
    """
    Represents the state of the document processing pipeline.
    """
    file_id: str
    file_path: str
    ocr_result: Optional[OCRProcessingResult]
    articles: List[Article]
    unassigned_segments: List[Any] 
    # Parallel processing temporary partials
    department_updates: Optional[List[dict]] 
    sentiment_updates: Optional[List[dict]]
    error: Optional[str]
