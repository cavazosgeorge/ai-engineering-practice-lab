/**
 * Test utilities for frontend unit tests
 */

// Mock localStorage implementation
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
  };
}

// Mock fetch implementation
export interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

export interface MockFetchCall {
  url: string;
  init?: RequestInit;
}

export interface MockFetchSetup {
  mockFetch: typeof fetch;
  calls: MockFetchCall[];
  setResponse: (response: MockFetchResponse) => void;
  setResponseForUrl: (url: string | RegExp, response: MockFetchResponse) => void;
  reset: () => void;
}

export function createMockFetch(): MockFetchSetup {
  const calls: MockFetchCall[] = [];
  let defaultResponse: MockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
  };
  const urlResponses: Map<string | RegExp, MockFetchResponse> = new Map();

  const mockFetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });

    // Check for URL-specific responses
    for (const [pattern, response] of urlResponses) {
      if (pattern instanceof RegExp) {
        if (pattern.test(url)) {
          return response as unknown as Response;
        }
      } else if (url.includes(pattern)) {
        return response as unknown as Response;
      }
    }

    return defaultResponse as unknown as Response;
  };

  return {
    mockFetch: mockFetch as typeof fetch,
    calls,
    setResponse: (response: MockFetchResponse) => {
      defaultResponse = response;
    },
    setResponseForUrl: (url: string | RegExp, response: MockFetchResponse) => {
      urlResponses.set(url, response);
    },
    reset: () => {
      calls.length = 0;
      urlResponses.clear();
      defaultResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      };
    },
  };
}

// Helper to create a successful JSON response
export function jsonResponse<T>(data: T, status = 200): MockFetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

// Helper to create an error response
export function errorResponse(status: number, message = "Error"): MockFetchResponse {
  return {
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => message,
  };
}

// Mock crypto.randomUUID
export function createMockCrypto(fixedUUID?: string): { randomUUID: () => string } {
  let callCount = 0;
  return {
    randomUUID: () => {
      callCount++;
      return fixedUUID ?? `mock-uuid-${callCount}`;
    },
  };
}

// Setup helpers for global mocks
export function setupGlobalMocks(options: {
  localStorage?: Storage;
  fetch?: typeof fetch;
  crypto?: { randomUUID: () => string };
}): () => void {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const originalCrypto = globalThis.crypto;

  if (options.localStorage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: options.localStorage,
      writable: true,
      configurable: true,
    });
  }

  if (options.fetch) {
    globalThis.fetch = options.fetch;
  }

  if (options.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: { ...originalCrypto, ...options.crypto },
      writable: true,
      configurable: true,
    });
  }

  // Return cleanup function
  return () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  };
}
