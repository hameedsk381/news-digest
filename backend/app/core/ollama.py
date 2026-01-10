import ollama
from app.core.config import settings
from typing import List, Dict, Any, Optional

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.client = ollama.Client(host=self.base_url)

    def chat(self, messages: List[Dict[str, Any]], schema: Optional[Any] = None) -> str:
        # Adapter to convert OpenAI-style multimodal messages to Ollama format
        cleaned_messages = []
        for msg in messages:
            content = msg.get("content")
            if isinstance(content, list):
                # Handle multimodal content [{"type": "text", ...}, {"type": "image_url", ...}]
                text_parts = []
                images = []
                for part in content:
                    if part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif part.get("type") == "image_url":
                        url = part.get("image_url", {}).get("url", "")
                        if url.startswith("data:image"):
                            # Extract base64 part
                            try:
                                base64_str = url.split("base64,")[1]
                                images.append(base64_str)
                            except IndexError:
                                pass
                
                new_msg = {
                    "role": msg.get("role"),
                    "content": "\n".join(text_parts),
                }
                if images:
                    new_msg["images"] = images
                cleaned_messages.append(new_msg)
            else:
                cleaned_messages.append(msg)

        try:
            response = self.client.chat(
                model=self.model,
                messages=cleaned_messages,
                format="json" if schema else None
            )
            return response['message']['content']
        except Exception as e:
            print(f"Ollama error: {e}")
            raise e

ollama_service = OllamaService()
