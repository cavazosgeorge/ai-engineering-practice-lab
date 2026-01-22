import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface DecodeOperationProps {
  ids: number[];
  vocab: Record<string, number>;
  output: string;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Token ID display
function TokenId({
  id,
  index,
  isActive,
  delay = 0,
}: {
  id: number;
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
      <Text color={isActive ? "cyan.300" : "gray.300"} fontSize="sm" fontWeight="bold">{id}</Text>
      {index !== undefined && (
        <Text color="gray.500" fontSize="xs">[{index}]</Text>
      )}
    </MotionBox>
  );
}

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
      bg={isActive ? "green.900/50" : "gray.700"}
      border="2px solid"
      borderColor={isActive ? "green.500" : "gray.600"}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
    >
      <Text color={isActive ? "green.300" : "gray.300"} fontSize="sm">"{word}"</Text>
      {index !== undefined && (
        <Text color="gray.500" fontSize="xs">[{index}]</Text>
      )}
    </MotionBox>
  );
}

export function DecodeOperation({
  ids,
  vocab,
  output,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: DecodeOperationProps) {
  // Build reverse vocab for lookups
  const reverseVocab: Record<number, string> = {};
  for (const [word, id] of Object.entries(vocab)) {
    reverseVocab[id] = word;
  }

  const words = ids.map(id => reverseVocab[id]);

  // Steps:
  // 0: Show intro with code
  // 1: Show the input token IDs
  // 2: Build reverse vocabulary
  // 3 to 3+ids.length-1: Look up each ID
  // final: Show complete result

  const lookupStartStep = 3;
  const activeIdIndex = currentStep >= lookupStartStep
    ? Math.min(currentStep - lookupStartStep, ids.length - 1)
    : -1;
  const isLookingUp = currentStep >= lookupStartStep && currentStep < lookupStartStep + ids.length;
  const isComplete = currentStep >= lookupStartStep + ids.length;

  // Build partial output based on current step
  const partialWords = words.slice(0, Math.max(0, currentStep - lookupStartStep + 1));

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
                How decoding works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Build a reverse vocabulary (ID → word)
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Look up each token ID in the reverse vocabulary
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Join the words with spaces
              </Text>
            </Box>

            {codePatterns.hasListComprehension && (
              <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                  Dictionary Comprehension
                </Text>
                <Text color="gray.400" fontSize="xs" fontFamily="mono">
                  {"{"}v: k for k, v in vocab.items(){"}"}
                </Text>
                <Text color="gray.500" fontSize="xs" mt={1}>
                  Swaps keys and values to create a reverse mapping
                </Text>
              </Box>
            )}
          </MotionBox>
        )}

        {/* Step 1: Show input token IDs */}
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
              Step 1: Start with the input token IDs
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              We receive a list of integer token IDs to decode back to text.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md" textAlign="center">
              <Text color="gray.500" fontSize="sm" mb={2}>ids =</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {ids.map((id, i) => (
                  <HStack key={i} gap={1}>
                    <TokenId id={id} index={i} delay={i * 0.15} />
                    {i < ids.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Build reverse vocabulary */}
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
              Step 2: Build reverse vocabulary
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              The vocab maps word → ID. We need to reverse it to ID → word.
            </Text>

            {/* Original vocab */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Original vocab (word → ID):</Text>
              <VStack gap={2} align="stretch">
                {Object.entries(vocab).map(([word, id], i) => (
                  <MotionBox
                    key={word}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <HStack justify="center" fontFamily="mono" fontSize="sm" gap={2}>
                      <Text color="cyan.300">"{word}"</Text>
                      <Text color="gray.500">→</Text>
                      <Text color="yellow.300" fontWeight="bold">{id}</Text>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            {/* Arrow */}
            <VStack mb={4}>
              <Text color="pink.300" fontFamily="mono" fontSize="sm">{"{"}v: k for k, v in vocab.items(){"}"}</Text>
              <MotionBox
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Text color="cyan.500" fontSize="2xl">↓</Text>
              </MotionBox>
            </VStack>

            {/* Reverse vocab */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Reverse vocab (ID → word):</Text>
              <VStack gap={2} align="stretch">
                {Object.entries(reverseVocab).map(([id, word], i) => (
                  <MotionBox
                    key={id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Object.keys(vocab).length * 0.1 + i * 0.1 }}
                  >
                    <HStack justify="center" fontFamily="mono" fontSize="sm" gap={2}>
                      <Text color="yellow.300" fontWeight="bold">{id}</Text>
                      <Text color="gray.500">→</Text>
                      <Text color="green.300">"{word}"</Text>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Object.keys(vocab).length * 0.2 + 0.2 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontFamily="mono" fontSize="sm">
                reverse_vocab = {"{"}
                {Object.entries(reverseVocab).map(([id, word]) => `${id}: "${word}"`).join(", ")}
                {"}"}
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Steps 3+: Look up each ID */}
        {isLookingUp && (
          <MotionBox
            key={`lookup-${activeIdIndex}`}
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
              Step {currentStep}: Look up ID {ids[activeIdIndex]} in reverse vocabulary
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Find the word for each token ID using <Text as="span" color="yellow.300" fontFamily="mono">reverse_vocab[id]</Text>
            </Text>

            {/* IDs with active highlight */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Token IDs:</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                {ids.map((id, i) => (
                  <TokenId
                    key={i}
                    id={id}
                    index={i}
                    isActive={i === activeIdIndex}
                  />
                ))}
              </HStack>
            </Box>

            {/* Reverse vocab lookup */}
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
                Reverse Vocabulary Lookup:
              </Text>
              <HStack gap={0} justify="center" fontFamily="mono" fontSize="sm">
                <Text color="gray.400">reverse_vocab[</Text>
                <Text color="cyan.300" fontWeight="bold">{ids[activeIdIndex]}</Text>
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
                    "{reverseVocab[ids[activeIdIndex]]}"
                  </Text>
                </MotionBox>
              </HStack>
            </MotionBox>

            {/* Building words array */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">Words (building...):</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {partialWords.map((word, i) => (
                  <HStack key={i} gap={1}>
                    <WordToken
                      word={word}
                      index={i}
                      isActive={i === partialWords.length - 1}
                      delay={0.5}
                    />
                    {i < partialWords.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                {partialWords.length < ids.length && (
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
              Decoding Complete!
            </Text>

            {/* Summary */}
            <VStack gap={4} mb={6}>
              {/* Input */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Input token IDs:</Text>
                <Text color="cyan.300" fontFamily="mono" textAlign="center">[{ids.join(", ")}]</Text>
              </Box>

              <Text color="gray.500" fontSize="xl">↓</Text>

              {/* Join step */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Join words with spaces:</Text>
                <Text color="pink.300" fontFamily="mono" textAlign="center" fontSize="sm">
                  " ".join([{words.map(w => `"${w}"`).join(", ")}])
                </Text>
              </Box>

              <Text color="gray.500" fontSize="xl">↓</Text>

              {/* Output */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Decoded text:</Text>
                <Text color="green.300" fontFamily="mono" textAlign="center" fontWeight="bold" fontSize="lg">
                  "{output}"
                </Text>
              </Box>
            </VStack>

            {/* ID to Word mapping */}
            <Box p={4} bg="gray.800" borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={3}>Token ID → Word mapping:</Text>
              <VStack gap={2} align="stretch">
                {ids.map((id, i) => (
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
                        <Text color="cyan.300" fontWeight="bold">{id}</Text>
                      </HStack>
                      <HStack gap={2}>
                        <Text color="gray.500">→</Text>
                        <Text color="green.300">"{reverseVocab[id]}"</Text>
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

// Helper to detect if test case is a decode operation
export function isDecodeTestCase(input: unknown, challengeTitle: string): input is [number[], Record<string, number>] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("decode")) return false;
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [ids, vocab] = input;
  return (
    Array.isArray(ids) &&
    ids.every(id => typeof id === "number") &&
    typeof vocab === "object" &&
    vocab !== null
  );
}

// Get total steps for decode visualization
export function getDecodeTotalSteps(ids: number[]): number {
  return 3 + ids.length + 1; // intro + ids + reverse vocab + lookups + complete
}
