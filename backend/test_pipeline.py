import asyncio
from app.graph.workflow import app as pipeline_graph

initial_state = {
    'file_id': 'test123',

    'file_path': 'temp_uploads/8a8855bd-e000-4163-ab30-2f9b69e39bea_Prajasakti_AP_27-12-2025-2.pdf',

    'articles': [],
    'ocr_result': None,
    'error': None,
    'unassigned_segments': [],
    'department_updates': None,
    'sentiment_updates': None
}

async def run_test():
    try:
        result = await pipeline_graph.ainvoke(initial_state)
        articles = result.get('articles', [])
        print(f'Pipeline completed! Found {len(articles)} articles')
        if result.get('error'):
            print(f'Error: {result["error"]}')
    except Exception as e:
        print(f'Pipeline failed: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(run_test())
