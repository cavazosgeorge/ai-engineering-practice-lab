import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Card,
  Breadcrumb,
  Collapsible,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  fetchChallenge,
  submitChallenge,
  type Challenge,
  type SubmissionResult,
} from "../services/api";
import { CodeEditor } from "../components/challenges/CodeEditor";
import { TestResults } from "../components/challenges/TestResults";

const difficultyColors = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchChallenge(id)
      .then((data) => {
        setChallenge(data);
        setCode(data.starterCode || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!challenge || !code.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitChallenge(challenge.id, code, hintsRevealed > 0);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (challenge) {
      setCode(challenge.starterCode || "");
      setResult(null);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Loading...</Text>
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">Challenge not found</Text>
      </Container>
    );
  }

  const lesson = challenge.concept?.lesson;

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
            {lesson && (
              <>
                <Breadcrumb.Item>
                  <Link to={`/lessons/${lesson.slug}`}>
                    <Breadcrumb.Link color="gray.400">
                      {lesson.title}
                    </Breadcrumb.Link>
                  </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </>
            )}
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink color="white">
                {challenge.title}
              </Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Box>
          <HStack gap={2} mb={2}>
            <Badge
              colorPalette={difficultyColors[challenge.difficulty]}
              variant="subtle"
            >
              {challenge.difficulty}
            </Badge>
            <Badge colorPalette="gray" variant="subtle">
              {challenge.type}
            </Badge>
          </HStack>
          <Heading size="xl" color="white" mb={4}>
            {challenge.title}
          </Heading>
          <Box
            color="gray.300"
            css={{
              "& code": {
                background: "var(--chakra-colors-gray-800)",
                padding: "0.2em 0.4em",
                borderRadius: "4px",
                fontFamily: "'JetBrains Mono', monospace",
              },
              "& pre": {
                background: "var(--chakra-colors-gray-800)",
                padding: "1rem",
                borderRadius: "8px",
                overflow: "auto",
              },
            }}
          >
            <ReactMarkdown>{challenge.description}</ReactMarkdown>
          </Box>
        </Box>

        {challenge.type === "implement" && (
          <>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="md" color="white">
                    Your Solution
                  </Heading>
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="gray.300"
                      onClick={handleReset}
                      _hover={{ bg: "gray.800" }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="cyan"
                      onClick={handleSubmit}
                      loading={submitting}
                    >
                      Run Tests
                    </Button>
                  </HStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={0}>
                <CodeEditor value={code} onChange={setCode} />
              </Card.Body>
            </Card.Root>

            {result && (
              <Card.Root
                bg={result.passed ? "green.900/20" : "red.900/20"}
                borderColor={result.passed ? "green.800" : "red.800"}
              >
                <Card.Header>
                  <HStack justify="space-between">
                    <Heading size="md" color="white">
                      {result.passed ? "All Tests Passed!" : "Tests Failed"}
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      {result.executionTimeMs.toFixed(1)}ms
                    </Text>
                  </HStack>
                </Card.Header>
                <Card.Body pt={0}>
                  <TestResults results={result.results} />
                </Card.Body>
              </Card.Root>
            )}

            {challenge.hints && challenge.hints.length > 0 && (
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Header>
                  <Heading size="md" color="white">
                    Hints
                  </Heading>
                </Card.Header>
                <Card.Body pt={0}>
                  <VStack gap={3} align="stretch">
                    {challenge.hints.map((hint, index) => (
                      <Collapsible.Root
                        key={index}
                        onOpenChange={(details) => {
                          if (details.open && index >= hintsRevealed) {
                            setHintsRevealed(index + 1);
                          }
                        }}
                      >
                        <Collapsible.Trigger asChild>
                          <Button
                            variant="ghost"
                            color="gray.300"
                            width="full"
                            justifyContent="flex-start"
                            _hover={{ bg: "gray.800" }}
                            _expanded={{ bg: "gray.800" }}
                          >
                            {index < hintsRevealed
                              ? `Hint ${index + 1}`
                              : `Reveal Hint ${index + 1}`}
                          </Button>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <Box
                            p={4}
                            bg="gray.800"
                            borderRadius="md"
                            color="gray.300"
                            css={{
                              "& code": {
                                background: "var(--chakra-colors-gray-700)",
                                padding: "0.2em 0.4em",
                                borderRadius: "4px",
                              },
                            }}
                          >
                            <ReactMarkdown>{hint}</ReactMarkdown>
                          </Box>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}

            {challenge.testCases && challenge.testCases.length > 0 && (
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Header>
                  <Heading size="md" color="white">
                    Test Cases
                  </Heading>
                </Card.Header>
                <Card.Body pt={0}>
                  <VStack gap={2} align="stretch">
                    {challenge.testCases.map((tc, index) => (
                      <Box
                        key={tc.id}
                        p={3}
                        bg="gray.800"
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="sm"
                      >
                        <Text color="gray.400" mb={1}>
                          Test {index + 1}
                          {tc.description && `: ${tc.description}`}
                        </Text>
                        <Text color="gray.300">
                          Input:{" "}
                          <Text as="span" color="cyan.300">
                            {JSON.stringify(tc.input)}
                          </Text>
                        </Text>
                        <Text color="gray.300">
                          Expected:{" "}
                          <Text as="span" color="green.300">
                            {JSON.stringify(tc.expectedOutput)}
                          </Text>
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}
          </>
        )}

        {challenge.type === "explain" && (
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Header>
              <Heading size="md" color="white">
                Your Explanation
              </Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.400">
                This is an explanation challenge. Take some time to think through
                the question and formulate your answer. You can use the hints if
                you get stuck.
              </Text>
              {challenge.hints && challenge.hints.length > 0 && (
                <VStack gap={3} align="stretch" mt={4}>
                  {challenge.hints.map((hint, index) => (
                    <Collapsible.Root
                      key={index}
                      onOpenChange={(details) => {
                        if (details.open && index >= hintsRevealed) {
                          setHintsRevealed(index + 1);
                        }
                      }}
                    >
                      <Collapsible.Trigger asChild>
                        <Button
                          variant="ghost"
                          color="gray.300"
                          width="full"
                          justifyContent="flex-start"
                          _hover={{ bg: "gray.800" }}
                          _expanded={{ bg: "gray.800" }}
                        >
                          {index < hintsRevealed
                            ? `Hint ${index + 1}`
                            : `Reveal Hint ${index + 1}`}
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <Box
                          p={4}
                          bg="gray.800"
                          borderRadius="md"
                          color="gray.300"
                        >
                          <ReactMarkdown>{hint}</ReactMarkdown>
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  ))}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Container>
  );
}
