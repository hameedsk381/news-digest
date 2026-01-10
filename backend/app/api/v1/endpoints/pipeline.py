from fastapi import APIRouter, HTTPException, Depends
from app.api import deps
from app.db import models as db_models
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import DBFile, DBArticle
from app.schemas.layout import LayoutResult
from app.graph.workflow import app as pipeline_graph
from pydantic import BaseModel
from datetime import datetime
import os

from app.core.config import settings
from groq import Groq

router = APIRouter()

from app.core import pdf_generator
from fastapi.responses import StreamingResponse
import io

class BriefingDownloadRequest(BaseModel):
    markdown_content: str
from typing import List

class BriefingRequest(BaseModel):
    file_ids: List[str]

from app.core.audit import log_audit
from fastapi import Request

@router.post("/download-briefing-pdf")
async def download_briefing_pdf(
    request: BriefingDownloadRequest,
    current_user: db_models.User = Depends(deps.get_current_staff_user)
):
    """Export the markdown briefing to a formal PDF."""
    pdf_buffer = pdf_generator.generate_formal_briefing_pdf(request.markdown_content, current_user.full_name)
    filename = f"GOV_BRIEFING_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/generate-briefing")
async def generate_briefing(
    request: BriefingRequest, 
    req_raw: Request,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(deps.get_current_staff_user)
):
    """Generate a formal executive briefing from selected files."""
    log_audit(
        db, 
        "GENERATE_BRIEFING", 
        user_id=current_user.id, 
        details=f"Files: {', '.join(request.file_ids)}",
        ip_address=req_raw.client.host
    )
    if not request.file_ids:
        raise HTTPException(status_code=400, detail="No files selected")
        
    # 1. Fetch all articles for these files
    articles = db.query(DBArticle).filter(DBArticle.file_id.in_(request.file_ids)).all()
    
    if not articles:
        raise HTTPException(status_code=404, detail="No data found in selected files")

    # 2. Extract content for LLM
    context_text = ""
    for idx, art in enumerate(articles):
        context_text += f"\n--- ARTICLE {idx+1} ---\n"
        context_text += f"HEADLINE: {art.headline}\n"
        context_text += f"DEPARTMENT: {art.department}\n"
        context_text += f"SENTIMENT: {art.sentiment_label}\n"
        context_text += f"CONTENT: {art.body[:500]}...\n"

    # 3. Prompt for formal briefing
    prompt = f"""
    You are a Senior Strategic Analyst for a Government Department.
    Generate a FORMAL EXECUTIVE BRIEFING based on the following processed news data.
    
    DATA SOURCE: {len(request.file_ids)} Documents, {len(articles)} Articles.
    
    CONTEXT DATA:
    {context_text}
    
    INSTRUCTIONS:
    1. Title the briefing "GOVERNMENT DAILY INTELLIGENCE MEMO"
    2. Include a "STRATEGIC OVERVIEW" section (2-3 sentences).
    3. Include "KEY DEVELOPMENTS" (Bullet points of top news).
    4. Include "DEPARTMENTAL IMPACT" (How this affects different departments).
    5. Include "SENTIMENT & TRENDS" (Overall public mood).
    6. Include "RECOMMENDED ACTIONS" (Professional advice for officials).
    7. Use a strictly FORMAL, NEUTRAL, and PROFESSIONAL tone.
    8. Use Markdown formatting.
    9. MULTILINGUAL RULE: The source articles may be in Telugu or other regional languages. You MUST accurately reflect the content of these articles. Provide the briefing in English, but incorporate key Telugu terms or headlines where appropriate to maintain source integrity.
    """

    try:
        from app.core.ollama import ollama_service
        from groq import Groq, RateLimitError
        
        briefing_text = None
        keys = settings.GROQ_API_KEYS
        
        # Priority 1: Groq with Rotation
        if settings.LLM_PROVIDER == "groq" and keys:
            for i, key in enumerate(keys):
                try:
                    client = Groq(api_key=key)
                    completion = client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": "You are a professional government analyst."},
                            {"role": "user", "content": prompt}
                        ],
                        model=settings.GROQ_MODEL,
                        temperature=0.3
                    )
                    briefing_text = completion.choices[0].message.content
                    break # Success!
                except RateLimitError:
                    print(f"Briefing: Key {i+1} rate limited. Trying next...")
                    continue
                except Exception as e:
                    print(f"Briefing: Groq error with key {i+1}: {e}")
                    continue

        # Priority 2: Try Ollama (either as preference or fallback)
        if not briefing_text:
            try:
                briefing_text = ollama_service.chat([
                    {"role": "system", "content": "You are a professional government analyst."},
                    {"role": "user", "content": prompt}
                ])
            except Exception as e:
                print(f"Briefing: Ollama failed: {e}")

        # Last Resort: If Ollama was preferred but failed, try Groq rotation
        if not briefing_text and keys:
            for key in keys:
                try:
                    client = Groq(api_key=key)
                    completion = client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": "You are a professional government analyst."},
                            {"role": "user", "content": prompt}
                        ],
                        model=settings.GROQ_MODEL,
                        temperature=0.3
                    )
                    briefing_text = completion.choices[0].message.content
                    break
                except:
                    continue
            
        if not briefing_text:
            raise HTTPException(status_code=500, detail="All LLM providers failed to generate briefing")

        return {"briefing": briefing_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Briefing generation failed: {str(e)}")

@router.post("/{file_id}/pipeline", response_model=LayoutResult)
async def run_pipeline(
    file_id: str, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(deps.get_current_staff_user)
):
    """
    Run the full pipeline using LangGraph: 
    Upload (Already done) -> OCR -> Layout (Groq) -> Department/Sentiment (DeepSeek/Groq) -> Clustering
    """
    # 1. Locate file
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
         
    # 2. Invoke LangGraph Workflow
    print(f"Invoking Graph for {file_id}")
    initial_state = {
        "file_id": file_id,
        "file_path": target_file,
        "articles": [],
        "ocr_result": None,
        "error": None,
        "unassigned_segments": []
    }
    
    try:
        final_state = await pipeline_graph.ainvoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph Execution Failed: {str(e)}")
        
    if final_state.get("error"):
        raise HTTPException(status_code=500, detail=f"Pipeline Error: {final_state['error']}")
    
    articles = final_state.get("articles", [])
    unassigned = final_state.get("unassigned_segments", [])
    
    # 3. Persist to DB
    try:
        # Check if file exists in DB
        db_file = db.query(DBFile).filter(DBFile.id == file_id).first()
        if not db_file:
            db_file = DBFile(id=file_id, filename=os.path.basename(target_file))
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
        
        # Save Articles
        for art in articles:
            db_article = DBArticle(
                file_id=file_id,
                headline=art.headline,
                body=art.body,
                confidence=art.confidence,
                department=art.department,
                sentiment_label=art.sentiment_label,
                sentiment_confidence=art.sentiment_confidence,
                topic_cluster_id=art.topic_cluster_id
            )
            db.add(db_article)
        
        db.commit()
        
        return LayoutResult(
            articles=articles,
            unassigned_segments=unassigned
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Save Failed: {str(e)}")

@router.get("/history")
async def get_history(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(deps.get_current_staff_user)
):
    """Fetch history of processed files."""
    files = db.query(DBFile).order_by(DBFile.upload_date.desc()).all()
    return [{
        "id": f.id,
        "filename": f.filename,
        "upload_date": f.upload_date,
        "article_count": len(f.articles)
    } for f in files]

@router.get("/all-articles")
async def get_all_articles(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(deps.get_current_active_user)
):
    """Fetch all articles across all files."""
    articles = db.query(DBArticle).order_by(DBArticle.id.desc()).all()
    return [{
        "id": a.id,
        "headline": a.headline,
        "body": a.body,
        "confidence": a.confidence,
        "department": a.department,
        "sentiment_label": a.sentiment_label,
        "sentiment_confidence": a.sentiment_confidence,
        "topic_cluster_id": a.topic_cluster_id,
        "filename": a.file.filename if a.file else "Unknown"
    } for a in articles]
