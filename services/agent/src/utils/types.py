from typing import Annotated

from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class State(TypedDict):
    """State shared by the LangGraph nodes."""

    message: Annotated[list, add_messages]
