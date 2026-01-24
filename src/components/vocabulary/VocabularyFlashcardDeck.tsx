import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Progress,
  Icon,
  Card,
  SimpleGrid,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight, LuCheck, LuRotateCcw } from "react-icons/lu";
import { VocabularyFlashcard } from "./VocabularyFlashcard";
import { useFlashcardReview } from "../../hooks/useVocabulary";
import { type VocabularyTermWithProgress } from "../../services/api";

interface SessionStats {
  reviewed: number;
  knowIt: number;
  almost: number;
  reviewAgain: number;
}

interface VocabularyFlashcardDeckProps {
  terms: VocabularyTermWithProgress[];
  lessonId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function VocabularyFlashcardDeck({
  terms,
  lessonId,
  onComplete,
  onBack,
}: VocabularyFlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // ✅ Derive total from terms.length instead of storing in state
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    reviewed: 0,
    knowIt: 0,
    almost: 0,
    reviewAgain: 0,
  });
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const flashcardReview = useFlashcardReview();

  const currentTerm = terms[currentIndex];
  const progress = ((currentIndex + 1) / terms.length) * 100;

  const goToNext = useCallback(() => {
    if (currentIndex < terms.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, terms.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (quality: 1 | 3 | 5) => {
      if (!currentTerm || reviewedCards.has(currentTerm.id)) {
        // Already reviewed, just move to next
        if (currentIndex < terms.length - 1) {
          goToNext();
        } else if (reviewedCards.size === terms.length) {
          // ✅ Use reviewedCards.size instead of sessionStats.reviewed to reduce dependencies
          setIsSessionComplete(true);
        }
        return;
      }

      // Submit the review
      flashcardReview.mutate(
        { termId: currentTerm.id, quality, lessonId },
        {
          onSuccess: () => {
            // Track stats
            setReviewedCards((prev) => new Set([...prev, currentTerm.id]));
            setSessionStats((prev) => ({
              ...prev,
              reviewed: prev.reviewed + 1,
              knowIt: quality === 5 ? prev.knowIt + 1 : prev.knowIt,
              almost: quality === 3 ? prev.almost + 1 : prev.almost,
              reviewAgain: quality === 1 ? prev.reviewAgain + 1 : prev.reviewAgain,
            }));

            // Move to next or complete
            if (currentIndex < terms.length - 1) {
              goToNext();
            } else {
              setIsSessionComplete(true);
            }
          },
        }
      );
    },
    [currentTerm, currentIndex, terms.length, reviewedCards, flashcardReview, lessonId, goToNext]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionComplete) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "1":
          e.preventDefault();
          if (isFlipped) handleRate(1);
          break;
        case "3":
          e.preventDefault();
          if (isFlipped) handleRate(3);
          break;
        case "5":
          e.preventDefault();
          if (isFlipped) handleRate(5);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, goToPrevious, goToNext, handleRate, isFlipped, isSessionComplete]);

  // Session complete view
  if (isSessionComplete) {
    return (
      <VStack gap={8} py={8}>
        <Icon boxSize={16} color="green.400">
          <LuCheck />
        </Icon>

        <VStack gap={2}>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            Session Complete!
          </Text>
          <Text color="gray.400">
            You reviewed {sessionStats.reviewed} of {terms.length} terms
          </Text>
        </VStack>

        <SimpleGrid columns={3} gap={4} w="full" maxW="400px">
          <Card.Root bg="gray.900" borderColor="green.700">
            <Card.Body textAlign="center">
              <Text color="green.400" fontSize="2xl" fontWeight="bold">
                {sessionStats.knowIt}
              </Text>
              <Text color="gray.400" fontSize="sm">
                Know it
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.900" borderColor="yellow.700">
            <Card.Body textAlign="center">
              <Text color="yellow.400" fontSize="2xl" fontWeight="bold">
                {sessionStats.almost}
              </Text>
              <Text color="gray.400" fontSize="sm">
                Almost
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.900" borderColor="red.700">
            <Card.Body textAlign="center">
              <Text color="red.400" fontSize="2xl" fontWeight="bold">
                {sessionStats.reviewAgain}
              </Text>
              <Text color="gray.400" fontSize="sm">
                Review again
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

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

  const isAlreadyReviewed = reviewedCards.has(currentTerm.id);

  return (
    <VStack gap={6} py={4}>
      {/* Progress bar */}
      <Box w="full" maxW="500px">
        <HStack justify="space-between" mb={2}>
          <Text color="gray.400" fontSize="sm">
            Card {currentIndex + 1} of {terms.length}
          </Text>
          <Text color="gray.400" fontSize="sm">
            {sessionStats.reviewed} reviewed
          </Text>
        </HStack>
        <Progress.Root value={progress} size="sm" colorPalette="cyan">
          <Progress.Track bg="gray.800">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>

      {/* Flashcard */}
      <VocabularyFlashcard
        term={currentTerm}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      {/* Navigation */}
      <HStack gap={4}>
        <Button
          variant="ghost"
          color="gray.300"
          _hover={{ bg: "gray.800", color: "white" }}
          _disabled={{ color: "gray.600", _hover: { bg: "transparent" } }}
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <Icon mr={1}>
            <LuChevronLeft />
          </Icon>
          Previous
        </Button>

        <Button
          variant="ghost"
          color="gray.300"
          _hover={{ bg: "gray.800", color: "white" }}
          _disabled={{ color: "gray.600", _hover: { bg: "transparent" } }}
          onClick={goToNext}
          disabled={currentIndex === terms.length - 1}
        >
          Next
          <Icon ml={1}>
            <LuChevronRight />
          </Icon>
        </Button>
      </HStack>

      {/* Rating buttons - show only when flipped */}
      {isFlipped && (
        <VStack gap={4}>
          <Text color="gray.400" fontSize="sm">
            {isAlreadyReviewed ? "Already reviewed - select to continue" : "How well do you know this?"}
          </Text>
          <HStack gap={3}>
            <Button
              bg="red.900/50"
              color="red.300"
              _hover={{ bg: "red.900", color: "red.200" }}
              onClick={() => handleRate(1)}
              loading={flashcardReview.isPending}
            >
              <Box as="span" mr={2} px={1.5} py={0.5} bg="red.800/60" borderRadius="sm" fontSize="xs" fontFamily="mono">1</Box>
              Review again
            </Button>
            <Button
              bg="yellow.900/50"
              color="yellow.300"
              _hover={{ bg: "yellow.900", color: "yellow.200" }}
              onClick={() => handleRate(3)}
              loading={flashcardReview.isPending}
            >
              <Box as="span" mr={2} px={1.5} py={0.5} bg="yellow.800/60" borderRadius="sm" fontSize="xs" fontFamily="mono">3</Box>
              Almost
            </Button>
            <Button
              bg="green.900/50"
              color="green.300"
              _hover={{ bg: "green.900", color: "green.200" }}
              onClick={() => handleRate(5)}
              loading={flashcardReview.isPending}
            >
              <Box as="span" mr={2} px={1.5} py={0.5} bg="green.800/60" borderRadius="sm" fontSize="xs" fontFamily="mono">5</Box>
              Know it
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Back button */}
      <Button
        variant="ghost"
        color="gray.400"
        _hover={{ bg: "gray.800", color: "gray.200" }}
        onClick={onBack}
        size="sm"
        mt={4}
      >
        Exit Session
      </Button>
    </VStack>
  );
}
