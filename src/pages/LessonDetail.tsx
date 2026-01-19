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
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLesson, type Lesson } from "../services/api";
import ReactMarkdown from "react-markdown";

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

  useEffect(() => {
    if (!slug) return;
    fetchLesson(slug)
      .then(setLesson)
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
              <Link to="/">
                <Breadcrumb.Link color="gray.400">Home</Breadcrumb.Link>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Link to="/lessons">
                <Breadcrumb.Link color="gray.400">Lessons</Breadcrumb.Link>
              </Link>
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
                  {concept.challenges.map((challenge) => (
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
                          <Text color="gray.400" fontSize="sm">
                            →
                          </Text>
                        </HStack>
                      </Box>
                    </Link>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}
