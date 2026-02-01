import { useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Breadcrumb,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { LuBot } from "react-icons/lu";
import { useCreateConversation } from "../hooks/useAgentChat";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWeekDetail } from "../hooks/useWeeks";
import { prefetchLesson } from "../hooks/useLessons";

export function WeekDetail() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: week, isLoading } = useWeekDetail(slug);
  const createConversation = useCreateConversation();

  const handleLessonHover = useCallback(
    (lessonSlug: string) => {
      prefetchLesson(queryClient, lessonSlug);
    },
    [queryClient]
  );

  const isInitialLoading = !week && isLoading;

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
          <Skeleton height="20px" width="200px" />
          <Box>
            <Skeleton height="20px" width="80px" mb={2} />
            <Skeleton height="40px" width="400px" mb={4} />
            <Skeleton height="24px" width="80%" />
          </Box>
          {[1, 2].map((i) => (
            <Card.Root key={i} bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <HStack justify="space-between" mb={2}>
                  <Skeleton height="20px" width="100px" />
                  <Skeleton height="16px" width="60px" />
                </HStack>
                <Skeleton height="24px" width="60%" mb={2} />
                <SkeletonText noOfLines={2} gap={2} />
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </Container>
    );
  }

  if (!week) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Week not found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild color="gray.400">
                <Link to="/">Home</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild color="gray.400">
                <Link to="/weeks">Weeks</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink color="white">
                Week {week.weekNumber}
              </Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Box>
          <Badge colorPalette="cyan" variant="subtle" mb={2}>
            Week {week.weekNumber}
          </Badge>
          <Heading size="2xl" color="white" mb={4}>
            {week.title}
          </Heading>
          <Text color="gray.400" fontSize="lg">
            {week.description}
          </Text>
          <Button
            mt={4}
            variant="outline"
            borderColor="cyan.700"
            color="cyan.400"
            _hover={{ bg: "cyan.600/10", borderColor: "cyan.600" }}
            _focusVisible={{ outline: "none", boxShadow: "none" }}
            size="sm"
            onClick={async () => {
              const conv = await createConversation.mutateAsync({
                weekId: week.id,
                title: `Week ${week.weekNumber}: ${week.title}`,
              });
              navigate(`/agent/${conv.id}`);
            }}
            loading={createConversation.isPending}
          >
            <Box fontSize="14px" mr={1.5}>
              <LuBot />
            </Box>
            Ask AI Agent about this week
          </Button>
        </Box>

        {week.lessons.length === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body>
              <Text color="gray.400" textAlign="center" py={8}>
                No lessons available for this week yet. Check back soon!
              </Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack gap={4} align="stretch">
            <Heading size="lg" color="white">
              Lessons
            </Heading>
            {week.lessons.map((lesson) => (
              <Link key={lesson.id} to={`/lessons/${lesson.slug}`}>
                <Card.Root
                  bg="gray.900"
                  borderColor="gray.800"
                  _hover={{
                    borderColor: "cyan.700",
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onMouseEnter={() => handleLessonHover(lesson.slug)}
                >
                  <Card.Body>
                    <HStack justify="space-between" mb={2}>
                      <Text color="white" fontWeight="medium" fontSize="lg">
                        {lesson.title}
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        &rarr;
                      </Text>
                    </HStack>
                    {lesson.description && (
                      <Text
                        color="gray.400"
                        fontSize="sm"
                        lineClamp={2}
                        mb={3}
                      >
                        {lesson.description}
                      </Text>
                    )}
                    <HStack gap={3}>
                      {lesson.conceptCount > 0 && (
                        <Badge colorPalette="blue" variant="subtle">
                          {lesson.conceptCount} concept
                          {lesson.conceptCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {lesson.challengeCount > 0 && (
                        <Badge colorPalette="cyan" variant="subtle">
                          {lesson.challengeCount} challenge
                          {lesson.challengeCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {lesson.vocabularyCount > 0 && (
                        <Badge colorPalette="purple" variant="subtle">
                          {lesson.vocabularyCount} term
                          {lesson.vocabularyCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </HStack>
                  </Card.Body>
                </Card.Root>
              </Link>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
