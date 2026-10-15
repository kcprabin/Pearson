from fastapi import FastAPI
from dotenv import load_dotenv
from pathlib import Path
from threading import Thread
from .utils import llminvoke
from .kafka import consume_messages
from .controllers import router
from .kafka import connect_kafka
from threading import Thread
from .kafka import consume_messages




env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()
app.include_router(router)



@app.on_event("startup")
async def startup_event():
    """Startup event to connect to Kafka and start consuming messages."""
    try:
        connect_kafka()
    except Exception as e:
        print(f"Error during startup: {e}")





    
    



  