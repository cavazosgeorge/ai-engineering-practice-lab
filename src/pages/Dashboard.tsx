import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Card,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLessons, fetchProgress, type Lesson, type ProgressStats } from "../services/api";

export function Dashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLessons(), fetchProgress()])
      .then(([lessonsData, progressData]) => {
        setLessons(lessonsData);
        setStats(progressData.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.500">Loading...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={12} align="stretch">
        <Box>
          <Heading
            size="2xl"
            color="white"
            mb={4}
            fontFamily="'JetBrains Mono', monospace"
          >
            AI Engineering Practice Lab
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="2xl">
            Master AI/ML fundamentals through hands-on coding challenges.
            Implement tokenizers, build neural network components, and understand
            language models from the ground up.
          </Text>
        </Box>

        {stats && stats.total > 0 && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.500" fontSize="sm">
                  Total Progress
                </Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  {stats.total}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.500" fontSize="sm">
                  Mastered
                </Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">
                  {stats.mastered}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.500" fontSize="sm">
                  Reviewing
                </Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">
                  {stats.reviewing}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <Text color="gray.500" fontSize="sm">
                  Learning
                </Text>
                <Text color="blue.400" fontSize="2xl" fontWeight="bold">
                  {stats.learning}
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        )}

        <Box>
          <Heading size="lg" color="white" mb={6}>
            Lessons
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {lessons.map((lesson) => (
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
                >
                  <Card.Body>
                    <HStack justify="space-between" mb={2}>
                      <Badge
                        colorPalette="cyan"
                        variant="subtle"
                        fontSize="xs"
                      >
                        Lesson {lesson.orderIndex}
                      </Badge>
                      <Text color="gray.500" fontSize="sm">
                        {lesson.concepts.reduce(
                          (acc, c) => acc + c.challenges.length,
                          0
                        )}{" "}
                        challenges
                      </Text>
                    </HStack>
                    <Heading size="md" color="white" mb={2}>
                      {lesson.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm" lineClamp={2}>
                      {lesson.description}
                    </Text>
                  </Card.Body>
                </Card.Root>
              </Link>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}
