import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface TopKOperationProps {
  probabilities: Record<string, number>;
  k: number;
  output: Record<string, number>;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Token probability card
function TokenCard({
  token,
  prob,
  rank,
  isKept,
  isFiltered,
  delay = 0,
}: {
  token: string;
  prob: number;
  rank: number;
  isKept: boolean;
  isFiltered: boolean;
  delay?: number;
}) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isFiltered ? 0.4 : 1,
        y: 0,
        scale: isFiltered ? 0.95 : 1,
      }}
      transition={{ duration: 0.3, delay }}
      p={3}
      bg={isKept ? "green.900/50" : isFiltered ? "gray.800" : "gray.700"}
      border="2px solid"
      borderColor={isKept ? "green.500" : isFiltered ? "gray.700" : "gray.600"}
      borderRadius="md"
      position="relative"
    >
      <VStack gap={1}>
        <Text
          color={isKept ? "green.300" : isFiltered ? "gray.500" : "gray.300"}
          fontFamily="mono"
          fontSize="sm"
          fontWeight={isKept ? "bold" : "normal"}
        >
          "{token}"
        </Text>
        <Text
          color={isKept ? "green.400" : isFiltered ? "gray.600" : "gray.400"}
          fontSize="xs"
        >
          {(prob * 100).toFixed(0)}%
        </Text>
        <Box
          px={2}
          py={0.5}
          bg={isKept ? "green.800" : "gray.600"}
          borderRadius="full"
        >
          <Text color={isKept ? "green.200" : "gray.400"} fontSize="xs" fontWeight="bold">
            #{rank}
          </Text>
        </Box>
      </VStack>
      {isFiltered && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        >
          <Text color="red.400" fontSize="xl" fontWeight="bold">✕</Text>
        </MotionBox>
      )}
    </MotionBox>
  );
}

