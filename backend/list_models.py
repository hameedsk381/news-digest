import ollama
from app.core.config import settings

def list_ollama_models():
    client = ollama.Client(host=settings.OLLAMA_BASE_URL)
    try:
        resp = client.list()
        print("\nAVAILABLE MODELS:")
        if hasattr(resp, 'models'):
            for m in resp.models:
                print(f"- {m.model}")
        elif isinstance(resp, dict) and 'models' in resp:
            for m in resp['models']:
                print(f"- {m.get('model', m.get('name'))}")
        else:
            print(resp)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_ollama_models()
