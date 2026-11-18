from langchain_community.document_loaders import UnstructuredImageLoader
from langchain_community.document_loaders import PyPDFLoader
from pydantic import BaseModel
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentLoader(BaseModel):
    file: bytes
    name: str
    size: int


def load_documents(file: DocumentLoader):
    if not file or not file.name:
        raise ValueError("No file provided or file name is missing. Please provide a valid file.")
    if not file.file:
        raise ValueError("No file content provided. Please provide a valid file.")
    if not file.size:
        raise ValueError("No file size provided. Please provide a valid file size.")
    file_path = file.name
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith((".jpg", ".jpeg", ".png")):
        loader = UnstructuredImageLoader(file_path)
    else:
        raise ValueError("Unsupported file format. Only PDF and image files are supported.")

    return loader.load()

def text_splitter(documents):
    if not documents:
        raise ValueError("No documents provided for splitting. Please check the input documents.")
    
    format = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = format.split_documents(documents)
    if len(chunks) == 0:
        raise ValueError("No chunks were created from the documents. Please check the input documents.")
    return chunks

def load_and_chunking_pipeline(file: DocumentLoader):
    documents = load_documents(file)
    chunks = text_splitter(documents)
    return chunks