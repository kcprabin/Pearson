from fastapi import APIRouter, Query
from pydantic import BaseModel
from ..utils import llminvoke
import uuid4

router = APIRouter()


class AdminChatBotRequest(BaseModel):
    thread_id: str
    message: str | None = None
    restaurantName: str | None = None
    restaurant_name: str | None = None
    ownerName: str | None = None
    owner_name: str | None = None

class ConsumerChatBotRequest(BaseModel):
    ownerPhoneNumber: str | None = None
    message: str | None = None
    




## admin chat bot route for whatsapp
@router.post("/admin-chat-bot")
async def start_chat_bot_admin_post(payload: AdminChatBotRequest):
    """Invoke the LLM with a restaurant-specific prompt for the admin via POST."""
    restaurant_name = payload.restaurantName or payload.restaurant_name
    if (thread_id := payload.thread_id) is None:
        return {"error": "thread_id is required."}
    owner_name = payload.ownerName or payload.owner_name
    prompt = (
        payload.message
        if payload.message is not None
        else  f"You are an AI assistant helping the administrator for {restaurant_name}. "
            f"The owner of the restaurant is {owner_name}. "
            f"The admin has successfully logged in.\n\n"
            f"Your task:\n"
            f"1. Warmly welcome the admin.\n"
            f"2. Ask them to upload or provide the restaurant's current menu items, prices, "
            f"and dish photos so they can be saved into our vector database for future customer queries.\n"
            f"3. Ask how else you can assist them today."
            f"4. Ask admin if her want to update his information or if there's anything else they need help with."
            f"5. This is an Open Source project, And is managed by Team Pearson. If you have any questions or need assistance, please feel free to reach out to us at kcprabin2063@gmail.com"
    
    )
    try:
        response = llminvoke(payload.thread_id, prompt)
    except Exception as error:
        data = error.args[0] if error.args else str(error)
        return {"error": "LLM unavailable for admin welcome", "details": data}
    return {"message": response, "thread_id": payload.thread_id}



@router.get("/start-chat-bot")
async def start_chat_bot_Costumer( payload: ConsumerChatBotRequest):
    """Send a restaurant-specific welcome message for a new chat."""
    if (restaurant_name := payload.ownerPhoneNumber) is None:
        return {"error": "ownerPhoneNumber is required."}
  

    thread_id = uuid4.uuid4().hex
    prompt = (
            f"Your task:\n"
            f"1. Warmly welcome the customer.\n"
            f"2. Ask how else you can assist them today."
            f"3. Ask the customer if they want to know about the restaurant's menu, prices, and dish photos."
            f"4. This is an Open Source project, And is managed by Team Pearson. If you have any questions or need assistance, please feel free to reach out to us at kcprabin2063@gmail.com"
            )    
    
    response = llminvoke(thread_id, prompt)
    return {"message": response, "thread_id": thread_id}


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
