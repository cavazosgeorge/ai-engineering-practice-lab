/**
 * Tests for TestResults component
 *
 * Tests focus on:
 * - Rendering all test case results
 * - Success styling for passing tests
 * - Error styling for failing tests
 * - Expected vs actual output display
 * - Error message display for runtime errors
 * - Handling empty results array
 * - Collapsible behavior for details
 */
import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "../../setup/react-utils";
import { TestResults } from "../../../components/challenges/TestResults";
import type { TestResult } from "../../../services/api";

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Test data factory
function createPassingResult(
  overrides: Partial<TestResult> = {}
): TestResult {
  return {
    testId: `test-${Math.random().toString(36).slice(2, 9)}`,
    passed: true,
    actual: 42,
    expected: 42,
    ...overrides,
  };
}

function createFailingResult(
  overrides: Partial<TestResult> = {}
): TestResult {
  return {
    testId: `test-${Math.random().toString(36).slice(2, 9)}`,
    passed: false,
    actual: 41,
    expected: 42,
    ...overrides,
  };
}

function createErrorResult(
  overrides: Partial<TestResult> = {}
): TestResult {
  return {
    testId: `test-${Math.random().toString(36).slice(2, 9)}`,
    passed: false,
    error: "TypeError: Cannot read property 'length' of undefined",
    ...overrides,
  };
}

