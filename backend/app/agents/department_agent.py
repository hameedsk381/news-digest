from typing import List
from app.agents.base import BaseAgent
from app.schemas.layout import Article
from app.core.config import settings
from groq import Groq
import json

class DepartmentAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Neural Department Agent")
        
    async def run(self, articles: List[Article]) -> List[Article]:
        """
        UPGRADE: Using Neural Classification (LLM) instead of keyword matching.
        This allows the system to handle Telugu, Hindi, and other languages natively.
        """
        if not articles:
            return articles
            
        self.log(f"Neural Classification for {len(articles)} articles")
        
        # We'll batch them to save tokens if possible, but for accuracy let's do 1 by 1 
        # or in small batches. For this agent, 1 by 1 is safest for high-stakes gov data.
        

        # Granular AP Government Departments
        valid_departments = [
            "Agriculture & Cooperation",
            "Animal Husbandry & Fisheries",
            "Backward Classes Welfare",
            "Energy",
            "Finance & Planning",
            "Health, Medical & Family Welfare",
            "Higher Education",
            "Home & Law and Order",
            "Housing",
            "Irrigation & Water Resources",
            "Municipal Admin & Urban Dev",
            "Panchayat Raj & Rural Dev",
            "Revenue & Land Administration",
            "School Education",
            "Social Welfare",
            "Transport, Roads & Buildings",
            "Women & Child Welfare",
            "General Administration", # For CM/Generic Govt news
            "Civil Supplies"
        ]

        for article in articles:
            prompt = f"""
            Act as a Cabinet Secretary for the Andhra Pradesh Government.
            Classify the following news article into EXACTLY ONE of these official departments:
            
            {json.dumps(valid_departments, indent=2)}
            
            Article Headline: {article.headline}
            Article Body: {article.body[:800]}
            
            Rules:
            1. Analyze the content deeply. If mentions "Polavaram", it is "Irrigation". If "Amma Vodi", it is "School Education".
            2. If the article is about the Chief Minister (CM) but discusses a specific topic (e.g. CM visits Hospital), classify under that topic (Health).
            3. If the article is purely political or general administrative news, use "General Administration".
            4. Support TELUGU text natively.
            
            Return ONLY the department name from the list above. No other text.
            """
            
            try:
                category = await self.call_llm(
                    messages=[
                        {"role": "system", "content": "You are a government classification AI. Output only the exact department name."},
                        {"role": "user", "content": prompt}
                    ]
                )
                category = category.strip().replace('"', '').replace("'", "")
                
                # Fuzzy matching or exact match check
                # We can't trust LLM 100% to output exact string, so let's try to match
                matched = "General Administration"
                for dept in valid_departments:
                    if dept.lower() in category.lower():
                        matched = dept
                        break
                
                # If exact match failed but LLM output something, maybe it outputted "Education" instead of "School Education"
                if matched == "General Administration" and category != "General Administration":
                    # Fallback heuristics
                    if "education" in category.lower(): matched = "School Education"
                    elif "health" in category.lower(): matched = "Health, Medical & Family Welfare"
                    elif "police" in category.lower(): matched = "Home & Law and Order"
                    elif "water" in category.lower(): matched = "Irrigation & Water Resources"
                    elif "farm" in category.lower() or "agri" in category.lower(): matched = "Agriculture & Cooperation"
                
                article.department = matched
                self.log(f"Classified: '{article.headline[:30]}...' -> {matched}")
                    
            except Exception as e:
                self.log(f"Neural classification failed: {e}")
                article.department = "General Administration"
                
        return articles

