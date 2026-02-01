from fastapi import APIRouter

from config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "rag-agent",
        "models": {
            "embedding": settings.EMBEDDING_MODEL,
            "chat": settings.CHAT_MODEL,
            "agent": settings.AGENT_MODEL,
        },
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_groq_key": bool(settings.GROQ_API_KEY),
        "has_minimax_key": bool(settings.MINIMAX_API_KEY),
    }
