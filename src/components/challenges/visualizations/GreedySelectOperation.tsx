import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface GreedySelectOperationProps {
  probabilities: Record<string, number>;
  output: string;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Probability bar component
function ProbBar({
  token,
  prob,
  maxProb,
  isHighest,
  isActive,
  delay = 0,
}: {
  token: string;
  prob: number;
  maxProb: number;
  isHighest: boolean;
  isActive?: boolean;
  delay?: number;
}) {
  const barWidth = (prob / maxProb) * 100;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      w="full"
    >
      <HStack gap={3} align="center">
        <Box w="80px" textAlign="right">
          <Text
            color={isHighest ? "green.300" : isActive ? "cyan.300" : "gray.300"}
            fontFamily="mono"
            fontSize="sm"
            fontWeight={isHighest ? "bold" : "normal"}
          >
            "{token}"
          </Text>
        </Box>
        <Box flex={1} position="relative">
          <Box
            h="28px"
            bg="gray.700"
            borderRadius="md"
            overflow="hidden"
            position="relative"
          >
            <MotionBox
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              h="full"
              bg={isHighest ? "green.500" : isActive ? "cyan.500" : "blue.500"}
              borderRadius="md"
              position="relative"
            >
              {isHighest && (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  position="absolute"
                  inset={0}
                  bg="green.300"
                  borderRadius="md"
                />
              )}
            </MotionBox>
          </Box>
        </Box>
        <Box w="60px">
          <Text
            color={isHighest ? "green.300" : "gray.400"}
            fontFamily="mono"
            fontSize="sm"
            fontWeight={isHighest ? "bold" : "normal"}
          >
            {(prob * 100).toFixed(0)}%
          </Text>
        </Box>
      </HStack>
    </MotionBox>
  );
}

export function GreedySelectOperation({
  probabilities,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: GreedySelectOperationProps) {
  // Sort by probability descending for display
  const sortedEntries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const maxProb = Math.max(...Object.values(probabilities));
  const highestToken = sortedEntries[0][0];

  // Steps:
  // 0: Introduction
  // 1: Show probability distribution
  // 2: Find maximum
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
                How greedy selection works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Look at all tokens and their probabilities
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Find the token with the highest probability
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Return that token (always the same choice)
              </Text>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                Why "greedy"?
              </Text>
              <Text color="gray.400" fontSize="xs">
                It always picks the best option at each step without considering future consequences.
                Simple but can lead to repetitive outputs.
              </Text>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show probability distribution */}
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
              Step 1: View the probability distribution
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Each token has a probability from the model. Higher = more likely next token.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={4} textAlign="center">
                Token Probabilities:
              </Text>
              <VStack gap={3} align="stretch">
                {sortedEntries.map(([token, prob], i) => (
                  <ProbBar
                    key={token}
                    token={token}
                    prob={prob}
                    maxProb={maxProb}
                    isHighest={false}
                    delay={i * 0.15}
                  />
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: sortedEntries.length * 0.15 + 0.3 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
              textAlign="center"
            >
              <Text color="gray.300" fontFamily="mono" fontSize="sm">
                probabilities = {"{"}
                {sortedEntries.map(([t, p], i) => (
                  <Text as="span" key={t}>
                    "{t}": {p}{i < sortedEntries.length - 1 ? ", " : ""}
                  </Text>
                ))}
                {"}"}
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 2: Find maximum */}
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
              Step 2: Find the token with highest probability
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">max(probabilities, key=probabilities.get)</Text> finds the key with maximum value.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md" mb={4}>
              <VStack gap={3} align="stretch">
                {sortedEntries.map(([token, prob], i) => (
                  <ProbBar
                    key={token}
                    token={token}
                    prob={prob}
                    maxProb={maxProb}
                    isHighest={token === highestToken}
                    isActive={i === 0}
                    delay={i * 0.1}
                  />
                ))}
              </VStack>
            </Box>

            {/* Comparison visualization */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              p={4}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
            >
              <Text color="green.300" fontSize="sm" fontWeight="semibold" mb={3} textAlign="center">
                Comparing probabilities:
              </Text>
              <VStack gap={2}>
                {sortedEntries.map(([token, prob], i) => (
                  <MotionBox
                    key={token}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                  >
                    <HStack justify="center" fontFamily="mono" fontSize="sm">
                      <Text color={token === highestToken ? "green.300" : "gray.400"}>
                        "{token}"
                      </Text>
                      <Text color="gray.500">→</Text>
                      <Text color={token === highestToken ? "green.300" : "gray.400"} fontWeight={token === highestToken ? "bold" : "normal"}>
                        {prob}
                      </Text>
                      {token === highestToken && (
                        <Text color="green.400" fontWeight="bold" ml={2}>
                          ← HIGHEST
                        </Text>
                      )}
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
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
              Greedy Selection Complete!
            </Text>

            {/* Visual result */}
            <Box p={4} bg="gray.800" borderRadius="md" mb={4}>
              <VStack gap={3} align="stretch">
                {sortedEntries.map(([token, prob], i) => (
                  <ProbBar
                    key={token}
                    token={token}
                    prob={prob}
                    maxProb={maxProb}
                    isHighest={token === highestToken}
                    delay={i * 0.1}
                  />
                ))}
              </VStack>
            </Box>

            {/* Selected token */}
            <VStack gap={4}>
              <Box p={3} bg="gray.800" borderRadius="md" w="full" textAlign="center">
                <Text color="gray.500" fontSize="xs" mb={2}>Selected token:</Text>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  display="inline-block"
                  px={6}
                  py={3}
                  bg="green.900/50"
                  border="2px solid"
                  borderColor="green.500"
                  borderRadius="lg"
                >
                  <Text color="green.300" fontSize="2xl" fontWeight="bold" fontFamily="mono">
                    "{output}"
                  </Text>
                </MotionBox>
              </Box>

              <Box p={3} bg="gray.800" borderRadius="md" w="full" textAlign="center">
                <Text color="gray.500" fontSize="xs" mb={1}>Because it has the highest probability:</Text>
                <Text color="green.300" fontFamily="mono" fontSize="lg">
                  {(probabilities[output] * 100).toFixed(0)}%
                </Text>
              </Box>
            </VStack>

            {/* Key insight */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              mt={4}
              p={3}
              bg="yellow.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              textAlign="center"
            >
              <Text color="yellow.300" fontSize="sm">
                Greedy always picks the same token given the same probabilities (deterministic).
              </Text>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a greedy select operation
export function isGreedySelectTestCase(input: unknown, challengeTitle: string): input is [Record<string, number>] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("greedy")) return false;
  if (!Array.isArray(input) || input.length !== 1) return false;
  const [probs] = input;
  return (
    typeof probs === "object" &&
    probs !== null &&
    !Array.isArray(probs) &&
    Object.values(probs).every(v => typeof v === "number")
  );
}

// Get total steps for greedy select visualization
export function getGreedySelectTotalSteps(): number {
  return 4; // intro + distribution + find max + complete
}
