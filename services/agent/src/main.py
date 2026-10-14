from fastapi import FastAPI
from dotenv import load_dotenv
from .config import LoadGoogleModel
from pathlib import Path
from .graph import llm



env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()
LoadGoogleModel()  # Load the Google model when the application starts



@app.get("/")
async def root():
    prompt = "Hello, how are you?"
    response = llm.invoke({"input": prompt})
    return {"message": response}





    
    



  