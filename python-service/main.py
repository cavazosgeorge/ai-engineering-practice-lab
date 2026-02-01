from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, data_sources, search, generation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure FAISS index directory exists
    Path(settings.FAISS_INDEX_DIR).mkdir(parents=True, exist_ok=True)
    print(f"FAISS index directory: {settings.FAISS_INDEX_DIR}")
    print(f"Embedding model: {settings.EMBEDDING_MODEL}")
    print(f"Chat model: {settings.CHAT_MODEL}")
    print(f"Agent model: {settings.AGENT_MODEL}")
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="AI Practice Lab - RAG & Agent Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(data_sources.router)
app.include_router(search.router)
app.include_router(generation.router)
