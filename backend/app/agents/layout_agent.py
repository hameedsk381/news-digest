from typing import List, Dict, Any
from app.agents.base import BaseAgent
from app.schemas.ocr import OCRProcessingResult, TextBlock
from app.schemas.layout import LayoutResult, Article, LayoutSegment, SegmentType
from app.schemas.ocr import BoundingBox
from app.core.config import settings
from groq import Groq
import uuid
import statistics
import json

class LayoutAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Layout Segmentation Agent")
        
    async def run(self, input_data: OCRProcessingResult) -> LayoutResult:
        self.log("Starting Layout Analysis")
        
        # 1. Convert all blocks to unique segments
        all_segments = []
        for page in input_data.pages:
            if not page.blocks:
                continue
            for block in page.blocks:
                segment = LayoutSegment(
                    id=str(uuid.uuid4()),
                    type=SegmentType.BODY, # Default, will be updated if we can map it back or just used
                    text=block.text,
                    box=block.box,
                    page_number=page.page_number
                )
                all_segments.append(segment)
        
        # Sort segments by page, then Y position
        all_segments.sort(key=lambda s: (s.page_number, s.box.y, s.box.x))
        
        articles = []
        unassigned = []
        
        # 2. Use LLM to extract articles
        if len(all_segments) > 0:
            try:
                self.log("Attempting LLM-based layout analysis")
                articles = await self._extract_with_llm(all_segments)
            except Exception as e:
                self.log(f"LLM extraction failed: {e}. Falling back to heuristic.")
                articles, unassigned = self._heuristic_extraction(all_segments)
        else:
            self.log("Groq client not available or empty content. Falling back to heuristic.")
            articles, unassigned = self._heuristic_extraction(all_segments)
            
        # 3. Create unassigned list logic for LLM case if needed
        # (For now, if LLM succeeds, we assume it used what it needed. 
        # But we should probably check which segments were used. 
        # Skipping for MVP complexity reasons, defaulting unassigned to empty or remaining.)
        if self.client and articles and not unassigned:
            used_ids = set()
            for art in articles:
                for seg in art.segments:
                    used_ids.add(seg.id)
            unassigned = [s for s in all_segments if s.id not in used_ids]

        self.log(f"Found {len(articles)} articles")
        
        return LayoutResult(
            articles=articles,
            unassigned_segments=unassigned
        )

    async def _extract_with_llm(self, segments: List[LayoutSegment]) -> List[Article]:
        # Prepare lightweight context
        segments_data = [{"id": s.id, "text": s.text} for s in segments]
        
        # Limit to avoid token limits.
        if len(segments_data) > 50:
             self.log("Warning: Too many segments, truncating to 50 for LLM...")
             segments_data = segments_data[:50]
        
        prompt = f"""
        You are an expert news layout analyzer. 
        I have a list of text segments from a document (OCR output). 
        Your task is to group these segments into logical News Articles.
        
        RULES:
        1. Each article must have a "headline". Find the segment that serves as the headline.
        2. Combine the relevant "body" segments into a single body text.
        3. Return a JSON object containing a list of articles.
        4. The JSON format must be:
        {{
            "articles": [
                {{
                    "headline": "extracted headline text",
                    "segment_ids": ["id_1", "id_2", ...] 
                }}
            ]
        }}
        5. "segment_ids" must include the ID of the headline segment AND all body segments belonging to that article.
        6. Do not fabricate text. Use the provided text segments.
        
        Segments:
        {json.dumps(segments_data)}
        """
        
        result_content = await self.call_llm(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that outputs strictly valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            json_mode=True
        )
        
        result = json.loads(result_content)
        
        articles_data = result.get("articles", [])
        
        final_articles = []
        segment_map = {s.id: s for s in segments}
        
        for art_data in articles_data:
            headline_text = art_data.get("headline", "Unknown Headline")
            seg_ids = art_data.get("segment_ids", [])
            
            article_segments = []
            body_parts = []
            
            for sid in seg_ids:
                if sid in segment_map:
                    seg = segment_map[sid]
                    article_segments.append(seg)
                    # Try to avoid adding headline text to body if duplicate, but simple append is safer
                    if seg.text != headline_text: 
                        body_parts.append(seg.text)
            
            full_body = " ".join(body_parts)
            
            for seg in article_segments:
                if seg.text == headline_text:
                    seg.type = SegmentType.HEADLINE
                else:
                    seg.type = SegmentType.BODY

            final_articles.append(Article(
                headline=headline_text,
                body=full_body,
                segments=article_segments,
                confidence=0.9
            ))
            
        return final_articles

    def _heuristic_extraction(self, all_segments: List[LayoutSegment]) -> (List[Article], List[LayoutSegment]):
        # Calculate average height for heuristics
        if not all_segments:
            return [], []
            
        heights = [s.box.h for s in all_segments]
        avg_height = statistics.mean(heights) if heights else 0
        
        # Stricter Heuristics
        for seg in all_segments:
            # Must be significantly larger AND have some length, but not too long
            is_large = seg.box.h > avg_height * 1.5
            is_title_case = seg.text[0].isupper() # Simple check
            is_valid_len = 5 < len(seg.text) < 150
            
            if is_large and is_title_case and is_valid_len:
                seg.type = SegmentType.HEADLINE
            else:
                seg.type = SegmentType.BODY
                
        articles: List[Article] = []
        unassigned: List[LayoutSegment] = []
        current_article = None
        
        for seg in all_segments:
            if seg.type == SegmentType.HEADLINE:
                if current_article:
                    # Filter junk articles with no body or very short body
                    if len(current_article.body) > 50:
                        articles.append(current_article)
                
                current_article = Article(
                    headline=seg.text,
                    body="",
                    segments=[seg],
                    confidence=0.6 # Low confidence for heuristic
                )
            elif seg.type == SegmentType.BODY:
                if current_article:
                    current_article.segments.append(seg)
                    current_article.body += " " + seg.text
                else:
                    unassigned.append(seg)
            else:
                unassigned.append(seg)
        
        if current_article and len(current_article.body) > 50:
            articles.append(current_article)
            
        return articles, unassigned
