import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { CodePatterns } from "../ExecutionVisualizer";

interface Message {
  role: string;
  content: string;
}

interface ChatMLOperationProps {
  messages: Message[];
  output: string;
  currentStep: number;
  codePatterns: CodePatterns;
  solutionCode: string;
  challengeTitle: string;
}

const MotionBox = motion.create(Box);

// Role color mapping
function getRoleColor(role: string): string {
  switch (role) {
    case "system": return "purple";
    case "user": return "cyan";
    case "assistant": return "green";
    default: return "gray";
  }
}

// Message card component
function MessageCard({
  message,
  index,
  isActive,
  delay = 0,
}: {
  message: Message;
  index: number;
  isActive?: boolean;
  delay?: number;
}) {
  const roleColor = getRoleColor(message.role);

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      p={3}
      bg={isActive ? `${roleColor}.900/50` : "gray.700"}
      border="2px solid"
      borderColor={isActive ? `${roleColor}.500` : "gray.600"}
      borderRadius="md"
      w="full"
    >
      <HStack gap={3} align="flex-start">
        <Box
          px={2}
          py={1}
          bg={`${roleColor}.800`}
          borderRadius="md"
        >
          <Text color={`${roleColor}.200`} fontSize="xs" fontWeight="bold" textTransform="uppercase">
            {message.role}
          </Text>
        </Box>
        <VStack align="start" gap={1} flex={1}>
          <Text color="gray.400" fontSize="xs">messages[{index}]</Text>
          <Text color="gray.200" fontSize="sm">
            "{message.content}"
          </Text>
        </VStack>
      </HStack>
    </MotionBox>
  );
}

// Formatted output block
function FormattedBlock({
  message,
  delay = 0,
}: {
  message: Message;
  delay?: number;
}) {
  const roleColor = getRoleColor(message.role);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      p={3}
      bg="gray.900"
      borderRadius="md"
      border="1px solid"
      borderColor={`${roleColor}.700`}
      fontFamily="mono"
      fontSize="xs"
      w="full"
    >
      <VStack align="stretch" gap={1}>
        <HStack gap={0}>
          <Text color="yellow.400">{"<|im_start|>"}</Text>
          <Text color={`${roleColor}.300`}>{message.role}</Text>
        </HStack>
        <Text color="gray.300" pl={4}>{message.content}</Text>
        <Text color="yellow.400">{"<|im_end|>"}</Text>
      </VStack>
    </MotionBox>
  );
}

