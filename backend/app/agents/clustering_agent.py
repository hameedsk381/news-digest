from typing import List
from app.agents.base import BaseAgent
from app.schemas.layout import Article
import uuid
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
import numpy as np

class ClusteringAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Topic Clustering Agent")
        
    async def run(self, articles: List[Article]) -> List[Article]:
        self.log(f"Clustering {len(articles)} articles")
        
        if len(articles) < 2:
            self.log("Not enough articles to cluster")
            return articles
            
        # Extract text for clustering
        corpus = [art.headline + " " + art.body for art in articles]
        
        try:
            # Simple TF-IDF + DBSCAN
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            X = vectorizer.fit_transform(corpus)
            
            # DBSCAN: eps controls the distance, min_samples is min items in a cluster
            clustering = DBSCAN(eps=0.5, min_samples=2, metric='cosine').fit(X)
            labels = clustering.labels_
            
            for i, label in enumerate(labels):
                if label != -1:
                    # Assign cluster ID (append generic string to ensure string type)
                    articles[i].topic_cluster_id = f"cluster_{label}"
                else:
                     articles[i].topic_cluster_id = f"noise_{uuid.uuid4().hex[:8]}"

        except Exception as e:
            self.log(f"Clustering failed, skipping: {str(e)}")
            # Fallback: Treat all as unique
            for art in articles:
                art.topic_cluster_id = f"unique_{uuid.uuid4().hex[:8]}"
                
        return articles
