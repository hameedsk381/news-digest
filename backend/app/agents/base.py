from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def run(self, input_data: Any) -> Any:
        """
        Execute the agent's main logic.
        """
        pass

    def log(self, message: str):
        """
        Log a message with the agent's name.
        """
        # In a real app, use a proper logger
        print(f"[{self.name}] {message}")

    async def call_llm(self, messages: List[Dict[str, Any]], model: Optional[str] = None, json_mode: bool = False) -> str:
        """
        Versatile LLM caller that handles Groq key rotation and Ollama fallback.
        """
        from app.core.config import settings
        from groq import Groq, RateLimitError
        from app.core.ollama import ollama_service

        keys = settings.GROQ_API_KEYS
        
        # Case 1: Groq with Rotation
        if settings.LLM_PROVIDER == "groq" and keys:
            for i, key in enumerate(keys):
                try:
                    client = Groq(api_key=key)
                    resp = client.chat.completions.create(
                        messages=messages,
                        model=model or settings.GROQ_MODEL,
                        response_format={"type": "json_object"} if json_mode else None
                    )
                    result = resp.choices[0].message.content
                    self.log(f"LLM Call Success. Provider: Groq, Model: {model or settings.GROQ_MODEL}, Result len: {len(result) if result else 0}")
                    return result
                except RateLimitError:
                    self.log(f"Key {i+1}/{len(keys)} rate limited. Trying next...")
                    continue
                except Exception as e:
                    self.log(f"Groq error with key {i+1}: {e}")
                    if i < len(keys) - 1:
                        continue
                    else:
                        break # Fallback to Ollama if all keys fail

        # Case 2: Manual Ollama or Fallback
        try:
            return ollama_service.chat(messages, schema=True if json_mode else None)
        except Exception as e:
            # Final try: if Ollama was requested but failed, try Groq as last resort
            if settings.LLM_PROVIDER == "ollama" and keys:
                for key in keys:
                    try:
                        client = Groq(api_key=key)
                        resp = client.chat.completions.create(
                            messages=messages,
                            model=model or "meta-llama/llama-4-scout-17b-16e-instruct",
                            response_format={"type": "json_object"} if json_mode else None
                        )
                        return resp.choices[0].message.content
                    except:
                        continue
            
            self.log(f"Final LLM Call failed: {e}")
            raise e
