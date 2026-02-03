"""
Document processor service.

Extracts text from various source types (PDF, URL, plain text)
using LangChain document loaders.
"""

import logging
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def extract_from_text(content: str, title: str = "") -> list[Document]:
    """Extract documents from plain text content."""
    if not content.strip():
        return []
    return [
        Document(
            page_content=content,
            metadata={"source": title or "text_input", "source_type": "text"},
        )
    ]


def extract_from_url(url: str, title: str = "") -> list[Document]:
    """Extract documents from a URL using WebBaseLoader."""
    loader = WebBaseLoader(url, requests_kwargs={"timeout": 30})
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_type"] = "url"
        doc.metadata["title"] = title or url
    return docs


def extract_from_pdf(file_path: str, title: str = "") -> list[Document]:
    """Extract documents from a PDF file using PyPDFLoader."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    loader = PyPDFLoader(str(path))
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_type"] = "pdf"
        doc.metadata["title"] = title or path.name
    return docs


def extract_documents(
    source_type: str,
    content: str | None = None,
    url: str | None = None,
    file_path: str | None = None,
    title: str = "",
) -> list[Document]:
    """
    Extract documents from a source based on type.

    Args:
        source_type: One of "text", "url", "pdf"
        content: Plain text content (for source_type="text")
        url: URL to fetch (for source_type="url")
        file_path: Path to PDF (for source_type="pdf")
        title: Optional title for the source

    Returns:
        List of LangChain Document objects
    """
    if source_type == "text":
        if not content:
            raise ValueError("content is required for text source type")
        return extract_from_text(content, title)
    elif source_type == "url":
        if not url:
            raise ValueError("url is required for url source type")
        return extract_from_url(url, title)
    elif source_type == "pdf":
        if not file_path:
            raise ValueError("file_path is required for pdf source type")
        return extract_from_pdf(file_path, title)
    else:
        raise ValueError(f"Unknown source type: {source_type}")
