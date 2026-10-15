from typing import Annotated, Any
from typing_extensions import TypedDict

from langgraph.graph.message import add_messages 


## state memory of agent
class State(TypedDict):
    """State of the agent."""
    message: Annotated[list, add_messages]
