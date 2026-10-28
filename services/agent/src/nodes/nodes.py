import json
from langchain_core.messages import AIMessage, ToolMessage
from ..utils.types import State
from ..config import model



def chatbot(state: State, config):
    """ This function is the main entry point for the chatbot. """
    systemPrompt = """
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

    response = model("auto", messages)
    choice_msg = response.choices[0].message
    content = choice_msg.content or ""

    tool_calls = []
    if getattr(choice_msg, "tool_calls", None):
        for tc in choice_msg.tool_calls:
            args = tc.function.arguments
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}
            tool_calls.append({
                "name": tc.function.name,
                "args": args,
                "id": tc.id,
                "type": "tool_call",
            })

    return {"messages": [AIMessage(content=content, tool_calls=tool_calls)]}



