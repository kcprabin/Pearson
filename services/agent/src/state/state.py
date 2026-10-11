from typing import Annotated
from typing_extensions import TypedDict

from langgraph.graph.message import add_messages 


## state memory of agent
class State(TypedDict):
    message: Annotated[list[str], add_messages]



