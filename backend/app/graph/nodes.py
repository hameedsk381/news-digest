from app.graph.state import AgentState
from app.agents.ocr_agent import OCRAgent
from app.agents.layout_agent import LayoutAgent
from app.agents.vision_agent import VisionAgent
from app.agents.department_agent import DepartmentAgent
from app.agents.sentiment_agent import SentimentAgent
from app.agents.clustering_agent import ClusteringAgent
from app.agents.search_agent import search_agent

# Initialize Agents
# ocr_agent = OCRAgent() # Deprecated/Unused in VLM mode
# layout_agent = LayoutAgent() # Deprecated/Unused in VLM mode
vision_agent = VisionAgent()
department_agent = DepartmentAgent()
sentiment_agent = SentimentAgent()
clustering_agent = ClusteringAgent()

async def vision_node(state: AgentState) -> AgentState:
    try:
        print("---NODE: VISION EXTRACTION---")
        result_articles = await vision_agent.run({
            "file_id": state["file_id"],
            "file_path": state["file_path"]
        })
        return {"articles": result_articles, "ocr_result": None}
    except Exception as e:
        return {"error": f"Vision Extraction Failed: {str(e)}"}

async def ocr_node(state: AgentState) -> AgentState:
    try:
        print("---NODE: OCR---")
        result = await ocr_agent.run({
            "file_id": state["file_id"],
            "file_path": state["file_path"]
        })
        return {"ocr_result": result}
    except Exception as e:
        return {"error": f"OCR Failed: {str(e)}"}

async def layout_node(state: AgentState) -> AgentState:
    try:
        print("---NODE: LAYOUT---")
        if not state.get("ocr_result"):
            return {"error": "Missing OCR result"}
            
        result = await layout_agent.run(state["ocr_result"])
        return {"articles": result.articles, "unassigned_segments": result.unassigned_segments}
    except Exception as e:
        return {"error": f"Layout Analysis Failed: {str(e)}"}

import asyncio

async def human_review_node(state: AgentState) -> AgentState:
    print("---NODE: HUMAN REVIEW (HITL)---")
    # In a real app, this node would be an "interrupt" point.
    print(">>> REVIEW REQUIRED: Low confidence detected. Auto-approving for demo.")
    return {}

async def parallel_analysis_node(state: AgentState) -> AgentState:
    print("---NODE: PARALLEL ANALYSIS---")
    articles = state.get("articles", [])
    
    # Run both agents concurrently using asyncio.gather
    # Note: We need to pass COPIES or allow them to modify. 
    # Since these agents modify in-place, we loop carefully or let them run.
    # To be safe, we let them run on the same list objects because they modify DIFFERENT fields.
    # DepartmentAgent sets .department
    # SentimentAgent sets .sentiment_label, .sentiment_confidence
    # This is safe to run concurrently on the same object instances in Python async (single threaded event loop)
    # as long as they don't touch the exact same property.
    
    try:
        # We await both
        await asyncio.gather(
            department_agent.run(articles),
            sentiment_agent.run(articles)
        )
        # after gather, 'articles' objects are mutated in place.
        return {"articles": articles}
    except Exception as e:
        return {"error": f"Parallel Analysis Failed: {str(e)}"}

async def clustering_node(state: AgentState) -> AgentState:
    try:
        print("---NODE: CLUSTERING---")
        articles = state.get("articles", [])
        updated_articles = await clustering_agent.run(articles)
        return {"articles": updated_articles}
    except Exception as e:
         return {"error": f"Clustering Failed: {str(e)}"}

async def indexing_node(state: AgentState) -> AgentState:
    try:
        print("---NODE: INDEXING (RAG)---")
        articles = state.get("articles", [])
        if articles:
            search_agent.index_articles(articles)
        return {}
    except Exception as e:
        print(f"Indexing failed: {e}")
        return {}
