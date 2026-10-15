from fastapi import FastAPI
from fastapi import Query
from dotenv import load_dotenv
from pathlib import Path
from .graph import llm



env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()





@app.get("/")
async def root(
        prompt: str = Query(...),
        thread_id: str = Query(...),
):
        config = {
            "configurable": {
                "thread_id": thread_id,
            }
        }
        response = llm.invoke(
            {"message": [prompt]},
            config=config,
        )
        return {"message": response["message"]}
  
    




    
    



  