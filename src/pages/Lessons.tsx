import {
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLessons, type Lesson } from "../services/api";

export function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Loading...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Heading size="2xl" color="white">
          All Lessons
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
                h="full"
              >
                <Card.Body>
                  <HStack justify="space-between" mb={3}>
                    <Badge colorPalette="cyan" variant="subtle" fontSize="xs">
                      Lesson {lesson.orderIndex}
                    </Badge>
                    <Text color="gray.400" fontSize="sm">
                      {lesson.concepts.reduce(
                        (acc, c) => acc + c.challenges.length,
                        0
                      )}{" "}
                      challenges
                    </Text>
                  </HStack>
                  <Heading size="lg" color="white" mb={3}>
                    {lesson.title}
                  </Heading>
                  <Text color="gray.400" fontSize="sm" mb={4} lineClamp={2}>
                    {lesson.description}
                  </Text>
                  <VStack gap={1} align="stretch">
                    {lesson.concepts.slice(0, 3).map((concept) => (
                      <Text
                        key={concept.id}
                        color="gray.400"
                        fontSize="sm"
                      >
                        • {concept.title}
                      </Text>
                    ))}
                    {lesson.concepts.length > 3 && (
                      <Text color="gray.600" fontSize="sm">
                        +{lesson.concepts.length - 3} more concepts
                      </Text>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Link>
          ))}
        </SimpleGrid>

        {lessons.length === 0 && (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body textAlign="center" py={12}>
              <Text color="gray.400">
                No lessons available yet. Run `bun run db:seed` to add initial
                content.
              </Text>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Container>
  );
}
