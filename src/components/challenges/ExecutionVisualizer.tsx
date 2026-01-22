import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  HStack,
  VStack,
  Button,
  IconButton,
  Slider,
  Badge,
  CloseButton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRedo,
} from "react-icons/fa";
import { MatrixOperation, isLinearLayerTestCase, extractLinearLayerParams } from "./visualizations/MatrixOperation";
import { ArrayTransform, isArrayTransformTestCase } from "./visualizations/ArrayTransform";
import { SoftmaxOperation, isSoftmaxTestCase, getSoftmaxTotalSteps } from "./visualizations/SoftmaxOperation";
import { EncodeOperation, isEncodeTestCase, getEncodeTotalSteps } from "./visualizations/EncodeOperation";
import { DecodeOperation, isDecodeTestCase, getDecodeTotalSteps } from "./visualizations/DecodeOperation";

interface TestCase {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  description?: string | null;
}

interface ExecutionVisualizerProps {
  testCase: TestCase;
  solutionCode: string;
  challengeTitle: string;
  onClose: () => void;
}

// Detected Python patterns in the solution code
export interface CodePatterns {
  hasEnumerate: boolean;
  hasListComprehension: boolean;
  hasSum: boolean;
  hasRange: boolean;
  hasZip: boolean;
  hasMap: boolean;
  hasFilter: boolean;
  hasForLoop: boolean;
  hasNestedLoop: boolean;
  hasDotProduct: boolean;
}

