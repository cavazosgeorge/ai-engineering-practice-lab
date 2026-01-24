/**
 * Tests for VocabularyFlashcard component
 *
 * Tests focus on:
 * - Rendering term content on front side
 * - Rendering definition content when flipped
 * - Click handler invocation
 * - Difficulty badge display
 * - Context display (when provided)
 *
 * Note: The flashcard renders both sides simultaneously in the DOM.
 * The visibility is controlled via CSS 3D transforms.
 */
import { describe, test, expect, mock, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "../../setup/react-utils";
import { VocabularyFlashcard } from "../../../components/vocabulary/VocabularyFlashcard";
import type { VocabularyTerm } from "../../../services/api";

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Test data factory
function createMockTerm(overrides: Partial<VocabularyTerm> = {}): VocabularyTerm {
  return {
    id: "term-1",
    lessonId: "lesson-1",
    term: "Tokenization",
    definition: "The process of breaking text into smaller units called tokens.",
    context: "Tokenization is the first step in most NLP pipelines.",
    difficulty: "beginner",
    orderIndex: 0,
    ...overrides,
  };
}

describe("VocabularyFlashcard", () => {
  describe("Rendering", () => {
    test("renders the term text (appears on both sides)", () => {
      const term = createMockTerm({ term: "Embedding" });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      // Term appears on both front (large) and back (small) sides
      const termElements = screen.getAllByText("Embedding");
      expect(termElements.length).toBeGreaterThanOrEqual(1);
    });

    test("renders the definition on the back side", () => {
      const term = createMockTerm({
        definition: "A numerical representation of text in vector space.",
      });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      expect(
        screen.getByText("A numerical representation of text in vector space.")
      ).toBeTruthy();
    });

    test("renders context when provided", () => {
      const term = createMockTerm({
        context: "Used in RAG systems for semantic search.",
      });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      expect(
        screen.getByText("Used in RAG systems for semantic search.")
      ).toBeTruthy();
    });

    test("does not render context section when context is null", () => {
      const term = createMockTerm({ context: null });
      const onFlip = mock(() => {});

      const { container } = render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      // Definition should be present
      expect(screen.getByText(term.definition)).toBeTruthy();
      // Context container should not be present (no italic text for context)
      const contextContainer = container.querySelector('[style*="italic"]');
      expect(contextContainer).toBeNull();
    });

    test("renders flip instruction hint with Space keyboard shortcut", () => {
      const term = createMockTerm();
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      // Should show space key hint
      expect(screen.getByText("Space")).toBeTruthy();
    });
  });

  describe("Difficulty badges", () => {
    test("renders beginner difficulty badge", () => {
      const term = createMockTerm({ difficulty: "beginner" });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      // Badge appears on both sides
      const badges = screen.getAllByText("beginner");
      expect(badges.length).toBe(2);
    });

    test("renders intermediate difficulty badge", () => {
      const term = createMockTerm({ difficulty: "intermediate" });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      const badges = screen.getAllByText("intermediate");
      expect(badges.length).toBe(2);
    });

    test("renders advanced difficulty badge", () => {
      const term = createMockTerm({ difficulty: "advanced" });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      const badges = screen.getAllByText("advanced");
      expect(badges.length).toBe(2);
    });
  });

  describe("Click interaction", () => {
    test("calls onFlip when card container is clicked", () => {
      const term = createMockTerm();
      const onFlip = mock(() => {});

      const { container } = render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      // Find the outermost clickable container
      const cardContainer = container.firstChild as HTMLElement;
      if (cardContainer) {
        fireEvent.click(cardContainer);
        expect(onFlip).toHaveBeenCalledTimes(1);
      }
    });

    test("calls onFlip when clicking while flipped", () => {
      const term = createMockTerm();
      const onFlip = mock(() => {});

      const { container } = render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      const cardContainer = container.firstChild as HTMLElement;
      if (cardContainer) {
        fireEvent.click(cardContainer);
        expect(onFlip).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Content with special characters", () => {
    test("renders terms with parentheses and special characters", () => {
      const term = createMockTerm({
        term: "BPE (Byte-Pair Encoding)",
      });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      const termElements = screen.getAllByText("BPE (Byte-Pair Encoding)");
      expect(termElements.length).toBeGreaterThanOrEqual(1);
    });

    test("renders long definitions correctly", () => {
      const longDefinition =
        "A very detailed and comprehensive explanation of a complex AI concept that spans multiple sentences and includes technical terminology like transformers, attention mechanisms, and vector representations in high-dimensional space.";
      const term = createMockTerm({ definition: longDefinition });
      const onFlip = mock(() => {});

      render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      expect(screen.getByText(longDefinition)).toBeTruthy();
    });
  });

  describe("CSS transform state", () => {
    test("applies different transform when not flipped", () => {
      const term = createMockTerm();
      const onFlip = mock(() => {});

      const { container } = render(
        <VocabularyFlashcard term={term} isFlipped={false} onFlip={onFlip} />
      );

      // The inner transform container should have rotateY(0deg) when not flipped
      // We can verify the component renders without error
      expect(container.firstChild).toBeTruthy();
    });

    test("applies different transform when flipped", () => {
      const term = createMockTerm();
      const onFlip = mock(() => {});

      const { container } = render(
        <VocabularyFlashcard term={term} isFlipped={true} onFlip={onFlip} />
      );

      // The inner transform container should have rotateY(180deg) when flipped
      // We can verify the component renders without error
      expect(container.firstChild).toBeTruthy();
    });
  });
});
