import {
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  SimpleGrid,
  Progress,
  Skeleton,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useFullProgress } from "../hooks/useProgress";

const masteryColors = {
  learning: "blue",
  reviewing: "yellow",
  mastered: "green",
};

export function ProgressPage() {
  const { data, isLoading } = useFullProgress();

  const progress = data?.progress ?? [];
  const stats = data?.stats;

  // ✅ Only show skeleton on initial load (no cached data)
  if (!data && isLoading) {
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
            Your Progress
          </Heading>

          {/* Progress bar skeleton */}
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between">
                  <Skeleton height="20px" width="120px" />
                  <Skeleton height="20px" width="40px" />
                </HStack>
                <Skeleton height="8px" width="100%" />
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Stats cards skeleton */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            {[1, 2, 3, 4].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Skeleton height="14px" width="80px" mb={2} />
                  <Skeleton height="32px" width="40px" />
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>

          {/* Challenges list skeleton */}
          <Skeleton height="28px" width="200px" />
          <VStack gap={3} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body py={3}>
                  <HStack justify="space-between">
                    <HStack gap={3}>
                      <Skeleton height="20px" width="70px" />
                      <Skeleton height="20px" width="150px" />
                    </HStack>
                    <Skeleton height="16px" width="60px" />
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  // ✅ Derive percentage directly (no state needed)
  const masteredPct = stats
    ? Math.round((stats.mastered / Math.max(stats.total, 1)) * 100)
    : 0;

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Heading size="2xl" color="white">
          Your Progress
        </Heading>

        {stats && stats.total > 0 ? (
          <>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Body>
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between">
                    <Text color="white" fontWeight="medium">
                      Overall Mastery
                    </Text>
                    <Text color="cyan.400" fontWeight="bold">
                      {masteredPct}%
                    </Text>
                  </HStack>
                  <Progress.Root value={masteredPct} colorPalette="cyan">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                </VStack>
              </Card.Body>
            </Card.Root>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Text color="gray.400" fontSize="sm">
                    Total Practiced
                  </Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    {stats.total}
                  </Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Text color="gray.400" fontSize="sm">
                    Mastered
                  </Text>
                  <Text color="green.400" fontSize="2xl" fontWeight="bold">
                    {stats.mastered}
                  </Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Text color="gray.400" fontSize="sm">
                    Reviewing
                  </Text>
                  <Text color="yellow.400" fontSize="2xl" fontWeight="bold">
                    {stats.reviewing}
                  </Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <Text color="gray.400" fontSize="sm">
                    Learning
                  </Text>
                  <Text color="blue.400" fontSize="2xl" fontWeight="bold">
                    {stats.learning}
                  </Text>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>

            <Heading size="lg" color="white">
              Challenges by Mastery
            </Heading>

            <VStack gap={3} align="stretch">
              {progress.map((item) => (
                <Link key={item.id} to={`/challenges/${item.challengeId}`}>
                  <Card.Root
                    bg="gray.900"
                    borderColor="gray.800"
                    _hover={{ borderColor: "gray.700" }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <Card.Body py={3}>
                      <HStack justify="space-between">
                        <HStack gap={3}>
                          <Badge
                            colorPalette={masteryColors[item.masteryLevel]}
                            variant="subtle"
                          >
                            {item.masteryLevel}
                          </Badge>
                          <Text color="white">{item.challenge.title}</Text>
                        </HStack>
                        <Text color="gray.400" fontSize="sm">
                          {item.repetitions} reviews
                        </Text>
                      </HStack>
                    </Card.Body>
                  </Card.Root>
                </Link>
              ))}
            </VStack>
          </>
        ) : (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Body textAlign="center" py={12}>
              <Text color="gray.400" fontSize="lg" mb={4}>
                No progress yet!
              </Text>
              <Text color="gray.400">
                Start practicing challenges to track your progress.
              </Text>
              <Link to="/lessons">
                <HStack justify="center" mt={6}>
                  <Text color="cyan.400">Browse Lessons →</Text>
                </HStack>
              </Link>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Container>
  );
}
