import os
from typing import List
from app.agents.base import BaseAgent
from app.schemas.layout import Article
from app.core.config import settings
from groq import Groq
import json

class SentimentAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Sentiment Analysis Agent")

    async def run(self, articles: List[Article]) -> List[Article]:
        self.log(f"Analyzing sentiment for {len(articles)} articles")
        
        for article in articles:
            try:
                await self._analyze_llm(article)
            except Exception as e:
                self.log(f"LLM analysis failed for article '{article.headline[:30]}...': {e}. Falling back to heuristic.")
                self._analyze_heuristic(article)
                
        return articles

    async def _analyze_llm(self, article: Article):
        prompt = f"""
        Analyze the sentiment of the following news article. 
        Return ONLY a JSON object with keys: "sentiment" (one of "Positive", "Negative", "Neutral") and "confidence" (float between 0.0 and 1.0).
        
        Headline: {article.headline}
        Body: {article.body[:1000]}...
        """
        
        result_content = await self.call_llm(
            messages=[
                {
                    "role": "system",
                    "content": "You are a sentiment analysis assistant. You output only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            json_mode=True
        )
        
        result = json.loads(result_content)
        article.sentiment_label = result.get("sentiment", "Neutral")
        article.sentiment_confidence = result.get("confidence", 0.5)

    def _analyze_heuristic(self, article: Article):
        positive_words = ["growth", "success", "victory", "profit", "gain", "improve", "record", "happy", "win"]
        negative_words = ["loss", "fail", "defeat", "crash", "crisis", "accident", "death", "disaster", "warning"]
        
        text = (article.headline + " " + article.body).lower()
        
        pos_score = sum(1 for w in positive_words if w in text)
        neg_score = sum(1 for w in negative_words if w in text)
        
        total = pos_score + neg_score
        
        if total == 0:
            article.sentiment_label = "Neutral"
            article.sentiment_confidence = 0.5
        elif pos_score > neg_score:
            article.sentiment_label = "Positive"
            article.sentiment_confidence = 0.5 + (0.5 * (pos_score / total))
        elif neg_score > pos_score:
            article.sentiment_label = "Negative"
            article.sentiment_confidence = 0.5 + (0.5 * (neg_score / total))
        else:
            article.sentiment_label = "Neutral"
            article.sentiment_confidence = 0.6
