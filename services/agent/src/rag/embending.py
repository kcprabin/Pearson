import os
from pinecone import Pinecone, SchemaBuilder
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


pinecone_api_key = os.getenv("PINECONE_API_KEY")
if not pinecone_api_key:
    raise ValueError("PINECONE_API_KEY is not set in the environment variables.")

pc = Pinecone(api_key=pinecone_api_key)