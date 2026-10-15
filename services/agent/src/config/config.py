from dotenv import load_dotenv
import os
from pathlib import Path
from openai import OpenAI




env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)
openai_api_key = os.getenv("OPENAI_API_KEY")

google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not google_api_key:
    raise ValueError("Set GOOGLE_API_KEY or GEMINI_API_KEY in the environment.")

os.environ["GOOGLE_API_KEY"] = google_api_key

def model(model: str, prompt: str):
    client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key = google_api_key,)
    return client.chat.completions.create(
        model=model,  # let the router pick; or "auto:fast", "auto:smart", a profile, or a model id
        messages=[{"role": "user", "content": prompt}],
    )










