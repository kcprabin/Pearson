from .state import State
from .prompt.systemprompt import systemPrompt



def decision_node(state: State) -> str:
    """
    Decision node that determines the next state based on the current state.
    """
    if state.is_order_complete:
        return "order_confirmation"
    elif state.is_order_cancelled:
        return "order_cancellation"
    elif state.is_order_in_progress:
        return "order_processing"
    else:
        return "menu_selection"



