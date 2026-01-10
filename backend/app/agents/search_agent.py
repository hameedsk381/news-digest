import os
from typing import List, Dict, Any, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.schemas.layout import Article
from app.core.config import settings
from groq import Groq
from firecrawl import FirecrawlApp
from sentence_transformers import CrossEncoder
import json
from app.agents.base import BaseAgent

class SearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Search Intelligence Agent")
        self.persist_directory = os.path.join(os.getcwd(), "chroma_db")
        
        # UPGRADE: Using a multilingual model to support Telugu and other Indian languages
        print("--- RAG: Loading Multilingual Embeddings (Telugu Support) ---")
        self.embeddings = HuggingFaceEmbeddings(model_name="paraphrase-multilingual-MiniLM-L12-v2")
        
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="news_articles"
        )
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        
        # UPGRADE: Using a multilingual re-ranker
        print("--- RAG: Loading Multilingual Re-ranker ---")
        self.reranker = CrossEncoder('BAAI/bge-reranker-v2-m3') # Robust multilingual support including Telugu
        
        self.firecrawl = None
        if settings.FIRECRAWL_API_KEY:
            self.firecrawl = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

    def index_articles(self, articles: List[Article]):
        """Index articles into the vector store."""
        documents = []
        for art in articles:
            content = f"Headline: {art.headline}\n\nContent: {art.body}"
            metadata = {
                "headline": art.headline,
                "department": art.department or "General",
                "sentiment": art.sentiment_label or "Neutral",
                "cluster": art.topic_cluster_id or "None"
            }
            documents.append(Document(page_content=content, metadata=metadata))
        
        if documents:
            self.vector_store.add_documents(documents)
            print(f"--- RAG: Indexed {len(documents)} articles (Multilingual) ---")

    async def _web_search(self, query: str) -> str:
        """Perform a web search using Firecrawl."""
        if not self.firecrawl:
            return "Firecrawl API Key not configured."
        
        try:
            search_result = self.firecrawl.search(
                query=query,
                limit=5,
                scrape_options={"formats": ["markdown"]}
            )
            
            context = ""
            for i, result in enumerate(search_result.get("data", [])):
                context += f"\nSource {i+1}: {result.get('url')}\n"
                context += f"Content: {result.get('markdown', result.get('metadata', {}).get('description', ''))[:1000]}\n"
            
            return context if context else "No relevant web results found."
        except Exception as e:
            return f"Web search error: {str(e)}"

    async def run(self, input_data: str) -> Dict[str, Any]:
        """BaseAgent implementation - same as query for this agent."""
        return await self.query(input_data)

    async def query(self, user_query: str, use_web: bool = False) -> Dict[str, Any]:
        """Ask a question with Multilingual Retrieval & Rerank."""
        context_text = ""
        sources = []
        
        if use_web:
            print(f"--- RAG: Performing LIVE WEB SEARCH ---")
            web_context = await self._web_search(user_query)
            context_text = web_context
            sources = [{"headline": "Live Web Search", "snippet": "Direct info from internet search."}]
        else:
            # 1. Broad Retrieval (Multilingual)
            print(f"--- RAG: Broad Multilingual Retrieval ---")
            initial_results = self.vector_store.similarity_search(user_query, k=20)
            
            if not initial_results:
                return {"answer": "I couldn't find any relevant news in the database.", "sources": []}

            # 2. Multilingual Reranking
            print(f"--- RAG: Multilingual Re-ranking ---")
            pairs = [[user_query, doc.page_content] for doc in initial_results]
            scores = self.reranker.predict(pairs)
            
            scored_docs = sorted(zip(scores, initial_results), key=lambda x: x[0], reverse=True)
            best_results = [doc for score, doc in scored_docs[:5]]
            
            context_text = "\n\n---\n\n".join([doc.page_content for doc in best_results])
            sources = [
                {
                    "headline": doc.metadata["headline"],
                    "snippet": doc.page_content[:200] + "..."
                } for doc in best_results
            ]
        
        # 3. Generate Answer (Supports Telugu natively)
        system_msg = "You are a professional News Intel Analyst. You are an expert in regional Indian languages, particularly Telugu. You MUST respond in the same language as the user's question."
        prompt = f"""
        Answer the USER QUESTION strictly based on the provided CONTEXT. 
        
        LANGUAGE RULE:
        - If the user asks in Telugu, you MUST provide a detailed, professional response in Telugu script.
        - If the user asks in English, respond in English.
        - If the context articles are in English but the question is in Telugu, translate the findings into Telugu.
        - If the context articles are in Telugu, extract the facts directly.
        
        CONTEXT:
        {context_text}
        
        USER QUESTION: {user_query}
        """
        
        answer = await self.call_llm(
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            model=settings.GROQ_MODEL
        )
        
        return {
            "answer": answer,
            "sources": sources
        }

# Global Instance
search_agent = SearchAgent()
