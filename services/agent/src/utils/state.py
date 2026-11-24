from typing import Any

from ..graph import llm


def llminvoke(thread_id: str, message: str, restaurant_id: int | None = None) -> str:
    """Invoke the LLM with the current state."""
    config = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    input_state = {"messages": [message]}
    if restaurant_id is not None:
        input_state["restaurant_id"] = restaurant_id

    response = llm.invoke(
        input_state,
        config=config,
    )
    messages = response.get("messages", [])
    if messages:
        last_msg = messages[-1]
        return getattr(last_msg, "content", str(last_msg))
    return ""