import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface BuildVocabOperationProps {
  text: string;
  output: Record<string, number>;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Character cell display
function CharCell({
  char,
  index,
  isActive,
  isDuplicate,
  delay = 0,
}: {
  char: string;
  index?: number;
  isActive?: boolean;
  isDuplicate?: boolean;
  delay?: number;
}) {
  const bgColor = isActive
    ? "cyan.900/50"
    : isDuplicate
      ? "gray.800"
      : "gray.700";
  const borderColor = isActive
    ? "cyan.500"
    : isDuplicate
      ? "gray.700"
      : "gray.600";
  const textColor = isActive
    ? "cyan.300"
    : isDuplicate
      ? "gray.500"
      : "gray.300";

  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: isDuplicate ? 0.5 : 1,
      }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={bgColor}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="md"
      fontFamily="'JetBrains Mono', monospace"
      textAlign="center"
      position="relative"
    >
      <Text color={textColor} fontSize="lg" fontWeight="bold">
        "{char}"
      </Text>
      {index !== undefined && (
        <Text color="gray.500" fontSize="xs">[{index}]</Text>
      )}
      {isDuplicate && (
        <MotionBox
          position="absolute"
          top="-8px"
          right="-8px"
          px={1.5}
          py={0.5}
          bg="yellow.900"
          borderRadius="full"
          border="1px solid"
          borderColor="yellow.600"
        >
          <Text color="yellow.300" fontSize="xs" fontWeight="bold">dup</Text>
        </MotionBox>
      )}
    </MotionBox>
  );
}

// Vocab entry display
function VocabEntry({
  char,
  id,
  isActive,
  delay = 0,
}: {
  char: string;
  id: number;
  isActive?: boolean;
  delay?: number;
}) {
  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0, x: -20 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <HStack
        p={2}
        bg={isActive ? "green.900/50" : "gray.800"}
        border="2px solid"
        borderColor={isActive ? "green.500" : "gray.700"}
        borderRadius="md"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="sm"
        gap={3}
      >
        <Text color={isActive ? "cyan.300" : "gray.300"}>"{char}"</Text>
        <Text color="gray.500">:</Text>
        <Text color={isActive ? "green.300" : "yellow.300"} fontWeight="bold">{id}</Text>
      </HStack>
    </MotionBox>
  );
}

