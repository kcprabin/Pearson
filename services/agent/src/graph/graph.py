from langgraph.graph import StateGraph , START ,END
from ..nodes import chatbot
from ..utils.types import State
from ..tools import Tools
from langgraph.checkpoint.postgres import PostgresSaver
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

graph = StateGraph(State)

graph.add_node("chatbot", chatbot)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tool_condition, {
    "tools": "tools",
    END: END
})
graph.add_edge("tools", "chatbot")


import os
from pathlib import Path
from dotenv import load_dotenv

from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition

from ..nodes import chatbot
from ..utils.types import State
from ..tools import tools  # Assuming 'tools' is a list of your tool functions

# 1. Environment Setup
env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

# 2. Build Graph Architecture
builder = StateGraph(State)

tool_node = ToolNode(tools)

builder.add_node("chatbot", chatbot)
builder.add_node("tools", tool_node)

builder.add_edge(START, "chatbot")
builder.add_conditional_edges("chatbot", tools_condition)
builder.add_edge("tools", "chatbot")


pool = ConnectionPool(conninfo=DATABASE_URL, max_size=20)

checkpointer = PostgresSaver(pool)
checkpointer.setup()  

llm = builder.compile(checkpointer=checkpointer)







