from dotenv import load_dotenv
import os
from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI





env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)
openai_api_key = os.getenv("OPENAI_API_KEY")

google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not google_api_key:
    raise ValueError("Set GOOGLE_API_KEY or GEMINI_API_KEY in the environment.")

os.environ["GOOGLE_API_KEY"] = google_api_key


def LoadGoogleModel():
    """ Load the Google Gemini model. """
    global model
    model = ChatGoogleGenerativeAI(
        model="gemini-3.7-flash",
        temperature=1.0,  
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )


LoadGoogleModel()





