
import asyncio
import os
import sys
import json
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.agents.vision_agent import VisionAgent
from app.core.pdf_extractor import PDFExtractor


# Force UTF-8 for Telugu output
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_single_page():

    file_path = r"c:\Users\cogni\Desktop\news_digest\Prajasakti_AP_27-12-2025-2.pdf"
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    print(f"--- Testing Single Page Extraction (Page 1) ---")
    print(f"File: {os.path.basename(file_path)}")
    
    agent = VisionAgent()
    
    # We'll manually run a piece of the agent logic to process just one page
    # instead of the whole document, to save time and tokens.
    
    try:
        # 1. Check Digital Extraction first for Page 1 (index 0)
        print("\n[Step 1] Attempting Tiered Digital Extraction...")
        text, method, metrics = PDFExtractor.extract_page_tiered(file_path, 0)
        
        print(f"Extraction Method: {method}")
        print(f"Metrics: {json.dumps(metrics, indent=2)}")
        
        ratio = metrics["attempts"][-1]["ratio"]
        fffd_count = metrics["attempts"][-1].get("fffds", 0)
        
        print(f"Corruption Ratio: {ratio:.4f}")
        print(f"FFFD Count: {fffd_count}")
        
        use_digital = False
        if method != "vision_needed" and text:
            if len(text) > 100 and ratio <= 0.2:
                print(">>> DECISION: Digital text is GOOD. Would use LLM Text extraction.")
                use_digital = True
            else:
                print(f">>> DECISION: Digital text is CORRUPT/SPARSE (Ratio {ratio:.2f}). Falling back to VISION.")
        
        # 2. Perform the actual extraction (Vision fallback)
        print("\n[Step 2] Performing Vision Extraction (since it's Prajasakti)...")
        # To avoid processing all pages, we mock the 'total_pages' loop
        # We'll just run the image conversion for page 1
        from pdf2image import convert_from_path
        
        poppler_path = None
        local_poppler = os.path.join(os.getcwd(), "deps", "poppler", "poppler-24.02.0", "Library", "bin")
        if os.path.exists(local_poppler):
            poppler_path = local_poppler
            
        print("Converting Page 1 to image...")
        images = convert_from_path(file_path, first_page=1, last_page=1, poppler_path=poppler_path)
        
        if images:
            import io
            import base64
            buffered = io.BytesIO()
            images[0].save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            print("Sending to Vision LLM...")
            articles = await agent._extract_from_image(img_str, 1)
            
            print(f"\n[Result] Found {len(articles)} articles.")
            for i, art in enumerate(articles):
                print(f"\n--- Article {i+1} ---")
                print(f"HEADLINE: {art.headline}")
                print(f"BODY PREVIEW: {art.body[:200]}...")
        else:
            print("Error: Could not convert page to image.")

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_single_page())
