import { Box, HStack, Text, VStack, Badge, Collapsible } from "@chakra-ui/react";
import { useState, useCallback } from "react";
import type { TestResult } from "../../services/api";

interface TestResultsProps {
  results: TestResult[];
}

export function TestResults({ results }: TestResultsProps) {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // ✅ Stable callback reference
  const toggleTest = useCallback((testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  }, []);

  return (
    <VStack gap={2} align="stretch">
      {results.map((result, index) => {
        const isExpanded = expandedTests.has(result.testId);
        const hasDetails = result.expected !== undefined || result.error;

        return (
          <Box
            key={result.testId}
            p={3}
            bg={result.passed ? "green.900/30" : "red.900/30"}
            borderRadius="md"
            border="1px solid"
            borderColor={result.passed ? "green.800" : "red.800"}
          >
            <HStack
              justify="space-between"
              cursor={hasDetails ? "pointer" : "default"}
              onClick={() => hasDetails && toggleTest(result.testId)}
            >
              <HStack gap={2}>
                <Badge
                  colorPalette={result.passed ? "green" : "red"}
                  variant="solid"
                >
                  {result.passed ? "PASS" : "FAIL"}
                </Badge>
                <Text color="gray.300" fontSize="sm">
                  Test {index + 1}
                </Text>
              </HStack>
              {hasDetails && (
                <Text color="gray.500" fontSize="xs">
                  {isExpanded ? "▼" : "▶"}
                </Text>
              )}
            </HStack>

            <Collapsible.Root open={!result.passed || isExpanded}>
              <Collapsible.Content>
                {result.error && (
                  <Text color="red.300" fontSize="sm" fontFamily="mono" mt={2}>
                    {result.error}
                  </Text>
                )}
                {result.expected !== undefined && (
                  <VStack gap={1} align="stretch" mt={2}>
                    <Text color="gray.400" fontSize="xs">
                      Expected:{" "}
                      <Text as="span" color="green.300" fontFamily="mono">
                        {JSON.stringify(result.expected)}
                      </Text>
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      Got:{" "}
                      <Text
                        as="span"
                        color={result.passed ? "green.300" : "red.300"}
                        fontFamily="mono"
                      >
                        {JSON.stringify(result.actual)}
                      </Text>
                    </Text>
                  </VStack>
                )}
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        );
      })}
    </VStack>
  );
}