// Analyze solution code to detect Python patterns
function detectCodePatterns(code: string): CodePatterns {
  return {
    hasEnumerate: /\benumerate\s*\(/.test(code),
    hasListComprehension: /\[.+\bfor\b.+\bin\b.+\]/.test(code),
    hasSum: /\bsum\s*\(/.test(code),
    hasRange: /\brange\s*\(/.test(code),
    hasZip: /\bzip\s*\(/.test(code),
    hasMap: /\bmap\s*\(/.test(code),
    hasFilter: /\bfilter\s*\(/.test(code),
    hasForLoop: /\bfor\b.+\bin\b/.test(code),
    hasNestedLoop: /\bfor\b.+\bin\b[\s\S]*\bfor\b.+\bin\b/.test(code),
    hasDotProduct: /sum\s*\([^)]*\*[^)]*\)/.test(code) || /dot|@/.test(code),
  };
}

const MotionBox = motion.create(Box);

// Calculate total steps based on visualization type
function getTotalSteps(input: unknown, output: unknown, challengeTitle: string): number {
  if (isSoftmaxTestCase(input, challengeTitle)) {
    return getSoftmaxTotalSteps();
  }
  if (isEncodeTestCase(input, challengeTitle)) {
    const [text] = input;
    return getEncodeTotalSteps(text);
  }
  if (isDecodeTestCase(input, challengeTitle)) {
    const [ids] = input;
    return getDecodeTotalSteps(ids);
  }
  if (isLinearLayerTestCase(input)) {
    const { W } = extractLinearLayerParams(input);
    return W.length + 2; // Show inputs + compute each row + complete
  }
  if (isArrayTransformTestCase(input, output)) {
    const inputArray = typeof input === "string" ? input.split("") : input as unknown[];
    return inputArray.length + 2; // Show input + process each element + complete
  }
  return 5; // Default fallback
}

// Format the test case input for display
function formatInput(input: unknown): string {
  if (isLinearLayerTestCase(input)) {
    const { x, W, b } = extractLinearLayerParams(input);
    return `x=${JSON.stringify(x)}, W=${JSON.stringify(W)}, b=${JSON.stringify(b)}`;
  }
  return JSON.stringify(input);
}

export function ExecutionVisualizer({
  testCase,
  solutionCode,
  challengeTitle,
  onClose,
}: ExecutionVisualizerProps) {
  const totalSteps = getTotalSteps(testCase.input, testCase.expectedOutput, challengeTitle);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Detect patterns used in the solution code
  const codePatterns = detectCodePatterns(solutionCode);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(totalSteps - 1, step)));
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      nextStep();
    }, 1500 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, nextStep]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") {
        nextStep();
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        prevStep();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r") {
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextStep, prevStep, reset, onClose]);

  // Render the appropriate visualization
  const renderVisualization = () => {
    const input = testCase.input;
    const output = testCase.expectedOutput;

    // Softmax visualization
    if (isSoftmaxTestCase(input, challengeTitle)) {
      const logits = input[0];
      return (
        <SoftmaxOperation
          logits={logits}
          currentStep={currentStep}
          codePatterns={codePatterns}
          solutionCode={solutionCode}
          challengeTitle={challengeTitle}
        />
      );
    }

    // Encode visualization
    if (isEncodeTestCase(input, challengeTitle)) {
      const [text, vocab] = input;
      return (
        <EncodeOperation
          text={text}
          vocab={vocab}
          output={output as number[]}
          currentStep={currentStep}
          codePatterns={codePatterns}
          solutionCode={solutionCode}
          challengeTitle={challengeTitle}
        />
      );
    }

    // Decode visualization
    if (isDecodeTestCase(input, challengeTitle)) {
      const [ids, vocab] = input;
      return (
        <DecodeOperation
          ids={ids}
          vocab={vocab}
          output={output as string}
          currentStep={currentStep}
          codePatterns={codePatterns}
          solutionCode={solutionCode}
          challengeTitle={challengeTitle}
        />
      );
    }

    if (isLinearLayerTestCase(input)) {
      const { x, W, b } = extractLinearLayerParams(input);
      return (
        <MatrixOperation
          inputVector={x}
          weightMatrix={W}
          biasVector={b}
          outputVector={output as number[]}
          currentStep={currentStep}
          codePatterns={codePatterns}
          solutionCode={solutionCode}
          challengeTitle={challengeTitle}
        />
      );
    }

    if (isArrayTransformTestCase(input, output)) {
      const inputArray = typeof input === "string"
        ? input.split("")
        : input as unknown[];
      return (
        <ArrayTransform
          input={inputArray}
          output={output as unknown[]}
          currentStep={currentStep}
          codePatterns={codePatterns}
          solutionCode={solutionCode}
          challengeTitle={challengeTitle}
        />
      );
    }

    // Fallback: Generic visualization
    return (
      <VStack gap={4}>
        <Box p={4} bg="gray.800" borderRadius="md" w="full">
          <Text color="gray.400" fontSize="sm" mb={2}>Input:</Text>
          <Text color="cyan.300" fontFamily="mono" fontSize="sm">
            {JSON.stringify(testCase.input, null, 2)}
          </Text>
        </Box>
        <Text color="cyan.500" fontSize="2xl">↓</Text>
        <Box p={4} bg="gray.800" borderRadius="md" w="full">
          <Text color="gray.400" fontSize="sm" mb={2}>Output:</Text>
          <Text color="green.300" fontFamily="mono" fontSize="sm">
            {JSON.stringify(testCase.expectedOutput, null, 2)}
          </Text>
        </Box>
      </VStack>
    );
  };

  return (
    <AnimatePresence>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        position="fixed"
        inset={0}
        bg="blackAlpha.800"
        zIndex={1000}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <MotionBox
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          bg="gray.900"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          maxW="900px"
          w="full"
          maxH="90vh"
          overflow="auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <HStack
            justify="space-between"
            p={4}
            borderBottom="1px solid"
            borderColor="gray.800"
          >
            <VStack align="start" gap={1}>
              <HStack gap={2}>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  How Your Code Works
                </Text>
                <Badge colorPalette="cyan" variant="subtle">
                  Step {currentStep + 1} of {totalSteps}
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                {testCase.description || "Visualization"}
              </Text>
            </VStack>
            <CloseButton onClick={onClose} color="gray.400" size="lg" />
          </HStack>

          {/* Test case info */}
          <Box px={4} py={3} bg="gray.800/50" borderBottom="1px solid" borderColor="gray.800">
            <Text color="gray.400" fontSize="xs" fontFamily="mono">
              Input: <Text as="span" color="cyan.300">{formatInput(testCase.input)}</Text>
            </Text>
          </Box>

          {/* Visualization area */}
          <Box p={6} minH="400px">
            {renderVisualization()}
          </Box>

          {/* Controls */}
          <Box
            p={4}
            borderTop="1px solid"
            borderColor="gray.800"
            bg="gray.800/30"
          >
            {/* Progress bar */}
            <Box mb={4}>
              <Slider.Root
                value={[currentStep]}
                min={0}
                max={totalSteps - 1}
                step={1}
                onValueChange={(details) => goToStep(details.value[0])}
              >
                <Slider.Control>
                  <Slider.Track bg="gray.700" h="2">
                    <Slider.Range bg="cyan.500" />
                  </Slider.Track>
                  <Slider.Thumb index={0} bg="cyan.400" boxSize={4} />
                </Slider.Control>
              </Slider.Root>
            </Box>

            {/* Playback controls */}
            <HStack justify="space-between">
              <HStack gap={2}>
                <IconButton
                  aria-label="Reset"
                  onClick={reset}
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "gray.700" }}
                  size="sm"
                >
                  <FaRedo />
                </IconButton>
                <IconButton
                  aria-label="Previous step"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "gray.700" }}
                  _disabled={{ opacity: 0.3 }}
                  size="sm"
                >
                  <FaStepBackward />
                </IconButton>
                <IconButton
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant="solid"
                  colorPalette="cyan"
                  size="md"
                  borderRadius="full"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </IconButton>
                <IconButton
                  aria-label="Next step"
                  onClick={nextStep}
                  disabled={currentStep === totalSteps - 1}
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "gray.700" }}
                  _disabled={{ opacity: 0.3 }}
                  size="sm"
                >
                  <FaStepForward />
                </IconButton>
              </HStack>

              {/* Speed control */}
              <HStack gap={3}>
                <Text color="gray.300" fontSize="sm">Speed:</Text>
                <HStack gap={1}>
                  {[0.5, 1, 2].map((s) => (
                    <Button
                      key={s}
                      size="xs"
                      variant={speed === s ? "solid" : "ghost"}
                      colorPalette={speed === s ? "cyan" : "gray"}
                      color={speed === s ? undefined : "gray.300"}
                      _hover={speed === s ? undefined : { bg: "gray.700", color: "white" }}
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </Button>
                  ))}
                </HStack>
              </HStack>

              {/* Keyboard hints */}
              <HStack gap={2}>
                <Text color="gray.400" fontSize="xs">
                  Space: play/pause • ←→: step • Esc: close
                </Text>
              </HStack>
            </HStack>
          </Box>
        </MotionBox>
      </MotionBox>
    </AnimatePresence>
  );
}
