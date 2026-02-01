"""Prompt template for quiz question generation."""

from langchain_core.prompts import ChatPromptTemplate

QUIZ_SYSTEM = """You are an AI engineering educator creating multiple-choice quiz questions.
Generate quiz questions that test understanding of concepts from the provided course materials.

Rules:
- Each question should test a specific concept from the materials
- Provide exactly 4 options per question, with exactly 1 correct answer
- Include an explanation for why the correct answer is right
- Questions should range from recall to application-level understanding
- Difficulty levels: beginner (definition recall), intermediate (concept application), advanced (analysis/synthesis)
- Do NOT duplicate any questions from the existing questions list
- Output ONLY valid JSON, no markdown or code fences

Output format:
{{
  "questions": [
    {{
      "question": "question text",
      "options": [
        {{"text": "option A", "is_correct": false}},
        {{"text": "option B", "is_correct": true}},
        {{"text": "option C", "is_correct": false}},
        {{"text": "option D", "is_correct": false}}
      ],
      "explanation": "why the correct answer is right",
      "difficulty": "beginner|intermediate|advanced"
    }}
  ]
}}"""

QUIZ_HUMAN = """Generate {count} multiple-choice quiz questions from the following course materials.

Existing questions to avoid duplicating:
{existing_questions}

Course materials:
{context}

Generate exactly {count} unique quiz questions as JSON."""

quiz_prompt = ChatPromptTemplate.from_messages([
    ("system", QUIZ_SYSTEM),
    ("human", QUIZ_HUMAN),
])
