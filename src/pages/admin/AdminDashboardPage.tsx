import { useState, useMemo } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  Input,
  Button,
  Spinner,
  Center,
  NativeSelect,
  Tabs,
} from "@chakra-ui/react";
import {
  LuBookOpen,
  LuFileText,
  LuBrain,
  LuCalendar,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuSearch,
  LuTriangleAlert,
  LuEye,
  LuEyeOff,
  LuDatabase,
  LuLink,
} from "react-icons/lu";
import {
  useAdminStats,
  useAdminVocabularyTerms,
  useAdminLessons,
  useDeleteVocabularyTerm,
  useAdminWeeks,
  useUpdateWeek,
  useDeleteWeek,
} from "../../hooks/useAdmin";
import type { AdminVocabularyTerm, AdminWeek } from "../../services/admin-api";
import { WeekAssignmentTab } from "../../components/admin/weeks/WeekAssignmentTab";

// ============================================
// Shared Components
// ============================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
      <Card.Body>
        <VStack align="start" gap={3}>
          <Box fontSize="24px" color={color}>
            {icon}
          </Box>
          <Box>
            <Text color="gray.400" fontSize="sm">
              {label}
            </Text>
            <Text color="white" fontSize="3xl" fontWeight="bold">
              {value}
            </Text>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================
// Dashboard Tab
// ============================================

