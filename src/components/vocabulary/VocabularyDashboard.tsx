import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { LuBookOpen, LuBrain, LuCheck, LuClock, LuLayers, LuZap } from "react-icons/lu";
import { type VocabularyStats, type Lesson } from "../../services/api";

const masteryColors = {
  learning: "blue",
  reviewing: "yellow",
  mastered: "green",
};

interface VocabularyDashboardProps {
  lesson: Lesson;
  stats: VocabularyStats;
  onStartFlashcards: () => void;
  onStartQuiz: () => void;
  onHoverQuiz?: () => void; // ✅ Optional prefetch trigger on hover
}

export function VocabularyDashboard({
  lesson,
  stats,
  onStartFlashcards,
  onStartQuiz,
  onHoverQuiz,
}: VocabularyDashboardProps) {
  const overallProgress = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  const reviewingProgress = stats.total > 0
    ? Math.round((stats.reviewing / stats.total) * 100)
    : 0;

  const learningProgress = stats.total > 0
    ? Math.round((stats.learning / stats.total) * 100)
    : 0;

  return (
    <VStack gap={8} align="stretch">
      {/* Header */}
      <Box>
        <Badge colorPalette="cyan" variant="subtle" mb={2}>
          {lesson.title}
        </Badge>
        <Text color="white" fontSize="2xl" fontWeight="bold" mb={2}>
          Vocabulary
        </Text>
        <Text color="gray.400">
          Master the key terms and concepts from this lesson
        </Text>
      </Box>

      {/* Overall Progress */}
      <Card.Root bg="gray.900" borderColor="gray.800">
        <Card.Body>
          <HStack justify="space-between" mb={4}>
            <Text color="white" fontWeight="medium">
              Overall Progress
            </Text>
            <Text color="cyan.400" fontWeight="bold">
              {overallProgress}% mastered
            </Text>
          </HStack>

          {/* Stacked progress bar */}
          <Box h="12px" bg="gray.800" borderRadius="full" overflow="hidden">
            <Box display="flex" h="full">
              <Box
                w={`${overallProgress}%`}
                bg="green.500"
                transition="width 0.3s ease"
              />
              <Box
                w={`${reviewingProgress}%`}
                bg="yellow.500"
                transition="width 0.3s ease"
              />
              <Box
                w={`${learningProgress}%`}
                bg="blue.500"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>

          {/* Legend */}
          <HStack gap={6} mt={4} flexWrap="wrap">
            <HStack gap={2}>
              <Box w={3} h={3} bg="green.500" borderRadius="sm" />
              <Text color="gray.400" fontSize="sm">
                Mastered ({stats.mastered})
              </Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="yellow.500" borderRadius="sm" />
              <Text color="gray.400" fontSize="sm">
                Reviewing ({stats.reviewing})
              </Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="blue.500" borderRadius="sm" />
              <Text color="gray.400" fontSize="sm">
                Learning ({stats.learning})
              </Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="gray.700" borderRadius="sm" />
              <Text color="gray.400" fontSize="sm">
                Not started ({stats.total - stats.mastered - stats.reviewing - stats.learning})
              </Text>
            </HStack>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Card.Root bg="gray.900" borderColor="gray.800">
          <Card.Body>
            <HStack gap={3}>
              <Box p={2} bg="cyan.900" borderRadius="lg">
                <Icon boxSize={5} color="cyan.400">
                  <LuLayers />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  {stats.total}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Total Terms
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="gray.900" borderColor="gray.800">
          <Card.Body>
            <HStack gap={3}>
              <Box p={2} bg="green.900" borderRadius="lg">
                <Icon boxSize={5} color="green.400">
                  <LuCheck />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  {stats.mastered}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Mastered
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="gray.900" borderColor="gray.800">
          <Card.Body>
            <HStack gap={3}>
              <Box p={2} bg="yellow.900" borderRadius="lg">
                <Icon boxSize={5} color="yellow.400">
                  <LuClock />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  {stats.reviewing}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Reviewing
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="gray.900" borderColor="gray.800">
          <Card.Body>
            <HStack gap={3}>
              <Box p={2} bg="blue.900" borderRadius="lg">
                <Icon boxSize={5} color="blue.400">
                  <LuBrain />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  {stats.learning}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Learning
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Study Mode Selection */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Card.Root
          bg="gray.900"
          borderColor="gray.800"
          _hover={{ borderColor: "cyan.700", transform: "translateY(-2px)" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onStartFlashcards}
        >
          <Card.Body p={6}>
            <VStack gap={4}>
              <Box p={4} bg="cyan.900" borderRadius="xl">
                <Icon boxSize={10} color="cyan.400">
                  <LuBookOpen />
                </Icon>
              </Box>
              <VStack gap={1}>
                <Text color="white" fontSize="lg" fontWeight="bold">
                  Flashcards
                </Text>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  Review terms with flip cards. Rate your knowledge to track progress.
                </Text>
              </VStack>
              <HStack gap={2} flexWrap="wrap" justify="center">
                <Badge colorPalette={masteryColors.learning} variant="subtle">
                  {stats.flashcard?.learning ?? 0} learning
                </Badge>
                <Badge colorPalette={masteryColors.reviewing} variant="subtle">
                  {stats.flashcard?.reviewing ?? 0} reviewing
                </Badge>
                <Badge colorPalette={masteryColors.mastered} variant="subtle">
                  {stats.flashcard?.mastered ?? 0} mastered
                </Badge>
              </HStack>
              <Button colorPalette="cyan" w="full">
                <Icon mr={2}>
                  <LuBookOpen />
                </Icon>
                Start Flashcards
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        <Card.Root
          bg="gray.900"
          borderColor="gray.800"
          _hover={{ borderColor: "purple.700", transform: "translateY(-2px)" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onStartQuiz}
          onMouseEnter={onHoverQuiz}
        >
          <Card.Body p={6}>
            <VStack gap={4}>
              <Box p={4} bg="purple.900" borderRadius="xl">
                <Icon boxSize={10} color="purple.400">
                  <LuZap />
                </Icon>
              </Box>
              <VStack gap={1}>
                <Text color="white" fontSize="lg" fontWeight="bold">
                  Quiz Mode
                </Text>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  Test yourself with multiple choice questions. Track your accuracy.
                </Text>
              </VStack>
              <HStack gap={2} flexWrap="wrap" justify="center">
                <Badge colorPalette={masteryColors.learning} variant="subtle">
                  {stats.quiz?.learning ?? 0} learning
                </Badge>
                <Badge colorPalette={masteryColors.reviewing} variant="subtle">
                  {stats.quiz?.reviewing ?? 0} reviewing
                </Badge>
                <Badge colorPalette={masteryColors.mastered} variant="subtle">
                  {stats.quiz?.mastered ?? 0} mastered
                </Badge>
              </HStack>
              <Button colorPalette="purple" w="full">
                <Icon mr={2}>
                  <LuZap />
                </Icon>
                Start Quiz
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Empty state */}
      {stats.total === 0 && (
        <Card.Root bg="gray.900" borderColor="gray.800">
          <Card.Body textAlign="center" py={12}>
            <Icon boxSize={12} color="gray.600" mb={4}>
              <LuBookOpen />
            </Icon>
            <Text color="gray.400" fontSize="lg" mb={2}>
              No vocabulary terms yet
            </Text>
            <Text color="gray.500">
              Vocabulary terms will be added to this lesson soon.
            </Text>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}