export function BuildVocabOperation({
  text,
  output,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: BuildVocabOperationProps) {
  const chars = text.split("");

  // Get unique characters preserving order
  const uniqueChars = [...new Set(chars)];

  // Track which positions are duplicates
  const seenChars = new Set<string>();
  const isDuplicate = chars.map(char => {
    if (seenChars.has(char)) {
      return true;
    }
    seenChars.add(char);
    return false;
  });

  // Steps:
  // 0: Show intro with code
  // 1: Show the input text as characters
  // 2: Identify and remove duplicates
  // 3: Show enumerate pairing
  // 4: Build dictionary
  // 5: Final result

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
                How building a character vocabulary works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Extract all characters from the text
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Remove duplicates (keep first occurrence only)
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Assign each unique character an ID (0, 1, 2, ...)
              </Text>
              <Text color="gray.300" fontSize="sm">
                4. Return as a dictionary: {"{"}char: id{"}"}
              </Text>
            </Box>

            {codePatterns.hasEnumerate && (
              <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                  enumerate() for ID assignment
                </Text>
                <Text color="gray.400" fontSize="xs" fontFamily="mono">
                  enumerate(chars) → (0, 'h'), (1, 'e'), (2, 'l'), ...
                </Text>
              </Box>
            )}
          </MotionBox>
        )}

        {/* Step 1: Show input text as characters */}
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
              We receive a string and need to examine each character.
            </Text>

            {/* Original string */}
            <Box p={4} bg="gray.900" borderRadius="md" textAlign="center" mb={4}>
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
                <Text color="cyan.300" fontSize="2xl" fontFamily="mono">
                  "{text}"
                </Text>
              </MotionBox>
            </Box>

            {/* Characters array */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                As a list of characters:
              </Text>
              <HStack gap={2} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {chars.map((char, i) => (
                  <HStack key={i} gap={1}>
                    <CharCell char={char} index={i} delay={i * 0.08} />
                    {i < chars.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: chars.length * 0.08 + 0.2 }}
              mt={4}
              p={3}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              textAlign="center"
            >
              <Text color="yellow.300" fontSize="sm">
                {chars.length} total characters, {uniqueChars.length} unique
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 2: Identify and remove duplicates */}
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
              Step 2: Remove duplicate characters
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">dict.fromkeys(text)</Text> keeps only the first occurrence of each character.
            </Text>

            {/* Before: all characters with duplicates marked */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                All characters (duplicates marked):
              </Text>
              <HStack gap={2} justify="center" wrap="wrap">
                {chars.map((char, i) => (
                  <CharCell
                    key={i}
                    char={char}
                    index={i}
                    isDuplicate={isDuplicate[i]}
                    delay={i * 0.08}
                  />
                ))}
              </HStack>
            </Box>

            {/* Arrow */}
            <VStack mb={4}>
              <Text color="pink.300" fontFamily="mono" fontSize="sm">dict.fromkeys(text)</Text>
              <MotionBox
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Text color="cyan.500" fontSize="2xl">↓</Text>
              </MotionBox>
            </VStack>

            {/* After: unique characters only */}
            <Box p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Unique characters (preserving order):
              </Text>
              <HStack gap={3} justify="center" wrap="wrap">
                <Text color="gray.600" fontSize="lg">[</Text>
                {uniqueChars.map((char, i) => (
                  <HStack key={i} gap={1}>
                    <MotionBox
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: chars.length * 0.08 + i * 0.15 }}
                      px={3}
                      py={2}
                      bg="green.900/50"
                      border="2px solid"
                      borderColor="green.600"
                      borderRadius="md"
                      fontFamily="mono"
                    >
                      <Text color="green.300" fontSize="lg" fontWeight="bold">"{char}"</Text>
                    </MotionBox>
                    {i < uniqueChars.length - 1 && <Text color="gray.600">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.600" fontSize="lg">]</Text>
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: chars.length * 0.08 + uniqueChars.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontFamily="mono" fontSize="sm">
                chars = [{uniqueChars.map(c => `"${c}"`).join(", ")}]
              </Text>
              <Text color="gray.400" fontSize="xs" mt={1}>
                {chars.length - uniqueChars.length} duplicate{chars.length - uniqueChars.length !== 1 ? "s" : ""} removed
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 3: Show enumerate pairing */}
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
            borderColor="yellow.800"
          >
            <Text color="yellow.400" fontWeight="semibold" mb={3}>
              Step 3: Pair each character with an ID using enumerate()
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="yellow.300" fontFamily="mono">enumerate(chars)</Text> gives us (index, character) pairs.
            </Text>

            {/* Unique chars */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2} textAlign="center">chars =</Text>
              <HStack gap={2} justify="center" wrap="wrap">
                {uniqueChars.map((char, i) => (
                  <Text key={i} color="green.300" fontFamily="mono">"{char}"{i < uniqueChars.length - 1 ? "," : ""}</Text>
                ))}
              </HStack>
            </Box>

            {/* Arrow */}
            <VStack mb={4}>
              <Text color="yellow.300" fontFamily="mono" fontSize="sm">enumerate(chars)</Text>
              <MotionBox
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Text color="yellow.500" fontSize="2xl">↓</Text>
              </MotionBox>
            </VStack>

            {/* Enumerate pairs */}
            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                (index, character) pairs:
              </Text>
              <VStack gap={2} align="center">
                {uniqueChars.map((char, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <HStack
                      p={3}
                      bg="yellow.900/30"
                      border="1px solid"
                      borderColor="yellow.700"
                      borderRadius="md"
                      fontFamily="mono"
                      fontSize="sm"
                      gap={4}
                    >
                      <Text color="gray.400">(</Text>
                      <Box
                        px={2}
                        py={1}
                        bg="yellow.900/50"
                        borderRadius="md"
                      >
                        <Text color="yellow.300" fontWeight="bold">{i}</Text>
                      </Box>
                      <Text color="gray.400">,</Text>
                      <Box
                        px={2}
                        py={1}
                        bg="cyan.900/50"
                        borderRadius="md"
                      >
                        <Text color="cyan.300">"{char}"</Text>
                      </Box>
                      <Text color="gray.400">)</Text>
                      <Text color="gray.500" fontSize="xs">← i={i}, char="{char}"</Text>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 4: Build dictionary */}
        {currentStep === 4 && (
          <MotionBox
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="green.800"
          >
            <Text color="green.400" fontWeight="semibold" mb={3}>
              Step 4: Build the vocabulary dictionary
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Dictionary comprehension <Text as="span" color="pink.300" fontFamily="mono">{"{"}char: i for i, char in enumerate(chars){"}"}</Text> builds the final vocab.
            </Text>

            {/* Show the comprehension */}
            <Box p={3} bg="gray.900" borderRadius="md" mb={4} textAlign="center">
              <Text color="pink.300" fontFamily="mono" fontSize="sm">
                {"{"}char: i for i, char in enumerate(chars){"}"}
              </Text>
            </Box>

            {/* Building the dictionary */}
            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Building vocabulary:
              </Text>
              <HStack justify="center" wrap="wrap" gap={3}>
                <Text color="gray.400" fontSize="xl">{"{"}</Text>
                {uniqueChars.map((char, i) => (
                  <HStack key={i} gap={1}>
                    <VocabEntry
                      char={char}
                      id={i}
                      isActive={true}
                      delay={i * 0.2}
                    />
                    {i < uniqueChars.length - 1 && <Text color="gray.400">,</Text>}
                  </HStack>
                ))}
                <Text color="gray.400" fontSize="xl">{"}"}</Text>
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: uniqueChars.length * 0.2 + 0.3 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontSize="sm">
                Each character now maps to a unique integer ID!
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 5: Final result */}
        {currentStep >= 5 && (
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
              Vocabulary Built!
            </Text>

            {/* Summary */}
            <VStack gap={4} mb={6}>
              {/* Input */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Input text:</Text>
                <Text color="cyan.300" fontFamily="mono" textAlign="center" fontSize="lg">
                  "{text}"
                </Text>
              </Box>

              <Text color="gray.500" fontSize="xl">↓</Text>

              {/* Output vocabulary */}
              <Box p={3} bg="gray.800" borderRadius="md" w="full">
                <Text color="gray.500" fontSize="xs" mb={2}>Character vocabulary:</Text>
                <Text color="green.300" fontFamily="mono" textAlign="center" fontWeight="bold">
                  {"{"}
                  {Object.entries(output).map(([char, id], i) => (
                    <Text as="span" key={char}>
                      "{char}": {id}
                      {i < Object.keys(output).length - 1 ? ", " : ""}
                    </Text>
                  ))}
                  {"}"}
                </Text>
              </Box>
            </VStack>

            {/* Character to ID mapping */}
            <Box p={4} bg="gray.800" borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={3}>Character → ID mapping:</Text>
              <VStack gap={2} align="stretch">
                {Object.entries(output).map(([char, id], i) => (
                  <MotionBox
                    key={char}
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
                        <Text color="gray.500">vocab[</Text>
                        <Text color="cyan.300">"{char}"</Text>
                        <Text color="gray.500">]</Text>
                      </HStack>
                      <HStack gap={2}>
                        <Text color="gray.500">=</Text>
                        <Text color="green.300" fontWeight="bold">{id}</Text>
                      </HStack>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            {/* Stats */}
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
                {chars.length} characters → {uniqueChars.length} unique → vocabulary size: {Object.keys(output).length}
              </Text>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a build vocab operation
export function isBuildVocabTestCase(input: unknown, output: unknown, challengeTitle: string): boolean {
  const lowerTitle = challengeTitle.toLowerCase();
  // Must have "build" and "vocab" in title, or "character vocabulary"
  if (!((lowerTitle.includes("build") && lowerTitle.includes("vocab")) ||
        lowerTitle.includes("character vocabulary"))) {
    return false;
  }
  if (!Array.isArray(input) || input.length !== 1) return false;
  const [text] = input;
  // Input is a string, output is an object (the vocabulary)
  return typeof text === "string" && typeof output === "object" && output !== null && !Array.isArray(output);
}

// Get total steps for build vocab visualization
export function getBuildVocabTotalSteps(): number {
  return 6; // intro + text + duplicates + enumerate + build dict + complete
}
