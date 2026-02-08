"""
Text chunking service.

Splits documents into chunks using LangChain's RecursiveCharacterTextSplitter.
"""

import logging

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings

logger = logging.getLogger(__name__)


def create_splitter(
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> RecursiveCharacterTextSplitter:
    """Create a text splitter with the given or default settings."""
    size = chunk_size or settings.CHUNK_SIZE
    overlap = chunk_overlap or settings.CHUNK_OVERLAP

    if overlap >= size:
        raise ValueError(
            f"chunk_overlap ({overlap}) must be less than chunk_size ({size})"
        )

    return RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        length_function=len,
        add_start_index=True,
    )


def chunk_documents(
    documents: list[Document],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
    source_id: str = "",
) -> list[Document]:
    """
    Split documents into chunks.

    Each chunk inherits the parent document's metadata and gets additional
    metadata: chunk_index, source_id.

    Args:
        documents: LangChain Document objects to split
        chunk_size: Override default chunk size
        chunk_overlap: Override default chunk overlap
        source_id: ID to attach to each chunk for tracking

    Returns:
        List of chunked Document objects with metadata
    """
    if not documents:
        return []

    splitter = create_splitter(chunk_size, chunk_overlap)
    chunks = splitter.split_documents(documents)

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        if source_id:
            chunk.metadata["source_id"] = source_id

    logger.info(
        "Chunked %d documents into %d chunks (size=%d, overlap=%d)",
        len(documents),
        len(chunks),
        chunk_size or settings.CHUNK_SIZE,
        chunk_overlap or settings.CHUNK_OVERLAP,
    )

    return chunks


def estimate_token_count(text: str) -> int:
    """Rough token count estimate (~4 chars per token for English)."""
    return max(1, len(text) // 4)
