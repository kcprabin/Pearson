import os
import tempfile
from pathlib import Path
from langchain_core.documents import Document
from langchain_docling import DoclingLoader
from langchain_docling.loader import ExportType
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from pydantic import BaseModel, Field


class UploadedFileInput(BaseModel):
    file: bytes = Field(..., min_length=1, description="Raw file bytes.")
    name: str = Field(..., min_length=1, description="Original filename with extension.")
    size: int = Field(..., gt=0, description="File size in bytes.")
    restaurant_id: int = Field(..., gt=0, description="Restaurant ID for RAG filtering.")


def load_documents(uploaded: UploadedFileInput) -> list[Document]:
    ext = Path(uploaded.name).suffix.lower()
    if ext not in {".pdf", ".jpg", ".jpeg", ".png"}:
        raise ValueError(
            f"Unsupported file format '{ext}'. Only PDF, JPG, JPEG, and PNG are supported."
        )

    tmp_path = None
    try:
        # Write raw bytes to a temporary file on disk for DoclingLoader
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            tmp_file.write(uploaded.file)
            tmp_path = tmp_file.name

        # Docling handles both PDFs (digital & scanned) and images (JPG/PNG)
        # and outputs structured Markdown tables/sections
        loader = DoclingLoader(
            file_path=tmp_path,
            export_type=ExportType.MARKDOWN,
        )
        documents = loader.load()

        for doc in documents:
            doc.metadata["source"] = uploaded.name
            doc.metadata["restaurant_id"] = uploaded.restaurant_id

        return documents

    finally:
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def split_documents(documents: list[Document]) -> list[Document]:
    if not documents:
        raise ValueError("No documents provided for splitting.")

    # 1. First split by Markdown headers (# Section, ## Category) so menu items stay with prices
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "section"),
            ("##", "category"),
            ("###", "subcategory"),
        ],
        strip_headers=False,
    )

    header_chunks: list[Document] = []
    for doc in documents:
        splits = markdown_splitter.split_text(doc.page_content)
        for split in splits:
            # Preserve original metadata (source, restaurant_id)
            split.metadata.update(doc.metadata)
            header_chunks.append(split)

    # 2. Sub-split any oversized sections while keeping table rows intact where possible
    recursive_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len,
    )
    chunks = recursive_splitter.split_documents(header_chunks)

    if not chunks:
        raise ValueError("No text could be extracted from the uploaded file.")
    return chunks


def load_and_chunk_pipeline(uploaded: UploadedFileInput) -> list[Document]:
    documents = load_documents(uploaded)
    return split_documents(documents)