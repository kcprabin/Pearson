from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

load_dotenv()



llm = init_chat_model("gpt-4", temperature=0.7, model_kwargs={"max_tokens": 2000})

