"""
RAG pipeline orchestrator.

Coordinates the full ingestion pipeline:
  extract text → chunk → embed → store in FAISS

Also provides search functionality combining vector retrieval
with metadata enrichment.
"""

import logging
from dataclasses import dataclass

from langchain_core.documents import Document

from models.schemas import (
    ChunkResponse,
    IngestResponse,
    ProcessingStatus,
    SearchResult,
)
from services.chunking_service import chunk_documents, estimate_token_count
from services.document_processor import extract_documents
from services.vector_store_service import (
    add_documents,
    delete_source_chunks,
    search as vector_search,
    search_all_weeks,
)

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    """Result of a full ingestion pipeline run."""

    source_id: str
    status: ProcessingStatus
    chunk_count: int
    chunks: list[ChunkResponse]
    error: str | None = None


def ingest_text(
    source_id: str,
    week_slug: str,
    title: str,
    content: str,
) -> IngestResponse:
    """
    Ingest plain text content into the RAG pipeline.

    Extract → Chunk → Embed → Store in FAISS.
    """
    return _run_pipeline(
        source_id=source_id,
        week_slug=week_slug,
        title=title,
        source_type="text",
        content=content,
    )


def ingest_url(
    source_id: str,
    week_slug: str,
    title: str,
    url: str,
) -> IngestResponse:
    """
    Ingest content from a URL into the RAG pipeline.

    Fetch → Extract → Chunk → Embed → Store in FAISS.
    """
    return _run_pipeline(
        source_id=source_id,
        week_slug=week_slug,
        title=title,
        source_type="url",
        url=url,
    )


def ingest_pdf(
    source_id: str,
    week_slug: str,
    title: str,
    file_path: str,
) -> IngestResponse:
    """
    Ingest a PDF file into the RAG pipeline.

    Parse → Extract → Chunk → Embed → Store in FAISS.
    """
    return _run_pipeline(
        source_id=source_id,
        week_slug=week_slug,
        title=title,
        source_type="pdf",
        file_path=file_path,
    )


def remove_source(week_slug: str, source_id: str) -> int:
    """
    Remove all chunks for a data source from the vector store.

    Returns:
        Number of chunks removed
    """
    return delete_source_chunks(week_slug, source_id)


def search_knowledge_base(
    query: str,
    week_slug: str | None = None,
    top_k: int = 5,
) -> list[SearchResult]:
    """
    Search the knowledge base for relevant chunks.

    Args:
        query: Search query text
        week_slug: Optional week to scope search (None = all weeks)
        top_k: Number of results to return

    Returns:
        List of SearchResult with content, score, and metadata
    """
    if week_slug:
        results = vector_search(week_slug, query, top_k=top_k)
    else:
        results = search_all_weeks(query, top_k=top_k)

    return [
        SearchResult(
            chunk_id=doc.metadata.get("chunk_id", ""),
            source_id=doc.metadata.get("source_id", ""),
            content=doc.page_content,
            score=float(score),
            metadata={
                k: v
                for k, v in doc.metadata.items()
                if k not in ("chunk_id", "source_id")
            },
        )
        for doc, score in results
    ]


def _run_pipeline(
    source_id: str,
    week_slug: str,
    title: str,
    source_type: str,
    content: str | None = None,
    url: str | None = None,
    file_path: str | None = None,
) -> IngestResponse:
    """
    Internal: Run the full ingestion pipeline.

    Steps:
    1. Extract text from source
    2. Split into chunks
    3. Add metadata (source_id, chunk_id, week_slug)
    4. Embed and store in FAISS
    5. Return chunk info for SQLite storage
    """
    try:
        # 1. Extract
        logger.info(
            "Starting pipeline for source '%s' (type=%s, week=%s)",
            source_id,
            source_type,
            week_slug,
        )
        documents = extract_documents(
            source_type=source_type,
            content=content,
            url=url,
            file_path=file_path,
            title=title,
        )

        if not documents:
            return IngestResponse(
                source_id=source_id,
                status=ProcessingStatus.processed,
                chunk_count=0,
                chunks=[],
            )

        # 2. Chunk
        chunks = chunk_documents(documents, source_id=source_id)

        # 3. Enrich metadata
        chunk_responses = []
        for i, chunk in enumerate(chunks):
            chunk_id = f"{source_id}_chunk_{i}"
            chunk.metadata["chunk_id"] = chunk_id
            chunk.metadata["week_slug"] = week_slug

            chunk_responses.append(
                ChunkResponse(
                    chunk_index=i,
                    content=chunk.page_content,
                    token_count=estimate_token_count(chunk.page_content),
                    metadata=chunk.metadata,
                )
            )

        # 4. Embed and store in FAISS
        added = add_documents(week_slug, chunks)

        logger.info(
            "Pipeline complete for source '%s': %d chunks added to week '%s'",
            source_id,
            added,
            week_slug,
        )

        return IngestResponse(
            source_id=source_id,
            status=ProcessingStatus.processed,
            chunk_count=len(chunk_responses),
            chunks=chunk_responses,
        )

    except Exception as e:
        logger.error("Pipeline failed for source '%s': %s", source_id, str(e))
        return IngestResponse(
            source_id=source_id,
            status=ProcessingStatus.error,
            chunk_count=0,
            chunks=[],
            error=str(e),
        )
