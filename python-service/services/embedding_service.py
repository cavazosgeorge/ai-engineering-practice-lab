"""
Embedding service.

Generates embeddings using OpenAI text-embedding-3-small via LangChain.
"""

import concurrent.futures
import logging
import random
import time

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


def _embed_with_retry(texts: list[str], max_retries: int = 5) -> list[list[float]]:
    """Embed texts with retry and exponential backoff for rate limits."""
    for attempt in range(max_retries + 1):
        try:
            return embed_texts(texts)
        except Exception as e:
            if ("429" in str(e) or "rate_limit" in str(e)) and attempt < max_retries:
                wait = (2**attempt) + random.uniform(0, 1)
                logger.warning(
                    "Rate limited, retrying in %.1fs (attempt %d/%d)",
                    wait,
                    attempt + 1,
                    max_retries,
                )
                time.sleep(wait)
            else:
                raise


def embed_texts_parallel(
    texts: list[str],
    batch_size: int = 100,
    max_workers: int = 2,
) -> list[list[float]]:
    """
    Embed texts in parallel batches for faster processing of large documents.

    Splits the input into batches and sends concurrent API calls.
    Includes retry with backoff for rate limits.
    Falls back to a single call for small inputs.
    """
    if not texts:
        return []

    if len(texts) <= batch_size:
        return _embed_with_retry(texts)

    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]
    results: list[list[list[float]] | None] = [None] * len(batches)

    logger.info(
        "Embedding %d texts in %d parallel batches (batch_size=%d)",
        len(texts),
        len(batches),
        batch_size,
    )

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {
            executor.submit(_embed_with_retry, batch): i
            for i, batch in enumerate(batches)
        }
        for future in concurrent.futures.as_completed(future_to_idx):
            idx = future_to_idx[future]
            results[idx] = future.result()

    return [emb for batch_result in results for emb in batch_result]


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
