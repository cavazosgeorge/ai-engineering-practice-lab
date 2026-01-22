import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface EncodeOperationProps {
  text: string;
  vocab: Record<string, number>;
  output: number[];
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Word token display
function WordToken({
  word,
  index,
  isActive,
  delay = 0,
}: {
  word: string;
  index?: number;
  isActive?: boolean;
  delay?: number;
}) {
  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={isActive ? "cyan.900/50" : "gray.700"}
      border="2px solid"
      borderColor={isActive ? "cyan.500" : "gray.600"}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
    >
      <Text color={isActive ? "cyan.300" : "gray.300"} fontSize="sm">"{word}"</Text>
      {index !== undefined && (
        <Text color="gray.500" fontSize="xs">[{index}]</Text>
      )}
    </MotionBox>
  );
}

// Token ID display
function TokenId({
  id,
  index,
  isActive,
  delay = 0,
}: {
  id: number;
  index: number;
  isActive?: boolean;
  delay?: number;
}) {
  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={isActive ? "green.900/50" : "gray.700"}
      border="2px solid"
      borderColor={isActive ? "green.500" : "gray.600"}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
    >
      <Text color={isActive ? "green.300" : "gray.300"} fontSize="sm" fontWeight="bold">{id}</Text>
      <Text color="gray.500" fontSize="xs">[{index}]</Text>
    </MotionBox>
  );
}

