import { useState, useCallback, startTransition } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Container,
  VStack,
  Text,
  Breadcrumb,
  Spinner,
  Box,
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

  const {
    data: terms,
    isLoading: termsLoading,
  } = useVocabularyTerms(lesson?.id || "");

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useVocabularyStats(lesson?.id);

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

  // ✅ Only show full-page spinner on initial load, not refetches
  if (isInitialLoading) {
    return (
      <Container maxW="container.xl" py={12}>
        <VStack gap={4}>
          <Spinner size="xl" color="cyan.400" />
          <Text color="gray.400">Loading vocabulary...</Text>
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
