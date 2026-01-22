import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";

interface ArrayTransformProps {
  input: unknown[];
  output: unknown[];
  currentStep: number;
  transformLabel?: string;
}

const MotionBox = motion.create(Box);

function ArrayCell({
  value,
  highlight,
  color = "gray.300",
  delay = 0,
}: {
  value: unknown;
  highlight?: boolean;
  color?: string;
  delay?: number;
}) {
  const displayValue = typeof value === "string"
    ? `"${value}"`
    : JSON.stringify(value);

  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        boxShadow: highlight ? "0 0 20px rgba(0, 188, 212, 0.5)" : "none",
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
      px={3}
      py={2}
      bg={highlight ? "cyan.900/50" : "gray.800"}
      borderRadius="md"
      border="2px solid"
      borderColor={highlight ? "cyan.500" : "gray.700"}
      fontFamily="'JetBrains Mono', monospace"
      fontSize="sm"
      minW="fit-content"
    >
      <Text color={color} whiteSpace="nowrap">{displayValue}</Text>
    </MotionBox>
  );
}

function ArrayArrow({ delay = 0 }: { delay?: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Text color="cyan.500" fontSize="xl">→</Text>
    </MotionBox>
  );
}

export function ArrayTransform({
  input,
  output,
  currentStep,
  transformLabel = "transform",
}: ArrayTransformProps) {
  // Step 0: Show input
  // Step 1 to input.length: Process each element
  // Final step: Show complete output

  const isShowingInput = currentStep === 0;
  const activeIndex = isShowingInput ? -1 : Math.min(currentStep - 1, input.length - 1);
  const isComplete = currentStep > input.length;

  // Build partial output
  const partialOutput = output.slice(0, Math.max(0, currentStep));

  return (
    <Box>
      {/* Input array */}
      <VStack gap={4} align="center" mb={6}>
        <Text color="gray.500" fontSize="sm" fontWeight="medium">Input</Text>
        <HStack gap={2} wrap="wrap" justify="center">
          <Text color="gray.600" fontSize="lg">[</Text>
          {input.map((item, i) => (
            <HStack key={i} gap={1}>
              <ArrayCell
                value={item}
                highlight={i === activeIndex}
                color={i === activeIndex ? "cyan.300" : "gray.300"}
                delay={i * 0.05}
              />
              {i < input.length - 1 && <Text color="gray.600">,</Text>}
            </HStack>
          ))}
          <Text color="gray.600" fontSize="lg">]</Text>
        </HStack>
      </VStack>

      {/* Transform arrow with label */}
      <VStack gap={2} mb={6}>
        <MotionBox
          animate={{
            y: [0, -5, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Text color="cyan.500" fontSize="3xl">↓</Text>
        </MotionBox>
        <Text color="cyan.400" fontSize="sm" fontFamily="'JetBrains Mono', monospace">
          {transformLabel}()
        </Text>
      </VStack>

      {/* Output array */}
      <VStack gap={4} align="center">
        <Text color="gray.500" fontSize="sm" fontWeight="medium">Output</Text>
        <HStack gap={2} wrap="wrap" justify="center" minH="50px">
          <Text color="gray.600" fontSize="lg">[</Text>
          <AnimatePresence mode="popLayout">
            {(isComplete ? output : partialOutput).map((item, i) => (
              <HStack key={`out-${i}`} gap={1}>
                <ArrayCell
                  value={item}
                  highlight={i === partialOutput.length - 1 && !isComplete}
                  color="green.300"
                  delay={0.1}
                />
                {i < (isComplete ? output.length : partialOutput.length) - 1 && (
                  <Text color="gray.600">,</Text>
                )}
              </HStack>
            ))}
          </AnimatePresence>
          {!isComplete && partialOutput.length === 0 && (
            <Text color="gray.600" fontStyle="italic">building...</Text>
          )}
          <Text color="gray.600" fontSize="lg">]</Text>
        </HStack>
      </VStack>

      {/* Current operation display */}
      <AnimatePresence mode="wait">
        {activeIndex >= 0 && activeIndex < input.length && !isComplete && (
          <MotionBox
            key={activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            mt={6}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            border="1px solid"
            borderColor="cyan.800"
          >
            <HStack gap={4} justify="center">
              <ArrayCell value={input[activeIndex]} color="cyan.300" />
              <ArrayArrow delay={0.1} />
              <ArrayCell
                value={output[activeIndex]}
                color="green.300"
                highlight
                delay={0.2}
              />
            </HStack>
            <Text color="gray.500" fontSize="xs" textAlign="center" mt={2}>
              Processing element {activeIndex + 1} of {input.length}
            </Text>
          </MotionBox>
        )}

        {isComplete && (
          <MotionBox
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            mt={6}
            p={4}
            bg="green.900/30"
            borderRadius="lg"
            border="2px solid"
            borderColor="green.500"
            textAlign="center"
          >
            <Text color="green.300" fontWeight="bold" fontSize="lg">
              Transformation complete!
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              {input.length} elements → {output.length} elements
            </Text>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a simple array transformation
export function isArrayTransformTestCase(input: unknown, output: unknown): boolean {
  return (
    (Array.isArray(input) || typeof input === "string") &&
    Array.isArray(output)
  );
}
