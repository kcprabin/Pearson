import json

from ..utils.types import State
from ..config import model
from langchain_core.messages import AIMessage
from ..tools import Tools



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
    When the user requests a restaurant information update, call the update_restaurant_info tool.
    Do not claim an update was completed unless the tool returns successfully.
    """

    messages = [{"role": "system", "content": systemPrompt}]
    messages.extend(
        {
            "role": "assistant" if message.type == "ai" else "user",
            "content": message.content,
        }
        for message in state["message"]
    )
    thread_id = config.get("configurable", {}).get("thread_id")
    tools_by_name = {tool.name: tool for tool in Tools}

    for _ in range(3):
        response = model("auto", messages)
        assistant_message = response.choices[0].message

        if not assistant_message.tool_calls:
            content = assistant_message.content or ""
            return {"message": [AIMessage(content=content)]}

        messages.append({
            "role": "assistant",
            "content": assistant_message.content or "",
            "tool_calls": [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {
                        "name": call.function.name,
                        "arguments": call.function.arguments,
                    },
                }
                for call in assistant_message.tool_calls
            ],
        })

        for call in assistant_message.tool_calls:
            tool = tools_by_name.get(call.function.name)
            if tool is None:
                result = {"message": f"Unknown tool: {call.function.name}"}
            else:
                arguments = json.loads(call.function.arguments or "{}")
                arguments["thread_id"] = thread_id
                print(
                    f"[agent] Calling tool {call.function.name} thread_id={thread_id} arguments={arguments}",
                    flush=True,
                )
                result = tool.invoke(arguments)

            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(result),
            })

    return {
        "message": [
            AIMessage(content="I could not complete that update. Please try again.")
        ]
    }



