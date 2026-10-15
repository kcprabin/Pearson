from fastapi import APIRouter, Query

from ..utils import llminvoke

router = APIRouter()


@router.get("/admin-chat-bot")
async def start_chat_Bot_admin(
    thread_id: str = Query(...),
    restaurant_name: str | None = Query(default=None),
):
    """Invoke the LLM  with a restaurant-specific prompt for the admin."""
    if restaurant_name:
        prompt = (
        f"You are an AI assistant helping the administrator for {restaurant_name}. "
        f"The admin has successfully logged in.\n\n"
        f"Your task:\n"
        f"1. Warmly welcome the admin.\n"
        f"2. Ask them to upload or provide the restaurant's current menu items, prices, "
        f"and dish photos so they can be saved into our vector database for future customer queries.\n"
        f"3. Ask how else you can assist them today."
    )
    else:
        prompt = (
        "You are an AI assistant for a restaurant management system. "
        "The admin has logged in, but no restaurant name is associated with this account. "
        "Politely welcome the admin and ask them to provide the restaurant's name so we can get started."
    )

    response = llminvoke(thread_id, prompt)
    return {prompt: response["message"]}


@router.get("/start-chat-bot")
async def start_chat_bot_Costumer(
    thread_id: str = Query(...),
    restaurant_name: str | None = Query(default=None),
):
    """Send a restaurant-specific welcome message for a new chat."""
    restaurant = restaurant_name or "the restaurant"
    prompt = (
        f"The restaurant is {restaurant}. Welcome the guest warmly and briefly ask whether "
        "they would like to see the menu, check prices, or place an order."
    )
    response = llminvoke(thread_id, prompt)
    return {prompt: response["message"]}


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
