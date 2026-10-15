from fastapi import FastAPI
from fastapi import Query
from dotenv import load_dotenv
from pathlib import Path
from threading import Thread
from .utils import llminvoke
from .kafka import consume_messages


env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()


def handle_bot_receiver_event(payload):
    """Start the welcome conversation when the bot receiver connects."""
    if payload.get("event") != "bot_receiver_connected":
        return
    response = llminvoke(
        "whatsapp-receiver",
        payload.get(
            "message",
            "Welcome to our restaurant. How can we help you today?",
        ),
    )
    print(f"Welcome message generated: {response['message']}")


@app.on_event("startup")
async def start_kafka_consumer():
    Thread(
        target=consume_messages,
        args=("bot-receiver-connected", handle_bot_receiver_event),
        daemon=True,
    ).start()

@app.get("/")
async def root(
        prompt: str = Query(...),
        thread_id: str = Query(...),
    restaurant_name: str | None = Query(default=None),
):
    """Invoke the LLM with the current state."""
    if restaurant_name:
        prompt = f"The restaurant is {restaurant_name}. {prompt}"
    response = llminvoke(thread_id, prompt)
    return {prompt: response["message"]}

@app.get("/start-chat-bot")
async def start_chat_bot(
        thread_id: str = Query(...),
        restaurant_name: str | None = Query(default=None),
):
    """Send a restaurant-specific welcome message for a newly initialized chat."""
    restaurant = restaurant_name or "the restaurant"
    prompt = (
        f"The restaurant is {restaurant}. Welcome the guest warmly and briefly ask whether "
        "they would like to see the menu, check prices, or place an order."
    )
    response = llminvoke(thread_id, prompt)
    return {prompt: response["message"]}
        
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}




    
    



  