import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "../hooks/useVocabulary";
import { fetchLesson, type Lesson } from "../services/api";

type VocabularyMode = "dashboard" | "flashcards" | "quiz";

interface VocabularyPageProps {
  mode?: VocabularyMode;
}

export function VocabularyPage({ mode: initialMode }: VocabularyPageProps) {
  const { lessonSlug } = useParams<{ lessonSlug: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [mode, setMode] = useState<VocabularyMode>(initialMode || "dashboard");

  // Fetch lesson data
  useEffect(() => {
    if (!lessonSlug) return;

    setLessonLoading(true);
    fetchLesson(lessonSlug)
      .then(setLesson)
      .catch(console.error)
      .finally(() => setLessonLoading(false));
  }, [lessonSlug]);

  // Sync mode from props
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const {
    data: terms,
    isLoading: termsLoading,
  } = useVocabularyTerms(lesson?.id || "");

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useVocabularyStats(lesson?.id);

  const isLoading = lessonLoading || termsLoading || statsLoading;

  const handleStartFlashcards = () => {
    setMode("flashcards");
    navigate(`/vocabulary/${lessonSlug}/flashcards`, { replace: true });
  };

  const handleStartQuiz = () => {
    setMode("quiz");
    navigate(`/vocabulary/${lessonSlug}/quiz`, { replace: true });
  };

  const handleBackToDashboard = () => {
    setMode("dashboard");
    refetchStats();
    navigate(`/vocabulary/${lessonSlug}`, { replace: true });
  };

  if (isLoading) {
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
