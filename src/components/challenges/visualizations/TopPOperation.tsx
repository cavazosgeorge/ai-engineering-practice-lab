import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface TopPOperationProps {
  probabilities: Record<string, number>;
  p: number;
  output: Record<string, number>;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

export function TopPOperation({
  probabilities,
  p,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: TopPOperationProps) {
  // Sort by probability descending
  const sortedEntries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const keptTokens = Object.keys(output);

  // Calculate cumulative sums
  const cumSums: number[] = [];
  let runningSum = 0;
  for (const [, prob] of sortedEntries) {
    runningSum += prob;
    cumSums.push(runningSum);
  }

  // Find where we stop
  const stopIndex = cumSums.findIndex(sum => sum >= p);

  // Steps:
  // 0: Introduction
  // 1: Show sorted distribution
  // 2: Track cumulative sum
  // 3: Complete

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
                How top-p (nucleus) filtering works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Sort tokens by probability (highest first)
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Add tokens until cumulative probability ≥ p
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Stop as soon as threshold is reached
              </Text>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                Why "nucleus" sampling?
              </Text>
              <Text color="gray.400" fontSize="xs">
                Unlike top-k (fixed count), top-p adapts to the distribution.
                If the model is confident, fewer tokens are kept.
                If uncertain, more tokens are kept.
              </Text>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show sorted distribution */}
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
              Step 1: Sort tokens by probability
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              We want to keep tokens until cumulative probability reaches <Text as="span" color="cyan.300" fontWeight="bold">p = {p}</Text>
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={4} textAlign="center">
                Sorted by probability (highest to lowest):
              </Text>

              <VStack gap={3} align="stretch">
                {sortedEntries.map(([token, prob], i) => (
                  <MotionBox
                    key={token}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <HStack gap={4}>
                      <Box w="60px" textAlign="right">
                        <Text color="cyan.300" fontFamily="mono" fontSize="sm">"{token}"</Text>
                      </Box>
                      <Box flex={1} position="relative">
                        <Box h="24px" bg="gray.700" borderRadius="md" overflow="hidden">
                          <MotionBox
                            initial={{ width: 0 }}
                            animate={{ width: `${prob * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.15 + 0.1 }}
                            h="full"
                            bg="blue.500"
                            borderRadius="md"
                          />
                        </Box>
                      </Box>
                      <Box w="50px">
                        <Text color="gray.400" fontFamily="mono" fontSize="sm">
                          {(prob * 100).toFixed(0)}%
                        </Text>
                      </Box>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Track cumulative sum */}
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
            borderColor="green.800"
          >
            <Text color="green.400" fontWeight="semibold" mb={3}>
              Step 2: Add tokens until cumsum ≥ {p}
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Track cumulative sum. Stop when it reaches or exceeds <Text as="span" color="green.300" fontWeight="bold">p = {p}</Text>
            </Text>

            {/* Threshold indicator */}
            <Box mb={4} p={3} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={2} textAlign="center">Threshold progress:</Text>
              <Box position="relative" h="30px" bg="gray.700" borderRadius="md" overflow="hidden">
                <Box
                  position="absolute"
                  left={`${p * 100}%`}
                  top={0}
                  bottom={0}
                  w="2px"
                  bg="yellow.400"
                  zIndex={2}
                />
                <MotionBox
                  initial={{ width: 0 }}
                  animate={{ width: `${cumSums[stopIndex] * 100}%` }}
                  transition={{ duration: 1 }}
                  h="full"
                  bg="green.500"
                  borderRadius="md"
                />
              </Box>
              <HStack justify="space-between" mt={1}>
                <Text color="gray.500" fontSize="xs">0%</Text>
                <Text color="yellow.400" fontSize="xs" fontWeight="bold">p = {(p * 100).toFixed(0)}%</Text>
                <Text color="gray.500" fontSize="xs">100%</Text>
              </HStack>
            </Box>

            <Box p={4} bg="gray.900" borderRadius="md">
              <VStack gap={3} align="stretch">
                {sortedEntries.map(([token, prob], i) => {
                  const isKept = i <= stopIndex;
                  const isStopPoint = i === stopIndex;

                  return (
                    <MotionBox
                      key={token}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <HStack gap={4}>
                        <Box w="60px" textAlign="right">
                          <Text
                            color={isKept ? "green.300" : "gray.500"}
                            fontFamily="mono"
                            fontSize="sm"
                            fontWeight={isKept ? "bold" : "normal"}
                          >
                            "{token}"
                          </Text>
                        </Box>
                        <Box w="50px" textAlign="right">
                          <Text
                            color={isKept ? "green.400" : "gray.500"}
                            fontSize="sm"
                          >
                            +{(prob * 100).toFixed(0)}%
                          </Text>
                        </Box>
                        <Text color="gray.500">=</Text>
                        <MotionBox
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.2 + 0.1 }}
                          px={3}
                          py={1}
                          bg={isStopPoint ? "green.900/50" : isKept ? "cyan.900/30" : "gray.700"}
                          border="2px solid"
                          borderColor={isStopPoint ? "green.500" : isKept ? "cyan.700" : "gray.600"}
                          borderRadius="md"
                        >
                          <Text
                            color={isStopPoint ? "green.300" : isKept ? "cyan.300" : "gray.500"}
                            fontFamily="mono"
                            fontSize="sm"
                            fontWeight={isStopPoint ? "bold" : "normal"}
                          >
                            {(cumSums[i] * 100).toFixed(0)}%
                          </Text>
                        </MotionBox>
                        {isStopPoint && (
                          <MotionBox
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.2 + 0.3 }}
                          >
                            <Text color="green.400" fontSize="sm" fontWeight="bold">
                              ≥ {(p * 100).toFixed(0)}% ✓ STOP
                            </Text>
                          </MotionBox>
                        )}
                        {!isKept && (
                          <Text color="gray.500" fontSize="sm">
                            (not included)
                          </Text>
                        )}
                      </HStack>
                    </MotionBox>
                  );
                })}
              </VStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 3: Complete */}
        {currentStep >= 3 && (
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
              Top-p Filtering Complete!
            </Text>

            {/* Visualization */}
            <Box p={4} bg="gray.800" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Cumulative probability reaching threshold:
              </Text>
              <HStack gap={2} justify="center" wrap="wrap">
                {sortedEntries.map(([token, prob], i) => {
                  const isKept = i <= stopIndex;
                  return (
                    <MotionBox
                      key={token}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: isKept ? 1 : 0.3,
                        scale: 1,
                      }}
                      transition={{ delay: i * 0.1 }}
                      p={3}
                      bg={isKept ? "green.900/50" : "gray.700"}
                      border="2px solid"
                      borderColor={isKept ? "green.500" : "gray.600"}
                      borderRadius="md"
                      position="relative"
                    >
                      <VStack gap={1}>
                        <Text
                          color={isKept ? "green.300" : "gray.500"}
                          fontFamily="mono"
                          fontSize="sm"
                          fontWeight={isKept ? "bold" : "normal"}
                        >
                          "{token}"
                        </Text>
                        <Text color={isKept ? "green.400" : "gray.500"} fontSize="xs">
                          {(prob * 100).toFixed(0)}%
                        </Text>
                      </VStack>
                      {!isKept && (
                        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                          <Text color="red.400" fontSize="lg" fontWeight="bold">✕</Text>
                        </Box>
                      )}
                    </MotionBox>
                  );
                })}
              </HStack>
            </Box>

            {/* Result */}
            <Box p={3} bg="gray.800" borderRadius="md" textAlign="center" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2}>Filtered distribution:</Text>
              <Text color="green.300" fontFamily="mono" fontWeight="bold">
                {"{"}
                {Object.entries(output).map(([t, prob], i) => (
                  <Text as="span" key={t}>
                    "{t}": {prob}{i < keptTokens.length - 1 ? ", " : ""}
                  </Text>
                ))}
                {"}"}
              </Text>
            </Box>

            {/* Summary */}
            <VStack gap={3}>
              <Box p={3} bg="gray.700" borderRadius="md" w="full" textAlign="center">
                <Text color="gray.400" fontSize="sm">
                  Cumulative probability: <Text as="span" color="green.300" fontWeight="bold">{(cumSums[stopIndex] * 100).toFixed(0)}%</Text> ≥ threshold <Text as="span" color="yellow.300">{(p * 100).toFixed(0)}%</Text>
                </Text>
              </Box>

              <Box p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.700" w="full" textAlign="center">
                <Text color="yellow.300" fontSize="sm">
                  {keptTokens.length} token{keptTokens.length !== 1 ? "s" : ""} kept •
                  {sortedEntries.length - keptTokens.length} filtered out •
                  Adapts to model confidence
                </Text>
              </Box>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a top-p operation
export function isTopPTestCase(input: unknown, challengeTitle: string): input is [Record<string, number>, number] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("top-p") && !lowerTitle.includes("top p") && !lowerTitle.includes("nucleus")) return false;
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [probs, pVal] = input;
  return (
    typeof probs === "object" &&
    probs !== null &&
    !Array.isArray(probs) &&
    typeof pVal === "number" &&
    pVal > 0 &&
    pVal <= 1
  );
}

// Get total steps for top-p visualization
export function getTopPTotalSteps(): number {
  return 4; // intro + sorted + cumsum + complete
}
