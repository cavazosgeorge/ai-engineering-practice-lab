/**
 * HTTP client for proxying requests to the Python RAG/Agent service.
 * The Python service handles all AI operations (FAISS, LangChain, embeddings, agent).
 * This client handles health checks, request forwarding, SSE proxying, and error translation.
 */

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const HEALTH_CHECK_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 30000;

export interface PythonServiceHealth {
  status: string;
  service: string;
  models: {
    embedding: string;
    chat: string;
    agent: string;
  };
  has_openai_key: boolean;
  has_groq_key: boolean;
  has_minimax_key: boolean;
}

/**
 * Check if the Python service is reachable and healthy.
 */
export async function checkPythonServiceHealth(): Promise<PythonServiceHealth | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS
    );

    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PythonServiceHealth;
  } catch {
    return null;
  }
}

/**
 * Forward a JSON request to the Python service.
 * Returns the parsed JSON response or throws with a descriptive error.
 */
export async function forwardRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    timeout?: number;
  } = {}
): Promise<T> {
  const { method = "GET", body, timeout = REQUEST_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${PYTHON_SERVICE_URL}${path}`,
      fetchOptions
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new PythonServiceError(
        `Python service returned ${response.status}: ${errorBody}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PythonServiceError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PythonServiceError(
        "Python service request timed out",
        504
      );
    }

    throw new PythonServiceError(
      `Python service unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface SSEResponse {
  response: Response;
  cleanup: () => void;
}

/**
 * Forward a request to the Python service and stream the SSE response back.
 * Returns the Response object and a cleanup function to clear the abort timeout.
 */
export async function forwardSSERequest(
  path: string,
  body: unknown
): Promise<SSEResponse> {
  const controller = new AbortController();
  // SSE requests can be long-running (agent chat), so use a longer timeout
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new PythonServiceError(
        `Python service returned ${response.status}: ${errorBody}`,
        response.status
      );
    }

    return {
      response,
      cleanup: () => clearTimeout(timeoutId),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof PythonServiceError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PythonServiceError(
        "Python service SSE request timed out",
        504
      );
    }

    throw new PythonServiceError(
      `Python service unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
      503
    );
  }
}

/**
 * Forward a multipart file upload to the Python service.
 */
export async function forwardFileUpload<T = unknown>(
  path: string,
  formData: FormData,
  timeout: number = 60000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
      method: "POST",
      signal: controller.signal,
      body: formData,
      // Don't set Content-Type — fetch sets it with boundary for multipart
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new PythonServiceError(
        `Python service returned ${response.status}: ${errorBody}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof PythonServiceError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PythonServiceError(
        "Python service upload timed out",
        504
      );
    }

    throw new PythonServiceError(
      `Python service unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Custom error class for Python service errors.
 * Carries the HTTP status code for proper error translation in route handlers.
 */
export class PythonServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "PythonServiceError";
  }
}
