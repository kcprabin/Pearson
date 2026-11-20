import os
from pathlib import Path
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage
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

# Cache the LLM instance — avoid recreating it on every call
_DEFAULT_MODEL = "gemini-3.5-flash-lite"
_llm_cache: dict = {}


def _get_llm_with_tools(model_name: str):
    if model_name not in _llm_cache:
        llm = init_chat_model(
            model_name,
            model_provider="google_genai",
            api_key=GOOGLE_API_KEY,
        )
        _llm_cache[model_name] = llm.bind_tools(Tools)
    return _llm_cache[model_name]


def model(model_name: str, messages: list) -> AIMessage:
    """Call the LLM with bound tools and return an AIMessage.

    Google Gemini sometimes returns content as a list of content-part dicts
    rather than a plain string.  We normalise it to a plain string so the
    rest of the graph (and WhatsApp reply) always gets a str.
    """
    if not model_name:
        model_name = _DEFAULT_MODEL

    llm_with_tools = _get_llm_with_tools(model_name)
    response: AIMessage = llm_with_tools.invoke(messages)

    # Normalise content: list[dict] → plain string
    if isinstance(response.content, list):
        parts = []
        for part in response.content:
            if isinstance(part, dict):
                parts.append(part.get("text", ""))
            else:
                parts.append(str(part))
        response = AIMessage(
            content=" ".join(parts).strip(),
            tool_calls=response.tool_calls,
            id=response.id,
        )

    return response