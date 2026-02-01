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
  Spinner,
  Textarea,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { FaEye } from "react-icons/fa";
import {
  recordSubmission,
  resetChallengeProgress,
} from "../services/api";
import { useChallenge } from "../hooks/useProgress";
import { CodeEditor } from "../components/challenges/CodeEditor";
import { TestResults } from "../components/challenges/TestResults";
import { ExecutionVisualizer } from "../components/challenges/ExecutionVisualizer";
import { HintsSection } from "../components/challenges/HintsSection";
import { usePyodide } from "../hooks/usePyodide";
import {
  validatePythonCode,
  type ValidationResult,
} from "../services/pythonValidator";

const difficultyColors = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

// Extract function name from Python code (e.g., "def encode(" -> "encode")
function extractFunctionName(code: string): string | null {
  const match = code.match(/def\s+(\w+)\s*\(/);
  return match ? match[1] : null;
}

// localStorage key for saving explanation drafts
function getExplanationDraftKey(challengeId: string): string {
  return `explanation_draft_${challengeId}`;
}

export function ChallengePage() {
  const { id } = useParams<{ id: string }>();

  // ✅ Use TanStack Query for challenge fetching
  const { data: challenge, isLoading } = useChallenge(id);

  // User interaction state (kept local since it's user input)
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [selfAssessment, setSelfAssessment] = useState<"got_it" | "review" | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    isLoading: pyodideLoading,
    isReady: pyodideReady,
    error: pyodideError,
    runPython,
  } = usePyodide();

  // Initialize local state from challenge data (only once when challenge loads)
  useEffect(() => {
    if (!challenge || initialized) return;

    setCode(challenge.lastSubmission?.code || challenge.starterCode || "");

    if (challenge.type === "explain") {
      if (challenge.lastSubmission) {
        setExplanation(challenge.lastSubmission.code);
        setAnswerRevealed(true);
        setSelfAssessment(challenge.lastSubmission.passed ? "got_it" : "review");
      } else {
        const draft = localStorage.getItem(getExplanationDraftKey(challenge.id));
        if (draft) {
          setExplanation(draft);
        }
      }
    }

    setInitialized(true);
  }, [challenge, initialized]);

  // Reset initialized state when challenge ID changes
  useEffect(() => {
    setInitialized(false);
    setResult(null);
    setHintsRevealed(0);
    setAnswerRevealed(false);
    setSelfAssessment(null);
    setShowVisualization(false);
  }, [id]);

  // Auto-save explanation draft to localStorage
  useEffect(() => {
    if (!challenge || challenge.type !== "explain" || selfAssessment) return;

    if (explanation.trim()) {
      localStorage.setItem(getExplanationDraftKey(challenge.id), explanation);
    } else {
      localStorage.removeItem(getExplanationDraftKey(challenge.id));
    }
  }, [explanation, challenge, selfAssessment]);

  // ✅ Stable callback references with useCallback
  const handleSubmit = useCallback(async () => {
    if (!challenge || !code.trim() || !pyodideReady) return;

    const functionName = extractFunctionName(code);
    if (!functionName) {
      setResult({
        passed: false,
        results: [
          {
            testId: "parse",
            passed: false,
            error: "Could not find a function definition. Make sure to define a function using 'def function_name(...):'",
          },
        ],
        executionTimeMs: 0,
        stdout: "",
      });
      return;
    }

    setSubmitting(true);
    try {
      const testCases =
        challenge.testCases?.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          description: tc.description ?? undefined,
        })) || [];

      const validationResult = await validatePythonCode(
        runPython,
        code,
        functionName,
        testCases
      );
      setResult(validationResult);

      try {
        await recordSubmission(
          challenge.id,
          code,
          validationResult.passed,
          hintsRevealed > 0
        );
      } catch (err) {
        console.error("Failed to record submission:", err);
      }
    } catch (err) {
      console.error(err);
      setResult({
        passed: false,
        results: [
          {
            testId: "error",
            passed: false,
            error: err instanceof Error ? err.message : String(err),
          },
        ],
        executionTimeMs: 0,
        stdout: "",
      });
    } finally {
      setSubmitting(false);
    }
  }, [challenge, code, pyodideReady, runPython, hintsRevealed]);

  const handleReset = useCallback(async () => {
    if (challenge) {
      setCode(challenge.starterCode || "");
      setResult(null);
      try {
        await resetChallengeProgress(challenge.id);
      } catch (err) {
        console.error("Failed to reset progress:", err);
      }
    }
  }, [challenge]);

  const handleGotIt = useCallback(async () => {
    if (!challenge) return;
    setSelfAssessment("got_it");
    localStorage.removeItem(getExplanationDraftKey(challenge.id));
    try {
      await recordSubmission(challenge.id, explanation, true, hintsRevealed > 0);
    } catch (err) {
      console.error("Failed to record:", err);
    }
  }, [challenge, explanation, hintsRevealed]);

  const handleNeedReview = useCallback(async () => {
    if (!challenge) return;
    setSelfAssessment("review");
    localStorage.removeItem(getExplanationDraftKey(challenge.id));
    try {
      await recordSubmission(challenge.id, explanation, false, hintsRevealed > 0);
    } catch (err) {
      console.error("Failed to record:", err);
    }
  }, [challenge, explanation, hintsRevealed]);

  const handleTryAgain = useCallback(async () => {
    if (!challenge) return;
    setExplanation("");
    setAnswerRevealed(false);
    setSelfAssessment(null);
    localStorage.removeItem(getExplanationDraftKey(challenge.id));
    try {
      await resetChallengeProgress(challenge.id);
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  }, [challenge]);

  // ✅ Only show skeleton on initial load (no cached data)
  if (!challenge && isLoading) {
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <VStack gap={8} align="stretch">
          {/* Breadcrumb skeleton */}
          <Skeleton height="20px" width="250px" />

          {/* Header skeleton */}
          <Box>
            <HStack gap={2} mb={2}>
              <Skeleton height="20px" width="80px" />
              <Skeleton height="20px" width="60px" />
            </HStack>
            <Skeleton height="36px" width="60%" mb={4} />
            <SkeletonText noOfLines={3} gap={3} />
          </Box>

          {/* Code editor skeleton */}
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Header>
              <HStack justify="space-between">
                <Skeleton height="24px" width="120px" />
                <HStack gap={2}>
                  <Skeleton height="32px" width="60px" />
                  <Skeleton height="32px" width="90px" />
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={0}>
              <Skeleton height="300px" borderRadius="md" />
            </Card.Body>
          </Card.Root>

          {/* Test cases skeleton */}
          <Card.Root bg="gray.900" borderColor="gray.800">
            <Card.Header>
              <Skeleton height="24px" width="100px" />
            </Card.Header>
            <Card.Body pt={0}>
              <VStack gap={2} align="stretch">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="80px" borderRadius="md" />
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
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
              <Breadcrumb.Link asChild color="gray.400">
                <Link to="/">Home</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            {lesson && (
              <>
                <Breadcrumb.Item>
                  <Breadcrumb.Link asChild color="gray.400">
                    <Link to={`/lessons/${lesson.slug}`}>{lesson.title}</Link>
                  </Breadcrumb.Link>
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
                      disabled={!pyodideReady || submitting}
                    >
                      {pyodideLoading ? (
                        <HStack gap={2}>
                          <Spinner size="sm" />
                          <span>Loading Python...</span>
                        </HStack>
                      ) : pyodideError ? (
                        "Python Error"
                      ) : (
                        "Run Tests"
                      )}
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
                  {result.stdout && (
                    <Box mt={4}>
                      <Text color="gray.400" fontSize="sm" mb={2}>
                        Console Output:
                      </Text>
                      <Box
                        p={3}
                        bg="gray.800"
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="sm"
                        color="cyan.300"
                        whiteSpace="pre-wrap"
                      >
                        {result.stdout}
                      </Box>
                    </Box>
                  )}
                  {result.passed && challenge.testCases && challenge.testCases.length > 0 && (
                    <Button
                      mt={4}
                      colorPalette="cyan"
                      variant="solid"
                      onClick={() => setShowVisualization(true)}
                    >
                      <FaEye />
                      See How It Works
                    </Button>
                  )}
                </Card.Body>
              </Card.Root>
            )}

            {showVisualization && challenge.testCases && challenge.testCases.length > 0 && (
              <ExecutionVisualizer
                testCase={challenge.testCases[0]}
                solutionCode={code}
                challengeTitle={challenge.title}
                onClose={() => setShowVisualization(false)}
              />
            )}

            {challenge.hints && challenge.hints.length > 0 && (
              <HintsSection
                hints={challenge.hints}
                hintsRevealed={hintsRevealed}
                setHintsRevealed={setHintsRevealed}
              />
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
          <>
            <Card.Root bg="gray.900" borderColor="gray.800">
              <Card.Header>
                <Heading size="md" color="white">
                  Your Explanation
                </Heading>
              </Card.Header>
              <Card.Body>
                <Text color="gray.400" mb={4}>
                  Write your explanation below, then reveal the model answer to
                  compare and self-assess your understanding.
                </Text>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Type your explanation here..."
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                  minH="200px"
                  mb={4}
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                  _focusVisible={{ outline: "none", boxShadow: "none" }}
                />
                {!answerRevealed ? (
                  <Button
                    colorPalette="cyan"
                    onClick={() => setAnswerRevealed(true)}
                    disabled={!explanation.trim()}
                  >
                    Reveal Model Answer
                  </Button>
                ) : (
                  <Text color="gray.400" fontSize="sm">
                    Compare your answer with the model answer below
                  </Text>
                )}
              </Card.Body>
            </Card.Root>

            {answerRevealed && (
              <Card.Root bg="cyan.900/20" borderColor="cyan.800">
                <Card.Header>
                  <Heading size="md" color="white">
                    Model Answer
                  </Heading>
                </Card.Header>
                <Card.Body>
                  {challenge.modelAnswer ? (
                    <Box
                      color="gray.300"
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
                        "& ul, & ol": { paddingLeft: "1.5rem" },
                        "& li": { marginBottom: "0.5rem" },
                      }}
                    >
                      <ReactMarkdown>{challenge.modelAnswer}</ReactMarkdown>
                    </Box>
                  ) : (
                    <Text color="gray.400" fontStyle="italic">
                      Model answer not yet available for this challenge. Self-assess based on your understanding of the concepts.
                    </Text>
                  )}
                </Card.Body>
              </Card.Root>
            )}

            {answerRevealed && !selfAssessment && (
              <Card.Root bg="gray.900" borderColor="gray.800">
                <Card.Header>
                  <Heading size="md" color="white">
                    How did you do?
                  </Heading>
                </Card.Header>
                <Card.Body>
                  <Text color="gray.400" mb={4}>
                    Compare your explanation with the model answer. Did you cover
                    the key points?
                  </Text>
                  <HStack gap={4}>
                    <Button colorPalette="green" onClick={handleGotIt}>
                      Got it!
                    </Button>
                    <Button
                      colorPalette="orange"
                      variant="subtle"
                      onClick={handleNeedReview}
                    >
                      Need to Review
                    </Button>
                  </HStack>
                </Card.Body>
              </Card.Root>
            )}

            {selfAssessment && (
              <Card.Root
                bg={selfAssessment === "got_it" ? "green.900/20" : "orange.900/20"}
                borderColor={selfAssessment === "got_it" ? "green.800" : "orange.800"}
              >
                <Card.Body>
                  <HStack justify="space-between">
                    <Text color="white" fontWeight="medium">
                      {selfAssessment === "got_it"
                        ? "Great job! You've marked this as understood."
                        : "Marked for review. Keep practicing!"}
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="gray.300"
                      _hover={{ bg: "gray.700", color: "white" }}
                      onClick={handleTryAgain}
                    >
                      Try Again
                    </Button>
                  </HStack>
                </Card.Body>
              </Card.Root>
            )}

            {challenge.hints && challenge.hints.length > 0 && (
              <HintsSection
                hints={challenge.hints}
                hintsRevealed={hintsRevealed}
                setHintsRevealed={setHintsRevealed}
              />
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}
