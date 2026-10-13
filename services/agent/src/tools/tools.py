from langchain.tools import Tool


@Tool
def Search_Menu(query: str) -> str:
    """
    Search the restaurant menu for items matching the query.
    """
    # Implement the logic to search the menu based on the query
    # Return a string with the search results
    return f"Search results for '{query}'"


@Tool
def Create_Order(order_details: str) -> str:
    """
    backend route is provided to create an order based on the order_details.
    """
    # Implement the logic to create an order based on the order_details
    # Return a string confirming the order creation
    return f"Order created with details: '{order_details}'"

@Tool
def Search_about_food(query: str) -> str:
    """
    Search the restaurant menu for items in internet and check its rating form internet and return the result.
    """
    # Implement the logic to search the menu based on the query
    # Return a string with the search results
    return f"Search results for '{query}'"



Tools = [Search_Menu, Create_Order, Search_about_food]