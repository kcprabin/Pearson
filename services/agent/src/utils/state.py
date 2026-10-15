from typing import Annotated, Any
from typing_extensions import TypedDict
from ..graph import llm


from langgraph.graph.message import add_messages 


## state memory of agent
class State(TypedDict):
    """State of the agent."""
    message: Annotated[list, add_messages]




def llminvoke(thread_id: str, message: str) -> Any:
    """Invoke the LLM with the current state."""
    config = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    response = llm.invoke(
        {"message": [message]},
        config=config,
    )
    return {message: response["message"]}