/**
 * Tests for VocabularyQuiz component
 *
 * Tests focus on:
 * - Rendering question text
 * - Rendering all options
 * - Option selection behavior
 * - Submit button state
 * - Feedback display (correct/incorrect)
 * - Continue button after answer
 */
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "../../setup/react-utils";
import { VocabularyQuiz } from "../../../components/vocabulary/VocabularyQuiz";
import type { QuizQuestion } from "../../../services/api";

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Test data factory
function createMockQuestion(
  overrides: Partial<QuizQuestion> = {}
): QuizQuestion {
  return {
    termId: "term-1",
    questionText: "What is the process of breaking text into smaller units?",
    options: [
      { id: "opt-1", text: "Tokenization" },
      { id: "opt-2", text: "Embedding" },
      { id: "opt-3", text: "Vectorization" },
      { id: "opt-4", text: "Normalization" },
    ],
    correctOptionId: "opt-1",
    ...overrides,
  };
}

describe("VocabularyQuiz", () => {
  let mockOnAnswer: ReturnType<typeof mock>;
  let mockOnContinue: ReturnType<typeof mock>;

  beforeEach(() => {
    mockOnAnswer = mock(() => {});
    mockOnContinue = mock(() => {});
  });

  describe("Initial render", () => {
    test("renders the question text", () => {
      const question = createMockQuestion({
        questionText: "Which technique converts words to vectors?",
      });

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      expect(
        screen.getByText("Which technique converts words to vectors?")
      ).toBeTruthy();
    });

    test("renders all four options", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("Tokenization")).toBeTruthy();
      expect(screen.getByText("Embedding")).toBeTruthy();
      expect(screen.getByText("Vectorization")).toBeTruthy();
      expect(screen.getByText("Normalization")).toBeTruthy();
    });

    test("renders keyboard shortcuts for options", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // The component renders kbd elements with numbers 1-4
      const kbdElements = screen.getAllByText(/^[1-4]$/);
      expect(kbdElements.length).toBe(4);
    });

    test("renders submit button initially disabled", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      const submitButton = screen.getByText("Submit");
      expect(submitButton).toBeTruthy();
      expect(submitButton.closest("button")?.disabled).toBe(true);
    });
  });

  describe("Option selection", () => {
    test("enables submit button when an option is selected", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // Click on an option
      fireEvent.click(screen.getByText("Tokenization"));

      // Submit button should be enabled now
      const submitButton = screen.getByText("Submit");
      expect(submitButton.closest("button")?.disabled).toBe(false);
    });

    test("allows selecting a different option", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // Select first option
      fireEvent.click(screen.getByText("Tokenization"));
      // Select different option
      fireEvent.click(screen.getByText("Embedding"));

      // Submit should still be enabled
      const submitButton = screen.getByText("Submit");
      expect(submitButton.closest("button")?.disabled).toBe(false);
    });
  });

  describe("Submission", () => {
    test("calls onAnswer with selected option when submitted", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // Select an option
      fireEvent.click(screen.getByText("Embedding"));

      // Click submit
      fireEvent.click(screen.getByText("Submit"));

      // onAnswer should be called with the selected option ID and time
      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      const [optionId, timeMs] = mockOnAnswer.mock.calls[0] as [string, number];
      expect(optionId).toBe("opt-2");
      expect(typeof timeMs).toBe("number");
      expect(timeMs).toBeGreaterThanOrEqual(0);
    });

    test("submit button is disabled when isPending is true", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={true}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // Submit button should be disabled during loading
      const submitButton = screen.getByText("Submit").closest("button");
      expect(submitButton?.disabled).toBe(true);
    });

    test("prevents selection when isPending", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={true}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      // Try to click an option - state shouldn't change
      fireEvent.click(screen.getByText("Tokenization"));

      // Submit button should still be disabled (no selection made)
      const submitButton = screen.getByText("Submit").closest("button");
      expect(submitButton?.disabled).toBe(true);
    });
  });

  describe("Feedback display - Correct answer", () => {
    test("shows Correct message for correct answer", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: true, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("Correct!")).toBeTruthy();
    });

    test("shows Continue button after feedback", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: true, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("Continue")).toBeTruthy();
    });

    test("calls onContinue when Continue is clicked", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: true, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.click(screen.getByText("Continue"));
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe("Feedback display - Incorrect answer", () => {
    test("shows Incorrect message for wrong answer", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: false, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("Incorrect")).toBeTruthy();
    });

    test("shows Continue button after incorrect feedback", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: false, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("Continue")).toBeTruthy();
    });
  });

  describe("Options disabled after feedback", () => {
    test("prevents option selection after feedback is shown", () => {
      const question = createMockQuestion();

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={{ correct: true, correctOptionId: "opt-1" }}
          onContinue={mockOnContinue}
        />
      );

      // Options should have pointerEvents set to none after feedback
      // Clicking shouldn't do anything meaningful (onAnswer not called)
      fireEvent.click(screen.getByText("Embedding"));

      // onAnswer should not be called
      expect(mockOnAnswer).not.toHaveBeenCalled();
    });
  });

  describe("Questions with different content", () => {
    test("renders questions with long text correctly", () => {
      const longQuestion =
        "In the context of natural language processing and transformer architectures, what is the name of the mechanism that allows the model to focus on different parts of the input sequence?";
      const question = createMockQuestion({ questionText: longQuestion });

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText(longQuestion)).toBeTruthy();
    });

    test("renders options with special characters", () => {
      const question = createMockQuestion({
        options: [
          { id: "opt-1", text: "BPE (Byte-Pair Encoding)" },
          { id: "opt-2", text: "WordPiece" },
          { id: "opt-3", text: "SentencePiece" },
          { id: "opt-4", text: "Unigram LM" },
        ],
      });

      render(
        <VocabularyQuiz
          question={question}
          onAnswer={mockOnAnswer}
          isPending={false}
          feedback={null}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("BPE (Byte-Pair Encoding)")).toBeTruthy();
      expect(screen.getByText("WordPiece")).toBeTruthy();
      expect(screen.getByText("SentencePiece")).toBeTruthy();
      expect(screen.getByText("Unigram LM")).toBeTruthy();
    });
  });
});
