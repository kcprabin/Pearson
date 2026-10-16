from langgraph.graph import StateGraph , START ,END
from ..nodes import chatbot
from ..utils.types import State
from langgraph.checkpoint.memory import MemorySaver




graph = StateGraph(State)

graph.add_node("chatbot", chatbot)

graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)

memory = MemorySaver()

llm = graph.compile(checkpointer=memory)



