import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface ArrayTransformProps {
  input: unknown[];
  output: unknown[];
  currentStep: number;
  transformLabel?: string;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

function ArrayCell({
  value,
  highlight,
  color = "gray.300",
  delay = 0,
  indexLabel,
}: {
  value: unknown;
  highlight?: boolean;
  color?: string;
  delay?: number;
  indexLabel?: string;
}) {
  const displayValue = typeof value === "string"
    ? `"${value}"`
    : JSON.stringify(value);

  return (
    <VStack gap={0}>
      {indexLabel && (
        <Text color="gray.500" fontSize="xs" fontFamily="'JetBrains Mono', monospace">
          {indexLabel}
        </Text>
      )}
      <MotionBox
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          boxShadow: highlight ? "0 0 20px rgba(0, 188, 212, 0.5)" : "none",
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, delay }}
        px={3}
        py={2}
        bg={highlight ? "cyan.900/50" : "gray.800"}
        borderRadius="md"
        border="2px solid"
        borderColor={highlight ? "cyan.500" : "gray.700"}
        fontFamily="'JetBrains Mono', monospace"
        fontSize="sm"
        minW="fit-content"
      >
        <Text color={color} whiteSpace="nowrap">{displayValue}</Text>
      </MotionBox>
    </VStack>
  );
}

function ArrayArrow({ delay = 0 }: { delay?: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Text color="cyan.500" fontSize="xl">→</Text>
    </MotionBox>
  );
}

