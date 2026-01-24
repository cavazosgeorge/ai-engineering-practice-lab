import { getTestDb } from "./test-db";
import {
  MOCK_LESSON,
  MOCK_LESSON_2,
  MOCK_CONCEPT,
  MOCK_CHALLENGE,
  MOCK_TEST_CASE,
  MOCK_TEST_CASE_HIDDEN,
  MOCK_VOCABULARY_TERM,
  MOCK_VOCABULARY_TERM_NO_CONCEPT,
} from "./mock-data";

/**
 * Seeds the test database with lessons, concepts, challenges, and test cases.
 * Creates a complete hierarchy of test data.
 */
export function seedTestData(): void {
  const db = getTestDb();

  // Seed lessons
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      MOCK_LESSON.id,
      MOCK_LESSON.title,
      MOCK_LESSON.slug,
      MOCK_LESSON.description,
      MOCK_LESSON.order_index,
      MOCK_LESSON.is_published,
    ]
  );

  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      MOCK_LESSON_2.id,
      MOCK_LESSON_2.title,
      MOCK_LESSON_2.slug,
      MOCK_LESSON_2.description,
      MOCK_LESSON_2.order_index,
      MOCK_LESSON_2.is_published,
    ]
  );

  // Seed concept
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      MOCK_CONCEPT.id,
      MOCK_CONCEPT.lesson_id,
      MOCK_CONCEPT.title,
      MOCK_CONCEPT.explanation,
      MOCK_CONCEPT.order_index,
    ]
  );

  // Seed challenge
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MOCK_CHALLENGE.id,
      MOCK_CHALLENGE.concept_id,
      MOCK_CHALLENGE.type,
      MOCK_CHALLENGE.title,
      MOCK_CHALLENGE.description,
      MOCK_CHALLENGE.starter_code,
      MOCK_CHALLENGE.solution_code,
      MOCK_CHALLENGE.hints,
      MOCK_CHALLENGE.difficulty,
      MOCK_CHALLENGE.order_index,
    ]
  );

  // Seed test cases
  db.run(
    `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, is_hidden, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      MOCK_TEST_CASE.id,
      MOCK_TEST_CASE.challenge_id,
      MOCK_TEST_CASE.input,
      MOCK_TEST_CASE.expected_output,
      MOCK_TEST_CASE.description,
      MOCK_TEST_CASE.is_hidden,
      MOCK_TEST_CASE.order_index,
    ]
  );

  db.run(
    `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, is_hidden, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      MOCK_TEST_CASE_HIDDEN.id,
      MOCK_TEST_CASE_HIDDEN.challenge_id,
      MOCK_TEST_CASE_HIDDEN.input,
      MOCK_TEST_CASE_HIDDEN.expected_output,
      MOCK_TEST_CASE_HIDDEN.description,
      MOCK_TEST_CASE_HIDDEN.is_hidden,
      MOCK_TEST_CASE_HIDDEN.order_index,
    ]
  );
}

/**
 * Seeds the test database with vocabulary terms.
 * Requires seedTestData() to be called first for lesson/concept references.
 */
export function seedVocabularyData(): void {
  const db = getTestDb();

  // Seed vocabulary terms
  db.run(
    `INSERT INTO vocabulary_terms (id, lesson_id, concept_id, term, definition, context, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MOCK_VOCABULARY_TERM.id,
      MOCK_VOCABULARY_TERM.lesson_id,
      MOCK_VOCABULARY_TERM.concept_id,
      MOCK_VOCABULARY_TERM.term,
      MOCK_VOCABULARY_TERM.definition,
      MOCK_VOCABULARY_TERM.context,
      MOCK_VOCABULARY_TERM.difficulty,
      MOCK_VOCABULARY_TERM.order_index,
    ]
  );

  db.run(
    `INSERT INTO vocabulary_terms (id, lesson_id, concept_id, term, definition, context, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MOCK_VOCABULARY_TERM_NO_CONCEPT.id,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.lesson_id,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.concept_id,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.term,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.definition,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.context,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.difficulty,
      MOCK_VOCABULARY_TERM_NO_CONCEPT.order_index,
    ]
  );
}

/**
 * Clears all test data from the database in the correct order
 * to respect foreign key constraints.
 */
export function clearTestData(): void {
  const db = getTestDb();

  // Clear in reverse dependency order
  // First: tables with no dependencies on them
  db.run("DELETE FROM vocabulary_submissions");
  db.run("DELETE FROM vocabulary_progress");
  db.run("DELETE FROM vocabulary_terms");

  db.run("DELETE FROM submissions");
  db.run("DELETE FROM user_progress");
  db.run("DELETE FROM test_cases");
  db.run("DELETE FROM challenges");
  db.run("DELETE FROM concepts");
  db.run("DELETE FROM lessons");
}

/**
 * Seeds all test data (core + vocabulary).
 * Convenience function for tests that need complete data.
 */
export function seedAllTestData(): void {
  seedTestData();
  seedVocabularyData();
}
