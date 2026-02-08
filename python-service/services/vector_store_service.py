"""
Vector store service.

Manages per-week FAISS indexes for semantic search.
Uses LangChain's FAISS wrapper for document storage and similarity search.
"""

import logging
import os
import shutil
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from config import settings
from services.embedding_service import embed_texts_parallel, get_embeddings

logger = logging.getLogger(__name__)

# In-memory cache of loaded indexes
_index_cache: dict[str, FAISS] = {}


def _index_dir(week_slug: str) -> Path:
    """Get the directory for a week's FAISS index."""
    return Path(settings.FAISS_INDEX_DIR) / week_slug


def index_exists(week_slug: str) -> bool:
    """Check if a FAISS index exists on disk for a week."""
    index_path = _index_dir(week_slug) / "index.faiss"
    return index_path.exists()


def _load_index(week_slug: str) -> FAISS | None:
    """Load a FAISS index from disk into the cache."""
    if week_slug in _index_cache:
        return _index_cache[week_slug]

    dir_path = _index_dir(week_slug)
    if not (dir_path / "index.faiss").exists():
        return None

    embeddings = get_embeddings()
    store = FAISS.load_local(
        str(dir_path),
        embeddings,
        allow_dangerous_deserialization=True,
    )
    _index_cache[week_slug] = store
    logger.info("Loaded FAISS index for week '%s'", week_slug)
    return store


def _save_index(week_slug: str, store: FAISS) -> None:
    """Persist a FAISS index to disk."""
    dir_path = _index_dir(week_slug)
    dir_path.mkdir(parents=True, exist_ok=True)

    # Write to temp dir first, then move for atomic save
    tmp_dir = dir_path.parent / f".tmp_{week_slug}"
    try:
        tmp_dir.mkdir(parents=True, exist_ok=True)
        store.save_local(str(tmp_dir))
        # Move files from temp to target
        for f in tmp_dir.iterdir():
            shutil.move(str(f), str(dir_path / f.name))
    finally:
        if tmp_dir.exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)

    _index_cache[week_slug] = store
    logger.info("Saved FAISS index for week '%s'", week_slug)


def add_documents(week_slug: str, documents: list[Document]) -> int:
    """
    Add documents to a week's FAISS index.

    Creates the index if it doesn't exist. Persists to disk after adding.

    Args:
        week_slug: Week identifier for index isolation
        documents: LangChain Document objects with page_content and metadata

    Returns:
        Number of documents added
    """
    if not documents:
        return 0

    embeddings = get_embeddings()
    texts = [doc.page_content for doc in documents]
    metadatas = [doc.metadata for doc in documents]

    # Embed in parallel batches for large document sets
    vectors = embed_texts_parallel(texts)
    text_embeddings = list(zip(texts, vectors))

    existing = _load_index(week_slug)

    if existing is not None:
        existing.add_embeddings(text_embeddings, metadatas)
        _save_index(week_slug, existing)
    else:
        store = FAISS.from_embeddings(text_embeddings, embeddings, metadatas=metadatas)
        _save_index(week_slug, store)

    logger.info(
        "Added %d documents to week '%s' index", len(documents), week_slug
    )
    return len(documents)


def search(
    week_slug: str,
    query: str,
    top_k: int | None = None,
) -> list[tuple[Document, float]]:
    """
    Semantic search over a week's FAISS index.

    Args:
        week_slug: Week to search
        query: Search query text
        top_k: Number of results (defaults to RAG_TOP_K setting)

    Returns:
        List of (Document, score) tuples sorted by relevance
    """
    k = top_k or settings.RAG_TOP_K
    store = _load_index(week_slug)

    if store is None:
        logger.warning("No index found for week '%s'", week_slug)
        return []

    results = store.similarity_search_with_score(query, k=k)
    return results


