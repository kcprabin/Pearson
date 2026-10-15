from ..utils.state import State
from ..config import model
from langchain_core.messages import AIMessage



def chatbot(state: State):
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
    messages.extend(
        {
            "role": "assistant" if message.type == "ai" else "user",
            "content": message.content,
        }
        for message in state["message"]
    )
    response = model("auto", messages)
    content = response.choices[0].message.content
    return {"message": [AIMessage(content=content)]}



