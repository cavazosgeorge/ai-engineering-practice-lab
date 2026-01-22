import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface MatrixOperationProps {
  inputVector: number[];
  weightMatrix: number[][];
  biasVector: number[];
  outputVector: number[];
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);
const MotionText = motion.create(Text);

function MatrixCell({
  value,
  highlight,
  color = "gray.300",
  glowColor,
  delay = 0,
}: {
  value: number | string;
  highlight?: boolean;
  color?: string;
  glowColor?: string;
  delay?: number;
}) {
  return (
    <MotionBox
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        boxShadow: highlight && glowColor ? `0 0 15px ${glowColor}` : "none",
      }}
      transition={{ duration: 0.3, delay }}
      w="40px"
      h="40px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={highlight ? "cyan.900/50" : "gray.800"}
      borderRadius="md"
      border="1px solid"
      borderColor={highlight ? "cyan.500" : "gray.700"}
      fontFamily="'JetBrains Mono', monospace"
      fontSize="sm"
    >
      <Text color={color}>{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}</Text>
    </MotionBox>
  );
}

function VectorDisplay({
  values,
  label,
  highlightIndex,
  color,
  glowColor,
}: {
  values: (number | null)[];
  label: string;
  highlightIndex?: number;
  color?: string;
  glowColor?: string;
}) {
  return (
    <VStack gap={2}>
      <Text color="gray.500" fontSize="xs" fontWeight="medium">
        {label}
      </Text>
      <HStack gap={1}>
        <Text color="gray.600" fontSize="lg">[</Text>
        <VStack gap={1}>
          {values.map((val, i) => (
            <AnimatePresence key={i} mode="wait">
              {val !== null ? (
                <MatrixCell
                  value={val}
                  highlight={i === highlightIndex}
                  color={color || "cyan.300"}
                  glowColor={glowColor}
                  delay={i * 0.1}
                />
              ) : (
                <MotionBox
                  key={`empty-${i}`}
                  w="40px"
                  h="40px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.900"
                  borderRadius="md"
                  border="1px dashed"
                  borderColor="gray.700"
                >
                  <Text color="gray.600">?</Text>
                </MotionBox>
              )}
            </AnimatePresence>
          ))}
        </VStack>
        <Text color="gray.600" fontSize="lg">]</Text>
      </HStack>
    </VStack>
  );
}

function MatrixDisplay({
  values,
  label,
  highlightRow,
}: {
  values: number[][];
  label: string;
  highlightRow?: number;
}) {
  return (
    <VStack gap={2}>
      <Text color="gray.500" fontSize="xs" fontWeight="medium">
        {label}
      </Text>
      <HStack gap={1}>
        <Text color="gray.600" fontSize="lg">[</Text>
        <VStack gap={1}>
          {values.map((row, i) => (
            <HStack key={i} gap={1}>
              {row.map((val, j) => (
                <MatrixCell
                  key={j}
                  value={val}
                  highlight={i === highlightRow}
                  color={i === highlightRow ? "yellow.300" : "gray.300"}
                  glowColor="rgba(236, 201, 75, 0.4)"
                  delay={i * 0.05 + j * 0.05}
                />
              ))}
            </HStack>
          ))}
        </VStack>
        <Text color="gray.600" fontSize="lg">]</Text>
      </HStack>
    </VStack>
  );
}

