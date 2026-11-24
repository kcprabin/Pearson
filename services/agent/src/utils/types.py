from typing import Annotated

from typing_extensions import NotRequired, TypedDict
from langgraph.graph.message import add_messages


class State(TypedDict):
    """State shared by the LangGraph nodes."""

    messages: Annotated[list, add_messages]
    restaurant_id: NotRequired[int]