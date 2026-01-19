import { useState, useEffect, useCallback, useRef } from "react";

// Pyodide types
interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

interface UsePyodideReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  runPython: (code: string) => Promise<unknown>;
}

// Singleton to share Pyodide instance across components
let pyodideInstance: PyodideInterface | null = null;
let pyodidePromise: Promise<PyodideInterface> | null = null;

async function loadPyodideInstance(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    // Load the Pyodide script if not already loaded
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    pyodideInstance = await window.loadPyodide();
    return pyodideInstance;
  })();

  return pyodidePromise;
}

export function usePyodide(): UsePyodideReturn {
  const [isLoading, setIsLoading] = useState(!pyodideInstance);
  const [isReady, setIsReady] = useState(!!pyodideInstance);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<PyodideInterface | null>(pyodideInstance);

  useEffect(() => {
    if (pyodideRef.current) {
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    loadPyodideInstance()
      .then((pyodide) => {
        pyodideRef.current = pyodide;
        setIsReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const runPython = useCallback(async (code: string): Promise<unknown> => {
    if (!pyodideRef.current) {
      throw new Error("Pyodide not loaded");
    }
    return pyodideRef.current.runPythonAsync(code);
  }, []);

  return { isLoading, isReady, error, runPython };
}
