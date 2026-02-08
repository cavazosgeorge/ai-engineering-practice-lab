"""
Agent chat router.

Provides streaming SSE endpoint for the AI study assistant.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import AgentChatRequest, AgentChatResponse
from services.agent_service import chat, chat_stream

logger = logging.getLogger(__name__)

router = APIRouter(tags=["agent"])


@router.post("/agent/chat")
async def agent_chat(request: AgentChatRequest):
    """
    Chat with the AI study assistant.

    Returns SSE stream if Accept header includes text/event-stream,
    otherwise returns a complete JSON response.
    """
    try:
        return StreamingResponse(
            chat_stream(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        logger.error("Agent chat failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent/chat/sync", response_model=AgentChatResponse)
async def agent_chat_sync(request: AgentChatRequest) -> AgentChatResponse:
    """
    Non-streaming chat with the AI study assistant.
    Returns a complete JSON response after all tool calls complete.
    """
    try:
        return await chat(request)
    except Exception as e:
        logger.error("Agent chat (sync) failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
