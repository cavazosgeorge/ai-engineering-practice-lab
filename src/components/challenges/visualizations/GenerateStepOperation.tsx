import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface GenerateStepOperationProps {
  logits: number[];
  vocab: string[];
  temperature: number;
  output: string;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Softmax calculation
function softmax(arr: number[]): number[] {
  const maxVal = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - maxVal));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

// Bar component for logits/probs
function ValueBar({
  label,
  value,
  maxValue,
  color,
  isHighest,
  showPercent,
  delay = 0,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  isHighest?: boolean;
  showPercent?: boolean;
  delay?: number;
}) {
  const barWidth = Math.abs(value) / maxValue * 70;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      w="full"
    >
      <HStack gap={3}>
        <Box w="50px" textAlign="right">
          <Text
            color={isHighest ? "green.300" : "gray.300"}
            fontFamily="mono"
            fontSize="sm"
            fontWeight={isHighest ? "bold" : "normal"}
          >
            "{label}"
          </Text>
        </Box>
        <Box flex={1} position="relative" h="24px">
          <Box h="full" bg="gray.700" borderRadius="md" overflow="hidden">
            <MotionBox
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.5, delay: delay + 0.1 }}
              h="full"
              bg={isHighest ? "green.500" : color}
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
            {showPercent ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)}
          </Text>
        </Box>
      </HStack>
    </MotionBox>
  );
}

