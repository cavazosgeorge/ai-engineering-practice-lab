from enum import Enum

from pydantic import BaseModel, Field


# --- Enums ---


class SourceType(str, Enum):
    pdf = "pdf"
    url = "url"
    text = "text"


class ProcessingStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    processed = "processed"
    error = "error"


class GenerationType(str, Enum):
    vocabulary = "vocabulary"
    quiz = "quiz"
    challenge = "challenge"


# --- Data Sources ---


class IngestTextRequest(BaseModel):
    week_slug: str
    source_id: str
    title: str
    content: str


class IngestURLRequest(BaseModel):
    week_slug: str
    source_id: str
    title: str
    url: str


class ChunkResponse(BaseModel):
    chunk_index: int
    content: str
    token_count: int
    metadata: dict = Field(default_factory=dict)


class IngestResponse(BaseModel):
    source_id: str
    status: ProcessingStatus
    chunk_count: int
    chunks: list[ChunkResponse] = Field(default_factory=list)
    error: str | None = None


# --- Search ---


class SearchRequest(BaseModel):
    query: str
    week_slug: str | None = None
    top_k: int = 5


class SearchResult(BaseModel):
    chunk_id: str
    source_id: str
    content: str
    score: float
    metadata: dict = Field(default_factory=dict)


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str
    week_slug: str | None = None


# --- Stats ---


class WeekIndexStats(BaseModel):
    week_slug: str
    chunk_count: int
    index_size_bytes: int


class StatsResponse(BaseModel):
    total_chunks: int
    total_indexes: int
    indexes: list[WeekIndexStats]


# --- Generation ---


class GenerateVocabularyRequest(BaseModel):
    week_slug: str
    count: int = 10
    existing_terms: list[str] = Field(default_factory=list)
    temperature: float = 0.7


class GeneratedVocabularyTerm(BaseModel):
    term: str
    definition: str
    context: str | None = None
    difficulty: str = "intermediate"


class GenerateVocabularyResponse(BaseModel):
    terms: list[GeneratedVocabularyTerm]
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


# --- Agent ---


class AgentChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    week_slug: str | None = None
    session_id: str
    history: list[dict] = Field(default_factory=list)


class ToolCallInfo(BaseModel):
    tool_name: str
    arguments: dict = Field(default_factory=dict)
    result: str | None = None


class AgentChatResponse(BaseModel):
    content: str
    tool_calls: list[ToolCallInfo] = Field(default_factory=list)
    sources: list[SearchResult] = Field(default_factory=list)
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None
