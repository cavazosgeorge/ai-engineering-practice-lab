import { Box, Text, Badge, VStack, Kbd } from "@chakra-ui/react";
import { type VocabularyTerm } from "../../services/api";

const difficultyColors = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

interface VocabularyFlashcardProps {
  term: VocabularyTerm;
  isFlipped: boolean;
  onFlip: () => void;
}

export function VocabularyFlashcard({
  term,
  isFlipped,
  onFlip,
}: VocabularyFlashcardProps) {
  return (
    <Box
      position="relative"
      w="full"
      maxW="500px"
      h="320px"
      perspective="1000px"
      cursor="pointer"
      onClick={onFlip}
      mx="auto"
    >
      {/* Card container with 3D transform */}
      <Box
        position="absolute"
        w="full"
        h="full"
        transition="transform 0.4s ease-out"
        transformStyle="preserve-3d"
        transform={isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"}
      >
        {/* Front side - Term */}
        <Box
          position="absolute"
          w="full"
          h="full"
          backfaceVisibility="hidden"
          bg="gray.900"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
          p={8}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Badge
            colorPalette={difficultyColors[term.difficulty]}
            variant="subtle"
            position="absolute"
            top={4}
            right={4}
            fontSize="xs"
          >
            {term.difficulty}
          </Badge>

          <VStack gap={4} textAlign="center">
            <Text
              color="white"
              fontSize="2xl"
              fontWeight="bold"
              fontFamily="'JetBrains Mono', monospace"
            >
              {term.term}
            </Text>

            <Text color="gray.500" fontSize="sm">
              Press <Kbd>Space</Kbd> to flip
            </Text>
          </VStack>
        </Box>

        {/* Back side - Definition */}
        <Box
          position="absolute"
          w="full"
          h="full"
          backfaceVisibility="hidden"
          bg="gray.800"
          borderRadius="xl"
          border="1px solid"
          borderColor="cyan.700"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 182, 212, 0.1)"
          p={8}
          transform="rotateY(180deg)"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          overflow="auto"
        >
          <Badge
            colorPalette={difficultyColors[term.difficulty]}
            variant="subtle"
            position="absolute"
            top={4}
            right={4}
            fontSize="xs"
          >
            {term.difficulty}
          </Badge>

          <VStack gap={4} textAlign="center" maxW="100%">
            <Text color="gray.400" fontSize="sm" fontWeight="medium">
              {term.term}
            </Text>

            <Text color="white" fontSize="lg" lineHeight="tall">
              {term.definition}
            </Text>

            {term.context && (
              <Box
                mt={2}
                p={3}
                bg="gray.900"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="cyan.500"
                w="full"
              >
                <Text color="gray.400" fontSize="sm" fontStyle="italic">
                  {term.context}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
