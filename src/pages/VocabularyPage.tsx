import { useState, useCallback, startTransition } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Container,
  VStack,
  Text,
  Breadcrumb,
  Box,
  Card,
  Skeleton,
  SimpleGrid,
  HStack,
} from "@chakra-ui/react";
import {
  VocabularyDashboard,
  VocabularyFlashcardDeck,
  VocabularyQuizSession,
} from "../components/vocabulary";
import {
  useVocabularyTerms,
  useVocabularyStats,
  prefetchQuizQuestion,
} from "../hooks/useVocabulary";
import { useLesson } from "../hooks/useLessons";

type VocabularyMode = "dashboard" | "flashcards" | "quiz";

interface VocabularyPageProps {
  mode?: VocabularyMode;
}

export function VocabularyPage({ mode: initialMode }: VocabularyPageProps) {
  const { lessonSlug } = useParams<{ lessonSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ✅ Use TanStack Query for lesson fetching (not useEffect)
  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonSlug);

  // ✅ Derive initial mode from props, only use state for user-initiated changes
  const [userMode, setUserMode] = useState<VocabularyMode | null>(null);
  const mode = userMode ?? initialMode ?? "dashboard";

  // ✅ Use lessonSlug directly - no cascading dependency on lesson.id
  // All three queries run in parallel instead of lesson → terms/stats waterfall
  const {
    data: terms,
    isLoading: termsLoading,
  } = useVocabularyTerms(lessonSlug);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useVocabularyStats(lessonSlug);

  // ✅ Only show loading spinner on initial load (no cached data), not refetches
  const isInitialLoading = (!lesson && lessonLoading) || (!terms && termsLoading) || (!stats && statsLoading);

  // ✅ Stable callback references with useCallback
  // ✅ Use startTransition to avoid showing loading spinners during mode changes
  const handleStartFlashcards = useCallback(() => {
    startTransition(() => {
      setUserMode("flashcards");
    });
    navigate(`/vocabulary/${lessonSlug}/flashcards`, { replace: true });
  }, [navigate, lessonSlug]);

  const handleStartQuiz = useCallback(() => {
    startTransition(() => {
      setUserMode("quiz");
    });
    navigate(`/vocabulary/${lessonSlug}/quiz`, { replace: true });
  }, [navigate, lessonSlug]);

  const handleBackToDashboard = useCallback(() => {
    startTransition(() => {
      setUserMode("dashboard");
    });
    refetchStats();
    navigate(`/vocabulary/${lessonSlug}`, { replace: true });
  }, [navigate, lessonSlug, refetchStats]);

  // ✅ Prefetch first quiz question when user hovers over Quiz Mode card
  const handleHoverQuiz = useCallback(() => {
    if (terms && terms.length > 0) {
      prefetchQuizQuestion(queryClient, terms[0].id);
    }
  }, [queryClient, terms]);

  // ✅ Only show skeleton on initial load, not refetches
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
          {/* Breadcrumb skeleton */}
          <Skeleton height="20px" width="300px" />

          {/* Header skeleton */}
          <Box>
            <Skeleton height="40px" width="250px" mb={2} />
            <Skeleton height="20px" width="150px" />
          </Box>

          {/* Stats skeleton */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            {[1, 2, 3, 4].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Skeleton height="16px" width="60px" mb={2} />
                  <Skeleton height="32px" width="40px" />
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>

          {/* Mode cards skeleton */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {[1, 2].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <HStack gap={4}>
                    <Skeleton height="48px" width="48px" borderRadius="lg" />
                    <VStack align="start" gap={2} flex={1}>
                      <Skeleton height="24px" width="120px" />
                      <Skeleton height="16px" width="80%" />
                    </VStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (!lesson) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Lesson not found</Text>
      </Container>
    );
  }

  if (!terms || !stats) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Failed to load vocabulary data</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        {/* Breadcrumbs */}
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
                <Link to="/lessons">Lessons</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild color="gray.400">
                <Link to={`/lessons/${lessonSlug}`}>{lesson.title}</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              {mode === "dashboard" ? (
                <Breadcrumb.CurrentLink color="white">
                  Vocabulary
                </Breadcrumb.CurrentLink>
              ) : (
                <Breadcrumb.Link asChild color="gray.400">
                  <Link to={`/vocabulary/${lessonSlug}`}>Vocabulary</Link>
                </Breadcrumb.Link>
              )}
            </Breadcrumb.Item>
            {mode !== "dashboard" && (
              <>
                <Breadcrumb.Separator />
                <Breadcrumb.Item>
                  <Breadcrumb.CurrentLink color="white">
                    {mode === "flashcards" ? "Flashcards" : "Quiz"}
                  </Breadcrumb.CurrentLink>
                </Breadcrumb.Item>
              </>
            )}
          </Breadcrumb.List>
        </Breadcrumb.Root>

        {/* Content based on mode */}
        <Box>
          {mode === "dashboard" && (
            <VocabularyDashboard
              lesson={lesson}
              stats={stats}
              onStartFlashcards={handleStartFlashcards}
              onStartQuiz={handleStartQuiz}
              onHoverQuiz={handleHoverQuiz}
            />
          )}

          {mode === "flashcards" && terms.length > 0 && (
            <VocabularyFlashcardDeck
              terms={terms}
              lessonId={lesson.id}
              onComplete={handleBackToDashboard}
              onBack={handleBackToDashboard}
            />
          )}

          {mode === "quiz" && terms.length > 0 && (
            <VocabularyQuizSession
              terms={terms}
              lessonId={lesson.id}
              onComplete={handleBackToDashboard}
              onBack={handleBackToDashboard}
            />
          )}

          {(mode === "flashcards" || mode === "quiz") && terms.length === 0 && (
            <VStack gap={4} py={12}>
              <Text color="gray.400" fontSize="lg">
                No vocabulary terms available
              </Text>
              <Text color="gray.500">
                Return to the dashboard to see available study options.
              </Text>
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
