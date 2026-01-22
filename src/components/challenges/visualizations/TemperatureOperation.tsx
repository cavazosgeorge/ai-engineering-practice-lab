import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface TemperatureOperationProps {
  logits: number[];
  temperature: number;
  output: number[];
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Logit bar component
function LogitBar({
  value,
  index,
  maxValue,
  color,
  label,
  delay = 0,
}: {
  value: number;
  index: number;
  maxValue: number;
  color: string;
  label?: string;
  delay?: number;
}) {
  const barWidth = Math.abs(value) / maxValue * 80;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      w="full"
    >
      <HStack gap={3}>
        <Box w="40px" textAlign="right">
          <Text color="gray.500" fontSize="xs">[{index}]</Text>
        </Box>
        <Box flex={1} position="relative" h="28px">
          <Box
            h="full"
            bg="gray.700"
            borderRadius="md"
            overflow="hidden"
          >
            <MotionBox
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.5, delay: delay + 0.1 }}
              h="full"
              bg={color}
              borderRadius="md"
            />
          </Box>
        </Box>
        <Box w="60px">
          <Text color={color.replace("500", "300").replace(".", "")} fontFamily="mono" fontSize="sm" fontWeight="bold">
            {value.toFixed(1)}
          </Text>
        </Box>
        {label && (
          <Box w="80px">
            <Text color="gray.500" fontSize="xs">{label}</Text>
          </Box>
        )}
      </HStack>
    </MotionBox>
  );
}

