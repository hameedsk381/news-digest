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


## Deployment (Docker Compose)
1. Ensure Docker and Docker Compose are installed.
2. Configure `.env` files in `backend/` as needed (or rely on default in `docker-compose.yml`).
3. Run the stack:
   ```bash
   docker-compose up --build
   ```
4. Access:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/docs`
   - Database: Port 5432

## Features (Phase 1 MVP)
- PDF Upload Endpoint (`/api/v1/pdfs/upload/`)
- Basic Project Structure for Agents
- Parallel PDF Processing (Hybrid Digital + Vision Fallback)
- Agentic Database (PostgreSQL/SQLite)
