import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface UnkEncodeOperationProps {
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
  isUnknown,
  delay = 0,
}: {
  word: string;
  index?: number;
  isActive?: boolean;
  isUnknown?: boolean;
  delay?: number;
}) {
  const bgColor = isActive
    ? isUnknown
      ? "red.900/50"
      : "cyan.900/50"
    : "gray.700";
  const borderColor = isActive
    ? isUnknown
      ? "red.500"
      : "cyan.500"
    : "gray.600";
  const textColor = isActive
    ? isUnknown
      ? "red.300"
      : "cyan.300"
    : "gray.300";

  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={bgColor}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
    >
      <Text color={textColor} fontSize="sm">"{word}"</Text>
      {index !== undefined && (
        <Text color="gray.500" fontSize="xs">[{index}]</Text>
      )}
      {isActive && isUnknown && (
        <Text color="red.400" fontSize="xs" fontWeight="bold">NOT IN VOCAB</Text>
      )}
    </MotionBox>
  );
}

// Token ID display
function TokenId({
  id,
  index,
  isActive,
  isUnk,
  delay = 0,
}: {
  id: number;
  index: number;
  isActive?: boolean;
  isUnk?: boolean;
  delay?: number;
}) {
  const bgColor = isActive
    ? isUnk
      ? "red.900/50"
      : "green.900/50"
    : "gray.700";
  const borderColor = isActive
    ? isUnk
      ? "red.500"
      : "green.500"
    : "gray.600";
  const textColor = isActive
    ? isUnk
      ? "red.300"
      : "green.300"
    : "gray.300";

  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={bgColor}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
    >
      <Text color={textColor} fontSize="sm" fontWeight="bold">{id}</Text>
      <Text color="gray.500" fontSize="xs">[{index}]</Text>
      {isUnk && (
        <Text color="red.400" fontSize="xs">[UNK]</Text>
      )}
    </MotionBox>
  );
}

