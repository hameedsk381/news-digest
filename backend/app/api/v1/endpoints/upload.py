from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import shutil
import os
import uuid
from app.api import deps
from app.db import models

router = APIRouter()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_staff_user)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    return {
        "id": file_id,
        "filename": file.filename,
        "saved_path": file_path,
        "message": "File uploaded successfully"
    }
