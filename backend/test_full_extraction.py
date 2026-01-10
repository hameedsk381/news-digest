
import asyncio
import os
import sys
import time
# Add project root to path
sys.path.append(os.getcwd())

from app.agents.vision_agent import VisionAgent
from app.core.config import settings

async def test_full_extraction():
    file_path = r"c:\Users\cogni\Desktop\news_digest\Prajasakti_AP_27-12-2025-2.pdf"
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    agent = VisionAgent()
    
    print(f"--- Starting Full Extraction Test for {os.path.basename(file_path)} ---")
    start_time = time.time()
    
    try:
        articles = await agent.run({"file_path": file_path})
        end_time = time.time()
        
        print(f"\n--- EXTRACTION COMPLETE ---")
        print(f"Time Taken: {end_time - start_time:.2f} seconds")
        print(f"Total Articles Found: {len(articles)}")
        
        print("\n--- SAMPLE ARTICLES ---")
        for i, article in enumerate(articles):
            print(f"\nArticle {i+1}:")
            print(f"Headline: {article.headline}")
            print(f"Body (First 200 chars): {article.body[:200]}...")
            print("-" * 50)
            
            # Print only first 5 to avoid flooding console
            if i >= 4:
                print(f"... and {len(articles) - 5} more articles.")
                break
                
    except Exception as e:
        print(f"Extraction Failed: {e}")

if __name__ == "__main__":
    # Ensure event loop is handled correctly for Windows
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_full_extraction())
