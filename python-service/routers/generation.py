"""
AI content generation router.

Provides endpoints for generating vocabulary terms, quiz questions,
and coding challenges from RAG-retrieved course materials.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import (
    GenerateChallengeRequest,
    GenerateChallengeResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GenerateVocabularyRequest,
    GenerateVocabularyResponse,
)
from services.generation_service import (
    generate_challenges,
    generate_quiz,
    generate_vocabulary,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["generation"])


@router.post("/generate/vocabulary", response_model=GenerateVocabularyResponse)
async def generate_vocabulary_terms(
    request: GenerateVocabularyRequest,
) -> GenerateVocabularyResponse:
    """Generate vocabulary terms from week course materials."""
    try:
        return generate_vocabulary(request)
    except Exception as e:
        logger.error("Vocabulary generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/quiz", response_model=GenerateQuizResponse)
async def generate_quiz_questions(
    request: GenerateQuizRequest,
) -> GenerateQuizResponse:
    """Generate quiz questions from week course materials."""
    try:
        return generate_quiz(request)
    except Exception as e:
        logger.error("Quiz generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/challenges", response_model=GenerateChallengeResponse)
async def generate_coding_challenges(
    request: GenerateChallengeRequest,
) -> GenerateChallengeResponse:
    """Generate coding challenges from week course materials."""
    try:
        return generate_challenges(request)
    except Exception as e:
        logger.error("Challenge generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
