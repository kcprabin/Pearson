from typing import Optional
import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from langchain_core.utils.function_calling import convert_to_openai_tool


class UpdateRestaurantInfoInput(BaseModel):
    thread_id: str = Field(
        ..., description="The unique thread or entity ID for the restaurant update."
    )
    restaurant_name: Optional[str] = Field(
        None, alias="RestaurantName", description="Updated name of the restaurant."
    )
    address: Optional[str] = Field(None, description="Updated street address.")
    phone_number: Optional[str] = Field(
        None, alias="phoneNumber", description="Updated primary phone number."
    )
    email: Optional[str] = Field(None, description="Updated contact email.")
    owner_name: Optional[str] = Field(
        None, alias="ownerName", description="Updated owner's full name."
    )
    owner_email: Optional[str] = Field(
        None, alias="ownerEmail", description="Updated owner's email address."
    )
    owner_phone_number: Optional[str] = Field(
        None,
        alias="ownerPhoneNumber",
        description="Updated owner's phone number.",
    )

    class Config:
        populate_by_name = True


@tool(args_schema=UpdateRestaurantInfoInput)
def update_restaurant_info(
    thread_id: str,
    restaurant_name: Optional[str] = None,
    address: Optional[str] = None,
    phone_number: Optional[str] = None,
    email: Optional[str] = None,
    owner_name: Optional[str] = None,
    owner_email: Optional[str] = None,
    owner_phone_number: Optional[str] = None,
) -> str:
    """Updates restaurant information by calling the internal backend API.
    
    Only provide the fields that require updating.
    """
    url = f"http://127.0.0.1:3000/hotel/update-restro/{thread_id}"

    # Build payload containing only explicitly provided (non-None) fields
    payload = {
        "RestaurantName": restaurant_name,
        "address": address,
        "phoneNumber": phone_number,
        "email": email,
        "ownerName": owner_name,
        "ownerEmail": owner_email,
        "ownerPhoneNumber": owner_phone_number,
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    if not payload:
        return "No fields were provided to update."

    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        response.raise_for_status()
        return "Restaurant information updated successfully."
    except requests.exceptions.RequestException as e:
        return f"Server error: Unable to update restaurant information. Error: {str(e)}"




Tools = [
    update_restaurant_info,]

OPENAI_TOOLS = [convert_to_openai_tool(t) for t in Tools]