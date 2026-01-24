import type {
  LessonRow,
  ConceptRow,
  ChallengeRow,
  TestCaseRow,
  VocabularyTermRow,
} from "../../db/index";

/**
 * Mock lesson data for testing
 */
export const MOCK_LESSON: Omit<LessonRow, "created_at" | "updated_at"> = {
  id: "lesson-test-001",
  title: "Introduction to Tokenization",
  slug: "tokenization",
  description:
    "Learn how text is converted into tokens for processing by language models.",
  order_index: 1,
  is_published: 1,
};

/**
 * Mock concept data for testing
 */
export const MOCK_CONCEPT: Omit<ConceptRow, "created_at" | "updated_at"> = {
  id: "concept-test-001",
  lesson_id: "lesson-test-001",
  title: "Byte Pair Encoding (BPE)",
  explanation:
    "BPE is a subword tokenization algorithm that iteratively merges the most frequent pairs of characters or tokens.",
  order_index: 1,
};

/**
 * Mock challenge data for testing
 */
export const MOCK_CHALLENGE: Omit<ChallengeRow, "created_at" | "updated_at"> = {
  id: "challenge-test-001",
  concept_id: "concept-test-001",
  type: "implement",
  title: "Implement Simple Tokenizer",
  description:
    "Create a function that splits text into tokens based on whitespace and punctuation.",
  starter_code: `function tokenize(text: string): string[] {
  // Your implementation here
  return [];
}`,
  solution_code: `function tokenize(text: string): string[] {
  return text.split(/\\s+/).filter(token => token.length > 0);
}`,
  hints: JSON.stringify([
    "Consider using String.split() with a regex",
    "Don't forget to handle empty strings",
    "Filter out empty tokens after splitting",
  ]),
  difficulty: "beginner",
  order_index: 1,
};

/**
 * Mock test case data for testing
 */
export const MOCK_TEST_CASE: Omit<TestCaseRow, "created_at"> = {
  id: "testcase-test-001",
  challenge_id: "challenge-test-001",
  input: JSON.stringify(["hello world"]),
  expected_output: JSON.stringify(["hello", "world"]),
  description: "Should split simple whitespace-separated text",
  is_hidden: 0,
  order_index: 1,
};

/**
 * Additional test case (hidden) for testing
 */
export const MOCK_TEST_CASE_HIDDEN: Omit<TestCaseRow, "created_at"> = {
  id: "testcase-test-002",
  challenge_id: "challenge-test-001",
  input: JSON.stringify(["  multiple   spaces  "]),
  expected_output: JSON.stringify(["multiple", "spaces"]),
  description: "Should handle multiple spaces",
  is_hidden: 1,
  order_index: 2,
};

/**
 * Mock vocabulary term data for testing
 */
export const MOCK_VOCABULARY_TERM: Omit<VocabularyTermRow, "created_at"> = {
  id: "vocab-test-001",
  lesson_id: "lesson-test-001",
  concept_id: "concept-test-001",
  term: "Token",
  definition:
    "A unit of text that a language model processes, which can be a word, subword, or character depending on the tokenization method.",
  context:
    "In the sentence 'Hello world', a word-level tokenizer would produce two tokens: 'Hello' and 'world'.",
  difficulty: "beginner",
  order_index: 1,
};

/**
 * Additional vocabulary term without concept association
 */
export const MOCK_VOCABULARY_TERM_NO_CONCEPT: Omit<
  VocabularyTermRow,
  "created_at"
> = {
  id: "vocab-test-002",
  lesson_id: "lesson-test-001",
  concept_id: null,
  term: "Vocabulary",
  definition:
    "The set of all unique tokens known to a language model, typically stored in a lookup table.",
  context: null,
  difficulty: "intermediate",
  order_index: 2,
};

/**
 * Second mock lesson for testing multiple records
 */
export const MOCK_LESSON_2: Omit<LessonRow, "created_at" | "updated_at"> = {
  id: "lesson-test-002",
  title: "Language Models",
  slug: "language-models",
  description: "Understanding how language models predict and generate text.",
  order_index: 2,
  is_published: 1,
};

/**
 * Unpublished mock lesson for testing filters
 */
export const MOCK_LESSON_UNPUBLISHED: Omit<
  LessonRow,
  "created_at" | "updated_at"
> = {
  id: "lesson-test-003",
  title: "Advanced Topics (Draft)",
  slug: "advanced-topics-draft",
  description: "Work in progress content.",
  order_index: 99,
  is_published: 0,
};