export function ChatMLOperation({
  messages,
  output,
  currentStep,
  codePatterns: _codePatterns,
  solutionCode,
  challengeTitle,
}: ChatMLOperationProps) {
  // Steps:
  // 0: Introduction
  // 1: Show messages
  // 2: Format each message
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
                What is ChatML?
              </Text>
              <Text color="gray.300" fontSize="sm">
                ChatML is a format for structuring conversations with LLMs.
                Each message is wrapped with special tokens that indicate role and boundaries.
              </Text>
            </Box>

            <Box mt={3} p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.800">
              <Text color="yellow.300" fontSize="sm" fontWeight="semibold" mb={2}>
                The Format:
              </Text>
              <Box fontFamily="mono" fontSize="xs" pl={2}>
                <Text color="yellow.400">{"<|im_start|>"}<Text as="span" color="cyan.300">role</Text></Text>
                <Text color="gray.400" pl={2}>content goes here</Text>
                <Text color="yellow.400">{"<|im_end|>"}</Text>
              </Box>
            </Box>
          </MotionBox>
        )}

        {/* Step 1: Show messages */}
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
              Step 1: Start with the message objects
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Each message has a <Text as="span" color="cyan.300" fontFamily="mono">role</Text> and <Text as="span" color="cyan.300" fontFamily="mono">content</Text>.
            </Text>

            <VStack gap={3} align="stretch">
              {messages.map((message, i) => (
                <MessageCard
                  key={i}
                  message={message}
                  index={i}
                  delay={i * 0.15}
                />
              ))}
            </VStack>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: messages.length * 0.15 + 0.2 }}
              mt={4}
              p={3}
              bg="gray.700"
              borderRadius="md"
            >
              <Text color="gray.400" fontSize="xs" mb={1}>Input structure:</Text>
              <Text color="gray.300" fontFamily="mono" fontSize="xs">
                messages = [
                {messages.map((m, i) => (
                  <Text as="span" key={i}>
                    {`{role: "${m.role}", content: "${m.content}"}`}
                    {i < messages.length - 1 ? ", " : ""}
                  </Text>
                ))}
                ]
              </Text>
            </MotionBox>
          </MotionBox>
        )}

        {/* Step 2: Format each message */}
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
              Step 2: Format each message with ChatML tokens
            </Text>

            <Text color="gray.400" fontSize="sm" mb={4}>
              Wrap each message: <Text as="span" color="yellow.300" fontFamily="mono">{"<|im_start|>"}role\ncontent{"<|im_end|>"}</Text>
            </Text>

            <VStack gap={4} align="stretch">
              {messages.map((message, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                >
                  <HStack gap={4} align="flex-start">
                    {/* Original message */}
                    <Box flex={1}>
                      <Text color="gray.500" fontSize="xs" mb={2}>Message {i}:</Text>
                      <MessageCard message={message} index={i} isActive />
                    </Box>

                    {/* Arrow */}
                    <VStack justify="center" py={6}>
                      <MotionBox
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Text color="cyan.500" fontSize="xl">→</Text>
                      </MotionBox>
                    </VStack>

                    {/* Formatted */}
                    <Box flex={1}>
                      <Text color="gray.500" fontSize="xs" mb={2}>Formatted:</Text>
                      <FormattedBlock message={message} delay={i * 0.3 + 0.2} />
                    </Box>
                  </HStack>
                </MotionBox>
              ))}
            </VStack>
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
              ChatML Formatting Complete!
            </Text>

            {/* Input messages */}
            <Box p={3} bg="gray.800" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3}>Input messages:</Text>
              <VStack gap={2} align="stretch">
                {messages.map((message, i) => (
                  <MessageCard key={i} message={message} index={i} delay={i * 0.1} />
                ))}
              </VStack>
            </Box>

            {/* Arrow */}
            <VStack mb={4}>
              <Text color="pink.300" fontFamily="mono" fontSize="sm">format_chatml()</Text>
              <Text color="cyan.500" fontSize="2xl">↓</Text>
            </VStack>

            {/* Output string */}
            <Box p={4} bg="gray.800" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={3}>Formatted output string:</Text>
              <Box
                p={3}
                bg="gray.900"
                borderRadius="md"
                border="1px solid"
                borderColor="green.700"
                fontFamily="mono"
                fontSize="sm"
                whiteSpace="pre-wrap"
                overflowX="auto"
              >
                {messages.map((message, i) => {
                  const roleColor = getRoleColor(message.role);
                  return (
                    <Box key={i} mb={i < messages.length - 1 ? 2 : 0}>
                      <Text as="span" color="yellow.400">{"<|im_start|>"}</Text>
                      <Text as="span" color={`${roleColor}.300`}>{message.role}</Text>
                      <Text as="span" color="gray.500">\n</Text>
                      <br />
                      <Text as="span" color="gray.300">{message.content}</Text>
                      <Text as="span" color="yellow.400">{"<|im_end|>"}</Text>
                      <Text as="span" color="gray.500">\n</Text>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Raw string view */}
            <Box p={3} bg="gray.700" borderRadius="md" mb={4}>
              <Text color="gray.500" fontSize="xs" mb={2}>As a Python string (with escape characters):</Text>
              <Text color="green.300" fontFamily="mono" fontSize="xs" wordBreak="break-all">
                "{output.replace(/\n/g, "\\n")}"
              </Text>
            </Box>

            {/* Key insight */}
            <Box p={3} bg="yellow.900/20" borderRadius="md" border="1px solid" borderColor="yellow.700" textAlign="center">
              <Text color="yellow.300" fontSize="sm">
                Special tokens like <Text as="span" fontFamily="mono">{"<|im_start|>"}</Text> help the model
                understand conversation structure and role boundaries.
              </Text>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// Helper to detect if test case is a ChatML operation
export function isChatMLTestCase(input: unknown, challengeTitle: string): input is [Message[]] {
  const lowerTitle = challengeTitle.toLowerCase();
  if (!lowerTitle.includes("chatml") && !lowerTitle.includes("chat") && !lowerTitle.includes("format message")) return false;
  if (!Array.isArray(input) || input.length !== 1) return false;
  const [messages] = input;
  return (
    Array.isArray(messages) &&
    messages.every(m =>
      typeof m === "object" &&
      m !== null &&
      "role" in m &&
      "content" in m
    )
  );
}

// Get total steps for ChatML visualization
export function getChatMLTotalSteps(): number {
  return 4; // intro + messages + format + complete
}
