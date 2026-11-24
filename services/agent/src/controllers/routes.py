from typing import Optional
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..rag import UploadedFileInput, load_and_chunk_pipeline, vector_store
from ..utils import llminvoke

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAGIC_SIGNATURES = (b"%PDF", b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n")




class AdminChatBotRequest(BaseModel):
    thread_id: str = Field(..., min_length=1)
    restaurant_id: int = Field(..., gt=0)
    message: Optional[str] = None
    restaurant_name: Optional[str] = Field(None, alias="restaurantName")
    owner_name: Optional[str] = Field(None, alias="ownerName")

    model_config = {"populate_by_name": True}


class ConsumerChatBotRequest(BaseModel):
    restaurant_id: int = Field(..., gt=0)
    owner_phone_number: Optional[str] = Field(None, alias="ownerPhoneNumber")
    thread_id: Optional[str] = None
    message: Optional[str] = None

    model_config = {"populate_by_name": True}


# --- Routes ---

@router.post("/admin-chat-bot")
async def admin_chat_bot(payload: AdminChatBotRequest):
    """Handles admin welcome and ongoing admin chat turns."""
    restaurant_name = payload.restaurant_name or "your restaurant"
    owner_name = payload.owner_name or "Admin"

    prompt = payload.message or (
        f"You are an AI assistant helping the administrator for {restaurant_name}. "
        f"The owner of the restaurant is {owner_name}.\n\n"
        f"Your task:\n"
        f"1. Warmly welcome {owner_name}.\n"
        f"2. Ask them to upload the restaurant's current menu (PDF or photo) so it can be saved for customer queries.\n"
        f"3. Ask if they would like to update any restaurant details or need help with anything else.\n"
        f"4. Mention briefly that this is an open-source project managed by Team Pearson (contact: kcprabin2063@gmail.com)."
    )

    try:
        response = llminvoke(
            thread_id=payload.thread_id,
            message=prompt,
            restaurant_id=payload.restaurant_id,
        )
        return {"message": response, "thread_id": payload.thread_id}
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"LLM unavailable for admin chat: {error}",
        )


@router.post("/start-chat-bot")
async def consumer_chat_bot(payload: ConsumerChatBotRequest):
    """Starts a new customer chat session or continues an existing thread."""
    if not payload.thread_id and not payload.owner_phone_number:
        raise HTTPException(
            status_code=400,
            detail="Either thread_id (for existing chat) or ownerPhoneNumber (for new chat) is required.",
        )

    thread_id = payload.thread_id or uuid4().hex

    prompt = payload.message or (
        "Your task:\n"
        "1. Warmly welcome the customer.\n"
        "2. Let them know they can ask for the full menu, dish prices, recommendations, or place an order.\n"
        "3. use the restaurant's menu to answer their questions accurately.\n"
        "4. If they ask for the menu, provide it in a clear and concise manner.\n"
        "5. Ask them to provide their phone number so the restaurant can contact them if needed.\n"
        "6. Mention briefly that this is an open-source project managed by Team Pearson (contact: kcprabin2063@gmail.com)."
        "7. use tools given to you for ordering and other restaurant related queries."
  
    )


    try:
        response = llminvoke(
            thread_id=thread_id,
            message=prompt,
            restaurant_id=payload.restaurant_id,
        )
        return {"message": response, "thread_id": thread_id}
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"LLM unavailable for customer chat: {error}",
        )


@router.post("/uploadmenu")
async def upload_menu(
    restaurant_id: int = Form(..., gt=0, description="Positive integer ID of the restaurant"),
    restaurant_name: str = Form(..., alias="restaurantName", description="Name of the restaurant"),
    owner_name: str = Form(..., alias="ownerName", description="Name of the restaurant owner"),
    file: UploadFile = File(..., description="Menu file (PDF, JPG, JPEG, or PNG)"),
):
    """Uploads a restaurant menu (PDF or image), chunks it via Docling, and stores vectors in PGVector."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. Only PDF, JPG, and PNG files are supported.",
        )

    signature_by_extension = {
        ".pdf": b"%PDF",
        ".jpg": b"\xff\xd8\xff",
        ".jpeg": b"\xff\xd8\xff",
        ".png": b"\x89PNG\r\n\x1a\n",
    }
    if not raw_bytes.startswith(signature_by_extension[extension]):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. Only valid PDF, JPG, and PNG files are supported.",
        )

    try:
        uploaded_doc = UploadedFileInput(
            file=raw_bytes,
            name=file.filename,
            size=len(raw_bytes),
            restaurant_id=restaurant_id,
        )

        # 1. Load & chunk via Docling/OCR
        try:
            chunks = load_and_chunk_pipeline(uploaded_doc)
        except Exception as conversion_error:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Menu could not be read. Ensure the PDF or image is clear and "
                    f"contains readable menu text. Parser error: {conversion_error}"
                ),
            ) from conversion_error

        # 2. Enrich chunks with restaurant/owner metadata
        for chunk in chunks:
            chunk.metadata["restaurant_name"] = restaurant_name
            chunk.metadata["owner_name"] = owner_name

        # 3. Embed & persist vectors into PGVector
        vector_store.add_documents(chunks)

        return {
            "message": "Menu uploaded and indexed successfully.",
            "restaurant_id": restaurant_id,
            "chunks_indexed": len(chunks),
        }
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process menu: {str(e)}")


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}