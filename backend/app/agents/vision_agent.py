from typing import List, Dict, Any
import base64
import io
import json
import os
from app.agents.base import BaseAgent
from app.schemas.layout import Article, LayoutSegment, SegmentType
from app.core.config import settings
from groq import Groq

class VisionAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Vision Extraction Agent")





    async def run(self, input_data: Dict[str, Any]) -> List[Article]:
        file_path = input_data.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise ValueError(f"File path not found: {file_path}")
            
        self.log(f"Starting Parallel Hybrid Vision Extraction for: {file_path}")
        
        try:
            from app.core.pdf_extractor import PDFExtractor
            import fitz
            import asyncio
            
            # Use PyMuPDF to get total page count
            doc = fitz.open(file_path)
            total_pages = len(doc)
            doc.close()
            
            self.log(f"PDF has {total_pages} pages. Analyzing strategy...")
            
            all_articles = []
            
            # Create tasks for all pages to run in parallel
            # We process ALL pages indiscriminately with the same logic:
            # Try Digital -> If corrupt/bad -> Fallback to Vision
            self.log(f"Processing {total_pages} pages parallelly...")
            tasks = []
            for i in range(total_pages):
                tasks.append(self._process_single_page(file_path, i, total_pages))
            
            results = await asyncio.gather(*tasks)
            
            # Combine results
            for page_articles in results:
                all_articles.extend(page_articles)
                
            self.log(f"Extraction complete. Found {len(all_articles)} articles across {total_pages} pages.")
            return all_articles

        except Exception as e:
            self.log(f"Vision Extraction failed: {e}")
            raise RuntimeError(f"Failed to process PDF: {e}")

    async def _process_single_page(self, file_path: str, page_index: int, total_pages: int) -> List[Article]:
        """Process a single page: Digital Check -> (Optional Vision)"""
        from app.core.pdf_extractor import PDFExtractor
        page_num = page_index + 1
        
        try:
            # 1. Digital Extraction
            extracted_text, method, metrics = PDFExtractor.extract_page_tiered(file_path, page_index)
            
            # 2. Decide strategy
            use_digital = False
            if method != "vision_needed" and extracted_text:
                ratio = metrics["attempts"][-1]["ratio"]
                if len(extracted_text) > 100 and ratio <= 0.2:
                    self.log(f"Page {page_num}: Valid digital text ({len(extracted_text)} chars, ratio: {ratio:.2f}). Using LLM.")
                    use_digital = True
                else:
                    self.log(f"Page {page_num}: Text corrupt/sparse (ratio: {ratio:.2f}). Fallback to Vision.")

            # 3. Execute Digital
            if use_digital:
                try:
                    return await self._extract_from_text(extracted_text, page_num)
                except Exception as e:
                    self.log(f"Page {page_num}: LLM text extraction failed: {e}")
                    use_digital = False 
            
            # 4. Execute Vision Fallback
            from pdf2image import convert_from_path
            
            poppler_path = None
            local_poppler = os.path.join(os.getcwd(), "deps", "poppler", "poppler-24.02.0", "Library", "bin")
            if os.path.exists(local_poppler):
                poppler_path = local_poppler
            

            # Convert ONLY the current page to image
            # Lower DPI to 150 to avoid hitting API payload limits (Groq limit ~33MP)
            images = convert_from_path(
                file_path, 
                first_page=page_num, 
                last_page=page_num, 
                poppler_path=poppler_path,
                fmt="jpeg",
                dpi=150
            )
            
            if not images:
                return []
            
            # Resize logic to ensure we stay well under limits
            image = images[0]
            max_dimension = 2000
            if max(image.size) > max_dimension:
                scale = max_dimension / max(image.size)
                new_size = (int(image.size[0] * scale), int(image.size[1] * scale))
                image = image.resize(new_size)
                
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return await self._extract_from_image(img_str, page_num)


        except Exception as e:
            self.log(f"Page {page_num}: Unexpected error: {e}")
            return []






    async def _extract_from_text(self, text: str, page_num: int) -> List[Article]:
        """Use LLM to extract articles from digital text."""
        # Truncate if too long to avoid token limits
        if len(text) > 8000:
            text = text[:8000]
            
        prompt = f"""
        Analyze this newspaper page text. Extract ONLY news articles related to the "Andhra Pradesh Government".
        For each article, identify the "Headline" and the "Body" text.
        
        Return a valid JSON object with the following structure:
        {{
            "articles": [
                {{
                    "headline": "Headline Text",
                    "body": "Full body text..."
                }}
            ]
        }}
        
        Rules:
        1. FILTER STRICTLY: Only extract news about the AP Government, including:
           - CM and Minister statements/activities.
           - Government Orders (GOs), Schemes, and Policies.
           - District Administration (Collectors) and official announcements.
        2. IGNORE: General crime news, sports, entertainment, or national news unrelated to AP Govt.
        3. Headlines are usually short, capitalized or title-cased.
        4. Body text follows the headline.
        5. SUPPORTED LANGUAGES: If the text contains Telugu script, preserve it exactly as written. Do not translate the extraction results.
        Page Text:
        {text}
        """

        self.log(f"Page {page_num}: Digital Text Sample: {text[:200]}")
        
        result_content = await self.call_llm(
            messages=[
                {
                    "role": "system",
                    "content": "You are a news article extraction assistant. You handle multilingual text including Telugu. Output only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            json_mode=True
        )
        
        self.log(f"Page {page_num}: Received result content (len: {len(result_content)})")
        if not result_content.strip():
            self.log(f"Page {page_num}: WARNING - Received empty response from LLM")
        
        return self._parse_json_result(result_content, page_num)



    async def _extract_from_image(self, base64_image: str, page_num: int) -> List[Article]:

        """Use Vision LLM to extract articles from image."""
        prompt = """
        Analyze this newspaper page image. Extract ONLY news articles related to the "Andhra Pradesh Government".
        For each article, identify the "Headline" and the "Body" text.
        
        Return a valid JSON object with the following structure:
        {
            "articles": [
                {
                    "headline": "Headline Text",
                    "body": "Full body text..."
                }
            ]
        }
        
        Rules:
        1. FILTER STRICTLY: Only extract news about the AP Government, including:
           - CM and Minister statements/activities.
           - Government Orders (GOs), Schemes, and Policies.
           - District Administration (Collectors) and official announcements.
        2. IGNORE: General crime news, sports, entertainment, or national news unrelated to AP Govt.
        3. Be precise with text extraction.
        4. Determine the "Body" by visually associating columns of text with the headline.
        5. SUPPORTED LANGUAGES: This system handles English, Telugu, and other regional scripts. If text is in Telugu, extract it EXACTLY as written in the original script.
        """

        
        result_content = await self.call_llm(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            json_mode=True,
            model="meta-llama/llama-4-scout-17b-16e-instruct"
        )
        
        return self._parse_json_result(result_content, page_num)

    def _parse_json_result(self, content: str, page_num: int) -> List[Article]:
        try:
            # Clean markdown code blocks if present
            content = content.replace("```json", "").replace("```", "").strip()
            data = json.loads(content)
            articles_data = data.get("articles", [])
            
            articles = []
            for item in articles_data:
                headline = item.get("headline", "").strip()
                body = item.get("body", "").strip()
                
                if headline and len(body) > 20:
                    articles.append(Article(
                        headline=headline,
                        body=body,
                        segments=[],
                        confidence=0.95,
                        department="General"
                    ))
            if not articles:
                self.log(f"Page {page_num}: WARNING - No articles extracted from content: {content[:200]}...")
            return articles
        except Exception as e:
            self.log(f"Page {page_num}: Failed to parse JSON from model: {e}. Raw content: {content[:500]}...")
            return []
