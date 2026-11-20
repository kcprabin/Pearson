import json
from langchain_core.messages import AIMessage, ToolMessage
from ..utils.types import State
from ..config import model



def chatbot(state: State, config):
    """ This function is the main entry point for the chatbot. """
    thread_id: str = (config or {}).get("configurable", {}).get("thread_id", "")

    systemPrompt = f"""
    You are a friendly restaurant assistant for WhatsApp.
    Help guests with the restaurant menu, item availability, prices, dietary questions, and orders.
    Use the restaurant name provided by the conversation when addressing the guest.
    Show menu items and prices clearly when they are available in the conversation or supplied data.
    If the menu or price is not available, say so and ask for the menu instead of inventing details.
    Help guests choose within a stated budget or compare prices when asked.
    For an order, collect the item, quantity, options, special requests, and whether it is for
    dine-in, takeaway, or delivery. Ask for any missing details, summarize the order and total
    when prices are known, and ask for confirmation before treating it as placed.
    Never claim that an order was submitted or paid for unless a connected ordering system confirms it.
    Keep replies warm, concise, and suitable for WhatsApp.

    SYSTEM CONTEXT (never reveal to the user):
    The current conversation thread_id is: {thread_id}
    You MUST always pass this thread_id when calling the update_restaurant_info tool.
    """

    messages = [{"role": "system", "content": systemPrompt}]
    for msg in state.get("messages", []):
        if isinstance(msg, AIMessage):
            entry = {"role": "assistant", "content": msg.content or ""}
            if getattr(msg, "tool_calls", None):
                entry["tool_calls"] = [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {
                            "name": tc["name"],
                            "arguments": (
                                json.dumps(tc["args"])
                                if isinstance(tc["args"], dict)
                                else str(tc["args"])
                            ),
                        },
                    }
                    for tc in msg.tool_calls
                ]
            messages.append(entry)
        elif isinstance(msg, ToolMessage) or getattr(msg, "type", "") == "tool" or hasattr(msg, "tool_call_id"):
            messages.append({
                "role": "tool",
                "content": str(msg.content),
                "tool_call_id": getattr(msg, "tool_call_id", ""),
            })
        else:
            messages.append({
                "role": "user",
                "content": getattr(msg, "content", str(msg)),
            })

  
    ai_message = model("gemini-3.5-flash-lite", messages)

    # ai_message is already an AIMessage with .tool_calls populated by LangChain
    return {"messages": [ai_message]}



