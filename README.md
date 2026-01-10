# Agentic News Digest and Sentiment Intelligence System

## Objective
Automatically ingest newspaper PDFs and generate a daily structured news digest containing article summaries, sentiment classification, and topic clustering.

## Project Structure
- `backend/`: FastAPI application for PDF processing, OCR, and Agentic logic.
- `frontend/`: Next.js application for Dashboard and file upload.

## Getting Started

### Backend
1. **Prerequisites**: Python 3.10+, Tesseract OCR, Poppler (if running locally). Or Docker.
2. Navigate to `backend/`:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python -m app.main
   ```
   Or verify with Docker:
   ```bash
   docker build -t news-digest-backend .
   docker run -p 8000:8000 news-digest-backend
   ```
   
   API Docs will be at `http://localhost:8000/docs`.

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

## Features (Phase 1 MVP)
- PDF Upload Endpoint (`/api/v1/pdfs/upload/`)
- Basic Project Structure for Agents
