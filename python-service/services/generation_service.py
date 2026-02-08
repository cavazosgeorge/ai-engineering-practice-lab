"""
AI content generation service.

Uses LangChain chains with Groq (Llama 3.3 70B) to generate
vocabulary terms, quiz questions, and coding challenges from
RAG-retrieved course materials.
"""

import json
import logging

from langchain_groq import ChatGroq

from config import settings
from models.schemas import (
    GenerateChallengeRequest,
    GenerateChallengeResponse,
    GeneratedChallenge,
    GeneratedVocabularyTerm,
    GeneratedQuizQuestion,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GenerateVocabularyRequest,
    GenerateVocabularyResponse,
    QuizOption,
)
from prompts.vocabulary_prompt import vocabulary_prompt
from prompts.quiz_prompt import quiz_prompt
from prompts.challenge_prompt import challenge_prompt
from services.rag_pipeline import search_knowledge_base

logger = logging.getLogger(__name__)


def _get_llm(temperature: float = 0.7) -> ChatGroq:
    """Create a ChatGroq instance with the configured model."""
    return ChatGroq(
        model=settings.CHAT_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
    )


def _get_context(week_slug: str, top_k: int = 10) -> str:
    """Retrieve RAG context for a week by searching with a broad query."""
    results = search_knowledge_base(
        query="key concepts definitions terminology",
        week_slug=week_slug,
        top_k=top_k,
    )
    if not results:
        return "No course materials found for this week."

    chunks = []
    for r in results:
        chunks.append(r.content)
    return "\n\n---\n\n".join(chunks)


def _parse_json(text: str) -> dict:
    """Parse JSON from LLM output, stripping markdown fences if present."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag)
        first_newline = cleaned.index("\n")
        cleaned = cleaned[first_newline + 1 :]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


def generate_vocabulary(
    request: GenerateVocabularyRequest,
) -> GenerateVocabularyResponse:
    """
    Generate vocabulary terms from week course materials.

    Uses RAG retrieval to get relevant context, then generates
    structured vocabulary terms via Groq Llama 3.3 70B.
    """
    logger.info(
        "Generating %d vocabulary terms for week '%s'",
        request.count,
        request.week_slug,
    )

    context = _get_context(request.week_slug)
    llm = _get_llm(temperature=request.temperature)

    chain = vocabulary_prompt | llm
    result = chain.invoke({
        "count": request.count,
        "existing_terms": ", ".join(request.existing_terms) if request.existing_terms else "None",
        "context": context,
    })

    parsed = _parse_json(result.content)
    terms = [
        GeneratedVocabularyTerm(
            term=t["term"],
            definition=t["definition"],
            context=t.get("context"),
            difficulty=t.get("difficulty", "intermediate"),
        )
        for t in parsed.get("terms", [])
    ]

    usage = result.usage_metadata or {}

    logger.info("Generated %d vocabulary terms", len(terms))
    return GenerateVocabularyResponse(
        terms=terms,
        model=settings.CHAT_MODEL,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
    )


def generate_quiz(
    request: GenerateQuizRequest,
) -> GenerateQuizResponse:
    """
    Generate quiz questions from week course materials.

    Uses RAG retrieval to get relevant context, then generates
    structured multiple-choice questions via Groq Llama 3.3 70B.
    """
    logger.info(
        "Generating %d quiz questions for week '%s'",
        request.count,
        request.week_slug,
    )

    context = _get_context(request.week_slug)
    llm = _get_llm(temperature=request.temperature)

    chain = quiz_prompt | llm
    result = chain.invoke({
        "count": request.count,
        "existing_questions": ", ".join(request.existing_questions) if request.existing_questions else "None",
        "context": context,
    })

    parsed = _parse_json(result.content)
    questions = [
        GeneratedQuizQuestion(
            question=q["question"],
            options=[
                QuizOption(text=o["text"], is_correct=o["is_correct"])
                for o in q.get("options", [])
            ],
            explanation=q.get("explanation", ""),
            difficulty=q.get("difficulty", "intermediate"),
        )
        for q in parsed.get("questions", [])
    ]

    usage = result.usage_metadata or {}

    logger.info("Generated %d quiz questions", len(questions))
    return GenerateQuizResponse(
        questions=questions,
        model=settings.CHAT_MODEL,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
    )


def generate_challenges(
    request: GenerateChallengeRequest,
) -> GenerateChallengeResponse:
    """
    Generate coding challenges from week course materials.

    Uses RAG retrieval to get relevant context, then generates
    structured coding challenges via Groq Llama 3.3 70B.
    """
    logger.info(
        "Generating %d challenges for week '%s'",
        request.count,
        request.week_slug,
    )

    context = _get_context(request.week_slug)
    llm = _get_llm(temperature=request.temperature)

    chain = challenge_prompt | llm
    result = chain.invoke({
        "count": request.count,
        "existing_titles": ", ".join(request.existing_titles) if request.existing_titles else "None",
        "context": context,
    })

    parsed = _parse_json(result.content)
    challenges = [
        GeneratedChallenge(
            title=ch["title"],
            description=ch["description"],
            starter_code=ch.get("starter_code", ""),
            test_code=ch.get("test_code", ""),
            difficulty=ch.get("difficulty", "intermediate"),
        )
        for ch in parsed.get("challenges", [])
    ]

    usage = result.usage_metadata or {}

    logger.info("Generated %d challenges", len(challenges))
    return GenerateChallengeResponse(
        challenges=challenges,
        model=settings.CHAT_MODEL,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
    )
