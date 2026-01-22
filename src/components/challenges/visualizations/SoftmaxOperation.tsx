import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface SoftmaxOperationProps {
  logits: number[];
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Calculate softmax intermediate values
function calculateSoftmaxSteps(logits: number[]) {
  const maxVal = Math.max(...logits);
  const shifted = logits.map(x => x - maxVal);
  const exps = shifted.map(x => Math.exp(x));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExps);
  return { maxVal, shifted, exps, sumExps, probs };
}

function formatNum(n: number, decimals = 3): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(decimals);
}

// Probability bar visualization
function ProbabilityBar({ value, index, isActive }: { value: number; index: number; isActive: boolean }) {
  const percentage = value * 100;
  return (
    <HStack gap={3} w="full">
      <Text color="gray.400" fontSize="sm" fontFamily="mono" w="30px">[{index}]</Text>
      <Box flex={1} h="24px" bg="gray.700" borderRadius="md" overflow="hidden" position="relative">
        <MotionBox
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          h="full"
          bg={isActive ? "green.500" : "cyan.600"}
          borderRadius="md"
        />
        <Text
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
          fontSize="xs"
          color="white"
          fontFamily="mono"
        >
          {formatNum(value, 4)} ({percentage.toFixed(1)}%)
        </Text>
      </Box>
    </HStack>
  );
}

