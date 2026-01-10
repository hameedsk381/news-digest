from fastapi import APIRouter
from app.api.v1.endpoints import upload, ocr, pipeline, export, analytics, search, auth





api_router = APIRouter()
api_router.include_router(upload.router, prefix="/pdfs", tags=["pdfs"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
api_router.include_router(pipeline.router, prefix="/pipeline", tags=["pipeline"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])




