from ..utils.state import State
from ..config import model


def chatbot(state: State, user_input: str) -> dict:
    """ This function is the main entry point for the chatbot. """
    prompt = """
    You are a helpful assistant that can answer questions and provide information.
    """

    # Use the system prompt and the input from the state to generate a response.
    prompt = systemPrompt + "\n" + user_input
    response = model.invoke(prompt)
    return { "message": response }