export function UnkEncodeOperation({
  text,
  vocab,
  output,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: UnkEncodeOperationProps) {
  const words = text.split(/\s+/);
  const unkId = vocab["[UNK]"];

  // Determine which words are unknown
  const wordIsUnknown = words.map(word => !(word in vocab));

  // Steps:
  // 0: Show intro with code
  // 1: Show the input text and vocabulary
  // 2: Get UNK ID from vocabulary
  // 3: Split into words
  // 4 to 4+words.length-1: Look up each word (with UNK handling)
  // final: Show complete result

  const lookupStartStep = 4;
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
                How UNK handling works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Get the [UNK] token ID from the vocabulary
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Split the text into individual words
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. For each word: use vocab[word] if known, otherwise use [UNK] ID
              </Text>
            </Box>

            <Box mt={3} p={3} bg="red.900/20" borderRadius="md" border="1px solid" borderColor="red.800">
              <Text color="red.300" fontSize="sm" fontWeight="semibold" mb={1}>
                Why [UNK] tokens?
              </Text>
              <Text color="gray.400" fontSize="xs">
                Real-world text often contains words not in our vocabulary (typos, rare words, names).
                The [UNK] token is a fallback that lets us encode any text, even with unknown words.
              </Text>
            </Box>

            {codePatterns.hasListComprehension && (
              <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                  vocab.get(word, default)
                </Text>
                <Text color="gray.400" fontSize="xs" fontFamily="mono">
                  vocab.get(word, unk_id) returns vocab[word] if exists, else unk_id
                </Text>
              </Box>
            )}
          </MotionBox>
        )}

        {/* Step 1: Show input text and vocabulary */}
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
              Step 1: Examine the inputs
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              We have a text string to encode and a vocabulary that includes [UNK].
            </Text>

            {/* Input text */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2}>text =</Text>
              <Text color="cyan.300" fontSize="lg" fontFamily="mono" textAlign="center">
                "{text}"
              </Text>
            </Box>

            {/* Vocabulary */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3}>vocab =</Text>
              <VStack gap={2} align="stretch">
                {Object.entries(vocab).map(([word, id], i) => (
                  <MotionBox
                    key={word}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <HStack
                      justify="space-between"
                      p={2}
                      bg={word === "[UNK]" ? "red.900/30" : "gray.800"}
                      borderRadius="md"
                      border={word === "[UNK]" ? "1px solid" : "none"}
                      borderColor="red.700"
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      <Text color={word === "[UNK]" ? "red.300" : "cyan.300"}>
                        "{word}"
                      </Text>
                      <HStack gap={2}>
                        <Text color="gray.500">→</Text>
                        <Text color={word === "[UNK]" ? "red.300" : "yellow.300"} fontWeight="bold">
                          {id}
                        </Text>
                      </HStack>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Get UNK ID */}
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
            borderColor="red.800"
          >
            <Text color="red.400" fontWeight="semibold" mb={3}>
              Step 2: Get the [UNK] token ID
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Store the [UNK] ID so we can use it as a fallback for unknown words.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md" textAlign="center">
              <HStack justify="center" gap={3} fontFamily="mono">
                <Text color="gray.400">unk_id = vocab[</Text>
                <Text color="red.300">"[UNK]"</Text>
                <Text color="gray.400">]</Text>
              </HStack>

              <MotionBox
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                mt={4}
              >
                <Text color="gray.500" fontSize="sm" mb={2}>↓</Text>
                <Box
                  display="inline-block"
                  px={6}
                  py={3}
                  bg="red.900/50"
                  border="2px solid"
                  borderColor="red.500"
                  borderRadius="lg"
                >
                  <Text color="red.300" fontSize="2xl" fontWeight="bold">
                    unk_id = {unkId}
                  </Text>
                </Box>
              </MotionBox>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              mt={4}
              p={3}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
            >
              <Text color="yellow.300" fontSize="sm">
                This ID ({unkId}) will be used whenever we encounter a word not in our vocabulary.
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 3: Split into words */}
        {currentStep === 3 && (
          <MotionBox
            key="step3"
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
              Step 3: Split text into words
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

            {/* After: list of words with unknown highlighting */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">After (list of words):</Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {words.map((word, i) => (
                  <HStack key={i} gap={1}>
                    <VStack gap={1}>
                      <MotionBox
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.15 }}
                        px={3}
                        py={2}
                        bg={wordIsUnknown[i] ? "red.900/30" : "gray.700"}
                        border="2px solid"
                        borderColor={wordIsUnknown[i] ? "red.600" : "gray.600"}
                        borderRadius="md"
                        fontFamily="mono"
                        textAlign="center"
                      >
                        <Text color={wordIsUnknown[i] ? "red.300" : "gray.300"} fontSize="sm">
                          "{word}"
                        </Text>
                        <Text color="gray.500" fontSize="xs">[{i}]</Text>
                      </MotionBox>
                      {wordIsUnknown[i] && (
                        <MotionBox
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.15 + 0.2 }}
                        >
                          <Text color="red.400" fontSize="xs">unknown!</Text>
                        </MotionBox>
                      )}
                    </VStack>
                    {i < words.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: words.length * 0.15 + 0.3 }}
              mt={4}
              p={3}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              textAlign="center"
            >
              <Text color="yellow.300" fontSize="sm">
                {wordIsUnknown.filter(Boolean).length} word{wordIsUnknown.filter(Boolean).length !== 1 ? "s" : ""} not in vocabulary → will use [UNK] ID ({unkId})
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Steps 4+: Look up each word */}
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
            borderColor={wordIsUnknown[activeWordIndex] ? "red.800" : "cyan.800"}
          >
            <Text color={wordIsUnknown[activeWordIndex] ? "red.400" : "cyan.400"} fontWeight="semibold" mb={3}>
              Step {currentStep}: Look up "{words[activeWordIndex]}"
              {wordIsUnknown[activeWordIndex] && " (NOT IN VOCAB!)"}
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              {wordIsUnknown[activeWordIndex]
                ? <><Text as="span" color="red.300">"{words[activeWordIndex]}"</Text> is not in vocab → use <Text as="span" color="red.300" fontFamily="mono">unk_id</Text></>
                : <><Text as="span" color="cyan.300">"{words[activeWordIndex]}"</Text> is in vocab → use <Text as="span" color="yellow.300" fontFamily="mono">vocab[word]</Text></>
              }
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
                    isUnknown={wordIsUnknown[i]}
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
              bg={wordIsUnknown[activeWordIndex] ? "red.900/20" : "yellow.900/20"}
              borderRadius="md"
              border="1px solid"
              borderColor={wordIsUnknown[activeWordIndex] ? "red.700" : "yellow.700"}
              mb={4}
            >
              <Text color={wordIsUnknown[activeWordIndex] ? "red.300" : "yellow.300"} fontSize="sm" fontWeight="semibold" mb={3}>
                {wordIsUnknown[activeWordIndex] ? "Fallback to UNK:" : "Vocabulary Lookup:"}
              </Text>

              {wordIsUnknown[activeWordIndex] ? (
                <VStack gap={2}>
                  <HStack gap={0} justify="center" fontFamily="mono" fontSize="sm">
                    <Text color="gray.400">vocab.get(</Text>
                    <Text color="red.300">"{words[activeWordIndex]}"</Text>
                    <Text color="gray.400">, </Text>
                    <Text color="red.300">unk_id</Text>
                    <Text color="gray.400">)</Text>
                  </HStack>
                  <Text color="gray.500" fontSize="xs">
                    "{words[activeWordIndex]}" not found → using unk_id
                  </Text>
                  <MotionBox
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    px={3}
                    py={1}
                    bg="red.900/50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="red.500"
                  >
                    <Text color="red.300" fontWeight="bold" fontSize="lg">
                      {unkId} <Text as="span" fontSize="sm" fontWeight="normal">[UNK]</Text>
                    </Text>
                  </MotionBox>
                </VStack>
              ) : (
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
              )}
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
                      isUnk={id === unkId}
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
                <HStack justify="center" gap={2} fontFamily="mono">
                  <Text color="gray.400">[</Text>
                  {output.map((id, i) => (
                    <Text
                      key={i}
                      color={id === unkId ? "red.300" : "green.300"}
                      fontWeight="bold"
                    >
                      {id}{i < output.length - 1 ? "," : ""}
                    </Text>
                  ))}
                  <Text color="gray.400">]</Text>
                </HStack>
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
                      bg={wordIsUnknown[i] ? "red.900/30" : "gray.900"}
                      borderRadius="md"
                      border={wordIsUnknown[i] ? "1px solid" : "none"}
                      borderColor="red.700"
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      <HStack gap={2}>
                        <Text color="gray.500">[{i}]</Text>
                        <Text color={wordIsUnknown[i] ? "red.300" : "cyan.300"}>"{word}"</Text>
                        {wordIsUnknown[i] && (
                          <Text color="red.400" fontSize="xs">(unknown)</Text>
                        )}
                      </HStack>
                      <HStack gap={2}>
                        <Text color="gray.500">→</Text>
                        <Text color={wordIsUnknown[i] ? "red.300" : "green.300"} fontWeight="bold">
                          {output[i]}
                        </Text>
                        {wordIsUnknown[i] && (
                          <Text color="red.400" fontSize="xs">[UNK]</Text>
                        )}
                      </HStack>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            {/* Summary stats */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              mt={4}
              p={3}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              textAlign="center"
            >
              <Text color="yellow.300" fontSize="sm">
                {words.length - wordIsUnknown.filter(Boolean).length} known word{words.length - wordIsUnknown.filter(Boolean).length !== 1 ? "s" : ""} • {wordIsUnknown.filter(Boolean).length} unknown → [UNK]
              </Text>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a UNK encode operation
export function isUnkEncodeTestCase(input: unknown, challengeTitle: string): input is [string, Record<string, number>] {
  const lowerTitle = challengeTitle.toLowerCase();
  // Must have UNK or "out of vocabulary" in title, and be an encode-like operation
  if (!lowerTitle.includes("unk") && !lowerTitle.includes("out of vocabulary") && !lowerTitle.includes("out-of-vocabulary")) {
    return false;
  }
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [text, vocab] = input;
  // Must have [UNK] in the vocabulary
  return (
    typeof text === "string" &&
    typeof vocab === "object" &&
    vocab !== null &&
    "[UNK]" in vocab
  );
}

// Get total steps for UNK encode visualization
export function getUnkEncodeTotalSteps(text: string): number {
  const words = text.split(/\s+/);
  return 4 + words.length + 1; // intro + inputs + unk_id + split + lookups + complete
}
