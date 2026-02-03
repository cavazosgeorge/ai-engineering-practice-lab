import { useState, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Spinner,
  Center,
  Badge,
  NativeSelect,
  Breadcrumb,
  Input,
  Skeleton,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import {
  LuSparkles,
  LuCheck,
  LuX,
  LuLoader,
  LuTriangleAlert,
  LuTrash2,
  LuClock,
} from "react-icons/lu";
import {
  useAdminWeeks,
  useAdminLessons,
  useGenerationJobs,
  useRequestGeneration,
  useApproveGeneration,
  useDeleteGenerationJob,
} from "../../hooks/useAdmin";
import type {
  GenerationJob,
  GenerationJobType,
  GeneratedVocabularyTerm,
} from "../../services/admin-api";

// ============================================
// Status Badge
// ============================================

function JobStatusBadge({ status }: { status: GenerationJob["status"] }) {
  const config = {
    pending: { color: "gray", icon: <LuClock />, label: "Pending" },
    running: { color: "blue", icon: <LuLoader />, label: "Running" },
    completed: { color: "green", icon: <LuCheck />, label: "Completed" },
    failed: { color: "red", icon: <LuX />, label: "Failed" },
  };
  const c = config[status];
  return (
    <Badge colorPalette={c.color} variant="subtle">
      <HStack gap={1}>
        <Box fontSize="10px">{c.icon}</Box>
        <Text>{c.label}</Text>
      </HStack>
    </Badge>
  );
}

// ============================================
// Generation Form
// ============================================

function GenerationForm({
  onGenerate,
  isGenerating,
}: {
  onGenerate: (params: {
    weekId: string;
    weekSlug: string;
    jobType: GenerationJobType;
    count: number;
    temperature: number;
  }) => void;
  isGenerating: boolean;
}) {
  const { data: weeks } = useAdminWeeks();
  const [weekId, setWeekId] = useState("");
  const [jobType, setJobType] = useState<GenerationJobType>("vocabulary");
  const [count, setCount] = useState(10);
  const [temperature, setTemperature] = useState(0.7);

  const selectedWeek = weeks?.find((w) => w.id === weekId);

  const handleSubmit = () => {
    if (!selectedWeek) return;
    onGenerate({
      weekId: selectedWeek.id,
      weekSlug: selectedWeek.slug,
      jobType,
      count,
      temperature,
    });
  };

  return (
    <Card.Root bg="gray.900" borderColor="cyan.800" borderWidth="1px">
      <Card.Body p={6}>
        <VStack gap={5} align="stretch">
          <Heading size="md" color="white">
            Generate Content
          </Heading>

          <HStack gap={4} flexWrap="wrap">
            <Box flex="1" minW="200px">
              <Text color="gray.400" fontSize="sm" mb={1}>
                Week
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={weekId}
                  onChange={(e) => setWeekId(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                  _focusVisible={{
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "cyan.500",
                  }}
                >
                  <option value="">Select a week...</option>
                  {(weeks ?? []).map((w) => (
                    <option key={w.id} value={w.id}>
                      Week {w.weekNumber}: {w.title}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>

            <Box flex="1" minW="180px">
              <Text color="gray.400" fontSize="sm" mb={1}>
                Content Type
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={jobType}
                  onChange={(e) =>
                    setJobType(e.target.value as GenerationJobType)
                  }
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                  _focusVisible={{
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "cyan.500",
                  }}
                >
                  <option value="vocabulary">Vocabulary Terms</option>
                  <option value="quiz">Quiz Questions</option>
                  <option value="challenge">Coding Challenges</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>

            <Box w="100px">
              <Text color="gray.400" fontSize="sm" mb={1}>
                Count
              </Text>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                min={1}
                max={20}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                _focusVisible={{ outline: "none", boxShadow: "none" }}
              />
            </Box>

            <Box w="120px">
              <Text color="gray.400" fontSize="sm" mb={1}>
                Temperature
              </Text>
              <Input
                type="number"
                value={temperature}
                onChange={(e) =>
                  setTemperature(parseFloat(e.target.value) || 0.7)
                }
                min={0}
                max={1}
                step={0.1}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                _focusVisible={{ outline: "none", boxShadow: "none" }}
              />
            </Box>
          </HStack>

          <Button
            bg="cyan.600"
            color="white"
            _hover={{ bg: "cyan.500" }}
            onClick={handleSubmit}
            loading={isGenerating}
            loadingText="Generating..."
            disabled={!weekId || isGenerating}
            alignSelf="flex-start"
          >
            <Box fontSize="16px" mr={2}>
              <LuSparkles />
            </Box>
            Generate
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================
// Vocabulary Review
// ============================================

function VocabularyReview({
  job,
  onApprove,
  isApproving,
}: {
  job: GenerationJob;
  onApprove: (jobId: string, lessonId: string, selectedIndices: number[]) => void;
  isApproving: boolean;
}) {
  const { data: lessons } = useAdminLessons();
  const [lessonId, setLessonId] = useState("");
  const [selected, setSelected] = useState<Set<number>>(() => {
    const terms = job.result as GeneratedVocabularyTerm[] | null;
    return new Set(terms?.map((_, i) => i) ?? []);
  });

  const terms = (job.result as GeneratedVocabularyTerm[] | null) ?? [];

  const toggleTerm = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(terms.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  return (
    <Card.Root bg="gray.900" borderColor="green.800" borderWidth="1px">
      <Card.Body p={6}>
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <Heading size="md" color="white">
              Review Generated Terms ({terms.length})
            </Heading>
            <HStack gap={2}>
              <Button
                variant="ghost"
                size="sm"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.800" }}
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.800" }}
                onClick={selectNone}
              >
                Select None
              </Button>
            </HStack>
          </HStack>

          <VStack gap={2} align="stretch">
            {terms.map((term, i) => (
              <Box
                key={i}
                p={3}
                bg={selected.has(i) ? "gray.800" : "gray.900"}
                borderWidth="1px"
                borderColor={selected.has(i) ? "cyan.700/50" : "gray.800"}
                borderRadius="md"
                cursor="pointer"
                transition="all 0.15s ease"
                _hover={{ borderColor: "cyan.600/50" }}
                onClick={() => toggleTerm(i)}
              >
                <HStack gap={3} align="start">
                  <Box
                    mt={0.5}
                    w={4}
                    h={4}
                    borderRadius="sm"
                    borderWidth="1px"
                    borderColor={selected.has(i) ? "cyan.400" : "gray.600"}
                    bg={selected.has(i) ? "cyan.600" : "transparent"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {selected.has(i) && (
                      <Box fontSize="10px" color="white">
                        <LuCheck />
                      </Box>
                    )}
                  </Box>
                  <Box flex="1">
                    <HStack gap={2} mb={1}>
                      <Text color="white" fontWeight="medium" fontSize="sm">
                        {term.term}
                      </Text>
                      <Badge
                        colorPalette={
                          term.difficulty === "beginner"
                            ? "green"
                            : term.difficulty === "advanced"
                            ? "red"
                            : "blue"
                        }
                        variant="subtle"
                        fontSize="xs"
                      >
                        {term.difficulty}
                      </Badge>
                    </HStack>
                    <Text color="gray.300" fontSize="sm">
                      {term.definition}
                    </Text>
                    {term.context && (
                      <Text color="gray.500" fontSize="xs" mt={1}>
                        {term.context}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </Box>
            ))}
          </VStack>

          <Box borderTop="1px solid" borderColor="gray.800" pt={4}>
            <HStack gap={4} flexWrap="wrap">
              <Box flex="1" minW="200px">
                <Text color="gray.400" fontSize="sm" mb={1}>
                  Save to Lesson
                </Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _focusVisible={{
                      outline: "none",
                      boxShadow: "none",
                      borderColor: "cyan.500",
                    }}
                  >
                    <option value="">Select a lesson...</option>
                    {(lessons ?? []).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>
              <Button
                bg="green.600"
                color="white"
                _hover={{ bg: "green.500" }}
                onClick={() =>
                  onApprove(job.id, lessonId, Array.from(selected))
                }
                loading={isApproving}
                loadingText="Saving..."
                disabled={!lessonId || selected.size === 0 || isApproving}
                alignSelf="flex-end"
              >
                <Box fontSize="16px" mr={2}>
                  <LuCheck />
                </Box>
                Approve {selected.size} Terms
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================
// Job History
// ============================================

function JobHistory({
  jobs,
  onSelectJob,
  onDeleteJob,
  selectedJobId,
}: {
  jobs: GenerationJob[];
  onSelectJob: (job: GenerationJob) => void;
  onDeleteJob: (jobId: string) => void;
  selectedJobId: string | null;
}) {
  if (jobs.length === 0) {
    return (
      <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
        <Card.Body py={8}>
          <Center>
            <Text color="gray.500">No generation history yet</Text>
          </Center>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <VStack gap={2} align="stretch">
      {jobs.map((job) => (
        <Box
          key={job.id}
          p={3}
          bg={selectedJobId === job.id ? "gray.800" : "gray.900"}
          borderWidth="1px"
          borderColor={
            selectedJobId === job.id ? "cyan.700/50" : "gray.800"
          }
          borderRadius="md"
          cursor="pointer"
          transition="all 0.15s ease"
          _hover={{ borderColor: "gray.700" }}
          onClick={() => onSelectJob(job)}
        >
          <HStack justify="space-between">
            <HStack gap={3}>
              <JobStatusBadge status={job.status} />
              <Badge
                variant="subtle"
                colorPalette="purple"
                fontSize="xs"
              >
                {job.jobType}
              </Badge>
              <Text color="gray.400" fontSize="xs">
                {new Date(job.createdAt).toLocaleString()}
              </Text>
            </HStack>
            <HStack gap={2}>
              {job.modelName && (
                <Text
                  color="gray.400"
                  fontSize="xs"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {job.modelName}
                </Text>
              )}
              {(job.inputTokenCount || job.outputTokenCount) && (
                <Text
                  color="gray.400"
                  fontSize="xs"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {job.inputTokenCount ?? 0}+{job.outputTokenCount ?? 0} tokens
                </Text>
              )}
              <Box
                as="button"
                p={1}
                borderRadius="md"
                color="gray.600"
                transition="all 0.15s ease"
                _hover={{ color: "red.400", bg: "gray.800" }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDeleteJob(job.id);
                }}
              >
                <Box fontSize="12px">
                  <LuTrash2 />
                </Box>
              </Box>
            </HStack>
          </HStack>
          {job.errorMessage && (
            <Text color="red.400" fontSize="xs" mt={1}>
              {job.errorMessage}
            </Text>
          )}
          {job.status === "completed" && job.result && (
            <Text color="gray.400" fontSize="xs" mt={1}>
              {Array.isArray(job.result) ? job.result.length : 0} items
              generated
            </Text>
          )}
        </Box>
      ))}
    </VStack>
  );
}

// ============================================
// Main Page
// ============================================

export function GenerationAdminPage() {
  const { data: jobs, isLoading: jobsLoading } = useGenerationJobs();

  const generateMutation = useRequestGeneration();
  const approveMutation = useApproveGeneration();
  const deleteMutation = useDeleteGenerationJob();

  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);

  // When a new job completes from mutation, select it
  const handleGenerate = async (params: {
    weekId: string;
    weekSlug: string;
    jobType: GenerationJobType;
    count: number;
    temperature: number;
  }) => {
    try {
      const job = await generateMutation.mutateAsync(params);
      setSelectedJob(job);
    } catch {
      // Error displayed via mutation state
    }
  };

  const handleApprove = async (
    jobId: string,
    lessonId: string,
    selectedIndices: number[],
  ) => {
    try {
      await approveMutation.mutateAsync({
        jobId,
        input: { lessonId, selectedIndices },
      });
      setSelectedJob(null);
    } catch {
      // Error displayed via mutation state
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }
    deleteMutation.mutate(jobId);
  };

  // Sort jobs by created date descending
  const sortedJobs = useMemo(
    () =>
      [...(jobs ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [jobs]
  );

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild color="gray.400">
                <Link to="/admin/dashboard">Admin</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink color="white">
                AI Generation
              </Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Box>
          <Heading
            size="xl"
            color="white"
            mb={2}
            fontFamily="'JetBrains Mono', monospace"
          >
            AI Content Generation
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Generate vocabulary, quizzes, and challenges from course materials
          </Text>
        </Box>

        {/* Generation Form */}
        <GenerationForm
          onGenerate={handleGenerate}
          isGenerating={generateMutation.isPending}
        />

        {/* Error display */}
        {generateMutation.isError && (
          <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
            <Card.Body p={4}>
              <HStack gap={2}>
                <Box color="red.400" fontSize="16px">
                  <LuTriangleAlert />
                </Box>
                <Text color="red.300" fontSize="sm">
                  {generateMutation.error instanceof Error
                    ? generateMutation.error.message
                    : "Generation failed"}
                </Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Approval display */}
        {approveMutation.isSuccess && (
          <Card.Root
            bg="green.900/20"
            borderColor="green.700/50"
            borderWidth="1px"
          >
            <Card.Body p={4}>
              <HStack gap={2}>
                <Box color="green.400" fontSize="16px">
                  <LuCheck />
                </Box>
                <Text color="green.300" fontSize="sm">
                  Terms approved and saved to lesson
                </Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Review panel for selected completed vocabulary job */}
        {selectedJob &&
          selectedJob.status === "completed" &&
          selectedJob.jobType === "vocabulary" &&
          selectedJob.result && (
            <VocabularyReview
              job={selectedJob}
              onApprove={handleApprove}
              isApproving={approveMutation.isPending}
            />
          )}

        {/* Running indicator */}
        {generateMutation.isPending && (
          <Card.Root bg="gray.900" borderColor="blue.800" borderWidth="1px">
            <Card.Body p={6}>
              <Center>
                <VStack gap={3}>
                  <Spinner size="lg" color="cyan.400" />
                  <Text color="gray.400">
                    Generating content via Groq Llama 3.3 70B...
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Retrieving RAG context and running LLM inference
                  </Text>
                </VStack>
              </Center>
            </Card.Body>
          </Card.Root>
        )}

        {/* Job History */}
        <Box>
          <Heading size="md" color="white" mb={4}>
            Generation History
          </Heading>
          {jobsLoading ? (
            <VStack
              gap={2}
              align="stretch"
              opacity={0}
              animation="fadeIn 0.2s ease-in 0.2s forwards"
              css={{
                "@keyframes fadeIn": { to: { opacity: 1 } },
              }}
            >
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  p={3}
                  bg="gray.900"
                  borderWidth="1px"
                  borderColor="gray.800"
                  borderRadius="md"
                >
                  <HStack justify="space-between">
                    <HStack gap={3}>
                      <Skeleton height="20px" width="90px" />
                      <Skeleton height="20px" width="70px" />
                      <Skeleton height="14px" width="140px" />
                    </HStack>
                    <HStack gap={2}>
                      <Skeleton height="14px" width="160px" />
                      <Skeleton height="14px" width="100px" />
                    </HStack>
                  </HStack>
                  <Skeleton height="12px" width="120px" mt={2} />
                </Box>
              ))}
            </VStack>
          ) : (
            <JobHistory
              jobs={sortedJobs}
              onSelectJob={setSelectedJob}
              onDeleteJob={handleDeleteJob}
              selectedJobId={selectedJob?.id ?? null}
            />
          )}
        </Box>
      </VStack>
    </Container>
  );
}