export function GenerateStepOperation({
  logits,
  vocab,
  temperature,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: GenerateStepOperationProps) {
  // Calculate intermediate values
  const scaledLogits = logits.map(l => l / temperature);
  const probs = softmax(scaledLogits);
  const maxProb = Math.max(...probs);
  const maxIdx = probs.indexOf(maxProb);

  // Steps:
  // 0: Introduction
  // 1: Show inputs
  // 2: Apply temperature
  // 3: Apply softmax
  // 4: Greedy select
  // 5: Complete

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

            <Box mb={4} p={3} bg="gray.900" borderRadius="md" fontFamily="mono" fontSize="xs" whiteSpace="pre-wrap" overflowX="auto">
              <Text color="gray.500" mb={1}># Your solution:</Text>
              <Text color="gray.300">{solutionCode}</Text>
            </Box>

            <Box p={3} bg="cyan.900/20" borderRadius="md" border="1px solid" borderColor="cyan.800">
              <Text color="cyan.300" fontSize="sm" fontWeight="semibold" mb={2}>
                The Generation Pipeline:
              </Text>
              <VStack align="stretch" gap={1} pl={2}>
                <HStack>
                  <Text color="yellow.300" fontSize="sm">1.</Text>
                  <Text color="gray.300" fontSize="sm">Apply temperature scaling to logits</Text>
                </HStack>
                <HStack>
                  <Text color="yellow.300" fontSize="sm">2.</Text>
                  <Text color="gray.300" fontSize="sm">Convert to probabilities with softmax</Text>
                </HStack>
                <HStack>
                  <Text color="yellow.300" fontSize="sm">3.</Text>
                  <Text color="gray.300" fontSize="sm">Select token with highest probability (greedy)</Text>
                </HStack>
              </VStack>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                This combines everything you've learned!
              </Text>
              <Text color="gray.400" fontSize="xs">
                Temperature + Softmax + Greedy Decoding = One generation step
              </Text>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show inputs */}
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
              Step 1: Start with the inputs
            </Text>

            <HStack gap={6} align="flex-start" mb={4}>
              {/* Logits */}
              <Box flex={1} p={3} bg="gray.900" borderRadius="md">
                <Text color="cyan.300" fontSize="sm" fontWeight="semibold" mb={2}>Logits (raw scores):</Text>
                <VStack gap={2} align="stretch">
                  {logits.map((logit, i) => (
                    <MotionBox
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <HStack justify="space-between" fontFamily="mono" fontSize="sm">
                        <Text color="gray.400">[{i}] "{vocab[i]}"</Text>
                        <Text color="cyan.300">{logit.toFixed(1)}</Text>
                      </HStack>
                    </MotionBox>
                  ))}
                </VStack>
              </Box>

              {/* Vocab */}
              <Box flex={1} p={3} bg="gray.900" borderRadius="md">
                <Text color="green.300" fontSize="sm" fontWeight="semibold" mb={2}>Vocabulary:</Text>
                <HStack gap={2} wrap="wrap">
                  {vocab.map((token, i) => (
                    <MotionBox
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      px={2}
                      py={1}
                      bg="gray.700"
                      borderRadius="md"
                    >
                      <Text color="gray.300" fontFamily="mono" fontSize="sm">"{token}"</Text>
                    </MotionBox>
                  ))}
                </HStack>
              </Box>
            </HStack>

            <Box p={3} bg="gray.700" borderRadius="md" textAlign="center">
              <Text color="gray.300" fontSize="sm">
                Temperature: <Text as="span" color="yellow.300" fontWeight="bold">T = {temperature}</Text>
              </Text>
            </Box>
          </MotionBox>
        )}

        {/* Step 2: Apply temperature */}
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
            borderColor="yellow.800"
          >
            <Text color="yellow.400" fontWeight="semibold" mb={3}>
              Step 2: Apply temperature scaling
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">scaled = logit / temperature</Text> for each logit
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <VStack gap={3} align="stretch">
                {logits.map((logit, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <HStack gap={3} justify="center" fontFamily="mono" fontSize="sm">
                      <Text color="gray.400">"{vocab[i]}":</Text>
                      <Box px={2} py={1} bg="cyan.900/30" borderRadius="md">
                        <Text color="cyan.300">{logit.toFixed(1)}</Text>
                      </Box>
                      <Text color="gray.500">÷</Text>
                      <Box px={2} py={1} bg="yellow.900/30" borderRadius="md">
                        <Text color="yellow.300">{temperature}</Text>
                      </Box>
                      <Text color="gray.500">=</Text>
                      <MotionBox
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.2 + 0.15 }}
                        px={2}
                        py={1}
                        bg="orange.900/30"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="orange.600"
                      >
                        <Text color="orange.300" fontWeight="bold">{scaledLogits[i].toFixed(2)}</Text>
                      </MotionBox>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: logits.length * 0.2 + 0.2 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
              textAlign="center"
            >
              <Text color="orange.300" fontFamily="mono" fontSize="sm">
                scaled = [{scaledLogits.map(l => l.toFixed(2)).join(", ")}]
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 3: Apply softmax */}
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
            borderColor="blue.800"
          >
            <Text color="blue.400" fontWeight="semibold" mb={3}>
              Step 3: Apply softmax to get probabilities
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">softmax(scaled)</Text> converts logits to probabilities that sum to 1.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Probability distribution:
              </Text>
              <VStack gap={3} align="stretch">
                {vocab.map((token, i) => (
                  <ValueBar
                    key={i}
                    label={token}
                    value={probs[i]}
                    maxValue={1}
                    color="blue.500"
                    isHighest={i === maxIdx}
                    showPercent
                    delay={i * 0.15}
                  />
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: vocab.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
              textAlign="center"
            >
              <Text color="blue.300" fontFamily="mono" fontSize="sm">
                probs = [{probs.map(p => (p * 100).toFixed(1) + "%").join(", ")}]
              </Text>
              <Text color="gray.500" fontSize="xs" mt={1}>
                Sum = {(probs.reduce((a, b) => a + b, 0) * 100).toFixed(0)}% (always 100%)
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 4: Greedy select */}
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
              Step 4: Select token with highest probability (greedy)
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Find max probability and return the corresponding token.
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md" mb={4}>
              <VStack gap={3} align="stretch">
                {vocab.map((token, i) => (
                  <ValueBar
                    key={i}
                    label={token}
                    value={probs[i]}
                    maxValue={1}
                    color="gray.500"
                    isHighest={i === maxIdx}
                    showPercent
                    delay={i * 0.1}
                  />
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              p={4}
              bg="green.900/30"
              borderRadius="md"
              border="2px solid"
              borderColor="green.500"
              textAlign="center"
            >
              <Text color="gray.400" fontSize="sm" mb={2}>Selected token:</Text>
              <Text color="green.300" fontSize="3xl" fontWeight="bold" fontFamily="mono">
                "{output}"
              </Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                vocab[{maxIdx}] with {(probs[maxIdx] * 100).toFixed(1)}% probability
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 5: Complete */}
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
              Generation Step Complete!
            </Text>

            {/* Pipeline visualization */}
            <Box p={4} bg="gray.800" borderRadius="md" mb={4}>
              <VStack gap={3} align="stretch">
                {/* Logits */}
                <HStack justify="space-between">
                  <Text color="cyan.300" fontSize="sm" fontWeight="semibold">Logits:</Text>
                  <Text color="cyan.300" fontFamily="mono" fontSize="sm">
                    [{logits.map(l => l.toFixed(1)).join(", ")}]
                  </Text>
                </HStack>

                <HStack justify="center">
                  <Text color="yellow.300" fontSize="xs">÷ T={temperature}</Text>
                  <Text color="gray.500">↓</Text>
                </HStack>

                {/* Scaled */}
                <HStack justify="space-between">
                  <Text color="orange.300" fontSize="sm" fontWeight="semibold">Scaled:</Text>
                  <Text color="orange.300" fontFamily="mono" fontSize="sm">
                    [{scaledLogits.map(l => l.toFixed(2)).join(", ")}]
                  </Text>
                </HStack>

                <HStack justify="center">
                  <Text color="blue.300" fontSize="xs">softmax()</Text>
                  <Text color="gray.500">↓</Text>
                </HStack>

                {/* Probs */}
                <HStack justify="space-between">
                  <Text color="blue.300" fontSize="sm" fontWeight="semibold">Probs:</Text>
                  <Text color="blue.300" fontFamily="mono" fontSize="sm">
                    [{probs.map(p => (p * 100).toFixed(1) + "%").join(", ")}]
                  </Text>
                </HStack>

                <HStack justify="center">
                  <Text color="green.300" fontSize="xs">max()</Text>
                  <Text color="gray.500">↓</Text>
                </HStack>

                {/* Result */}
                <Box p={3} bg="green.900/50" borderRadius="md" border="1px solid" borderColor="green.500">
                  <HStack justify="space-between">
                    <Text color="green.300" fontSize="sm" fontWeight="bold">Result:</Text>
                    <Text color="green.300" fontFamily="mono" fontSize="lg" fontWeight="bold">
                      "{output}"
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Summary */}
            <Box p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.700" textAlign="center">
              <Text color="yellow.300" fontSize="sm">
                One generation step: Temperature → Softmax → Greedy Select
              </Text>
              <Text color="gray.400" fontSize="xs" mt={1}>
                Repeat this process, appending tokens, to generate full text!
              </Text>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a generate step operation
export function isGenerateStepTestCase(input: unknown, challengeTitle: string): input is [number[], string[], number] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("generat") && !lowerTitle.includes("pipeline")) return false;
  if (!Array.isArray(input) || input.length !== 3) return false;
  const [logits, vocab, temp] = input;
  return (
    Array.isArray(logits) &&
    logits.every(l => typeof l === "number") &&
    Array.isArray(vocab) &&
    vocab.every(v => typeof v === "string") &&
    typeof temp === "number"
  );
}

// Get total steps for generate step visualization
export function getGenerateStepTotalSteps(): number {
  return 6; // intro + inputs + temp + softmax + greedy + complete
}
