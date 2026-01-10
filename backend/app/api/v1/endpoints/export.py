from fastapi import APIRouter, HTTPException, Response, Depends
from app.db.session import get_db
from app.db.models import DBFile, DBArticle
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime

router = APIRouter()

@router.get("/{file_id}/excel")
async def export_excel(file_id: str, db: Session = Depends(get_db)):
    """
    Export processed articles to Excel.
    """
    db_file = db.query(DBFile).filter(DBFile.id == file_id).first()
    
    if not db_file:
         raise HTTPException(status_code=404, detail="Result not found. Run pipeline first.")
    
    # Flatten articles
    data = []
    for art in db_file.articles:
        data.append({
            "Headline": art.headline,
            "Body": art.body[:500] + "..." if len(art.body) > 500 else art.body, 
            "Word Count": len(art.body.split()),
            "Department": art.department,
            "Sentiment": art.sentiment_label,
            "Cluster ID": art.topic_cluster_id,
            "Confidence": art.confidence
        })
        
    if not data:
        # Create empty if no articles
        data = [{"Headline": "No articles found", "Body": "", "Word Count": 0}]
        
    df = pd.DataFrame(data)
    
    # Create BytesIO buffer
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Articles')
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="news_digest_{file_id}.xlsx"'
    }
    
    return Response(content=output.getvalue(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)
