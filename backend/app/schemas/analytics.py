from pydantic import BaseModel
from typing import Dict, List

class SentimentStats(BaseModel):
    positive: int
    negative: int
    neutral: int

class AnalyticsResponse(BaseModel):
    total_files: int
    total_articles: int
    sentiment_distribution: SentimentStats
    department_distribution: Dict[str, int]
