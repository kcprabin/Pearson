from dotenv import load_dotenv
import os
from pathlib import Path
from openai import OpenAI



env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)
FREE_LLM_API_KEY = os.getenv("GOOGLE_API_KEY")

if FREE_LLM_API_KEY is None:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")

def model(model_name: str, messages: list[dict[str, str]]):
    client = OpenAI(
        base_url="http://localhost:3001/v1",
        api_key=FREE_LLM_API_KEY,
    )
    return client.chat.completions.create(
        model=model_name,
        messages=messages,
    )










