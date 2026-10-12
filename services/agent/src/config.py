from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os

load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")



llm = init_chat_model("gpt-4", temperature=0.7, model_kwargs={"max_tokens": 2000})