export function TemperatureOperation({
  logits,
  temperature,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: TemperatureOperationProps) {
  const maxLogit = Math.max(...logits.map(Math.abs), ...output.map(Math.abs));
  const isLowTemp = temperature < 1;
  const isHighTemp = temperature > 1;

  // Steps:
  // 0: Introduction
  // 1: Show original logits
  // 2: Apply temperature
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
                How temperature scaling works:
              </Text>
              <Text color="gray.300" fontSize="sm">
                1. Take raw logits from the model
              </Text>
              <Text color="gray.300" fontSize="sm">
                2. Divide each logit by temperature
              </Text>
              <Text color="gray.300" fontSize="sm">
                3. Result affects probability sharpness after softmax
              </Text>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={2}>
                Temperature Effects:
              </Text>
              <VStack align="stretch" gap={1}>
                <HStack>
                  <Box w="80px"><Text color="blue.300" fontSize="xs">T {"<"} 1.0</Text></Box>
                  <Text color="gray.400" fontSize="xs">→ Sharper distribution (more confident)</Text>
                </HStack>
                <HStack>
                  <Box w="80px"><Text color="gray.300" fontSize="xs">T = 1.0</Text></Box>
                  <Text color="gray.400" fontSize="xs">→ Original distribution (unchanged)</Text>
                </HStack>
                <HStack>
                  <Box w="80px"><Text color="orange.300" fontSize="xs">T {">"} 1.0</Text></Box>
                  <Text color="gray.400" fontSize="xs">→ Flatter distribution (more random)</Text>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show original logits */}
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
              Step 1: Start with the raw logits
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Logits are raw scores from the model (before softmax).
              Temperature <Text as="span" color={isLowTemp ? "blue.300" : isHighTemp ? "orange.300" : "gray.300"} fontWeight="bold">T = {temperature}</Text>
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <Text color="gray.500" fontSize="xs" mb={3} textAlign="center">
                Original logits:
              </Text>
              <VStack gap={3} align="stretch">
                {logits.map((logit, i) => (
                  <LogitBar
                    key={i}
                    value={logit}
                    index={i}
                    maxValue={maxLogit}
                    color="cyan.500"
                    delay={i * 0.15}
                  />
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: logits.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
              textAlign="center"
            >
              <Text color="gray.300" fontFamily="mono" fontSize="sm">
                logits = [{logits.map(l => l.toFixed(1)).join(", ")}]
              </Text>
            </MotionBox>
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
            borderColor={isLowTemp ? "blue.800" : isHighTemp ? "orange.800" : "gray.700"}
          >
            <Text color={isLowTemp ? "blue.400" : isHighTemp ? "orange.400" : "gray.400"} fontWeight="semibold" mb={3}>
              Step 2: Divide each logit by temperature ({temperature})
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              <Text as="span" color="pink.300" fontFamily="mono">logit / temperature</Text> for each value
            </Text>

            <Box p={4} bg="gray.900" borderRadius="md">
              <VStack gap={4} align="stretch">
                {logits.map((logit, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <HStack gap={4} justify="center" fontFamily="mono" fontSize="sm">
                      <Box
                        px={3}
                        py={2}
                        bg="cyan.900/30"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="cyan.700"
                      >
                        <Text color="cyan.300">{logit.toFixed(1)}</Text>
                      </Box>
                      <Text color="gray.500">÷</Text>
                      <Box
                        px={3}
                        py={2}
                        bg={isLowTemp ? "blue.900/30" : isHighTemp ? "orange.900/30" : "gray.700"}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={isLowTemp ? "blue.700" : isHighTemp ? "orange.700" : "gray.600"}
                      >
                        <Text color={isLowTemp ? "blue.300" : isHighTemp ? "orange.300" : "gray.300"}>
                          {temperature}
                        </Text>
                      </Box>
                      <Text color="gray.500">=</Text>
                      <MotionBox
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.2 + 0.2 }}
                        px={3}
                        py={2}
                        bg="green.900/50"
                        borderRadius="md"
                        border="2px solid"
                        borderColor="green.500"
                      >
                        <Text color="green.300" fontWeight="bold">{output[i].toFixed(1)}</Text>
                      </MotionBox>
                    </HStack>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: logits.length * 0.2 + 0.3 }}
              mt={4}
              p={3}
              bg={isLowTemp ? "blue.900/30" : isHighTemp ? "orange.900/30" : "gray.700"}
              borderRadius="md"
              border="1px solid"
              borderColor={isLowTemp ? "blue.700" : isHighTemp ? "orange.700" : "gray.600"}
              textAlign="center"
            >
              <Text color={isLowTemp ? "blue.300" : isHighTemp ? "orange.300" : "gray.300"} fontSize="sm">
                {isLowTemp && "Low temperature → Larger differences → Sharper probabilities"}
                {isHighTemp && "High temperature → Smaller differences → Flatter probabilities"}
                {!isLowTemp && !isHighTemp && "Temperature 1.0 → No change to differences"}
              </Text>
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
              Temperature Scaling Complete!
            </Text>

            {/* Before and After comparison */}
            <HStack gap={6} justify="center" align="flex-start" mb={6}>
              {/* Before */}
              <Box p={4} bg="gray.800" borderRadius="md" flex={1}>
                <Text color="cyan.400" fontSize="sm" fontWeight="semibold" mb={3} textAlign="center">
                  Before (T={temperature})
                </Text>
                <VStack gap={2} align="stretch">
                  {logits.map((logit, i) => (
                    <LogitBar
                      key={i}
                      value={logit}
                      index={i}
                      maxValue={maxLogit}
                      color="cyan.500"
                      delay={i * 0.1}
                    />
                  ))}
                </VStack>
              </Box>

              {/* Arrow */}
              <VStack justify="center" py={8}>
                <Text color={isLowTemp ? "blue.300" : isHighTemp ? "orange.300" : "gray.300"} fontFamily="mono" fontSize="sm">
                  ÷ {temperature}
                </Text>
                <Text color="cyan.500" fontSize="2xl">→</Text>
              </VStack>

              {/* After */}
              <Box p={4} bg="gray.800" borderRadius="md" flex={1}>
                <Text color="green.400" fontSize="sm" fontWeight="semibold" mb={3} textAlign="center">
                  After
                </Text>
                <VStack gap={2} align="stretch">
                  {output.map((value, i) => (
                    <LogitBar
                      key={i}
                      value={value}
                      index={i}
                      maxValue={maxLogit}
                      color="green.500"
                      delay={i * 0.1}
                    />
                  ))}
                </VStack>
              </Box>
            </HStack>

            {/* Result */}
            <Box p={3} bg="gray.800" borderRadius="md" textAlign="center" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2}>Scaled logits:</Text>
              <Text color="green.300" fontFamily="mono" fontWeight="bold" fontSize="lg">
                [{output.map(v => v.toFixed(1)).join(", ")}]
              </Text>
            </Box>

            {/* Insight */}
            <Box p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.700" textAlign="center">
              <Text color="yellow.300" fontSize="sm">
                {isLowTemp && (
                  <>
                    T={temperature} {"<"} 1: Differences are <Text as="span" fontWeight="bold">amplified</Text> →
                    After softmax, top token will dominate more
                  </>
                )}
                {isHighTemp && (
                  <>
                    T={temperature} {">"} 1: Differences are <Text as="span" fontWeight="bold">reduced</Text> →
                    After softmax, probabilities will be more uniform
                  </>
                )}
                {!isLowTemp && !isHighTemp && (
                  <>T=1.0: No change to logit values (identity operation)</>
                )}
              </Text>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a temperature operation
export function isTemperatureTestCase(input: unknown, challengeTitle: string): input is [number[], number] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("temperature")) return false;
  if (!Array.isArray(input) || input.length !== 2) return false;
  const [logits, temp] = input;
  return (
    Array.isArray(logits) &&
    logits.every(l => typeof l === "number") &&
    typeof temp === "number"
  );
}

// Get total steps for temperature visualization
export function getTemperatureTotalSteps(): number {
  return 4; // intro + logits + apply + complete
}
