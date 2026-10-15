from ..utils.state import State
from ..config import model
from langchain_core.messages import AIMessage



def chatbot(state: State):
    """ This function is the main entry point for the chatbot. """
    systemPrompt = """
    You are a helpful assistant that can answer questions and provide information.
    """

    messages = [{"role": "system", "content": systemPrompt}]
    messages.extend(
        {
            "role": "assistant" if message.type == "ai" else "user",
            "content": message.content,
        }
        for message in state["message"]
    )
    response = model("auto", messages)
    content = response.choices[0].message.content
    return {"message": [AIMessage(content=content)]}



