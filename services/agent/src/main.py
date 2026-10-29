from fastapi import FastAPI
from dotenv import load_dotenv
from pathlib import Path
from threading import Thread
from .utils.state import llminvoke
from .kafka import consume_messages
from .controllers import router
from .kafka import connect_kafka
from threading import Thread
from .kafka import consume_messages




for parent in Path(__file__).resolve().parents:
    env_file = parent / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
        break
else:
    load_dotenv(override=False)

app = FastAPI()
app.include_router(router)



@app.on_event("startup")
async def startup_event():
    """Startup event to connect to Kafka and start consuming messages."""
    try:
        connect_kafka()
        Thread(
            target=consume_messages,
            kwargs={
                "topic": "bot-receiver-connected",
                "handler": handle_kafka_message,
            },
            daemon=True,
        ).start()
    except Exception as e:
        print(f"Error during startup: {e}")


def handle_kafka_message(message: dict):
    """Handle Kafka events received by the agent."""
    print(f"Agent received Kafka message: {message}")





    
    



  