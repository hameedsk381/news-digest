from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.agents.ocr_agent import OCRAgent
from app.schemas.ocr import OCRProcessingResult
import os

router = APIRouter()

# In-memory storage for results (Replace with DB/Redis in production)
ocr_results = {}

@router.post("/{file_id}/process", response_model=OCRProcessingResult)
async def process_pdf_ocr(file_id: str):
    """
    Trigger OCR processing for a uploaded PDF.
    WARNING: This is currently synchronous for MVP simplicity. 
    For large files, this will timeout. Phase 2 should make this async.
    """
    # Locate file
    # We need to find the file in temp_uploads based on ID
    # This is a bit hacky, normally we'd look up the path in a DB
    upload_dir = "temp_uploads"
    if not os.path.exists(upload_dir):
        raise HTTPException(status_code=404, detail="No uploads found")
        
    target_file = None
    for filename in os.listdir(upload_dir):
        if filename.startswith(file_id):
            target_file = os.path.join(upload_dir, filename)
            break
            
    if not target_file:
         raise HTTPException(status_code=404, detail="File not found")

    agent = OCRAgent()
    
    try:
        result = await agent.run({
            "file_id": file_id,
            "file_path": target_file
        })
        ocr_results[file_id] = result
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
