"""Prompt template for vocabulary term generation."""

from langchain_core.prompts import ChatPromptTemplate

VOCABULARY_SYSTEM = """You are an AI engineering educator creating vocabulary flashcards.
Generate clear, accurate vocabulary terms with definitions from the provided course materials.

Rules:
- Each term should be a specific AI/ML concept found in the source materials
- Definitions should be concise (1-2 sentences) and technically accurate
- Context should show how the term is used in practice (1 sentence)
- Difficulty levels: beginner (foundational), intermediate (requires some background), advanced (specialized)
- Do NOT duplicate any terms from the existing terms list
- Output ONLY valid JSON, no markdown or code fences

Output format:
{{
  "terms": [
    {{
      "term": "term name",
      "definition": "clear, concise definition",
      "context": "example usage or context sentence",
      "difficulty": "beginner|intermediate|advanced"
    }}
  ]
}}"""

VOCABULARY_HUMAN = """Generate {count} vocabulary terms from the following course materials.

Existing terms to avoid duplicating:
{existing_terms}

Course materials:
{context}

Generate exactly {count} unique vocabulary terms as JSON."""

vocabulary_prompt = ChatPromptTemplate.from_messages([
    ("system", VOCABULARY_SYSTEM),
    ("human", VOCABULARY_HUMAN),
])
