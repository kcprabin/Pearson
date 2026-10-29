from dotenv import load_dotenv
import os
from pathlib import Path
from openai import OpenAI
from ..tools import OPENAI_TOOLS
from langchain.agents import create_agent



for parent in Path(__file__).resolve().parents:
    env_file = parent / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
        break
else:
    load_dotenv(override=False)

FREE_LLM_API_KEY = os.getenv("GOOGLE_API_KEY")
FREELLM_BASE_URL = os.getenv("FREELLM_BASE_URL", "http://localhost:3001/v1")

if FREE_LLM_API_KEY is None:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")



def model(model_name: str, messages: list[dict[str, str]]):
    client = OpenAI(
        base_url=FREELLM_BASE_URL,
        api_key=FREE_LLM_API_KEY,
        timeout=60,
    )
    return client.chat.completions.create(
        model=model_name,
        messages=messages,
        tools=OPENAI_TOOLS,
    )