def search_all_weeks(
    query: str,
    top_k: int | None = None,
) -> list[tuple[Document, float]]:
    """Search across all week indexes, returning merged top results."""
    k = top_k or settings.RAG_TOP_K
    all_results: list[tuple[Document, float]] = []

    faiss_dir = Path(settings.FAISS_INDEX_DIR)
    if not faiss_dir.exists():
        return []

    for week_dir in sorted(faiss_dir.iterdir()):
        if week_dir.is_dir() and (week_dir / "index.faiss").exists():
            week_slug = week_dir.name
            results = search(week_slug, query, top_k=k)
            all_results.extend(results)

    # Sort by score (lower = more similar for L2, but FAISS returns
    # similarity scores where higher is better for inner product)
    all_results.sort(key=lambda x: x[1])
    return all_results[:k]


def delete_source_chunks(week_slug: str, source_id: str) -> int:
    """
    Remove all chunks for a given source from the week's index.

    Note: FAISS doesn't support efficient deletion. We rebuild the index
    without the matching documents.

    Returns:
        Number of documents removed
    """
    store = _load_index(week_slug)
    if store is None:
        return 0

    # Get all documents from the store
    all_docs = store.docstore._dict
    ids_to_keep = []
    ids_to_remove = []

    for doc_id, doc in all_docs.items():
        if doc.metadata.get("source_id") == source_id:
            ids_to_remove.append(doc_id)
        else:
            ids_to_keep.append(doc_id)

    if not ids_to_remove:
        return 0

    if not ids_to_keep:
        # All documents belong to this source — delete the entire index
        delete_index(week_slug)
        return len(ids_to_remove)

    # Rebuild index from existing vectors (no re-embedding needed)
    remaining_docs = [all_docs[doc_id] for doc_id in ids_to_keep]
    remaining_texts = [doc.page_content for doc in remaining_docs]
    remaining_metadatas = [doc.metadata for doc in remaining_docs]

    # Extract existing vectors from the FAISS index
    id_to_index = {v: k for k, v in store.index_to_docstore_id.items()}
    vectors = [store.index.reconstruct(id_to_index[doc_id]).tolist() for doc_id in ids_to_keep]

    embeddings = get_embeddings()
    text_embeddings = list(zip(remaining_texts, vectors))
    new_store = FAISS.from_embeddings(
        text_embeddings, embeddings, metadatas=remaining_metadatas
    )
    _save_index(week_slug, new_store)

    logger.info(
        "Removed %d chunks for source '%s' from week '%s'",
        len(ids_to_remove),
        source_id,
        week_slug,
    )
    return len(ids_to_remove)


def delete_index(week_slug: str) -> bool:
    """Delete an entire week's FAISS index from disk and cache."""
    _index_cache.pop(week_slug, None)

    dir_path = _index_dir(week_slug)
    if dir_path.exists():
        shutil.rmtree(dir_path)
        logger.info("Deleted FAISS index for week '%s'", week_slug)
        return True
    return False


def get_index_stats(week_slug: str) -> dict:
    """Get statistics for a week's FAISS index."""
    dir_path = _index_dir(week_slug)
    faiss_file = dir_path / "index.faiss"

    if not faiss_file.exists():
        return {"week_slug": week_slug, "chunk_count": 0, "index_size_bytes": 0}

    store = _load_index(week_slug)
    chunk_count = len(store.docstore._dict) if store else 0
    index_size = faiss_file.stat().st_size if faiss_file.exists() else 0

    return {
        "week_slug": week_slug,
        "chunk_count": chunk_count,
        "index_size_bytes": index_size,
    }


def get_all_stats() -> dict:
    """Get statistics for all week indexes."""
    faiss_dir = Path(settings.FAISS_INDEX_DIR)
    indexes = []
    total_chunks = 0

    if faiss_dir.exists():
        for week_dir in sorted(faiss_dir.iterdir()):
            if week_dir.is_dir() and (week_dir / "index.faiss").exists():
                stats = get_index_stats(week_dir.name)
                indexes.append(stats)
                total_chunks += stats["chunk_count"]

    return {
        "total_chunks": total_chunks,
        "total_indexes": len(indexes),
        "indexes": indexes,
    }


def clear_cache() -> None:
    """Clear the in-memory index cache (for testing)."""
    _index_cache.clear()
