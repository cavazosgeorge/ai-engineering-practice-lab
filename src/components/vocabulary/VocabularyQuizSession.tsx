import { useState, useCallback } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Progress,
  Icon,
  Card,
  SimpleGrid,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { LuCheck, LuRotateCcw } from "react-icons/lu";
import { VocabularyQuiz } from "./VocabularyQuiz";
import { useQuizQuestion, useQuizAnswer } from "../../hooks/useVocabulary";
import { type VocabularyTermWithProgress, type VocabularyProgress } from "../../services/api";

interface SessionStats {
  total: number;
  completed: number;
  correct: number;
  incorrect: number;
}

interface VocabularyQuizSessionProps {
  terms: VocabularyTermWithProgress[];
  lessonId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function VocabularyQuizSession({
  terms,
  lessonId,
  onComplete,
  onBack,
}: VocabularyQuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: terms.length,
    completed: 0,
    correct: 0,
    incorrect: 0,
  });
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctOptionId: string;
    progress: VocabularyProgress;
  } | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentTerm = terms[currentIndex];

  // Fetch quiz question for current term
  const {
    data: question,
    isLoading: isLoadingQuestion,
    refetch: refetchQuestion,
  } = useQuizQuestion(currentTerm?.id, !!currentTerm && !isSessionComplete);

  const quizAnswer = useQuizAnswer();

  const progress = ((currentIndex + 1) / terms.length) * 100;

  const handleAnswer = useCallback(
    (selectedOptionId: string, timeSpentMs: number) => {
      if (!currentTerm || !question) return;

      quizAnswer.mutate(
        {
          termId: currentTerm.id,
          selectedOptionId,
          timeSpentMs,
          lessonId,
        },
        {
          onSuccess: (result) => {
            setFeedback({
              correct: result.correct,
              correctOptionId: question.correctOptionId,
              progress: result.progress,
            });

            setSessionStats((prev) => ({
              ...prev,
              completed: prev.completed + 1,
              correct: result.correct ? prev.correct + 1 : prev.correct,
              incorrect: !result.correct ? prev.incorrect + 1 : prev.incorrect,
            }));
          },
        }
      );
    },
    [currentTerm, question, quizAnswer, lessonId]
  );

  const handleContinue = useCallback(() => {
    setFeedback(null);

    if (currentIndex < terms.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      refetchQuestion();
    } else {
      setIsSessionComplete(true);
    }
  }, [currentIndex, terms.length, refetchQuestion]);

  // Session complete view
  if (isSessionComplete) {
    const accuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0;

    return (
      <VStack gap={8} py={8}>
        <Icon boxSize={16} color="green.400">
          <LuCheck />
        </Icon>

        <VStack gap={2}>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            Quiz Complete!
          </Text>
          <Text color="gray.400">
            You scored {sessionStats.correct} out of {sessionStats.total}
          </Text>
        </VStack>

        <SimpleGrid columns={3} gap={4} w="full" maxW="400px">
          <Card.Root bg="gray.900" borderColor="cyan.700">
            <Card.Body textAlign="center">
              <Text color="cyan.400" fontSize="2xl" fontWeight="bold">
                {accuracy}%
              </Text>
              <Text color="gray.400" fontSize="sm">
                Accuracy
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.900" borderColor="green.700">
            <Card.Body textAlign="center">
              <Text color="green.400" fontSize="2xl" fontWeight="bold">
                {sessionStats.correct}
              </Text>
              <Text color="gray.400" fontSize="sm">
                Correct
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.900" borderColor="red.700">
            <Card.Body textAlign="center">
              <Text color="red.400" fontSize="2xl" fontWeight="bold">
                {sessionStats.incorrect}
              </Text>
              <Text color="gray.400" fontSize="sm">
                Incorrect
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Performance message */}
        <Box
          p={4}
          bg="gray.900"
          borderRadius="lg"
          border="1px solid"
          borderColor={accuracy >= 80 ? "green.700" : accuracy >= 60 ? "yellow.700" : "red.700"}
          maxW="400px"
          textAlign="center"
        >
          <Text
            color={accuracy >= 80 ? "green.400" : accuracy >= 60 ? "yellow.400" : "red.400"}
          >
            {accuracy >= 80
              ? "Excellent work! You have a strong grasp of these terms."
              : accuracy >= 60
              ? "Good effort! Review the terms you missed to improve."
              : "Keep practicing! Try the flashcards to reinforce these concepts."}
          </Text>
        </Box>

        <HStack gap={4}>
          <Button
            variant="outline"
            color="gray.300"
            borderColor="gray.600"
            _hover={{ bg: "gray.800", borderColor: "gray.500" }}
            onClick={onComplete}
          >
            <Icon mr={2}>
              <LuRotateCcw />
            </Icon>
            Back to Dashboard
          </Button>
        </HStack>
      </VStack>
    );
  }

  // Loading state
  if (isLoadingQuestion || !question) {
    return (
      <VStack gap={6} py={8}>
        <Spinner size="xl" color="cyan.400" />
        <Text color="gray.400">Loading question...</Text>
      </VStack>
    );
  }

  return (
    <VStack gap={6} py={4}>
      {/* Progress bar */}
      <Box w="full" maxW="600px">
        <HStack justify="space-between" mb={2}>
          <Text color="gray.400" fontSize="sm">
            Question {currentIndex + 1} of {terms.length}
          </Text>
          <HStack gap={4}>
            <Text color="green.400" fontSize="sm">
              {sessionStats.correct} correct
            </Text>
            <Text color="red.400" fontSize="sm">
              {sessionStats.incorrect} incorrect
            </Text>
          </HStack>
        </HStack>
        <Progress.Root value={progress} size="sm" colorPalette="cyan">
          <Progress.Track bg="gray.800">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>

      {/* Current term hint */}
      <Text color="gray.500" fontSize="sm">
        Term: <Text as="span" color="cyan.400" fontFamily="'JetBrains Mono', monospace">{currentTerm.term}</Text>
      </Text>

      {/* Quiz component */}
      <VocabularyQuiz
        question={question}
        onAnswer={handleAnswer}
        isPending={quizAnswer.isPending}
        feedback={feedback}
        onContinue={handleContinue}
      />

      {/* Back button */}
      <Button
        variant="ghost"
        color="gray.400"
        _hover={{ bg: "gray.800", color: "gray.200" }}
        onClick={onBack}
        size="sm"
        mt={4}
      >
        Exit Quiz
      </Button>
    </VStack>
  );
}
