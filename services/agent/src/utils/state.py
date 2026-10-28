from typing import Any

from ..graph import llm


def llminvoke(thread_id: str, message: str) -> str:
    """Invoke the LLM with the current state."""
    config = {
        "configurable": {
            "thread_id": thread_id,
        }
    }
    response = llm.invoke(
        {"messages": [message]},
        config=config,
    )
    messages = response.get("messages", [])
    if messages:
        last_msg = messages[-1]
        return getattr(last_msg, "content", str(last_msg))
    return ""