export function EncodeOperation({
  text,
  vocab,
  output,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: EncodeOperationProps) {
  const words = text.split(/\s+/);

  // Steps:
  // 0: Show intro with code
  // 1: Show the input text string
  // 2: Split into words
  // 3 to 3+words.length-1: Look up each word
  // final: Show complete result

  const lookupStartStep = 3;
  const activeWordIndex = currentStep >= lookupStartStep
    ? Math.min(currentStep - lookupStartStep, words.length - 1)
    : -1;
  const isLookingUp = currentStep >= lookupStartStep && currentStep < lookupStartStep + words.length;
  const isComplete = currentStep >= lookupStartStep + words.length;

  // Build partial output based on current step
  const partialOutput = output.slice(0, Math.max(0, currentStep - lookupStartStep + 1));

  return (
    <Box>
      <AnimatePresence mode="wait">
        {/* Step 0: Introduction */}
        {currentStep === 0 && (
          <MotionBox
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="purple.800"
          >
            <Text color="purple.400" fontWeight="semibold" mb={3}>
              {challengeTitle}
            </Text>

            <Box mb={4} p={3} bg="gray.900" borderRadius="md" fontFamily="mono" fontSize="xs" whiteSpace="pre-wrap">
              <Text color="gray.500" mb={1}># Your solution:</Text>
              <Text color="gray.300">{solutionCode}</Text>
            </Box>

            <Box p={3} bg="cyan.900/20" borderRadius="md" border="1px solid" borderColor="cyan.800">
              <Text color="cyan.300" fontSize="sm" fontWeight="semibold" mb={2}>
                How encoding works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Split the text into individual words
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Look up each word in the vocabulary dictionary
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Return the list of token IDs
              </Text>
            </Box>

            {codePatterns.hasListComprehension && (
              <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                  List Comprehension
                </Text>
                <Text color="gray.400" fontSize="xs" fontFamily="mono">
                  [vocab[word] for word in text.split()]
                </Text>
                <Text color="gray.500" fontSize="xs" mt={1}>
                  Transforms each word into its token ID in one line
                </Text>
              </Box>
            )}
          </MotionBox>
        )}

        {/* Step 1: Show input text */}
        {currentStep === 1 && (
          <MotionBox
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Step 1: Start with the input text
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              We receive a string containing words separated by spaces.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md" textAlign="center">
              <Text color="gray.500" fontSize="sm" mb={2}>text =</Text>
              <MotionBox
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                display="inline-block"
                px={6}
                py={3}
                bg="cyan.900/30"
                border="2px solid"
                borderColor="cyan.600"
                borderRadius="lg"
              >
                <Text color="cyan.300" fontSize="xl" fontFamily="mono">
                  "{text}"
                </Text>
              </MotionBox>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Split into words */}
        {currentStep === 2 && (
          <MotionBox
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Step 2: Split text on whitespace
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">text.split()</Text> breaks the string into a list of words.
            </Text>

            {/* Before: string */}
            <Box p={3} bg="gray.900" borderRadius="md" textAlign="center" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2}>Before (string):</Text>
              <Text color="cyan.300" fontSize="lg" fontFamily="mono">"{text}"</Text>
            </Box>

            {/* Arrow */}
            <VStack mb={4}>
              <Text color="pink.300" fontFamily="mono" fontSize="sm">.split()</Text>
              <MotionBox
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Text color="cyan.500" fontSize="2xl">↓</Text>
              </MotionBox>
            </VStack>

            {/* After: list of words */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">After (list of words):</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {words.map((word, i) => (
                  <HStack key={i} gap={1}>
                    <WordToken word={word} index={i} delay={i * 0.15} />
                    {i < words.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: words.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontFamily="mono" fontSize="sm">
                words = [{words.map(w => `"${w}"`).join(", ")}]
              </Text>
              <Text color="gray.400" fontSize="xs" mt={1}>
                {words.length} word{words.length !== 1 ? "s" : ""} to encode
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Steps 3+: Look up each word */}
        {isLookingUp && (
          <MotionBox
            key={`lookup-${activeWordIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Step {currentStep}: Look up "{words[activeWordIndex]}" in vocabulary
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Find the token ID for each word using <Text as="span" color="yellow.300" fontFamily="mono">vocab[word]</Text>
            </Text>

            {/* Words with active highlight */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Words:</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                {words.map((word, i) => (
                  <WordToken
                    key={i}
                    word={word}
                    index={i}
                    isActive={i === activeWordIndex}
                  />
                ))}
              </HStack>
            </Box>

            {/* Vocabulary lookup */}
            <MotionBox
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              p={4}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              mb={4}
            >
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={3}>
                Vocabulary Lookup:
              </Text>
              <HStack gap={0} justify="center" fontFamily="mono" fontSize="sm">
                <Text color="gray.400">vocab[</Text>
                <Text color="cyan.300">"{words[activeWordIndex]}"</Text>
                <Text color="gray.400">]</Text>
                <Text color="gray.500" mx={3}>=</Text>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  px={3}
                  py={1}
                  bg="green.900/50"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="green.500"
                >
                  <Text color="green.300" fontWeight="bold" fontSize="lg">
                    {vocab[words[activeWordIndex]]}
                  </Text>
                </MotionBox>
              </HStack>
            </MotionBox>

            {/* Building output array */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Output (building...):</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {partialOutput.map((id, i) => (
                  <HStack key={i} gap={1}>
                    <TokenId
                      id={id}
                      index={i}
                      isActive={i === partialOutput.length - 1}
                      delay={0.5}
                    />
                    {i < partialOutput.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                {partialOutput.length < words.length && (
                  <Text color="gray.600" fontStyle="italic">...</Text>
                )}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>
          </MotionBox>
        )}

        {/* Final: Complete result */}
        {isComplete && (
          <MotionBox
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            p={4}
            bg="green.900/20"
            borderRadius="lg"
            border="2px solid"
            borderColor="green.600"
          >
            <Text color="green.300" fontWeight="bold" fontSize="lg" mb={4} textAlign="center">
              Encoding Complete!
            </Text>

            {/* Summary */}
            <VStack gap={4} mb={6}>
              {/* Input */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Input text:</Text>
                <Text color="cyan.300" fontFamily="mono" textAlign="center">"{text}"</Text>
              </Box>

              <Text color="gray.500" fontSize="xl">↓</Text>

              {/* Output */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Token IDs:</Text>
                <Text color="green.300" fontFamily="mono" textAlign="center" fontWeight="bold">
                  [{output.join(", ")}]
                </Text>
              </Box>
            </VStack>

            {/* Word to ID mapping */}
            <Box p={4} bg="gray.800" borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={3}>Word → Token ID mapping:</Text>
              <VStack gap={2} align="stretch">
                {words.map((word, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <HStack
                      justify="space-between"
                      p={2}
                      bg="gray.900"
                      borderRadius="md"
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      <HStack gap={2}>
                        <Text color="gray.500">[{i}]</Text>
                        <Text color="cyan.300">"{word}"</Text>
                      </HStack>
                      <HStack gap={2}>
                        <Text color="gray.500">→</Text>
                        <Text color="green.300" fontWeight="bold">{output[i]}</Text>
                      </HStack>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is an encode operation
export function isEncodeTestCase(input: unknown, challengeTitle: string): input is [string, Record<string, number>] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("encode") || lowerTitle.includes("decode")) return false;
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [text, vocab] = input;
  return typeof text === "string" && typeof vocab === "object" && vocab !== null;
}

// Get total steps for encode visualization
export function getEncodeTotalSteps(text: string): number {
  const words = text.split(/\s+/);
  return 3 + words.length + 1; // intro + text + split + lookups + complete
}
