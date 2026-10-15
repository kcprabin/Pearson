from fastapi import FastAPI
from dotenv import load_dotenv
import uuid
from pathlib import Path
from .graph import llm



env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()





@app.get("/")
async def root():
        prompt = "Hello, how are you My name is prabin"
        prompt1 = "what is my name"
        config = {
            "configurable": {
                "thread_id": "1",
            }
        }
        response = llm.stream(
            {"message": [prompt1]},
            config=config)
        return {"message": response["message"]}
  
    




    
    



  