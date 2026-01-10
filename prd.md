

# Product Requirements Document (PRD)

## Product Name

Agentic AI News Digest and Sentiment Intelligence System

## Objective

Automatically ingest **newspaper PDFs** and generate a **daily structured news digest** containing:

* article summaries
* sentiment classification
* category/department classification
* topic clustering
* output suitable for Excel/PDF/API delivery

System must operate **agentically**

* plan pipeline steps
* recover from OCR/layout errors
* self-validate summaries
* retry alternative methods when quality is low

---

## Primary Users

1. Government departments
2. Corporate communication teams
3. Research and policy analysts
4. Editorial intelligence teams

---

## Core Use Cases

1. Read 10–50 newspaper PDFs per day
2. Produce a single unified digest
3. Track positive vs negative narrative
4. Identify topic clusters and trends
5. Export to Excel/PDF/Web dashboard

---

## Out-of-Scope (for v1)

* social media news scraping
* real-time news streaming
* multilingual cross-translation
* audio/video news content

Keep v1 focused and stable.

---

# Functional Requirements

### 1) PDF Intake

System must:

* accept uploaded PDFs
* validate format and size
* tag source metadata (paper, date, edition)

### 2) OCR and Text Extraction

System must:

* auto-detect scanned vs searchable PDFs
* run OCR where required
* retain bounding boxes for layout segmentation

### 3) Article Segmentation

System must:

* identify headlines vs body text
* handle multi-column layouts
* merge continuation segments across columns/pages

### 4) Summarization

System must:

* produce 2–4 line factual summaries
* preserve names, numbers, entities
* avoid hallucinations

### 5) Sentiment Classification

System must:

* classify Positive / Negative / Neutral
* assign model confidence score
* use event-based sentiment not tone analysis

### 6) Department / Category Tagging

System must classify into:

* governance
* economy/business
* education
* health
* infrastructure
* law and order
* politics
* environment
* sports
* technology

Rule+ML hybrid acceptable.

### 7) Topic Clustering

System must:

* group duplicate articles across papers
* identify same story spread across sources

### 8) Output Formats

Required exports:

* Excel (.xlsx)
* JSON API
* PDF digest (optional)

---

# Non-Functional Requirements

* Accuracy target: 85% article segmentation, 90% OCR text legibility
* Latency: 100 PDFs processed within 2 hours
* Scalability: horizontal worker scaling
* Observability: processing logs per stage
* Data privacy: store PDFs securely, no public sharing

---

# Final Output Schema (recommended)

| Field                | Required       |
| -------------------- | -------------- |
| unique_id            | Yes            |
| date                 | Yes            |
| newspaper_name       | Yes            |
| edition              | Optional       |
| page_number          | Optional       |
| headline             | Yes            |
| article_text         | Optional store |
| summary              | Yes            |
| sentiment_label      | Yes            |
| sentiment_confidence | Yes            |
| department/category  | Yes            |
| topic_cluster_id     | Optional       |
| source_pdf_reference | Yes            |

Your current Excel format should evolve to this.

---

# Agentic System Design

### Agents

1. Orchestrator Planner Agent
2. PDF Understanding Agent
3. OCR Agent
4. Layout Segmentation Agent
5. Summarization Agent
6. Sentiment Agent
7. Department Classifier Agent
8. Validator Critic Agent
9. Report Generation Agent

### Agentic Behavior Requirements

System must be capable of:

* retrying OCR with higher DPI
* switching OCR engine automatically
* re-segmenting layout when confidence low
* re-summarizing on hallucination detection
* flagging unreadable pages for human review

Maximum retries = 2 per stage.

Unresolved cases → “Needs Review” queue.

---

# Technical Architecture Recommendation

Backend:

* FastAPI

Workers:

* Celery or Redis Queue

OCR:

* Tesseract + PaddleOCR fallback

Layout:

* LayoutParser + Detectron2 model

LLM:

* GPT-class API or local LLaMA

Embeddings:

* Sentence-BERT

Vector DB:

* FAISS / Qdrant

Object Storage:

* S3 / MinIO

Database:

* PostgreSQL

Optional dashboard:

* Next.js or Streamlit

---

# Quality Metrics (KPIs)

* OCR accuracy %
* article segmentation accuracy
* summary factual consistency
* sentiment agreement with human annotators
* processing throughput
* percentage requiring manual review

---

# Risks and Mitigation

Risk: OCR failure on low-quality scans
Fix: dual OCR + preprocessing

Risk: hallucinated summaries
Fix: validator agent + quote-based summaries

Risk: legal restrictions for full-text storage
Fix: store extracted text internally only, do not redistribute

Risk: political bias claims
Fix: neutral event-based sentiment policy, documented rules

---

# Delivery Phases

### Phase 1 – MVP

* single PDF input
* OCR + segmentation
* per-article summary + sentiment
* Excel export

### Phase 2 – Full Agentic Pipeline

* auto retries
* clustering
* confidence scoring
* department classification

### Phase 3 – Dashboard + API

* search
* analytics charts
* historical trend sentiment

---

# Final Recommendation

Build the system **agentic, but deterministic**:

* fixed schemas between agents
* fixed retry limits
* confidence scoring at each stage
* fallback tools, not endless autonomy

Do not allow LLM to freely “decide everything”.
Use LLMs only where human judgment exists:

* summarization
* sentiment interpretation
* department classification

Everything else must be rule-driven and measurable:

* OCR
* segmentation
* clustering
* orchestration logic

This gives you:

* reliability
* auditability
* regulatory defensibility
* scalable automation

