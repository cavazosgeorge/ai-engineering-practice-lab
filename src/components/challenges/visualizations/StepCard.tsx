import { Box, Text, HStack, Badge } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description?: string;
  code?: string;
  isActive: boolean;
  isCompleted: boolean;
}

export function StepCard({
  stepNumber,
  title,
  description,
  code,
  isActive,
  isCompleted,
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      <Box
        p={4}
        bg={isActive ? "cyan.900/30" : isCompleted ? "green.900/20" : "gray.800"}
        borderRadius="lg"
        border="2px solid"
        borderColor={isActive ? "cyan.500" : isCompleted ? "green.700" : "gray.700"}
        boxShadow={isActive ? "0 0 20px rgba(0, 188, 212, 0.3)" : "none"}
        transition="all 0.3s ease"
      >
        <HStack gap={3} mb={2}>
          <Badge
            colorPalette={isActive ? "cyan" : isCompleted ? "green" : "gray"}
            variant="solid"
            borderRadius="full"
            px={2}
          >
            {stepNumber}
          </Badge>
          <Text color="white" fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
        </HStack>
        {description && (
          <Text color="gray.400" fontSize="sm" mb={2}>
            {description}
          </Text>
        )}
        {code && (
          <Box
            p={2}
            bg="gray.900"
            borderRadius="md"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="xs"
            color="cyan.300"
            overflow="auto"
          >
            {code}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
