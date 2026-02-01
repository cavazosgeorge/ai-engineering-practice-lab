"""
Data source ingestion router.

Handles text, URL, and PDF ingestion into the RAG pipeline.
"""

import logging
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from config import settings
from models.schemas import IngestResponse, IngestTextRequest, IngestURLRequest
from services.rag_pipeline import ingest_pdf, ingest_text, ingest_url, remove_source

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sources", tags=["data-sources"])


@router.post("/ingest/text", response_model=IngestResponse)
async def ingest_text_source(request: IngestTextRequest) -> IngestResponse:
    """Ingest plain text content into the RAG pipeline."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    return ingest_text(
        source_id=request.source_id,
        week_slug=request.week_slug,
        title=request.title,
        content=request.content,
    )


@router.post("/ingest/url", response_model=IngestResponse)
async def ingest_url_source(request: IngestURLRequest) -> IngestResponse:
    """Ingest content from a URL into the RAG pipeline."""
    if not request.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    return ingest_url(
        source_id=request.source_id,
        week_slug=request.week_slug,
        title=request.title,
        url=request.url,
    )


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf_source(
    week_slug: str = Form(...),
    source_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
) -> IngestResponse:
    """Ingest a PDF file into the RAG pipeline."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Sanitize filename: strip path separators, null bytes
    safe_name = (
        file.filename.replace("/", "_")
        .replace("\\", "_")
        .replace("\x00", "")
        .replace("..", "_")
    )
    unique_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_name

    try:
        contents = await file.read()

        # Check file size
        max_bytes = 10 * 1024 * 1024  # 10MB
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=413, detail="File too large. Maximum size is 10MB."
            )

        with open(file_path, "wb") as f:
            f.write(contents)

        result = ingest_pdf(
            source_id=source_id,
            week_slug=week_slug,
            title=title,
            file_path=str(file_path),
        )

        return result

    finally:
        # Clean up uploaded file after processing
        if file_path.exists():
            os.remove(file_path)


@router.post("/reprocess/{source_id}", response_model=IngestResponse)
async def reprocess_source(
    source_id: str,
    week_slug: str,
    title: str,
    source_type: str,
    content: str | None = None,
    url: str | None = None,
) -> IngestResponse:
    """
    Reprocess a data source.

    Removes existing chunks and re-runs the pipeline.
    """
    # Remove old chunks first
    remove_source(week_slug, source_id)

    if source_type == "text":
        if not content:
            raise HTTPException(
                status_code=400, detail="Content required for text reprocessing"
            )
        return ingest_text(source_id, week_slug, title, content)
    elif source_type == "url":
        if not url:
            raise HTTPException(
                status_code=400, detail="URL required for URL reprocessing"
            )
        return ingest_url(source_id, week_slug, title, url)
    else:
        raise HTTPException(
            status_code=400,
            detail="PDF reprocessing requires re-upload",
        )


@router.delete("/{source_id}")
async def delete_source(source_id: str, week_slug: str) -> dict:
    """Remove all chunks for a data source from the vector store."""
    removed = remove_source(week_slug, source_id)
    return {"source_id": source_id, "chunks_removed": removed}