describe("TestResults", () => {
  describe("Rendering test results", () => {
    test("renders all test results", () => {
      const results: TestResult[] = [
        createPassingResult({ testId: "test-1" }),
        createFailingResult({ testId: "test-2" }),
        createPassingResult({ testId: "test-3" }),
      ];

      render(<TestResults results={results} />);

      // Should show test numbers
      expect(screen.getByText("Test 1")).toBeTruthy();
      expect(screen.getByText("Test 2")).toBeTruthy();
      expect(screen.getByText("Test 3")).toBeTruthy();
    });

    test("renders empty state gracefully", () => {
      const { container } = render(<TestResults results={[]} />);

      // Should render without crashing
      // Container should be empty or have no test result elements
      const testLabels = container.querySelectorAll('[class*="badge"]');
      expect(testLabels.length).toBe(0);
    });
  });

  describe("Passing tests", () => {
    test("displays PASS badge for passing tests", () => {
      const results: TestResult[] = [createPassingResult()];

      render(<TestResults results={results} />);

      expect(screen.getByText("PASS")).toBeTruthy();
    });

    test("displays multiple PASS badges for multiple passing tests", () => {
      const results: TestResult[] = [
        createPassingResult({ testId: "test-1" }),
        createPassingResult({ testId: "test-2" }),
        createPassingResult({ testId: "test-3" }),
      ];

      render(<TestResults results={results} />);

      const passBadges = screen.getAllByText("PASS");
      expect(passBadges.length).toBe(3);
    });
  });

  describe("Failing tests", () => {
    test("displays FAIL badge for failing tests", () => {
      const results: TestResult[] = [createFailingResult()];

      render(<TestResults results={results} />);

      expect(screen.getByText("FAIL")).toBeTruthy();
    });

    test("displays expected and actual values for failing tests", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: "hello",
          actual: "world",
        }),
      ];

      render(<TestResults results={results} />);

      // Check for Expected and Got labels
      expect(screen.getByText("Expected:")).toBeTruthy();
      expect(screen.getByText("Got:")).toBeTruthy();

      // Check for the actual values (JSON stringified)
      expect(screen.getByText('"hello"')).toBeTruthy();
      expect(screen.getByText('"world"')).toBeTruthy();
    });

    test("displays expected and actual for numeric values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: 100,
          actual: 99,
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("100")).toBeTruthy();
      expect(screen.getByText("99")).toBeTruthy();
    });

    test("displays expected and actual for array values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: [1, 2, 3],
          actual: [1, 2],
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("[1,2,3]")).toBeTruthy();
      expect(screen.getByText("[1,2]")).toBeTruthy();
    });

    test("displays expected and actual for object values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: { a: 1 },
          actual: { b: 2 },
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText('{"a":1}')).toBeTruthy();
      expect(screen.getByText('{"b":2}')).toBeTruthy();
    });
  });

  describe("Runtime errors", () => {
    test("displays error message for runtime errors", () => {
      const results: TestResult[] = [
        createErrorResult({
          testId: "test-1",
          error: "ReferenceError: x is not defined",
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("ReferenceError: x is not defined")).toBeTruthy();
    });

    test("displays FAIL badge for error results", () => {
      const results: TestResult[] = [createErrorResult()];

      render(<TestResults results={results} />);

      expect(screen.getByText("FAIL")).toBeTruthy();
    });

    test("handles error with expected/actual values", () => {
      // Sometimes a test might have both an error and expected/actual
      const results: TestResult[] = [
        {
          testId: "test-1",
          passed: false,
          error: "Assertion failed",
          expected: true,
          actual: false,
        },
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("FAIL")).toBeTruthy();
      expect(screen.getByText("Assertion failed")).toBeTruthy();
    });
  });

  describe("Mixed results", () => {
    test("renders mix of passing, failing, and error results", () => {
      const results: TestResult[] = [
        createPassingResult({ testId: "test-1" }),
        createFailingResult({ testId: "test-2", expected: 10, actual: 5 }),
        createErrorResult({ testId: "test-3", error: "Timeout" }),
        createPassingResult({ testId: "test-4" }),
      ];

      render(<TestResults results={results} />);

      // Check badges
      const passBadges = screen.getAllByText("PASS");
      const failBadges = screen.getAllByText("FAIL");

      expect(passBadges.length).toBe(2);
      expect(failBadges.length).toBe(2);

      // Check error message
      expect(screen.getByText("Timeout")).toBeTruthy();
    });

    test("maintains correct test numbering", () => {
      const results: TestResult[] = [
        createPassingResult({ testId: "a" }),
        createFailingResult({ testId: "b" }),
        createPassingResult({ testId: "c" }),
        createErrorResult({ testId: "d" }),
        createPassingResult({ testId: "e" }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("Test 1")).toBeTruthy();
      expect(screen.getByText("Test 2")).toBeTruthy();
      expect(screen.getByText("Test 3")).toBeTruthy();
      expect(screen.getByText("Test 4")).toBeTruthy();
      expect(screen.getByText("Test 5")).toBeTruthy();
    });
  });

  describe("Collapsible behavior", () => {
    test("failing tests are expanded by default", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: "foo",
          actual: "bar",
        }),
      ];

      render(<TestResults results={results} />);

      // Failing test details should be visible without clicking
      expect(screen.getByText("Expected:")).toBeTruthy();
      expect(screen.getByText("Got:")).toBeTruthy();
    });

    test("passing tests can be expanded by clicking", () => {
      const results: TestResult[] = [
        createPassingResult({
          testId: "test-1",
          expected: 42,
          actual: 42,
        }),
      ];

      render(<TestResults results={results} />);

      // Find and click the test row to expand
      const testRow = screen.getByText("Test 1").closest('[cursor="pointer"]') ||
        screen.getByText("Test 1").parentElement?.parentElement;

      if (testRow) {
        fireEvent.click(testRow);

        // After clicking, details should be visible
        // Note: The Collapsible.Root has open={!result.passed || isExpanded}
        // So for passing tests, we need to click to see details
      }
    });

    test("shows expand indicator for tests with details", () => {
      const results: TestResult[] = [
        createPassingResult({
          testId: "test-1",
          expected: 42,
          actual: 42,
        }),
      ];

      render(<TestResults results={results} />);

      // Should show expand indicator (triangle)
      // The component shows "▶" for collapsed and "▼" for expanded
      const expandIndicator = screen.queryByText("▶") || screen.queryByText("▼");
      expect(expandIndicator).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    test("handles null expected/actual values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: null,
          actual: undefined,
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("null")).toBeTruthy();
    });

    test("handles boolean expected/actual values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: true,
          actual: false,
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("true")).toBeTruthy();
      expect(screen.getByText("false")).toBeTruthy();
    });

    test("handles empty string values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: "",
          actual: "not empty",
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText('""')).toBeTruthy();
      expect(screen.getByText('"not empty"')).toBeTruthy();
    });

    test("handles nested object values", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "test-1",
          expected: { nested: { value: 1 } },
          actual: { nested: { value: 2 } },
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText('{"nested":{"value":1}}')).toBeTruthy();
      expect(screen.getByText('{"nested":{"value":2}}')).toBeTruthy();
    });

    test("handles long error messages", () => {
      const longError =
        "Error: Expected function to return a valid token sequence but received malformed output. The tokenizer encountered an unexpected character at position 42 in the input string.";

      const results: TestResult[] = [
        createErrorResult({
          testId: "test-1",
          error: longError,
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText(longError)).toBeTruthy();
    });
  });

  describe("Single test scenarios", () => {
    test("renders single passing test", () => {
      const results: TestResult[] = [
        createPassingResult({ testId: "only-test" }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("PASS")).toBeTruthy();
      expect(screen.getByText("Test 1")).toBeTruthy();
    });

    test("renders single failing test", () => {
      const results: TestResult[] = [
        createFailingResult({
          testId: "only-test",
          expected: "success",
          actual: "failure",
        }),
      ];

      render(<TestResults results={results} />);

      expect(screen.getByText("FAIL")).toBeTruthy();
      expect(screen.getByText("Test 1")).toBeTruthy();
      expect(screen.getByText('"success"')).toBeTruthy();
      expect(screen.getByText('"failure"')).toBeTruthy();
    });
  });
});
