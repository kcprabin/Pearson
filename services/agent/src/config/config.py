import os
from pathlib import Path
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from ..tools import Tools

for parent in Path(__file__).resolve().parents:
    env_file = parent / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
        break
else:
    load_dotenv(override=False)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")


def model(model_name: str, messages: list):
    if not model_name:
        model_name = "gemini-3.5-flash-lite"

    llm = init_chat_model(
        model_name,
        model_provider="google_genai",
        api_key=GOOGLE_API_KEY,
    )
    llm_with_tools = llm.bind_tools(Tools)
    response = llm_with_tools.invoke(messages)

    # Return full AIMessage so caller/LangGraph can inspect response.tool_calls
    return response