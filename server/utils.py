import os
import tempfile
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_cohere import CohereEmbeddings
from langchain_pinecone import PineconeVectorStore

from config import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    EMBEDDING_MODEL,
    PINECONE_INDEX_NAME
)


def process_and_store_document(
    file_content: bytes, 
    filename: str, 
    chat_id: str
) -> int:
    """
    Process a PDF document and store it in Pinecone.
    
    Args:
        file_content: Raw bytes of the PDF file
        filename: Original filename
        chat_id: Chat ID to use as Pinecone namespace
        
    Returns:
        Number of chunks created
    """
    # 1. Save bytes to a temp file (auto-deleted on close)
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(file_content)
        file_path = tmp.name
        
    try:
        # 2. Load PDF
        loader = PyPDFLoader(file_path)
        raw_docs = loader.load()
        
        # 3. Add source metadata
        for doc in raw_docs:
            doc.metadata["source"] = filename
        
        # 4. Split Text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        documents = text_splitter.split_documents(raw_docs)
        
        # 5. Embed and Store with namespace = chat_id
        embeddings = CohereEmbeddings(model=EMBEDDING_MODEL)
        
        PineconeVectorStore.from_documents(
            documents, 
            embeddings, 
            index_name=PINECONE_INDEX_NAME,
            namespace=chat_id  # Separate data per chat
        )
        
        return len(documents)
        
    finally:
        # Cleanup: Remove the temp file
        if os.path.exists(file_path):
            os.remove(file_path)


def process_text_content(
    text: str,
    source_name: str,
    chat_id: str
) -> int:
    """
    Process raw text content and store in Pinecone.
    Useful for pasting text directly without file upload.
    
    Args:
        text: Raw text content
        source_name: Name to identify the source
        chat_id: Chat ID to use as Pinecone namespace
        
    Returns:
        Number of chunks created
    """
    from langchain.schema import Document
    
    # Create a document from the text
    doc = Document(
        page_content=text,
        metadata={"source": source_name, "page": 0}
    )
    
    # Split the text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    documents = text_splitter.split_documents([doc])
    
    # Embed and store
    embeddings = CohereEmbeddings(model=EMBEDDING_MODEL)
    
    PineconeVectorStore.from_documents(
        documents,
        embeddings,
        index_name=PINECONE_INDEX_NAME,
        namespace=chat_id
    )
    
    return len(documents)


def get_file_size_mb(file_content: bytes) -> float:
    """Get file size in MB"""
    return len(file_content) / (1024 * 1024)


def validate_pdf(file_content: bytes) -> bool:
    """Basic PDF validation by checking magic bytes"""
    return file_content[:4] == b'%PDF'


def extract_text_preview(file_content: bytes, max_chars: int = 500) -> str:
    """
    Extract a text preview from a PDF file.
    Useful for showing users what was uploaded.
    """
    import tempfile
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        
        if not docs:
            return "No text content found in PDF."
        
        full_text = " ".join(doc.page_content for doc in docs)
        preview = full_text[:max_chars]
        
        if len(full_text) > max_chars:
            preview += "..."
            
        return preview
        
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def count_pages(file_content: bytes) -> int:
    """Count number of pages in a PDF"""
    import tempfile
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        return len(docs)
        
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
