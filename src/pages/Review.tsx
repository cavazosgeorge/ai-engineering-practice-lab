import {
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Button,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchReviewQueue, type UserProgress } from "../services/api";
import { formatDistanceToNow } from "date-fns";

const masteryColors = {
  learning: "blue",
  reviewing: "yellow",
  mastered: "green",
};

export function Review() {
  const [queue, setQueue] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewQueue()
      .then(setQueue)
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
      <VStack gap={8} align="stretch">
        <Heading size="2xl" color="white">
          Review Queue
        </Heading>

        {queue.length === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body textAlign="center" py={12}>
              <Text color="gray.400" fontSize="lg" mb={4}>
                No challenges due for review!
              </Text>
              <Text color="gray.500">
                Complete some challenges to start building your review queue.
              </Text>
              <Link to="/lessons">
                <Button colorPalette="cyan" mt={6}>
                  Browse Lessons
                </Button>
              </Link>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack gap={4} align="stretch">
            {queue.map((item) => (
              <Link key={item.id} to={`/challenges/${item.challengeId}`}>
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
                      <VStack align="start" gap={1}>
                        <HStack gap={2}>
                          <Badge
                            colorPalette={masteryColors[item.masteryLevel]}
                            variant="subtle"
                          >
                            {item.masteryLevel}
                          </Badge>
                          <Text color="gray.500" fontSize="sm">
                            {item.repetitions} reviews
                          </Text>
                        </HStack>
                        <Text color="white" fontWeight="medium" fontSize="lg">
                          {item.challenge.title}
                        </Text>
                        {item.nextReviewDate && (
                          <Text color="gray.500" fontSize="sm">
                            Due{" "}
                            {formatDistanceToNow(new Date(item.nextReviewDate), {
                              addSuffix: true,
                            })}
                          </Text>
                        )}
                      </VStack>
                      <Button colorPalette="cyan" size="sm">
                        Review
                      </Button>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              </Link>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
