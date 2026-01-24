import { useState, useEffect, useCallback } from "react";
import { Box, Button, VStack, Text, HStack, Icon, Kbd } from "@chakra-ui/react";
import { LuCheck, LuX } from "react-icons/lu";
import { type QuizQuestion } from "../../services/api";

interface VocabularyQuizProps {
  question: QuizQuestion;
  onAnswer: (selectedOptionId: string, timeSpentMs: number) => void;
  isPending: boolean;
  feedback?: { correct: boolean; correctOptionId: string } | null;
  onContinue: () => void;
}

export function VocabularyQuiz({
  question,
  onAnswer,
  isPending,
  feedback,
  onContinue,
}: VocabularyQuizProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());

  const handleSelect = useCallback(
    (optionId: string) => {
      if (feedback || isPending) return; // Already answered or submitting
      setSelectedId(optionId);
    },
    [feedback, isPending]
  );

  const handleSubmit = useCallback(() => {
    if (!selectedId || feedback || isPending) return;
    const timeSpentMs = Date.now() - startTime;
    onAnswer(selectedId, timeSpentMs);
  }, [selectedId, feedback, isPending, startTime, onAnswer]);

  // Keyboard navigation
  // Note: question.options dependency is fine - TanStack Query provides stable references
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onContinue();
        }
        return;
      }

      if (isPending) return;

      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4) {
        e.preventDefault();
        const option = question.options[keyNum - 1];
        if (option) {
          handleSelect(option.id);
        }
      } else if (e.key === "Enter" && selectedId) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question.options, handleSelect, handleSubmit, selectedId, feedback, isPending, onContinue]);

  // Reset selection when question changes
  useEffect(() => {
    setSelectedId(null);
  }, [question.termId]);

  const getOptionStyle = (optionId: string) => {
    if (!feedback) {
      // No feedback yet
      return {
        bg: selectedId === optionId ? "gray.700" : "gray.800",
        borderColor: selectedId === optionId ? "cyan.500" : "gray.700",
        _hover: { bg: "gray.700", borderColor: "gray.600" },
      };
    }

    // Show feedback
    if (optionId === feedback.correctOptionId) {
      return {
        bg: "green.900",
        borderColor: "green.500",
        _hover: {},
      };
    }

    if (optionId === selectedId && !feedback.correct) {
      return {
        bg: "red.900",
        borderColor: "red.500",
        _hover: {},
      };
    }

    return {
      bg: "gray.800",
      borderColor: "gray.700",
      opacity: 0.5,
      _hover: {},
    };
  };

  return (
    <VStack gap={6} w="full" maxW="600px" mx="auto">
      {/* Question */}
      <Box
        w="full"
        p={6}
        bg="gray.900"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.800"
      >
        <Text color="white" fontSize="xl" fontWeight="medium" textAlign="center">
          {question.questionText}
        </Text>
      </Box>

      {/* Options */}
      <VStack gap={3} w="full">
        {question.options.map((option, index) => {
          const styles = getOptionStyle(option.id);
          const isCorrect = feedback && option.id === feedback.correctOptionId;
          const isWrong = feedback && option.id === selectedId && !feedback.correct;

          return (
            <Box
              key={option.id}
              as="button"
              w="full"
              p={4}
              borderRadius="lg"
              border="1px solid"
              textAlign="left"
              cursor={feedback ? "default" : "pointer"}
              transition="all 0.2s"
              onClick={() => handleSelect(option.id)}
              pointerEvents={feedback || isPending ? "none" : "auto"}
              {...styles}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Kbd
                    bg={selectedId === option.id ? "cyan.800" : "gray.700"}
                    color={selectedId === option.id ? "cyan.200" : "gray.300"}
                  >
                    {index + 1}
                  </Kbd>
                  <Text color="white">{option.text}</Text>
                </HStack>
                {isCorrect && (
                  <Icon color="green.400" boxSize={5}>
                    <LuCheck />
                  </Icon>
                )}
                {isWrong && (
                  <Icon color="red.400" boxSize={5}>
                    <LuX />
                  </Icon>
                )}
              </HStack>
            </Box>
          );
        })}
      </VStack>

      {/* Submit / Continue button */}
      {!feedback ? (
        <Button
          colorPalette="cyan"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedId}
          loading={isPending}
          w="full"
          maxW="200px"
        >
          Submit
        </Button>
      ) : (
        <HStack
          w="full"
          justify="space-between"
          align="center"
          p={4}
          bg="gray.900"
          borderRadius="lg"
          border="1px solid"
          borderColor={feedback.correct ? "green.800" : "red.800"}
        >
          <HStack gap={2}>
            <Icon
              boxSize={5}
              color={feedback.correct ? "green.400" : "red.400"}
            >
              {feedback.correct ? <LuCheck /> : <LuX />}
            </Icon>
            <Text
              color={feedback.correct ? "green.400" : "red.400"}
              fontWeight="medium"
            >
              {feedback.correct ? "Correct!" : "Incorrect"}
            </Text>
          </HStack>

          <HStack gap={3}>
            <Text color="gray.600" fontSize="xs" display={{ base: "none", sm: "block" }}>
              <Kbd size="sm">Enter</Kbd>
            </Text>
            <Button colorPalette="cyan" size="sm" onClick={onContinue}>
              Continue
            </Button>
          </HStack>
        </HStack>
      )}
    </VStack>
  );
}
