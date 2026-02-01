import { useCallback } from "react";
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
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWeeks, prefetchWeekDetail } from "../hooks/useWeeks";

export function Weeks() {
  const queryClient = useQueryClient();
  const { data: weeks, isLoading } = useWeeks();

  const handleWeekHover = useCallback(
    (slug: string) => {
      prefetchWeekDetail(queryClient, slug);
    },
    [queryClient]
  );

  const isInitialLoading = !weeks && isLoading;

  if (isInitialLoading) {
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <VStack gap={12} align="stretch">
          <Box>
            <Heading
              size="2xl"
              color="white"
              mb={4}
              fontFamily="'JetBrains Mono', monospace"
            >
              Weekly Curriculum
            </Heading>
            <Text color="gray.400" fontSize="lg" maxW="2xl">
              Follow the 5-week AI Engineering curriculum.
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card.Root key={i} bg="gray.900" borderColor="gray.800">
                <Card.Body>
                  <HStack justify="space-between" mb={2}>
                    <Skeleton height="20px" width="70px" />
                    <Skeleton height="16px" width="40px" />
                  </HStack>
                  <Skeleton height="24px" width="80%" mb={2} />
                  <SkeletonText noOfLines={2} gap={2} mb={3} />
                  <HStack gap={3}>
                    <Skeleton height="20px" width="60px" />
                    <Skeleton height="20px" width="80px" />
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </VStack>
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
            Weekly Curriculum
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="2xl">
            Follow the 5-week AI Engineering curriculum. Each week covers
            core concepts with lessons, coding challenges, and vocabulary.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {(weeks ?? []).map((week) => (
            <Link key={week.id} to={`/weeks/${week.slug}`}>
              <Card.Root
                bg="gray.900"
                borderColor="gray.800"
                _hover={{
                  borderColor: "cyan.700",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.2s"
                cursor="pointer"
                onMouseEnter={() => handleWeekHover(week.slug)}
              >
                <Card.Body>
                  <HStack justify="space-between" mb={2}>
                    <Badge colorPalette="cyan" variant="subtle" fontSize="xs">
                      Week {week.weekNumber}
                    </Badge>
                    <Text color="gray.400" fontSize="sm">
                      {week.lessonCount} lesson{week.lessonCount !== 1 ? "s" : ""}
                    </Text>
                  </HStack>
                  <Heading size="md" color="white" mb={2}>
                    {week.title}
                  </Heading>
                  <Text color="gray.400" fontSize="sm" lineClamp={2} mb={3}>
                    {week.description}
                  </Text>
                  <HStack gap={3}>
                    {week.lessonCount > 0 && (
                      <Badge colorPalette="blue" variant="subtle">
                        {week.lessonCount} lesson{week.lessonCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {week.vocabularyCount > 0 && (
                      <Badge colorPalette="purple" variant="subtle">
                        {week.vocabularyCount} term{week.vocabularyCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {week.lessonCount === 0 && (
                      <Badge colorPalette="gray" variant="subtle">
                        Coming soon
                      </Badge>
                    )}
                  </HStack>
                </Card.Body>
              </Card.Root>
            </Link>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
