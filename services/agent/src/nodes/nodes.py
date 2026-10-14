from ..utils.state import State
from ..config import model



def chatbot(state: State):
    """ This function is the main entry point for the chatbot. """
    systemPrompt = """
    You are a helpful assistant that can answer questions and provide information.
    """

    # Use the system prompt and the input from the state to generate a response.
    response = model.invoke(systemPrompt)
    return { "message": response }


