from typing import Any

from ..graph import llm


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