from ..state import State
from ..config import llm


def chatbot(State: State):
    """ A normal Chatbot node for llm """

    return {
        "message":[llm.invoke(State[messege])]   
    }