import {
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Button,
  Skeleton,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useReviewQueue } from "../hooks/useProgress";
import { formatDistanceToNow } from "date-fns";

const masteryColors = {
  learning: "blue",
  reviewing: "yellow",
  mastered: "green",
};

export function Review() {
  const { data: queue, isLoading } = useReviewQueue();

  // ✅ Only show skeleton on initial load (no cached data)
  if (!queue && isLoading) {
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <VStack gap={8} align="stretch">
          <Heading size="2xl" color="white">
            Review Queue
          </Heading>
          <VStack gap={4} align="stretch">
            {[1, 2, 3, 4].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <HStack gap={2}>
                        <Skeleton height="20px" width="70px" />
                        <Skeleton height="16px" width="60px" />
                      </HStack>
                      <Skeleton height="24px" width="200px" />
                      <Skeleton height="16px" width="100px" />
                    </VStack>
                    <Skeleton height="32px" width="70px" />
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  const reviewQueue = queue ?? [];

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Heading size="2xl" color="white">
          Review Queue
        </Heading>

        {reviewQueue.length === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body textAlign="center" py={12}>
              <Text color="gray.400" fontSize="lg" mb={4}>
                No challenges due for review!
              </Text>
              <Text color="gray.400">
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
            {reviewQueue.map((item) => (
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
                          <Text color="gray.400" fontSize="sm">
                            {item.repetitions} reviews
                          </Text>
                        </HStack>
                        <Text color="white" fontWeight="medium" fontSize="lg">
                          {item.challenge.title}
                        </Text>
                        {item.nextReviewDate && (
                          <Text color="gray.400" fontSize="sm">
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
