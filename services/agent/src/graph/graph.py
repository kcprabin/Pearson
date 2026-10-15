from langgraph.graph import StateGraph , START ,END
from ..nodes import chatbot
from ..utils.state import State
from langgraph.checkpoint.memory import InMemorySaver




graph = StateGraph(State)

graph.add_node("chatbot", chatbot)

graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)

memory = InMemorySaver()

llm = graph.compile(checkpointer=memory)



