import ollama
from app.core.config import settings
import sys

def test_ollama():
    print(f"Testing Ollama connection to: {settings.OLLAMA_BASE_URL}")
    client = ollama.Client(host=settings.OLLAMA_BASE_URL)
    
    try:
        # 1. List models
        print("\n--- Available Models ---")
        models_resp = client.list()
        
        # In newer ollama-python versions, it might be a ListResponse object
        # which has a 'models' attribute containing Model objects
        model_names = []
        if hasattr(models_resp, 'models'):
            for m in models_resp.models:
                name = getattr(m, 'model', 'Unknown')
                print(f"- {name}")
                model_names.append(name)
        elif isinstance(models_resp, dict) and 'models' in models_resp:
            for m in models_resp['models']:
                name = m.get('model', m.get('name', 'Unknown'))
                print(f"- {name}")
                model_names.append(name)
        else:
            print(f"Unexpected response format: {type(models_resp)}")
        
        # 2. Test configured model
        target_model = settings.OLLAMA_MODEL
        print(f"\n--- Testing Model: {target_model} ---")
        
        if target_model not in model_names:
            print(f"Warning: {target_model} not found in available models: {model_names}")
            if model_names:
                print(f"Falling back to {model_names[0]} for connection test...")
                target_model = model_names[0]
            else:
                print("No models available to test.")
                return

        response = client.generate(
            model=target_model,
            prompt='Say "OK"',
        )
        print(f"Response from {target_model}: {response.get('response', 'No response field')}")
        print("\nConnection Successful!")
        
    except Exception as e:
        print(f"\nConnection Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ollama()