export function ArrayTransform({
  input,
  output,
  currentStep,
  transformLabel = "transform",
  codePatterns,
  solutionCode,
  challengeTitle,
}: ArrayTransformProps) {
  // Step 0: Show input
  // Step 1 to input.length: Process each element
  // Final step: Show complete output

  const isShowingInput = currentStep === 0;
  const activeIndex = isShowingInput ? -1 : Math.min(currentStep - 1, input.length - 1);
  const isComplete = currentStep > input.length;

  // Build partial output
  const partialOutput = output.slice(0, Math.max(0, currentStep));

  return (
    <Box>
      {/* Input array with index labels */}
      <VStack gap={4} align="center" mb={6}>
        <Text color="cyan.400" fontSize="sm" fontWeight="medium">input (list)</Text>
        <HStack gap={2} wrap="wrap" justify="center" align="flex-end">
          <Text color="gray.600" fontSize="lg" alignSelf="center">[</Text>
          {input.map((item, i) => (
            <HStack key={i} gap={1} align="flex-end">
              <ArrayCell
                value={item}
                highlight={i === activeIndex}
                color={i === activeIndex ? "cyan.300" : "gray.300"}
                delay={i * 0.05}
                indexLabel={`[${i}]`}
              />
              {i < input.length - 1 && <Text color="gray.600" alignSelf="center">,</Text>}
            </HStack>
          ))}
          <Text color="gray.600" fontSize="lg" alignSelf="center">]</Text>
        </HStack>
      </VStack>

      {/* Transform arrow with label */}
      <VStack gap={2} mb={6}>
        <MotionBox
          animate={{
            y: [0, -5, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Text color="cyan.500" fontSize="3xl">↓</Text>
        </MotionBox>
        <Text color="cyan.400" fontSize="sm" fontFamily="'JetBrains Mono', monospace">
          {transformLabel}()
        </Text>
      </VStack>

      {/* Output array with index labels */}
      <VStack gap={4} align="center">
        <Text color="green.400" fontSize="sm" fontWeight="medium">output (list)</Text>
        <HStack gap={2} wrap="wrap" justify="center" minH="70px" align="flex-end">
          <Text color="gray.600" fontSize="lg" alignSelf="center">[</Text>
          <AnimatePresence mode="popLayout">
            {(isComplete ? output : partialOutput).map((item, i) => (
              <HStack key={`out-${i}`} gap={1} align="flex-end">
                <ArrayCell
                  value={item}
                  highlight={i === partialOutput.length - 1 && !isComplete}
                  color="green.300"
                  delay={0.1}
                  indexLabel={`[${i}]`}
                />
                {i < (isComplete ? output.length : partialOutput.length) - 1 && (
                  <Text color="gray.600" alignSelf="center">,</Text>
                )}
              </HStack>
            ))}
          </AnimatePresence>
          {!isComplete && partialOutput.length === 0 && (
            <Text color="gray.600" fontStyle="italic" alignSelf="center">building...</Text>
          )}
          <Text color="gray.600" fontSize="lg" alignSelf="center">]</Text>
        </HStack>
      </VStack>

      {/* Step explanations */}
      <AnimatePresence mode="wait">
        {/* Step 0: Show actual solution code and relevant explanations */}
        {isShowingInput && (
          <MotionBox
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            mt={6}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="purple.800"
          >
            <Text color="purple.400" fontWeight="semibold" mb={3}>
              {challengeTitle}
            </Text>

            {/* Show actual solution code */}
            <Box mb={4} p={3} bg="gray.900" borderRadius="md" fontFamily="'JetBrains Mono', monospace" fontSize="xs" whiteSpace="pre-wrap" overflowX="auto">
              <Text color="gray.500" mb={1}># Your solution:</Text>
              <Text color="gray.300">{solutionCode}</Text>
            </Box>

            {/* Only show explanations for concepts used in the code */}
            <VStack gap={3} align="stretch">
              {codePatterns.hasEnumerate && (
                <Box p={3} bg="cyan.900/20" borderRadius="md" border="1px solid" borderColor="cyan.800">
                  <Text color="cyan.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does enumerate() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="cyan.300">enumerate()</Text> loops through a list and gives you both the
                    <Text as="span" color="yellow.300"> index</Text> and the
                    <Text as="span" color="cyan.300"> value</Text> at each position.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># Example: enumerate(["a", "b"])</Text>
                    <Text color="gray.300">→ (0, "a"), (1, "b")</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasListComprehension && (
                <Box p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                  <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    List Comprehension
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    A compact way to create lists by applying an expression to each item.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># [expression for item in iterable]</Text>
                    <Text color="gray.300">[x.upper() for x in ["a","b"]] → ["A", "B"]</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasRange && (
                <Box p={3} bg="orange.900/20" borderRadius="md" border="1px solid" borderColor="orange.800">
                  <Text color="orange.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does range() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="orange.300">range(n)</Text> generates numbers from 0 to n-1.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># Example: list(range(3))</Text>
                    <Text color="gray.300">→ [0, 1, 2]</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasZip && (
                <Box p={3} bg="pink.900/20" borderRadius="md" border="1px solid" borderColor="pink.800">
                  <Text color="pink.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does zip() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="pink.300">zip()</Text> pairs up elements from multiple lists.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># zip([1,2], ['a','b'])</Text>
                    <Text color="gray.300">→ (1,'a'), (2,'b')</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasMap && (
                <Box p={3} bg="blue.900/20" borderRadius="md" border="1px solid" borderColor="blue.800">
                  <Text color="blue.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does map() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="blue.300">map(func, list)</Text> applies a function to every element.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># list(map(str.upper, ["a","b"]))</Text>
                    <Text color="gray.300">→ ["A", "B"]</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasFilter && (
                <Box p={3} bg="purple.900/20" borderRadius="md" border="1px solid" borderColor="purple.800">
                  <Text color="purple.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does filter() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="purple.300">filter(func, list)</Text> keeps only items where func returns True.
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># list(filter(lambda x: x {">"} 0, [-1, 2, 3]))</Text>
                    <Text color="gray.300">→ [2, 3]</Text>
                  </Box>
                </Box>
              )}
            </VStack>
          </MotionBox>
        )}

        {/* Active step: Show current transformation */}
        {activeIndex >= 0 && activeIndex < input.length && !isComplete && (
          <MotionBox
            key={activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            mt={6}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Processing input[{activeIndex}]:
            </Text>
            <HStack gap={4} justify="center" mb={3}>
              <VStack gap={1}>
                <Text color="gray.500" fontSize="xs">input[{activeIndex}]</Text>
                <ArrayCell value={input[activeIndex]} color="cyan.300" />
              </VStack>
              <ArrayArrow delay={0.1} />
              <VStack gap={1}>
                <Text color="gray.500" fontSize="xs">output[{activeIndex}]</Text>
                <ArrayCell
                  value={output[activeIndex]}
                  color="green.300"
                  highlight
                  delay={0.2}
                />
              </VStack>
            </HStack>
            <Text color="gray.400" fontSize="sm" textAlign="center" fontFamily="'JetBrains Mono', monospace">
              {transformLabel}(input[{activeIndex}]) → output[{activeIndex}]
            </Text>
          </MotionBox>
        )}

        {isComplete && (
          <MotionBox
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            mt={6}
            p={4}
            bg="green.900/30"
            borderRadius="lg"
            border="2px solid"
            borderColor="green.500"
            textAlign="center"
          >
            <Text color="green.300" fontWeight="bold" fontSize="lg">
              Transformation complete!
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              {input.length} elements → {output.length} elements
            </Text>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a simple array transformation
export function isArrayTransformTestCase(input: unknown, output: unknown): boolean {
  return (
    (Array.isArray(input) || typeof input === "string") &&
    Array.isArray(output)
  );
}
