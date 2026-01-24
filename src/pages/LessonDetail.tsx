import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Breadcrumb,
  Icon,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLesson, fetchProgress, fetchVocabularyStats, type Lesson, type VocabularyStats } from "../services/api";
import ReactMarkdown from "react-markdown";
import { LuCheck, LuBookOpen } from "react-icons/lu";

const difficultyColors = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

const typeLabels = {
  implement: "Code",
  explain: "Explain",
  compare: "Compare",
  multiple_choice: "Quiz",
};

export function LessonDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(
    new Set()
  );
  const [vocabularyStats, setVocabularyStats] = useState<VocabularyStats | null>(null);

  useEffect(() => {
    if (!slug) return;

    // Fetch lesson and progress in parallel
    Promise.all([fetchLesson(slug), fetchProgress()])
      .then(([lessonData, progressData]) => {
        setLesson(lessonData);
        // Build set of completed challenge IDs
        const completed = new Set(
          progressData.progress.map((p) => p.challengeId)
        );
        setCompletedChallenges(completed);

        // Fetch vocabulary stats for this lesson
        fetchVocabularyStats(lessonData.id)
          .then(setVocabularyStats)
          .catch(() => setVocabularyStats(null));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Loading...</Text>
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
                <Link to="/lessons">Lessons</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink color="white">
                {lesson.title}
              </Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Box>
          <Badge colorPalette="cyan" variant="subtle" mb={2}>
            Lesson {lesson.orderIndex}
          </Badge>
          <Heading size="2xl" color="white" mb={4}>
            {lesson.title}
          </Heading>
          <Text color="gray.400" fontSize="lg">
            {lesson.description}
          </Text>
        </Box>

        {/* Study Vocabulary Card */}
        {vocabularyStats && vocabularyStats.total > 0 && (
          <Link to={`/vocabulary/${lesson.slug}`}>
            <Card.Root
              bg="gray.900"
              borderColor="gray.800"
              _hover={{
                borderColor: "cyan.700",
                transform: "translateY(-2px)",
              }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <Card.Body>
                <HStack justify="space-between">
                  <HStack gap={4}>
                    <Box p={3} bg="cyan.900" borderRadius="lg">
                      <Icon boxSize={6} color="cyan.400">
                        <LuBookOpen />
                      </Icon>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text color="white" fontWeight="medium" fontSize="lg">
                        Study Vocabulary
                      </Text>
                      <HStack gap={3}>
                        <Text color="gray.400" fontSize="sm">
                          {vocabularyStats.total} terms
                        </Text>
                        {vocabularyStats.mastered > 0 && (
                          <Badge colorPalette="green" variant="subtle">
                            {vocabularyStats.mastered} mastered
                          </Badge>
                        )}
                        {vocabularyStats.reviewing > 0 && (
                          <Badge colorPalette="yellow" variant="subtle">
                            {vocabularyStats.reviewing} reviewing
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                  <Box
                    px={3}
                    py={1.5}
                    bg="cyan.600"
                    color="white"
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Study →
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Link>
        )}

        <VStack gap={8} align="stretch">
          {lesson.concepts.map((concept) => (
            <Card.Root key={concept.id} bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Heading size="lg" color="white" mb={4}>
                  {concept.title}
                </Heading>
                {concept.explanation && (
                  <Box
                    color="gray.300"
                    mb={6}
                    css={{
                      "& h1, & h2, & h3": { color: "white", marginTop: "1rem" },
                      "& code": {
                        background: "var(--chakra-colors-gray-800)",
                        padding: "0.2em 0.4em",
                        borderRadius: "4px",
                      },
                      "& pre": {
                        background: "var(--chakra-colors-gray-800)",
                        padding: "1rem",
                        borderRadius: "8px",
                        overflow: "auto",
                      },
                    }}
                  >
                    <ReactMarkdown>{concept.explanation}</ReactMarkdown>
                  </Box>
                )}

                <Heading size="md" color="gray.300" mb={4}>
                  Challenges
                </Heading>
                <VStack gap={3} align="stretch">
                  {concept.challenges.map((challenge) => {
                    const isCompleted = completedChallenges.has(challenge.id);
                    return (
                      <Link
                        key={challenge.id}
                        to={`/challenges/${challenge.id}`}
                      >
                        <Box
                          p={4}
                          bg="gray.800"
                          borderRadius="lg"
                          _hover={{ bg: "gray.750" }}
                          transition="background 0.2s"
                          borderRight={isCompleted ? "3px solid" : "none"}
                          borderRightColor="green.500"
                        >
                          <HStack justify="space-between">
                            <HStack gap={3}>
                              <Badge
                                colorPalette={difficultyColors[challenge.difficulty]}
                                variant="subtle"
                              >
                                {challenge.difficulty}
                              </Badge>
                              <Badge colorPalette="gray" variant="subtle">
                                {typeLabels[challenge.type]}
                              </Badge>
                              <Text color="white" fontWeight="medium">
                                {challenge.title}
                              </Text>
                            </HStack>
                            <HStack gap={2}>
                              {isCompleted && (
                                <Icon color="green.400" boxSize={5}>
                                  <LuCheck />
                                </Icon>
                              )}
                              <Text color="gray.400" fontSize="sm">
                                →
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>
                      </Link>
                    );
                  })}
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}
