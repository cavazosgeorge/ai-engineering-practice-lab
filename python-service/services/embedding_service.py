"""
Embedding service.

Generates embeddings using OpenAI text-embedding-3-small via LangChain.
"""

import logging

from langchain_openai import OpenAIEmbeddings

from config import settings

logger = logging.getLogger(__name__)

_embeddings_instance: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    """Get or create the singleton OpenAI embeddings instance."""
    global _embeddings_instance
    if _embeddings_instance is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError(
                "OPENAI_API_KEY is required for embeddings. "
                "Set it in .env or environment variables."
            )
        _embeddings_instance = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )
        logger.info("Initialized OpenAI embeddings: %s", settings.EMBEDDING_MODEL)
    return _embeddings_instance


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a batch of texts.

    Args:
        texts: List of text strings to embed

    Returns:
        List of embedding vectors (each is a list of floats)
    """
    if not texts:
        return []

    embeddings = get_embeddings()
    vectors = embeddings.embed_documents(texts)

    logger.info("Generated %d embeddings (dim=%d)", len(vectors), len(vectors[0]))
    return vectors


def embed_query(query: str) -> list[float]:
    """
    Generate an embedding for a single search query.

    Uses the query-specific embedding method which may differ
    from document embeddings in some models.
    """
    embeddings = get_embeddings()
    return embeddings.embed_query(query)


def reset_instance() -> None:
    """Reset the singleton for testing."""
    global _embeddings_instance
    _embeddings_instance = None
