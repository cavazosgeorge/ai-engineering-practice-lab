"""
Semantic search router.

Provides search over the RAG knowledge base and index statistics.
"""

import logging

from fastapi import APIRouter

from models.schemas import SearchRequest, SearchResponse, StatsResponse, WeekIndexStats
from services.rag_pipeline import search_knowledge_base
from services.vector_store_service import get_all_stats

logger = logging.getLogger(__name__)

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest) -> SearchResponse:
    """
    Search the knowledge base for relevant content.

    Optionally scope to a specific week. Returns ranked results
    with similarity scores.
    """
    results = search_knowledge_base(
        query=request.query,
        week_slug=request.week_slug,
        top_k=request.top_k,
    )

    return SearchResponse(
        results=results,
        query=request.query,
        week_slug=request.week_slug,
    )


@router.get("/stats", response_model=StatsResponse)
async def index_stats() -> StatsResponse:
    """Get statistics for all FAISS indexes."""
    stats = get_all_stats()
    return StatsResponse(
        total_chunks=stats["total_chunks"],
        total_indexes=stats["total_indexes"],
        indexes=[WeekIndexStats(**idx) for idx in stats["indexes"]],
    )