export function SoftmaxOperation({
  logits,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: SoftmaxOperationProps) {
  const { maxVal, shifted, exps, sumExps, probs } = calculateSoftmaxSteps(logits);

  // Steps:
  // 0: Show intro with code
  // 1: Find max value
  // 2: Subtract max (shift)
  // 3: Apply exp()
  // 4: Sum exp values
  // 5: Divide to get probabilities
  // 6: Show final result with bar chart

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
                The Softmax Formula:
              </Text>
              <Text color="gray.300" fontSize="sm" fontFamily="mono">
                softmax(x_i) = exp(x_i) / sum(exp(x_j) for all j)
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Converts raw scores (logits) into probabilities that sum to 1.
              </Text>
            </Box>

            {codePatterns.hasListComprehension && (
              <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
                <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={1}>
                  List Comprehension
                </Text>
                <Text color="gray.400" fontSize="xs">
                  [expression for item in list] - applies expression to each item
                </Text>
              </Box>
            )}
          </MotionBox>
        )}

        {/* Step 1: Find max value */}
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
              Step 1: Find the maximum value
            </Text>

            <Text color="gray.400" fontSize="sm" mb={3}>
              For numerical stability, we first find the max to prevent overflow when computing exp().
            </Text>

            {/* Show logits with max highlighted */}
            <VStack gap={2} align="stretch" mb={4}>
              <Text color="gray.500" fontSize="sm">logits = </Text>
              <HStack gap={2} justify="center" wrap="wrap">
                {logits.map((val, i) => (
                  <MotionBox
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    px={4}
                    py={2}
                    bg={val === maxVal ? "yellow.900/50" : "gray.700"}
                    border="2px solid"
                    borderColor={val === maxVal ? "yellow.500" : "gray.600"}
                    borderRadius="md"
                    fontFamily="mono"
                  >
                    <Text color={val === maxVal ? "yellow.300" : "gray.300"}>{formatNum(val)}</Text>
                    <Text color="gray.500" fontSize="xs">[{i}]</Text>
                  </MotionBox>
                ))}
              </HStack>
            </VStack>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              p={3}
              bg="yellow.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="yellow.700"
              textAlign="center"
            >
              <Text color="gray.400" fontSize="sm">
                <Text as="span" color="yellow.300" fontFamily="mono">max_val = max(logits) = </Text>
                <Text as="span" color="yellow.300" fontWeight="bold" fontSize="lg">{formatNum(maxVal)}</Text>
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 2: Subtract max (shift) */}
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
              Step 2: Subtract max from each logit
            </Text>

            <Text color="gray.400" fontSize="sm" mb={3}>
              This "shifts" values to prevent exp() overflow while preserving relative differences.
            </Text>

            <VStack gap={3} align="stretch" fontFamily="mono" fontSize="sm">
              {logits.map((val, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <HStack
                    gap={0}
                    bg="gray.900"
                    p={3}
                    borderRadius="md"
                    justify="center"
                  >
                    <Text color="cyan.300" w="100px" textAlign="right">logits[{i}]</Text>
                    <Text color="gray.500" mx={2}>=</Text>
                    <Text color="cyan.300" w="50px">{formatNum(val)}</Text>
                    <Text color="gray.500" mx={2}>-</Text>
                    <Text color="yellow.300" w="50px">{formatNum(maxVal)}</Text>
                    <Text color="gray.500" mx={2}>=</Text>
                    <Text color="green.300" fontWeight="bold" w="60px" textAlign="right">{formatNum(shifted[i])}</Text>
                  </HStack>
                </MotionBox>
              ))}
            </VStack>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: logits.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontFamily="mono">
                shifted = [{shifted.map(s => formatNum(s)).join(", ")}]
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 3: Apply exp() */}
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
              Step 3: Apply exp() to each shifted value
            </Text>

            <Text color="gray.400" fontSize="sm" mb={3}>
              The exponential function makes all values positive and amplifies differences.
            </Text>

            <VStack gap={3} align="stretch" fontFamily="mono" fontSize="sm">
              {shifted.map((val, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <HStack
                    gap={0}
                    bg="gray.900"
                    p={3}
                    borderRadius="md"
                    justify="center"
                  >
                    <Text color="pink.300" w="80px" textAlign="right">exp(</Text>
                    <Text color="green.300" w="60px" textAlign="center">{formatNum(val)}</Text>
                    <Text color="pink.300">)</Text>
                    <Text color="gray.500" mx={3}>=</Text>
                    <Text color="orange.300" fontWeight="bold" w="80px" textAlign="right">{formatNum(exps[i])}</Text>
                  </HStack>
                </MotionBox>
              ))}
            </VStack>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: shifted.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="orange.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="orange.700"
              textAlign="center"
            >
              <Text color="orange.300" fontFamily="mono">
                exps = [{exps.map(e => formatNum(e)).join(", ")}]
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 4: Sum exp values */}
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
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Step 4: Sum all exp values
            </Text>

            <Text color="gray.400" fontSize="sm" mb={3}>
              This will be our denominator to normalize probabilities to sum to 1.
            </Text>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              p={4}
              bg="gray.900"
              borderRadius="md"
              textAlign="center"
              fontFamily="mono"
            >
              <HStack justify="center" gap={2} wrap="wrap" mb={3}>
                <Text color="gray.400">sum_exps = </Text>
                {exps.map((e, i) => (
                  <HStack key={i} gap={1}>
                    <MotionBox
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <Text color="orange.300">{formatNum(e)}</Text>
                    </MotionBox>
                    {i < exps.length - 1 && <Text color="gray.500">+</Text>}
                  </HStack>
                ))}
              </HStack>

              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: exps.length * 0.15 + 0.2 }}
                p={3}
                bg="purple.900/30"
                borderRadius="md"
                border="1px solid"
                borderColor="purple.700"
              >
                <Text color="purple.300" fontSize="lg" fontWeight="bold">
                  sum_exps = {formatNum(sumExps)}
                </Text>
              </MotionBox>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 5: Divide to get probabilities */}
        {currentStep === 5 && (
          <MotionBox
            key="step5"
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
              Step 5: Divide each exp by sum → probabilities
            </Text>

            <Text color="gray.400" fontSize="sm" mb={3}>
              Each probability = exp(x_i) / sum_exps. Results will sum to 1.
            </Text>

            <VStack gap={3} align="stretch" fontFamily="mono" fontSize="sm">
              {exps.map((e, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <HStack
                    gap={0}
                    bg="gray.900"
                    p={3}
                    borderRadius="md"
                    justify="center"
                  >
                    <Text color="gray.400" w="70px" textAlign="right">prob[{i}]</Text>
                    <Text color="gray.500" mx={2}>=</Text>
                    <Text color="orange.300" w="60px" textAlign="right">{formatNum(e)}</Text>
                    <Text color="gray.500" mx={2}>/</Text>
                    <Text color="purple.300" w="60px">{formatNum(sumExps)}</Text>
                    <Text color="gray.500" mx={2}>=</Text>
                    <Text color="green.300" fontWeight="bold" w="80px" textAlign="right">
                      {formatNum(probs[i], 4)}
                    </Text>
                  </HStack>
                </MotionBox>
              ))}
            </VStack>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: exps.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="green.900/30"
              borderRadius="md"
              border="1px solid"
              borderColor="green.700"
              textAlign="center"
            >
              <Text color="green.300" fontFamily="mono">
                probs = [{probs.map(p => formatNum(p, 4)).join(", ")}]
              </Text>
              <Text color="gray.400" fontSize="xs" mt={1}>
                Sum: {probs.reduce((a, b) => a + b, 0).toFixed(6)} ≈ 1.0 ✓
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 6: Final result with bar chart */}
        {currentStep >= 6 && (
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
              Softmax Complete!
            </Text>

            <HStack gap={8} justify="center" mb={4} wrap="wrap">
              <VStack>
                <Text color="gray.500" fontSize="sm">Input (logits)</Text>
                <Text color="cyan.300" fontFamily="mono">[{logits.map(l => formatNum(l)).join(", ")}]</Text>
              </VStack>
              <Text color="gray.500" fontSize="2xl">→</Text>
              <VStack>
                <Text color="gray.500" fontSize="sm">Output (probabilities)</Text>
                <Text color="green.300" fontFamily="mono">[{probs.map(p => formatNum(p, 4)).join(", ")}]</Text>
              </VStack>
            </HStack>

            <Box p={4} bg="gray.800" borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={3}>Probability Distribution:</Text>
              <VStack gap={2} align="stretch">
                {probs.map((p, i) => (
                  <ProbabilityBar
                    key={i}
                    value={p}
                    index={i}
                    isActive={p === Math.max(...probs)}
                  />
                ))}
              </VStack>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a softmax operation
export function isSoftmaxTestCase(input: unknown, challengeTitle: string): input is [number[]] {
  if (!challengeTitle.toLowerCase().includes("softmax")) return false;
  if (!Array.isArray(input) || input.length !== 1) return false;
  const logits = input[0];
  return Array.isArray(logits) && logits.every(x => typeof x === "number");
}

// Get total steps for softmax visualization
export function getSoftmaxTotalSteps(): number {
  return 7;
}
