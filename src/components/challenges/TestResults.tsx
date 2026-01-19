import { Box, HStack, Text, VStack, Badge } from "@chakra-ui/react";
import type { TestResult } from "../../services/api";

interface TestResultsProps {
  results: TestResult[];
}

export function TestResults({ results }: TestResultsProps) {
  return (
    <VStack gap={2} align="stretch">
      {results.map((result, index) => (
        <Box
          key={result.testId}
          p={3}
          bg={result.passed ? "green.900/30" : "red.900/30"}
          borderRadius="md"
          border="1px solid"
          borderColor={result.passed ? "green.800" : "red.800"}
        >
          <HStack justify="space-between" mb={result.error ? 2 : 0}>
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
          </HStack>
          {!result.passed && result.error && (
            <Text color="red.300" fontSize="sm" fontFamily="mono">
              {result.error}
            </Text>
          )}
          {!result.passed && result.expected !== undefined && (
            <VStack gap={1} align="stretch" mt={2}>
              <Text color="gray.400" fontSize="xs">
                Expected:{" "}
                <Text as="span" color="green.300" fontFamily="mono">
                  {JSON.stringify(result.expected)}
                </Text>
              </Text>
              <Text color="gray.400" fontSize="xs">
                Got:{" "}
                <Text as="span" color="red.300" fontFamily="mono">
                  {JSON.stringify(result.actual)}
                </Text>
              </Text>
            </VStack>
          )}
        </Box>
      ))}
    </VStack>
  );
}
