import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (one level up)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class Settings:
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    MINIMAX_API_KEY: str = os.getenv("MINIMAX_API_KEY", "")

    # Model configuration
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    CHAT_MODEL: str = os.getenv("CHAT_MODEL", "llama-3.3-70b-versatile")
    AGENT_MODEL: str = os.getenv("AGENT_MODEL", "MiniMax-M2")

    # Chunking
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))

    # RAG
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))

    # Paths
    FAISS_INDEX_DIR: str = os.getenv(
        "FAISS_INDEX_DIR",
        str(Path(__file__).resolve().parent / "data" / "faiss"),
    )
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data/uploads")

    # Service
    BUN_API_URL: str = os.getenv("BUN_API_URL", "http://localhost:3000")
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")


settings = Settings()