export function MatrixOperation({
  inputVector,
  weightMatrix,
  biasVector,
  outputVector,
  currentStep,
  codePatterns,
  solutionCode,
  challengeTitle,
}: MatrixOperationProps) {
  const numRows = weightMatrix.length;

  // Calculate which row we're processing
  // Step 0: Show inputs
  // Steps 1 to numRows: Compute each row
  // Final step: Show complete output

  const isShowingInputs = currentStep === 0;
  const activeRow = isShowingInputs ? -1 : Math.min(currentStep - 1, numRows - 1);
  const isComplete = currentStep >= numRows + 1;

  // Build partial output based on current step
  const partialOutput: (number | null)[] = outputVector.map((val, i) =>
    i <= activeRow ? val : null
  );

  // Calculate dot product for current row
  const currentDotProduct = activeRow >= 0 && activeRow < numRows
    ? weightMatrix[activeRow].reduce((sum, w, j) => sum + w * inputVector[j], 0)
    : null;

  const currentBiasAddition = activeRow >= 0 && activeRow < numRows && currentDotProduct !== null
    ? currentDotProduct + biasVector[activeRow]
    : null;

  return (
    <Box>
      {/* Main visualization */}
      <HStack gap={6} justify="center" align="center" wrap="wrap" mb={8}>
        <VectorDisplay
          values={inputVector}
          label="x (input)"
          color="cyan.300"
        />

        <MotionText
          color="gray.500"
          fontSize="2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ×
        </MotionText>

        <MatrixDisplay
          values={weightMatrix}
          label="W (weights)"
          highlightRow={activeRow >= 0 && activeRow < numRows ? activeRow : undefined}
        />

        <MotionText
          color="gray.500"
          fontSize="2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          +
        </MotionText>

        <VectorDisplay
          values={biasVector}
          label="b (bias)"
          highlightIndex={activeRow >= 0 && activeRow < numRows ? activeRow : undefined}
          color="orange.300"
          glowColor="rgba(237, 137, 54, 0.4)"
        />

        <MotionText
          color="gray.500"
          fontSize="2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          =
        </MotionText>

        <VectorDisplay
          values={isComplete ? outputVector : partialOutput}
          label="y (output)"
          highlightIndex={activeRow >= 0 && activeRow < numRows ? activeRow : undefined}
          color="green.300"
          glowColor="rgba(72, 187, 120, 0.4)"
        />
      </HStack>

      {/* Step-by-step calculation breakdown */}
      <AnimatePresence mode="wait">
        {/* Step 0: Show the actual solution code and explain relevant concepts */}
        {isShowingInputs && (
          <MotionBox
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="purple.800"
          >
            <Text color="purple.400" fontWeight="semibold" mb={3}>
              {challengeTitle}: y = Wx + b
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
                    <Text color="gray.500"># Example: enumerate([10, 20, 30])</Text>
                    <Text color="gray.300">→ (0, 10), (1, 20), (2, 30)</Text>
                  </Box>
                </Box>
              )}

              {codePatterns.hasSum && (
                <Box p={3} bg="green.900/20" borderRadius="md" border="1px solid" borderColor="green.800">
                  <Text color="green.300" fontSize="sm" fontWeight="semibold" mb={2}>
                    What does sum() do?
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    <Text as="span" color="green.300">sum()</Text> adds up all values in an iterable (list, generator, etc.)
                  </Text>
                  <Box mt={2} fontFamily="'JetBrains Mono', monospace" fontSize="xs">
                    <Text color="gray.500"># Example: sum([1, 2, 3])</Text>
                    <Text color="gray.300">→ 6</Text>
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
                    <Text color="gray.300">[x*2 for x in [1,2,3]] → [2, 4, 6]</Text>
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
                    <Text color="gray.500"># Example: range(3)</Text>
                    <Text color="gray.300">→ 0, 1, 2</Text>
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
            </VStack>
          </MotionBox>
        )}

        {activeRow >= 0 && activeRow < numRows && (
          <MotionBox
            key={activeRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <Text color="cyan.400" fontWeight="semibold" mb={3}>
              Computing y[{activeRow}]:
            </Text>

            {/* Dot product breakdown */}
            <Box mb={4}>
              <Text color="gray.400" fontSize="sm" mb={2}>
                Step 1: Dot product — multiply each W[{activeRow}][j] × x[j], then sum
              </Text>
              <HStack gap={2} wrap="wrap" fontFamily="'JetBrains Mono', monospace" fontSize="sm" mb={2}>
                {weightMatrix[activeRow].map((_, j) => (
                  <HStack key={j} gap={1}>
                    <MotionBox
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: j * 0.15 }}
                    >
                      <Text color="yellow.300">W[{activeRow}][{j}]</Text>
                      <Text color="gray.500">×</Text>
                      <Text color="cyan.300">x[{j}]</Text>
                    </MotionBox>
                    {j < weightMatrix[activeRow].length - 1 && (
                      <Text color="gray.500">+</Text>
                    )}
                  </HStack>
                ))}
              </HStack>
              <HStack gap={2} wrap="wrap" fontFamily="'JetBrains Mono', monospace" fontSize="sm">
                {weightMatrix[activeRow].map((w, j) => (
                  <HStack key={j} gap={1}>
                    <MotionBox
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: j * 0.15 + 0.3 }}
                    >
                      <Text color="yellow.300">{w}</Text>
                      <Text color="gray.500">×</Text>
                      <Text color="cyan.300">{inputVector[j]}</Text>
                      <Text color="gray.600"> = {w * inputVector[j]}</Text>
                    </MotionBox>
                    {j < weightMatrix[activeRow].length - 1 && (
                      <Text color="gray.500">+</Text>
                    )}
                  </HStack>
                ))}
                <Text color="gray.500">=</Text>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: weightMatrix[activeRow].length * 0.15 + 0.5 }}
                >
                  <Text color="white" fontWeight="bold">{currentDotProduct?.toFixed(currentDotProduct % 1 === 0 ? 0 : 2)}</Text>
                </MotionBox>
              </HStack>
            </Box>

            {/* Bias addition */}
            <Box>
              <Text color="gray.400" fontSize="sm" mb={2}>
                Step 2: Add bias b[{activeRow}] to get y[{activeRow}]
              </Text>
              <HStack gap={2} fontFamily="'JetBrains Mono', monospace" fontSize="sm">
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Text color="gray.400">dot</Text>
                  <Text color="white"> = {currentDotProduct?.toFixed(currentDotProduct % 1 === 0 ? 0 : 2)}</Text>
                </MotionBox>
                <Text color="gray.500">+</Text>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <Text color="orange.300">b[{activeRow}]</Text>
                  <Text color="orange.300"> = {biasVector[activeRow]}</Text>
                </MotionBox>
                <Text color="gray.500">=</Text>
                <MotionBox
                  initial={{ scale: 0, backgroundColor: "transparent" }}
                  animate={{ scale: 1, backgroundColor: "rgba(72, 187, 120, 0.2)" }}
                  transition={{ delay: 0.6 }}
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  <Text color="green.300" fontWeight="bold">
                    y[{activeRow}] = {currentBiasAddition?.toFixed(currentBiasAddition % 1 === 0 ? 0 : 2)}
                  </Text>
                </MotionBox>
              </HStack>
            </Box>
          </MotionBox>
        )}

        {isComplete && (
          <MotionBox
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            p={4}
            bg="green.900/30"
            borderRadius="lg"
            border="2px solid"
            borderColor="green.500"
            textAlign="center"
          >
            <Text color="green.300" fontWeight="bold" fontSize="lg">
              Linear transformation complete!
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              y = Wx + b = [{outputVector.map(v => v.toFixed(v % 1 === 0 ? 0 : 2)).join(", ")}]
            </Text>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Linear layer input can be either:
// - Array format: [x, W, b] where x is input, W is weight matrix, b is bias
// - Object format: { x, W, b }
export type LinearLayerInput =
  | { x: number[]; W: number[][]; b: number[] }
  | [number[], number[][], number[]];

// Helper to detect if test case is a linear layer operation
export function isLinearLayerTestCase(input: unknown): input is LinearLayerInput {
  // Check object format: { x, W, b }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    return (
      Array.isArray(obj.x) &&
      Array.isArray(obj.W) &&
      Array.isArray(obj.b) &&
      (obj.W as unknown[]).every((row: unknown) => Array.isArray(row))
    );
  }

  // Check array format: [x, W, b]
  if (Array.isArray(input) && input.length === 3) {
    const [x, W, b] = input;
    return (
      Array.isArray(x) &&
      Array.isArray(W) &&
      Array.isArray(b) &&
      W.every((row: unknown) => Array.isArray(row)) &&
      typeof x[0] === "number" &&
      typeof b[0] === "number"
    );
  }

  return false;
}

// Helper to extract linear layer parameters regardless of format
export function extractLinearLayerParams(input: LinearLayerInput): { x: number[]; W: number[][]; b: number[] } {
  if (Array.isArray(input)) {
    const [x, W, b] = input;
    return { x: x as number[], W: W as number[][], b: b as number[] };
  }
  return input as { x: number[]; W: number[][]; b: number[] };
}
