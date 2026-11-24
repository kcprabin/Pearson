import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_postgres.vectorstores import DistanceStrategy

# 1. Load .env from current directory or project root
load_dotenv()
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL is not set in the environment variables.")

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY (or GEMINI_API_KEY) is not set in the environment variables.")


embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=google_api_key,
    output_dimensionality=768,  # Compact 768-dim vectors (supports 768, 1536, or 3072)
)

# 3. PGVector with Cosine Similarity
vector_store = PGVector(
    embeddings=embeddings,
    collection_name="restaurant_menus",
    connection=database_url,
    distance_strategy=DistanceStrategy.COSINE,
    use_jsonb=True,
    create_extension=True,
)