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
  stdout: string;
}

// Deep equality check for comparing results
// Exported for testing
export function deepEqual(a: unknown, b: unknown): boolean {
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
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  // Handle floating point comparison
  if (typeof a === "number" && typeof b === "number") {
    if (Math.abs(a - b) < 1e-9) return true;
  }

  return false;
}

// Convert Python result to JS-comparable value
// Exported for testing
export function pythonToJS(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Handle Pyodide proxy objects
  if (typeof value === "object" && value !== null) {
    const proxy = value as { toJs?: () => unknown; type?: string };
    if (typeof proxy.toJs === "function") {
      const jsValue = proxy.toJs();
      // Recursively convert nested structures
      if (jsValue instanceof Map) {
        const obj: Record<string, unknown> = {};
        jsValue.forEach((v, k) => {
          obj[String(k)] = pythonToJS(v);
        });
        return obj;
      }
      if (Array.isArray(jsValue)) {
        return jsValue.map(pythonToJS);
      }
      return jsValue;
    }
  }

  return value;
}

export async function validatePythonCode(
  runPython: (code: string) => Promise<unknown>,
  userCode: string,
  functionName: string,
  testCases: TestCase[]
): Promise<ValidationResult> {
  const startTime = performance.now();
  const results: TestResult[] = [];
  let stdout = "";

  try {
    // Set up stdout capture
    await runPython(`
import sys
import io
__captured_stdout__ = io.StringIO()
__original_stdout__ = sys.stdout
sys.stdout = __captured_stdout__
`);

    // First, execute the user's code to define their function
    await runPython(userCode);

    // Run each test case
    for (const testCase of testCases) {
      try {
        // Prepare the input as Python code
        const args = Array.isArray(testCase.input)
          ? testCase.input
          : [testCase.input];

        // Convert JS values to Python literals
        const pythonArgs = args.map(jsToPythonLiteral).join(", ");

        // Call the function and get the result
        const testCode = `
import json
__result__ = ${functionName}(${pythonArgs})
# Convert to JSON-serializable format
if isinstance(__result__, dict):
    json.dumps(__result__)  # Validate it's serializable
__result__
`;
        const rawResult = await runPython(testCode);
        const actual = pythonToJS(rawResult);
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
    // Error in user code definition
    results.push({
      testId: "compile",
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Capture stdout and restore original
  try {
    const capturedOutput = await runPython(`
sys.stdout = __original_stdout__
__captured_stdout__.getvalue()
`);
    stdout = String(capturedOutput || "");
  } catch {
    // Ignore errors in stdout capture
  }

  const executionTimeMs = performance.now() - startTime;
  const passed = results.length > 0 && results.every((r) => r.passed);

  return { passed, results, executionTimeMs, stdout };
}

// Convert JS value to Python literal string
// Exported for testing
export function jsToPythonLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }
  if (typeof value === "string") {
    // Escape quotes and backslashes
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"${escaped}"`;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  if (Array.isArray(value)) {
    return `[${value.map(jsToPythonLiteral).join(", ")}]`;
  }
  if (typeof value === "object") {
    const pairs = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${jsToPythonLiteral(k)}: ${jsToPythonLiteral(v)}`)
      .join(", ");
    return `{${pairs}}`;
  }
  return String(value);
}
