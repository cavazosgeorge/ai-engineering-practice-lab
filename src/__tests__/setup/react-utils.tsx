/**
 * React testing utilities with providers for component tests
 */
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";
import { ReactElement, ReactNode } from "react";

/**
 * Create a fresh QueryClient for each test to avoid state leakage
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all necessary context providers
 */
function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={defaultSystem}>
        <MemoryRouter>{children}</MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library/react
export * from "@testing-library/react";
// Export our custom render as the default render
export { renderWithProviders as render };
