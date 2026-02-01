"""
Agent tools for the AI study assistant.

LangChain @tool decorated functions that the agent can call
during conversation. Tools provide access to the knowledge base,
vocabulary system, and lesson content.
"""

import logging

import httpx
from langchain_core.tools import tool

from config import settings
from services.rag_pipeline import search_knowledge_base
from services.generation_service import generate_quiz, _get_context
from models.schemas import GenerateQuizRequest

logger = logging.getLogger(__name__)

TOOL_TIMEOUT = 10  # seconds


@tool
def search_course_materials(query: str, week_slug: str | None = None) -> str:
    """Search the course knowledge base for relevant information about AI engineering topics.
    Use this when a student asks a factual question about course content, papers, or concepts.

    Args:
        query: The search query describing what to find
        week_slug: Optional week to scope the search (e.g. 'week-1')
    """
    try:
        results = search_knowledge_base(
            query=query,
            week_slug=week_slug,
            top_k=5,
        )
        if not results:
            return "No relevant materials found in the knowledge base."

        formatted = []
        for r in results:
            source = r.metadata.get("title", "Unknown source")
            formatted.append(f"[Source: {source}]\n{r.content}")
        return "\n\n---\n\n".join(formatted)
    except Exception as e:
        logger.error("search_course_materials failed: %s", str(e))
        return f"Search failed: {str(e)}"


@tool
def get_vocabulary_terms(lesson_slug: str) -> str:
    """Get vocabulary terms for a specific lesson. Use this when a student asks about
    key terms, definitions, or wants to review vocabulary for a lesson.

    Args:
        lesson_slug: The lesson slug (e.g. 'tokenization', 'language-models')
    """
    try:
        response = httpx.get(
            f"{settings.BUN_API_URL}/api/vocabulary/{lesson_slug}/terms",
            timeout=TOOL_TIMEOUT,
        )
        if response.status_code != 200:
            return f"Could not fetch vocabulary for lesson '{lesson_slug}'."

        data = response.json()
        # API returns {"terms": [...]} wrapper
        terms = data.get("terms", data) if isinstance(data, dict) else data
        if not terms:
            return f"No vocabulary terms found for lesson '{lesson_slug}'."

        formatted = []
        for t in terms:
            entry = f"**{t['term']}**: {t['definition']}"
            if t.get("context"):
                entry += f"\n  Context: {t['context']}"
            formatted.append(entry)
        return "\n\n".join(formatted)
    except Exception as e:
        logger.error("get_vocabulary_terms failed: %s", str(e))
        return f"Failed to fetch vocabulary: {str(e)}"


@tool
def get_vocabulary_stats(lesson_slug: str, session_id: str = "anonymous") -> str:
    """Get the student's vocabulary mastery statistics for a lesson. Use this when
    a student asks about their progress or how well they know the material.

    Args:
        lesson_slug: The lesson slug (e.g. 'tokenization', 'language-models')
        session_id: The student's session ID (defaults to 'anonymous')
    """
    try:
        response = httpx.get(
            f"{settings.BUN_API_URL}/api/vocabulary/{lesson_slug}/stats",
            params={"sessionId": session_id},
            timeout=TOOL_TIMEOUT,
        )
        if response.status_code != 200:
            return f"Could not fetch stats for lesson '{lesson_slug}'."

        stats = response.json()
        return (
            f"Vocabulary stats for '{lesson_slug}':\n"
            f"- Total terms: {stats.get('total', 0)}\n"
            f"- Mastered: {stats.get('mastered', 0)}\n"
            f"- Reviewing: {stats.get('reviewing', 0)}\n"
            f"- Learning: {stats.get('learning', 0)}"
        )
    except Exception as e:
        logger.error("get_vocabulary_stats failed: %s", str(e))
        return f"Failed to fetch stats: {str(e)}"


