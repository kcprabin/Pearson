import os
from typing import Annotated, Optional
import requests
from langchain_core.tools import InjectedToolArg, tool
from pydantic import BaseModel, ConfigDict, Field


def _post_to_backend(endpoint: str, payload: dict) -> dict:
    api_url = os.getenv("API_URL", "http://localhost:3000").rstrip("/")
    url = f"{api_url}{endpoint}"

    clean_payload = {k: v for k, v in payload.items() if v is not None}

    try:
        response = requests.post(
            url,
            json=clean_payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        response.raise_for_status()
        return {"status": "success", "data": response.json() if response.text else {}}
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.text if e.response is not None else str(e)
        return {
            "status": "error",
            "message": f"API Error ({e.response.status_code}): {error_detail}",
        }
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}


class UpdateRestaurantInfoInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    thread_id: Annotated[str, InjectedToolArg]
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
        None, alias="ownerPhoneNumber", description="Updated owner's phone number."
    )


class SubmitFeedbackInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    restaurant_id: str = Field(..., description="The unique ID of the restaurant.")
    username: str = Field(..., description="The username of the person providing feedback.")
    restaurant_name: str = Field(
        ..., alias="restaurantName", description="The name of the restaurant receiving feedback."
    )
    feedback_text: str = Field(
        ..., alias="feedbackText", description="The detailed feedback message."
    )
    rating: Optional[int] = Field(
        None, ge=1, le=5, description="Numeric rating from 1 (worst) to 5 (best)."
    )


class TakeOrderInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    restaurant_id: int = Field(
        ..., gt=0, description="The positive integer ID of the restaurant (e.g., 1, 42)."
    )
    username: str = Field(
        ..., description="The username of the customer placing the order."
    )
    restaurant_name: str = Field(
        ..., alias="restaurantName", description="The name of the restaurant."
    )
    items: str = Field(
        ...,
        description="Summary of items ordered (e.g., '2x Margherita Pizza, 1x Coke').",
    )
    price: Optional[float] = Field(
        None, ge=0, description="Total price of the order."
    )


@tool(args_schema=UpdateRestaurantInfoInput)
def update_restaurant_info(
    thread_id: Annotated[str, InjectedToolArg],
    restaurant_name: Optional[str] = None,
    address: Optional[str] = None,
    phone_number: Optional[str] = None,
    email: Optional[str] = None,
    owner_name: Optional[str] = None,
    owner_email: Optional[str] = None,
    owner_phone_number: Optional[str] = None,
) -> str:
    """Updates restaurant contact and owner information. Only pass fields that changed."""
    if not thread_id:
        return "Error: Conversation thread ID is missing."

    data = UpdateRestaurantInfoInput(
        thread_id=thread_id,
        restaurant_name=restaurant_name,
        address=address,
        phone_number=phone_number,
        email=email,
        owner_name=owner_name,
        owner_email=owner_email,
        owner_phone_number=owner_phone_number,
    ).model_dump(by_alias=True, exclude={"thread_id"}, exclude_none=True)

    if not data:
        return "No fields were provided to update."

    result = _post_to_backend(f"/hotel/update-restro/{thread_id}", data)
    if result["status"] == "success":
        return "Restaurant information updated successfully."
    return result["message"]


@tool(args_schema=SubmitFeedbackInput)
def submit_feedback(
    restaurant_id: str,
    username: str,
    restaurant_name: str,
    feedback_text: str,
    rating: Optional[int] = None,
) -> str:
    """Submits a user's feedback and optional rating (1-5) for a specific restaurant."""
    data = SubmitFeedbackInput(
        restaurant_id=restaurant_id,
        username=username,
        restaurant_name=restaurant_name,
        feedback_text=feedback_text,
        rating=rating,
    ).model_dump(by_alias=True, exclude={"restaurant_id"}, exclude_none=True)

    result = _post_to_backend(f"/hotel/feedback/{restaurant_id}", data)
    if result["status"] == "success":
        return "Feedback submitted successfully."
    return result["message"]


@tool(args_schema=TakeOrderInput)
def take_order(
    restaurant_id: int,
    username: str,
    restaurant_name: str,
    items: str,
    price: Optional[float] = None,
) -> str:
    """Places a new order for a specific restaurant."""
    data = TakeOrderInput(
        restaurant_id=restaurant_id,
        username=username,
        restaurant_name=restaurant_name,
        items=items,
        price=price,
    ).model_dump(by_alias=True, exclude={"restaurant_id"}, exclude_none=True)

    result = _post_to_backend(f"/hotel/order/{restaurant_id}", data)
    if result["status"] == "success":
        return "Order placed successfully."
    return result["message"]


tools = [update_restaurant_info, submit_feedback, take_order]