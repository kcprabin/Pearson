from langgraph.graph import StateGraph , START ,END
from ..nodes import chatbot
from ..utils.types import State
from ..tools import Tools
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool
from dotenv import load_dotenv
from pathlib import Path
import os
from langgraph.prebuilt import ToolNode , tools_condition

for parent in Path(__file__).resolve().parents:
    env_file = parent / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)
        break
else:
    load_dotenv(override=False)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

graph = StateGraph(State)

graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(Tools, name="tools"))

graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition, {
    "tools": "tools",
    END: END
})
graph.add_edge("tools", "chatbot")


with PostgresSaver.from_conn_string(DATABASE_URL) as setup_checkpointer:
    setup_checkpointer.setup()

# 
pool = ConnectionPool(conninfo=DATABASE_URL, max_size=20)
checkpointer = PostgresSaver(pool)

llm = graph.compile(checkpointer=checkpointer)







