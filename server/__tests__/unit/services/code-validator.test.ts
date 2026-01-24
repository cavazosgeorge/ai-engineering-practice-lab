import { describe, it, expect } from "bun:test";
import { validateCode, type TestCase } from "../../../services/code-validator";

describe("code-validator", () => {
  // Since deepEqual is not exported, we test it indirectly through validateCode
  // validateCode uses deepEqual to compare actual vs expected outputs

  describe("deepEqual (tested via validateCode)", () => {
    const createTestCase = (input: unknown, expectedOutput: unknown): TestCase => ({
      id: "test-1",
      input,
      expectedOutput,
    });

    it("returns true for identical numbers", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase(42, 42)];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical strings", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase("hello", "hello")];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical booleans", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase(true, true)];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical arrays", async () => {
      // validateCode spreads array inputs as arguments, so we wrap in another array
      // or use a function that returns an array
      const code = "function test() { return [1, 2, 3]; }";
      const testCases = [createTestCase([], [1, 2, 3])];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical nested arrays", async () => {
      const code = "function test() { return [[1, 2], [3, 4]]; }";
      const testCases = [createTestCase([], [[1, 2], [3, 4]])];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical objects", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase({ a: 1, b: 2 }, { a: 1, b: 2 })];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns true for identical nested objects", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [
        createTestCase(
          { outer: { inner: "value" } },
          { outer: { inner: "value" } }
        ),
      ];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it("returns false for different values", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase(42, 43)];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
    });

    it("returns false for different types", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase("42", 42)];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
    });

    it("handles null correctly", async () => {
      const code = "function test(x) { return x; }";

      // null === null should pass
      const result1 = await validateCode(code, "test", [createTestCase(null, null)]);
      expect(result1.passed).toBe(true);

      // null !== undefined should fail
      const code2 = "function test() { return null; }";
      const result2 = await validateCode(code2, "test", [createTestCase([], undefined)]);
      expect(result2.passed).toBe(false);
    });

    it("handles undefined correctly", async () => {
      const code = "function test() { return undefined; }";
      const testCases = [createTestCase([], undefined)];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(true);
    });

    it("returns false for arrays with different lengths", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase([1, 2, 3], [1, 2])];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
    });

    it("returns false for objects with different keys", async () => {
      const code = "function test(x) { return x; }";
      const testCases = [createTestCase({ a: 1 }, { b: 1 })];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
    });
  });

  describe("validateCode", () => {
    it("returns error when function is not found", async () => {
      const code = "function foo() { return 1; }";
      const testCases: TestCase[] = [{ id: "test-1", input: [], expectedOutput: 1 }];

      const result = await validateCode(code, "bar", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].testId).toBe("compile");
      expect(result.results[0].error).toContain('Function "bar" not found');
    });

    it("handles syntax errors in user code", async () => {
      const code = "function test( { return 1; }"; // syntax error
      const testCases: TestCase[] = [{ id: "test-1", input: [], expectedOutput: 1 }];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].testId).toBe("compile");
      expect(result.results[0].error).toBeDefined();
    });

    it("handles runtime errors in user code", async () => {
      const code = "function test() { throw new Error('oops'); }";
      const testCases: TestCase[] = [{ id: "test-1", input: [], expectedOutput: 1 }];

      const result = await validateCode(code, "test", testCases);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].error).toBe("oops");
    });

    it("runs multiple test cases and reports all results", async () => {
      const code = "function double(x) { return x * 2; }";
      const testCases: TestCase[] = [
        { id: "test-1", input: 2, expectedOutput: 4 },
        { id: "test-2", input: 3, expectedOutput: 6 },
        { id: "test-3", input: 0, expectedOutput: 0 },
      ];

      const result = await validateCode(code, "double", testCases);

      expect(result.passed).toBe(true);
      expect(result.results.length).toBe(3);
      expect(result.results.every((r) => r.passed)).toBe(true);
    });

    it("handles array inputs correctly", async () => {
      const code = "function sum(a, b) { return a + b; }";
      const testCases: TestCase[] = [
        { id: "test-1", input: [2, 3], expectedOutput: 5 },
      ];

      const result = await validateCode(code, "sum", testCases);

      expect(result.passed).toBe(true);
      expect(result.results[0].actual).toBe(5);
    });

    it("records execution time", async () => {
      const code = "function test() { return 1; }";
      const testCases: TestCase[] = [{ id: "test-1", input: [], expectedOutput: 1 }];

      const result = await validateCode(code, "test", testCases);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