@tool
def generate_practice_question(week_slug: str) -> str:
    """Generate a practice quiz question based on course materials for a specific week.
    Use this when a student wants to test their knowledge or practice.

    The tool returns the question and options, plus a hidden answer section.
    Present ONLY the question and options to the student first.
    Wait for them to answer before revealing the correct answer and explanation.

    Args:
        week_slug: The week to generate a question for (e.g. 'week-1')
    """
    try:
        response = generate_quiz(
            GenerateQuizRequest(
                week_slug=week_slug,
                count=1,
                temperature=0.8,
            )
        )
        if not response.questions:
            return "Could not generate a practice question. The knowledge base may be empty."

        q = response.questions[0]
        lines = [f"Question: {q.question}\n"]
        for i, opt in enumerate(q.options):
            letter = chr(65 + i)  # A, B, C, D
            lines.append(f"  {letter}) {opt.text}")

        correct_idx = next(
            (i for i, o in enumerate(q.options) if o.is_correct), 0
        )
        correct_letter = chr(65 + correct_idx)
        lines.append(f"\n[HIDDEN - do not show until student answers]")
        lines.append(f"Answer: {correct_letter}")
        lines.append(f"Explanation: {q.explanation}")

        return "\n".join(lines)
    except Exception as e:
        logger.error("generate_practice_question failed: %s", str(e))
        return f"Failed to generate question: {str(e)}"


@tool
def get_lesson_content(lesson_slug: str) -> str:
    """Get the structure and content of a specific lesson, including its concepts
    and challenges. Use this when a student asks about what a lesson covers.

    Args:
        lesson_slug: The lesson slug (e.g. 'tokenization', 'language-models')
    """
    try:
        response = httpx.get(
            f"{settings.BUN_API_URL}/api/lessons/{lesson_slug}",
            timeout=TOOL_TIMEOUT,
        )
        if response.status_code != 200:
            return f"Could not fetch lesson '{lesson_slug}'."

        lesson = response.json()
        lines = [
            f"**{lesson.get('title', lesson_slug)}**",
            f"Description: {lesson.get('description', 'No description')}",
            "",
        ]

        concepts = lesson.get("concepts", [])
        if concepts:
            lines.append("Concepts:")
            for c in concepts:
                challenge_count = len(c.get("challenges", []))
                lines.append(
                    f"  - {c['title']}: {c.get('description', '')} "
                    f"({challenge_count} challenges)"
                )

        return "\n".join(lines)
    except Exception as e:
        logger.error("get_lesson_content failed: %s", str(e))
        return f"Failed to fetch lesson: {str(e)}"


@tool
def get_week_lessons(week_slug: str) -> str:
    """Get the list of lessons that belong to a specific week. Use this FIRST when
    a student asks about a week's content, so you know the correct lesson slugs
    before calling get_lesson_content or get_vocabulary_terms.

    Args:
        week_slug: The week slug (e.g. 'week-1', 'week-2')
    """
    try:
        response = httpx.get(
            f"{settings.BUN_API_URL}/api/weeks/{week_slug}",
            timeout=TOOL_TIMEOUT,
        )
        if response.status_code != 200:
            return f"Could not fetch week '{week_slug}'."

        week = response.json()
        lessons = week.get("lessons", [])
        if not lessons:
            return f"No lessons found for week '{week_slug}'."

        lines = [f"**{week.get('title', week_slug)}**"]
        if week.get("description"):
            lines.append(week["description"])
        lines.append("")
        lines.append("Lessons:")
        for lesson in lessons:
            parts = [f"  - **{lesson['title']}** (slug: `{lesson['slug']}`)"]
            if lesson.get("description"):
                parts.append(f"    {lesson['description']}")
            counts = []
            if lesson.get("conceptCount", 0) > 0:
                counts.append(f"{lesson['conceptCount']} concepts")
            if lesson.get("challengeCount", 0) > 0:
                counts.append(f"{lesson['challengeCount']} challenges")
            if lesson.get("vocabularyCount", 0) > 0:
                counts.append(f"{lesson['vocabularyCount']} vocab terms")
            if counts:
                parts.append(f"    ({', '.join(counts)})")
            lines.extend(parts)

        return "\n".join(lines)
    except Exception as e:
        logger.error("get_week_lessons failed: %s", str(e))
        return f"Failed to fetch week lessons: {str(e)}"


def get_all_tools():
    """Return all agent tools as a list for the AgentExecutor."""
    return [
        search_course_materials,
        get_week_lessons,
        get_vocabulary_terms,
        get_vocabulary_stats,
        generate_practice_question,
        get_lesson_content,
    ]
