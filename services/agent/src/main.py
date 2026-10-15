from fastapi import FastAPI
from dotenv import load_dotenv
from .config import LoadGoogleModel
import uuid

from pathlib import Path
from .graph import llm



env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()
LoadGoogleModel()  # Load the Google model when the application starts




@app.get("/")
async def root():
    try:
        prompt = "Hello, how are you My name is prabin"
        prompt1 = "what is my name"
        config = {
            "configurable": {
                "thread_id": uuid.uuid4(),
            }
        }
        response = llm.invoke(
            {"message": [prompt]},
            config=config)
        return {"message": response["message"][-1].content}
    except Exception as e:
        return {"error": str(e)}
    




    
    



  