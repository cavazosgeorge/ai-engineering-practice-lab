import { useCallback } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Card,
  Icon,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLessons, useProgressStats } from "../hooks/useProgress";
import { prefetchLesson } from "../hooks/useLessons";
import { type Lesson } from "../services/api";
import { LuCheck } from "react-icons/lu";

export function Dashboard() {
  const queryClient = useQueryClient();
  const { data: lessons, isLoading: lessonsLoading } = useLessons();
  const { data: progressData, isLoading: progressLoading } = useProgressStats();

  const stats = progressData?.stats;
  const completedChallenges = progressData?.completedChallenges ?? new Set<string>();

  // ✅ Prefetch lesson on hover for instant navigation
  const handleLessonHover = useCallback((slug: string) => {
    prefetchLesson(queryClient, slug);
  }, [queryClient]);

  // Calculate completion stats for a lesson
  const getLessonProgress = (lesson: Lesson) => {
    const totalChallenges = lesson.concepts.reduce(
      (acc, c) => acc + c.challenges.length,
      0
    );
    const completedCount = lesson.concepts.reduce(
      (acc, c) => acc + c.challenges.filter(ch => completedChallenges.has(ch.id)).length,
      0
    );
    return { total: totalChallenges, completed: completedCount };
  };

  // ✅ Only show skeleton on initial load (no cached data)
  const isInitialLoading = (!lessons && lessonsLoading) || (!progressData && progressLoading);

  if (isInitialLoading) {
    // Skeleton only appears after 200ms delay - if data loads fast, user sees nothing
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{
          "@keyframes fadeIn": {
            to: { opacity: 1 },
          },
        }}
      >
        <VStack gap={12} align="stretch">
          {/* Header - show actual content, it's static */}
          <Box>
            <Heading
              size="2xl"
              color="white"
              mb={4}
              fontFamily="'JetBrains Mono', monospace"
            >
              AI Engineering Practice Lab
            </Heading>
            <Text color="gray.400" fontSize="lg" maxW="2xl">
              Master AI/ML fundamentals through hands-on coding challenges.
              Implement tokenizers, build neural network components, and understand
              language models from the ground up.
            </Text>
          </Box>

          {/* Stats skeleton */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            {[1, 2, 3, 4].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Skeleton height="14px" width="80px" mb={2} />
                  <Skeleton height="32px" width="40px" />
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>

          {/* Lessons skeleton */}
          <Box>
            <Heading size="lg" color="white" mb={6}>
              Lessons
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                  <Card.Body>
                    <HStack justify="space-between" mb={2}>
                      <Skeleton height="20px" width="70px" />
                      <Skeleton height="16px" width="30px" />
                    </HStack>
                    <Skeleton height="24px" width="60%" mb={2} />
                    <SkeletonText noOfLines={2} gap={2} mb={3} />
                    <Skeleton height="4px" width="100%" />
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={12} align="stretch">
        <Box>
          <Heading
            size="2xl"
            color="white"
            mb={4}
            fontFamily="'JetBrains Mono', monospace"
          >
            AI Engineering Practice Lab
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="2xl">
            Master AI/ML fundamentals through hands-on coding challenges.
            Implement tokenizers, build neural network components, and understand
            language models from the ground up.
          </Text>
        </Box>

        {stats && stats.total > 0 && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.400" fontSize="sm">
                  Total Progress
                </Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  {stats.total}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.400" fontSize="sm">
                  Mastered
                </Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">
                  {stats.mastered}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.400" fontSize="sm">
                  Reviewing
                </Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">
                  {stats.reviewing}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.400" fontSize="sm">
                  Learning
                </Text>
                <Text color="blue.400" fontSize="2xl" fontWeight="bold">
                  {stats.learning}
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        )}

        <Box>
          <Heading size="lg" color="white" mb={6}>
            Lessons
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {(lessons ?? []).map((lesson) => {
              const progress = getLessonProgress(lesson);
              const isComplete = progress.completed === progress.total && progress.total > 0;
              const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

              return (
                <Link key={lesson.id} to={`/lessons/${lesson.slug}`}>
                  <Card.Root
                    bg="gray.900"
                    borderColor={isComplete ? "green.700" : "gray.800"}
                    _hover={{
                      borderColor: isComplete ? "green.600" : "cyan.700",
                      transform: "translateY(-2px)",
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onMouseEnter={() => handleLessonHover(lesson.slug)}
                  >
                    <Card.Body>
                      <HStack justify="space-between" mb={2}>
                        <HStack gap={2}>
                          <Badge
                            colorPalette="cyan"
                            variant="subtle"
                            fontSize="xs"
                          >
                            Lesson {lesson.orderIndex}
                          </Badge>
                          {isComplete && (
                            <Icon color="green.400" boxSize={4}>
                              <LuCheck />
                            </Icon>
                          )}
                        </HStack>
                        <HStack gap={2}>
                          <Text
                            color={isComplete ? "green.400" : progress.completed > 0 ? "cyan.400" : "gray.400"}
                            fontSize="sm"
                            fontWeight={progress.completed > 0 ? "medium" : "normal"}
                          >
                            {progress.completed}/{progress.total}
                          </Text>
                        </HStack>
                      </HStack>
                      <Heading size="md" color="white" mb={2}>
                        {lesson.title}
                      </Heading>
                      <Text color="gray.400" fontSize="sm" lineClamp={2} mb={3}>
                        {lesson.description}
                      </Text>
                      {/* Progress bar */}
                      <Box
                        h="4px"
                        bg="gray.700"
                        borderRadius="full"
                        overflow="hidden"
                      >
                        <Box
                          h="full"
                          w={`${progressPercent}%`}
                          bg={isComplete ? "green.500" : "cyan.500"}
                          borderRadius="full"
                          transition="width 0.3s ease"
                        />
                      </Box>
                    </Card.Body>
                  </Card.Root>
                </Link>
              );
            })}
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}