function DashboardTab() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (!stats && isLoading) {
    return (
      <Box
        minH="40vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="40vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
        <Card.Body>
          <Text color="red.300">
            Error loading stats: {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Box>
      <Heading size="lg" color="white" mb={4}>
        Overview
      </Heading>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
        <StatCard
          label="Weeks"
          value={stats?.weekCount ?? 0}
          icon={<LuCalendar />}
          color="blue.400"
        />
        <StatCard
          label="Total Lessons"
          value={stats?.lessonCount ?? 0}
          icon={<LuBookOpen />}
          color="cyan.400"
        />
        <StatCard
          label="Vocabulary Terms"
          value={stats?.vocabularyCount ?? 0}
          icon={<LuFileText />}
          color="green.400"
        />
        <StatCard
          label="Challenges"
          value={stats?.challengeCount ?? 0}
          icon={<LuBrain />}
          color="purple.400"
        />
      </SimpleGrid>
    </Box>
  );
}

// ============================================
// Vocabulary Tab
// ============================================

interface DeleteConfirmationProps {
  term: AdminVocabularyTerm;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmation({
  term,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationProps) {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.700"
      zIndex={100}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Card.Root bg="gray.900" borderColor="gray.700" maxW="md" mx={4}>
        <Card.Body p={6}>
          <VStack gap={4} align="start">
            <HStack gap={3}>
              <Box color="red.400" fontSize="24px">
                <LuTriangleAlert />
              </Box>
              <Heading size="md" color="white">
                Delete Term
              </Heading>
            </HStack>
            <Text color="gray.300">
              Are you sure you want to delete "{term.term}"? This action cannot
              be undone.
            </Text>
            <HStack gap={3} justify="flex-end" w="full">
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.800" }}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                bg="red.600"
                color="white"
                _hover={{ bg: "red.500" }}
                onClick={onConfirm}
                loading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

function VocabularyTab() {
  const { data: terms, isLoading: termsLoading, error: termsError } = useAdminVocabularyTerms();
  const { data: lessons } = useAdminLessons();
  const deleteMutation = useDeleteVocabularyTerm();

  const [searchQuery, setSearchQuery] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [termToDelete, setTermToDelete] = useState<AdminVocabularyTerm | null>(null);

  const filteredTerms = useMemo(() => {
    if (!terms) return [];

    return terms.filter((term) => {
      const matchesSearch =
        !searchQuery ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLesson = !lessonFilter || term.lesson_id === lessonFilter;
      const matchesDifficulty =
        !difficultyFilter || term.difficulty === difficultyFilter;

      return matchesSearch && matchesLesson && matchesDifficulty;
    });
  }, [terms, searchQuery, lessonFilter, difficultyFilter]);

  const handleDelete = async () => {
    if (!termToDelete) return;
    try {
      await deleteMutation.mutateAsync(termToDelete.id);
      setTermToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (!terms && termsLoading) {
    return (
      <Box
        minH="40vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="40vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (termsError) {
    return (
      <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
        <Card.Body>
          <Text color="red.300">
            Error loading vocabulary terms:{" "}
            {termsError instanceof Error ? termsError.message : "Unknown error"}
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <>
      {termToDelete && (
        <DeleteConfirmation
          term={termToDelete}
          onConfirm={handleDelete}
          onCancel={() => setTermToDelete(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <VStack gap={6} align="stretch">
        {/* Header row */}
        <HStack justify="space-between" align="center">
          <Text color="gray.400" fontSize="sm">
            {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""}{" "}
            {searchQuery || lessonFilter || difficultyFilter ? "matching filters" : "total"}
          </Text>
          <RouterLink to="/admin/vocabulary/new">
            <Button bg="cyan.600" color="white" _hover={{ bg: "cyan.500" }} size="sm">
              <Box fontSize="16px" mr={2}>
                <LuPlus />
              </Box>
              Add Term
            </Button>
          </RouterLink>
        </HStack>

        {/* Filters */}
        <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
          <Card.Body p={4}>
            <HStack gap={4} flexWrap="wrap">
              <Box flex="1" minW="200px">
                <HStack>
                  <Box color="gray.400" fontSize="16px">
                    <LuSearch />
                  </Box>
                  <Input
                    placeholder="Search terms or definitions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                  />
                </HStack>
              </Box>
              <Box w="220px">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={lessonFilter}
                    onChange={(e) => setLessonFilter(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _focusVisible={{ outline: "none", boxShadow: "none", borderColor: "cyan.500" }}
                  >
                    <option value="">All Lessons</option>
                    {(lessons ?? []).map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>
              <Box w="180px">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _focusVisible={{ outline: "none", boxShadow: "none", borderColor: "cyan.500" }}
                  >
                    <option value="">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Table */}
        {filteredTerms.length === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
            <Card.Body py={12}>
              <Center>
                <VStack gap={4}>
                  <Text color="gray.400" fontSize="lg">
                    {terms?.length === 0
                      ? "No vocabulary terms yet"
                      : "No terms match your filters"}
                  </Text>
                  {terms?.length === 0 && (
                    <RouterLink to="/admin/vocabulary/new">
                      <Button bg="cyan.600" color="white" _hover={{ bg: "cyan.500" }}>
                        <Box fontSize="16px" mr={2}>
                          <LuPlus />
                        </Box>
                        Add Your First Term
                      </Button>
                    </RouterLink>
                  )}
                </VStack>
              </Center>
            </Card.Body>
          </Card.Root>
        ) : (
          <Box
            bg="gray.900"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.800"
            overflow="hidden"
          >
            {/* Table header */}
            <Box
              px={5}
              py={3}
              bg="gray.800/60"
              borderBottom="1px solid"
              borderColor="gray.800"
            >
              <HStack>
                <Box flex="1.2">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Term
                  </Text>
                </Box>
                <Box flex="2">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Definition
                  </Text>
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Lesson
                  </Text>
                </Box>
                <Box w="110px">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Level
                  </Text>
                </Box>
                <Box w="80px" textAlign="right">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Actions
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Table rows */}
            {filteredTerms.map((term, index) => (
              <Box
                key={term.id}
                px={5}
                py={3.5}
                borderBottom={index < filteredTerms.length - 1 ? "1px solid" : "none"}
                borderColor="gray.800/60"
                transition="all 0.15s ease"
                cursor="default"
                position="relative"
                _hover={{
                  bg: "gray.800/40",
                }}
                css={{
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    bg: "transparent",
                    transition: "background 0.15s ease",
                  },
                  "&:hover::before": {
                    background: "var(--chakra-colors-cyan-500)",
                  },
                }}
              >
                <HStack align="center">
                  <Box flex="1.2">
                    <Text
                      color="cyan.300"
                      fontWeight="medium"
                      fontSize="sm"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {term.term}
                    </Text>
                  </Box>
                  <Box flex="2">
                    <Text color="gray.400" fontSize="sm" lineClamp={1}>
                      {term.definition}
                    </Text>
                  </Box>
                  <Box flex="1">
                    <Text
                      color="gray.400"
                      fontSize="xs"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {term.lesson_title}
                    </Text>
                  </Box>
                  <Box w="110px">
                    <HStack gap={2}>
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg={
                          term.difficulty === "beginner"
                            ? "green.400"
                            : term.difficulty === "intermediate"
                            ? "yellow.400"
                            : "red.400"
                        }
                        flexShrink={0}
                      />
                      <Text
                        color="gray.400"
                        fontSize="xs"
                        fontFamily="'JetBrains Mono', monospace"
                        textTransform="capitalize"
                      >
                        {term.difficulty}
                      </Text>
                    </HStack>
                  </Box>
                  <Box w="80px">
                    <HStack gap={1} justify="flex-end">
                      <RouterLink to={`/admin/vocabulary/${term.id}/edit`}>
                        <Box
                          as="button"
                          p={1.5}
                          borderRadius="md"
                          color="gray.500"
                          transition="all 0.15s ease"
                          _hover={{ color: "cyan.400", bg: "gray.800" }}
                        >
                          <Box fontSize="14px"><LuPencil /></Box>
                        </Box>
                      </RouterLink>
                      <Box
                        as="button"
                        p={1.5}
                        borderRadius="md"
                        color="gray.500"
                        transition="all 0.15s ease"
                        _hover={{ color: "red.400", bg: "gray.800" }}
                        onClick={() => setTermToDelete(term)}
                      >
                        <Box fontSize="14px"><LuTrash2 /></Box>
                      </Box>
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            ))}
          </Box>
        )}
      </VStack>
    </>
  );
}

// ============================================
// Weeks Tab
// ============================================

interface WeekDeleteConfirmationProps {
  week: AdminWeek;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function WeekDeleteConfirmation({
  week,
  onConfirm,
  onCancel,
  isDeleting,
}: WeekDeleteConfirmationProps) {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.700"
      zIndex={100}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Card.Root bg="gray.900" borderColor="gray.700" maxW="md" mx={4}>
        <Card.Body p={6}>
          <VStack gap={4} align="start">
            <HStack gap={3}>
              <Box color="red.400" fontSize="24px">
                <LuTriangleAlert />
              </Box>
              <Heading size="md" color="white">
                Delete Week
              </Heading>
            </HStack>
            <Text color="gray.300">
              Are you sure you want to delete "Week {week.weekNumber}: {week.title}"?
              This will also remove all associated data sources and generation jobs.
            </Text>
            <HStack gap={3} justify="flex-end" w="full">
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.800" }}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                bg="red.600"
                color="white"
                _hover={{ bg: "red.500" }}
                onClick={onConfirm}
                loading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

function WeeksTab() {
  const { data: weeks, isLoading, error } = useAdminWeeks();
  const updateMutation = useUpdateWeek();
  const deleteMutation = useDeleteWeek();
  const [weekToDelete, setWeekToDelete] = useState<AdminWeek | null>(null);

  const handleTogglePublish = (week: AdminWeek) => {
    updateMutation.mutate({
      id: week.id,
      input: { isPublished: !week.isPublished },
    });
  };

  const handleDelete = async () => {
    if (!weekToDelete) return;
    try {
      await deleteMutation.mutateAsync(weekToDelete.id);
      setWeekToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (!weeks && isLoading) {
    return (
      <Box
        minH="40vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="40vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
        <Card.Body>
          <Text color="red.300">
            Error loading weeks: {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <>
      {weekToDelete && (
        <WeekDeleteConfirmation
          week={weekToDelete}
          onConfirm={handleDelete}
          onCancel={() => setWeekToDelete(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Text color="gray.400" fontSize="sm">
            {weeks?.length ?? 0} week{(weeks?.length ?? 0) !== 1 ? "s" : ""}
          </Text>
        </HStack>

        {(weeks?.length ?? 0) === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
            <Card.Body py={12}>
              <Center>
                <Text color="gray.400" fontSize="lg">
                  No weeks configured yet. Run `bun run db:seed-weeks` to seed weeks.
                </Text>
              </Center>
            </Card.Body>
          </Card.Root>
        ) : (
          <Box
            bg="gray.900"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.800"
            overflow="hidden"
          >
            {/* Table header */}
            <Box
              px={5}
              py={3}
              bg="gray.800/60"
              borderBottom="1px solid"
              borderColor="gray.800"
            >
              <HStack>
                <Box w="50px">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    #
                  </Text>
                </Box>
                <Box flex="2">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Title
                  </Text>
                </Box>
                <Box w="90px" textAlign="center">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Status
                  </Text>
                </Box>
                <Box w="90px" textAlign="center">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Lessons
                  </Text>
                </Box>
                <Box w="90px" textAlign="center">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Terms
                  </Text>
                </Box>
                <Box w="120px" textAlign="right">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="gray.400"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Actions
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Table rows */}
            {(weeks ?? []).map((week, index) => (
              <Box
                key={week.id}
                px={5}
                py={3.5}
                borderBottom={index < (weeks?.length ?? 0) - 1 ? "1px solid" : "none"}
                borderColor="gray.800/60"
                transition="all 0.15s ease"
                cursor="default"
                position="relative"
                _hover={{
                  bg: "gray.800/40",
                }}
                css={{
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    bg: "transparent",
                    transition: "background 0.15s ease",
                  },
                  "&:hover::before": {
                    background: "var(--chakra-colors-cyan-500)",
                  },
                }}
              >
                <HStack align="center">
                  <Box w="50px">
                    <Text
                      color="cyan.300"
                      fontWeight="medium"
                      fontSize="sm"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {week.weekNumber}
                    </Text>
                  </Box>
                  <Box flex="2">
                    <Text color="white" fontWeight="medium" fontSize="sm">
                      {week.title}
                    </Text>
                    {week.description && (
                      <Text color="gray.400" fontSize="xs" lineClamp={1}>
                        {week.description}
                      </Text>
                    )}
                  </Box>
                  <Box w="90px" textAlign="center">
                    <Box
                      as="button"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="medium"
                      bg={week.isPublished ? "green.900/40" : "gray.800"}
                      color={week.isPublished ? "green.400" : "gray.400"}
                      border="1px solid"
                      borderColor={week.isPublished ? "green.700/50" : "gray.700"}
                      transition="all 0.15s ease"
                      _hover={{
                        bg: week.isPublished ? "red.900/30" : "green.900/30",
                        color: week.isPublished ? "red.400" : "green.400",
                        borderColor: week.isPublished ? "red.700/50" : "green.700/50",
                      }}
                      onClick={() => handleTogglePublish(week)}
                    >
                      <HStack gap={1} justify="center">
                        <Box fontSize="10px">
                          {week.isPublished ? <LuEye /> : <LuEyeOff />}
                        </Box>
                        <Text>{week.isPublished ? "Published" : "Draft"}</Text>
                      </HStack>
                    </Box>
                  </Box>
                  <Box w="90px" textAlign="center">
                    <Text
                      color="gray.400"
                      fontSize="sm"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {week.lessonCount}
                    </Text>
                  </Box>
                  <Box w="90px" textAlign="center">
                    <Text
                      color="gray.400"
                      fontSize="sm"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {week.vocabularyCount}
                    </Text>
                  </Box>
                  <Box w="120px">
                    <HStack gap={1} justify="flex-end">
                      <RouterLink to={`/admin/weeks/${week.id}/edit`} title="Edit Week">
                        <Box
                          p={1.5}
                          borderRadius="md"
                          color="gray.500"
                          transition="all 0.15s ease"
                          _hover={{ color: "cyan.400", bg: "gray.800" }}
                        >
                          <Box fontSize="14px"><LuPencil /></Box>
                        </Box>
                      </RouterLink>
                      <RouterLink to={`/admin/weeks/${week.id}/sources`} title="Data Sources">
                        <Box
                          p={1.5}
                          borderRadius="md"
                          color="gray.500"
                          transition="all 0.15s ease"
                          _hover={{ color: "cyan.400", bg: "gray.800" }}
                        >
                          <Box fontSize="14px"><LuDatabase /></Box>
                        </Box>
                      </RouterLink>
                      <Box
                        as="button"
                        p={1.5}
                        borderRadius="md"
                        color="gray.500"
                        transition="all 0.15s ease"
                        _hover={{ color: "red.400", bg: "gray.800" }}
                        onClick={() => setWeekToDelete(week)}
                      >
                        <Box fontSize="14px"><LuTrash2 /></Box>
                      </Box>
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            ))}
          </Box>
        )}
      </VStack>
    </>
  );
}

// ============================================
// Main Page
// ============================================

export function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const handleTabChange = (details: { value: string }) => {
    setSearchParams(details.value === "dashboard" ? {} : { tab: details.value }, { replace: true });
  };

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={8} align="stretch">
        <Box>
          <Heading
            size="2xl"
            color="white"
            mb={4}
            fontFamily="'JetBrains Mono', monospace"
          >
            Admin Dashboard
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Manage content and monitor statistics
          </Text>
        </Box>

        <Tabs.Root value={activeTab} onValueChange={handleTabChange} variant="line">
          <Tabs.List borderColor="gray.800">
            <Tabs.Trigger
              value="dashboard"
              color="gray.400"
              _selected={{ color: "cyan.400", borderColor: "cyan.400" }}
              _checked={{ color: "cyan.400", borderColor: "cyan.400" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
              fontWeight="medium"
              fontSize="sm"
            >
              Dashboard
            </Tabs.Trigger>
            <Tabs.Trigger
              value="vocabulary"
              color="gray.400"
              _selected={{ color: "cyan.400", borderColor: "cyan.400" }}
              _checked={{ color: "cyan.400", borderColor: "cyan.400" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
              fontWeight="medium"
              fontSize="sm"
            >
              Vocabulary
            </Tabs.Trigger>
            <Tabs.Trigger
              value="weeks"
              color="gray.400"
              _selected={{ color: "cyan.400", borderColor: "cyan.400" }}
              _checked={{ color: "cyan.400", borderColor: "cyan.400" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
              fontWeight="medium"
              fontSize="sm"
            >
              Weeks
            </Tabs.Trigger>
            <Tabs.Trigger
              value="assignments"
              color="gray.400"
              _selected={{ color: "cyan.400", borderColor: "cyan.400" }}
              _checked={{ color: "cyan.400", borderColor: "cyan.400" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
              fontWeight="medium"
              fontSize="sm"
            >
              <Box fontSize="14px" mr={1.5}>
                <LuLink />
              </Box>
              Assignments
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt={6}>
            <Tabs.Content value="dashboard">
              <DashboardTab />
            </Tabs.Content>
            <Tabs.Content value="vocabulary">
              <VocabularyTab />
            </Tabs.Content>
            <Tabs.Content value="weeks">
              <WeeksTab />
            </Tabs.Content>
            <Tabs.Content value="assignments">
              <WeekAssignmentTab />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </VStack>
    </Container>
  );
}