export function TopKOperation({
  probabilities,
  k,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: TopKOperationProps) {
  // Sort by probability descending
  const sortedEntries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  // Steps:
  // 0: Introduction
  // 1: Show original distribution
  // 2: Sort by probability
  // 3: Slice top k
  // 4: Complete

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
                How top-k filtering works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Sort tokens by probability (highest first)
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Keep only the top k tokens
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Discard the rest (they can't be sampled)
              </Text>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                Why filter tokens?
              </Text>
              <Text color="gray.400" fontSize="xs">
                By removing unlikely tokens, we prevent the model from occasionally
                selecting very improbable words while still allowing some diversity.
              </Text>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show original distribution */}
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
              Step 1: Start with the probability distribution
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              We have {Object.keys(probabilities).length} tokens. We want to keep only the top <Text as="span" color="cyan.300" fontWeight="bold">k={k}</Text>.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                All tokens (unsorted):
              </Text>
              <HStack gap={3} justify="center" wrap="wrap">
                {Object.entries(probabilities).map(([token, prob], i) => (
                  <MotionBox
                    key={token}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    p={3}
                    bg="gray.700"
                    border="2px solid"
                    borderColor="gray.600"
                    borderRadius="md"
                  >
                    <VStack gap={1}>
                      <Text color="gray.300" fontFamily="mono" fontSize="sm">"{token}"</Text>
                      <Text color="gray.400" fontSize="xs">{(prob * 100).toFixed(0)}%</Text>
                    </VStack>
                  </MotionBox>
                ))}
              </HStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Sort by probability */}
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
              Step 2: Sort tokens by probability (descending)
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">sorted(items, key=lambda x: x[1], reverse=True)</Text>
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Sorted by probability (highest to lowest):
              </Text>
              <HStack gap={3} justify="center" wrap="wrap">
                {sortedEntries.map(([token, prob], i) => (
                  <TokenCard
                    key={token}
                    token={token}
                    prob={prob}
                    rank={i + 1}
                    isKept={false}
                    isFiltered={false}
                    delay={i * 0.15}
                  />
                ))}
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: sortedEntries.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
              textAlign="center"
            >
              <Text color="gray.300" fontFamily="mono" fontSize="sm">
                sorted_items = [
                {sortedEntries.map(([t, p], i) => (
                  <Text as="span" key={t}>
                    ("{t}", {p}){i < sortedEntries.length - 1 ? ", " : ""}
                  </Text>
                ))}
                ]
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 3: Slice top k */}
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
            borderColor="green.800"
          >
            <Text color="green.400" fontWeight="semibold" mb={3}>
              Step 3: Keep only top {k} tokens
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">sorted_items[:k]</Text> slices the first {k} items.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <HStack gap={3} justify="center" wrap="wrap" align="flex-start">
                {sortedEntries.map(([token, prob], i) => (
                  <VStack key={token} gap={2}>
                    <TokenCard
                      token={token}
                      prob={prob}
                      rank={i + 1}
                      isKept={i < k}
                      isFiltered={i >= k}
                      delay={i * 0.15}
                    />
                    {i < k && (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.3 }}
                      >
                        <Text color="green.400" fontSize="xs" fontWeight="bold">KEEP</Text>
                      </MotionBox>
                    )}
                    {i >= k && (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.3 }}
                      >
                        <Text color="red.400" fontSize="xs" fontWeight="bold">FILTER</Text>
                      </MotionBox>
                    )}
                  </VStack>
                ))}
              </HStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontSize="sm">
                Keeping tokens #{1} through #{k}, filtering the rest
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 4: Complete */}
        {currentStep >= 4 && (
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
              Top-{k} Filtering Complete!
            </Text>

            {/* Before and After */}
            <HStack gap={6} justify="center" align="flex-start" mb={6}>
              {/* Before */}
              <Box p={3} bg="gray.800" borderRadius="md" flex={1}>
                <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                  Before ({Object.keys(probabilities).length} tokens):
                </Text>
                <VStack gap={2}>
                  {sortedEntries.map(([token, prob]) => (
                    <HStack key={token} justify="space-between" w="full" fontFamily="mono" fontSize="sm">
                      <Text color="gray.400">"{token}"</Text>
                      <Text color="gray.400">{(prob * 100).toFixed(0)}%</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* Arrow */}
              <VStack justify="center" py={8}>
                <Text color="cyan.400" fontFamily="mono" fontSize="sm">k={k}</Text>
                <Text color="cyan.500" fontSize="2xl">→</Text>
              </VStack>

              {/* After */}
              <Box p={3} bg="gray.800" borderRadius="md" flex={1}>
                <Text color="green.400" fontSize="xs" mb={3} textAlign="center">
                  After (top {k} tokens):
                </Text>
                <VStack gap={2}>
                  {Object.entries(output).map(([token, prob]) => (
                    <HStack key={token} justify="space-between" w="full" fontFamily="mono" fontSize="sm">
                      <Text color="green.300" fontWeight="bold">"{token}"</Text>
                      <Text color="green.300">{(prob * 100).toFixed(0)}%</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </HStack>

            {/* Result */}
            <Box p={3} bg="gray.800" borderRadius="md" textAlign="center">
              <Text color="gray.500" fontSize="xs" mb={2}>Filtered distribution:</Text>
              <Text color="green.300" fontFamily="mono" fontWeight="bold">
                {"{"}
                {Object.entries(output).map(([t, p], i) => (
                  <Text as="span" key={t}>
                    "{t}": {p}{i < Object.keys(output).length - 1 ? ", " : ""}
                  </Text>
                ))}
                {"}"}
              </Text>
            </Box>

            {/* Summary */}
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
                {Object.keys(probabilities).length - k} token{Object.keys(probabilities).length - k !== 1 ? "s" : ""} filtered out •
                Sampling will now choose from only {k} options
              </Text>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a top-k operation
export function isTopKTestCase(input: unknown, challengeTitle: string): input is [Record<string, number>, number] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("top-k") && !lowerTitle.includes("top k")) return false;
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [probs, k] = input;
  return (
    typeof probs === "object" &&
    probs !== null &&
    !Array.isArray(probs) &&
    typeof k === "number"
  );
}

// Get total steps for top-k visualization
export function getTopKTotalSteps(): number {
  return 5; // intro + original + sort + slice + complete
}
