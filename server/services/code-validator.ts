export interface TestCase {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  description?: string;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
}

export interface ValidationResult {
  passed: boolean;
  results: TestResult[];
  executionTimeMs: number;
}

// Note: This runs user code in the same process - suitable for trusted users only
// For production, use isolated-vm or a sandboxed worker
export async function validateCode(
  userCode: string,
  functionName: string,
  testCases: TestCase[]
): Promise<ValidationResult> {
  const startTime = performance.now();
  const results: TestResult[] = [];

  try {
    // Create a function from the user's code
    const wrappedCode = `
      ${userCode}
      return typeof ${functionName} === 'function' ? ${functionName} : null;
    `;

    const createUserFunction = new Function(wrappedCode);
    const userFunction = createUserFunction();

    if (!userFunction) {
      return {
        passed: false,
        results: [{
          testId: "compile",
          passed: false,
          error: `Function "${functionName}" not found in your code`,
        }],
        executionTimeMs: performance.now() - startTime,
      };
    }

    // Run each test case
    for (const testCase of testCases) {
      try {
        const args = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
        const actual = userFunction(...args);
        const passed = deepEqual(actual, testCase.expectedOutput);

        results.push({
          testId: testCase.id,
          passed,
          actual,
          expected: testCase.expectedOutput,
          error: passed ? undefined : "Output does not match expected",
        });
      } catch (err) {
        results.push({
          testId: testCase.id,
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    results.push({
      testId: "compile",
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const executionTimeMs = performance.now() - startTime;
  const passed = results.length > 0 && results.every((r) => r.passed);

  return { passed, results, executionTimeMs };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}
