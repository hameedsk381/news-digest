---
description: GovDigest - Deployment and Operational Workflow
---

# GovDigest Intelligence System - Operational Workflow

This guide outlines the steps required to deploy, initialize, and operate the GovDigest platform as an Administrator or Analyst.

## 1. Prerequisites
Ensure the following environment variables are set in `backend/.env`:
- `GROQ_API_KEY`: Required for LLM-based OCR, classification, and briefing generation.
- `FIRECRAWL_API_KEY`: Required for Live Web search functionality.
- `SECRET_KEY`: A unique string used for signing JWT authentication tokens.

## 2. System Initialization (Backend)
Before the first run, the database and default accounts must be initialized.
// turbo
1. Navigate to `backend` and install dependencies: `pip install -r requirements.txt`
// turbo
2. Run the database initialization script: `python -m app.db.init_db`
   *This creates the schema and seeds the `admin` (pwd: `admin123`) and `analyst` (pwd: `analyst123`) accounts.*
// turbo
3. Start the FastAPI server: `python -m uvicorn app.main:app --reload --port 8000`

## 3. Frontend Setup
// turbo
1. Navigate to `frontend` and install dependencies: `npm install`
// turbo
2. Start the development server: `npm run dev`
   *The application will be accessible at `http://localhost:3000`.*

## 4. Operational Workflow

### Step A: Secure Access
1. Open the browser to the application URL.
2. Log in using an **Administrative** account (e.g., `admin`) to perform data ingestion.

### Step B: Document Ingestion (Admin Only)
1. Go to the **"Document Ingestion"** (Import PDF) tab.
2. Select one or more PDF files (Scanned or Digital).
3. Click **"Process Batch"**.
4. Monitor the **"System Monitor"** (Neural Status) to see the pipeline (OCR -> Analysis -> Indexing) in real-time.

### Step C: Research & Intelligence
1. Use the **"Knowledge Bank"** (Intelligence Archive) to filter articles by Department (Agriculture, Health, etc.) or Sentiment.
2. Use the **"Digital Assistant"** (Assistant) to ask complex questions.
   - Toggle **"Live Web Search"** for real-time external data.
   - Use the **Microphone icon** for voice-based queries.

### Step D: Strategic Reporting (Admin Only)
1. In the **"Knowledge Bank"** (Source Documents tab), select multiple document cards.
2. Click **"Generate Executive Briefing"**.
3. Review the AI-generated memo in the modal.
4. Click **"Download Formal PDF"** to export a branded, secure report for distribution.

### Step E: Oversight
1. Administrators should periodically check the **"System Monitor"** (Audit Trail) to verify user activities and data access patterns.
