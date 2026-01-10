from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes import (
    vision_node,
    parallel_analysis_node,
    clustering_node,
    indexing_node
)

# DEFINE THE GRAPH
workflow = StateGraph(AgentState)

# ADD NODES
workflow.add_node("vision", vision_node)
workflow.add_node("parallel_analysis", parallel_analysis_node)
workflow.add_node("clustering", clustering_node)
workflow.add_node("indexing", indexing_node)

# DEFINE EDGES
def check_error(state: AgentState):
    if state.get("error"):
        return END
    return "parallel_analysis"

workflow.set_entry_point("vision")

workflow.add_conditional_edges(
    "vision",
    check_error,
    {
        END: END,
        "parallel_analysis": "parallel_analysis"
    }
)

workflow.add_edge("parallel_analysis", "clustering")
workflow.add_edge("clustering", "indexing")
workflow.add_edge("indexing", END)

app = workflow.compile()
