import { useCallback } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  SimpleGrid,
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

export function Lessons() {
  const queryClient = useQueryClient();
  const { data: lessons, isLoading: lessonsLoading } = useLessons();
  const { data: progressData, isLoading: progressLoading } = useProgressStats();

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

  // ✅ Only show loading on initial load (no cached data)
  const isInitialLoading = (!lessons && lessonsLoading) || (!progressData && progressLoading);

  if (isInitialLoading) {
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <VStack gap={8} align="stretch">
          <Heading size="2xl" color="white">
            All Lessons
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <HStack justify="space-between" mb={3}>
                    <Skeleton height="20px" width="80px" />
                    <Skeleton height="16px" width="40px" />
                  </HStack>
                  <Skeleton height="28px" width="70%" mb={3} />
                  <SkeletonText noOfLines={2} gap={2} mb={3} />
                  <Skeleton height="4px" width="100%" mb={4} />
                  <VStack gap={1} align="stretch">
                    <Skeleton height="16px" width="60%" />
                    <Skeleton height="16px" width="50%" />
                    <Skeleton height="16px" width="55%" />
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Heading size="2xl" color="white">
          All Lessons
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
                  h="full"
                  onMouseEnter={() => handleLessonHover(lesson.slug)}
                >
                  <Card.Body>
                    <HStack justify="space-between" mb={3}>
                      <HStack gap={2}>
                        <Badge colorPalette="cyan" variant="subtle" fontSize="xs">
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
                    <Heading size="lg" color="white" mb={3}>
                      {lesson.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm" mb={3} lineClamp={2}>
                      {lesson.description}
                    </Text>
                    {/* Progress bar */}
                    <Box
                      h="4px"
                      bg="gray.700"
                      borderRadius="full"
                      overflow="hidden"
                      mb={4}
                    >
                      <Box
                        h="full"
                        w={`${progressPercent}%`}
                        bg={isComplete ? "green.500" : "cyan.500"}
                        borderRadius="full"
                        transition="width 0.3s ease"
                      />
                    </Box>
                    <VStack gap={1} align="stretch">
                      {lesson.concepts.slice(0, 3).map((concept) => (
                        <Text
                          key={concept.id}
                          color="gray.400"
                          fontSize="sm"
                        >
                          • {concept.title}
                        </Text>
                      ))}
                      {lesson.concepts.length > 3 && (
                        <Text color="gray.600" fontSize="sm">
                          +{lesson.concepts.length - 3} more concepts
                        </Text>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Link>
            );
          })}
        </SimpleGrid>

        {lessons && lessons.length === 0 && (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body textAlign="center" py={12}>
              <Text color="gray.400">
                No lessons available yet. Run `bun run db:seed` to add initial
                content.
              </Text>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Container>
  );
}
