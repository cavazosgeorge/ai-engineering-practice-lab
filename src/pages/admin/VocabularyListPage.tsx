import { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Card,
  Input,
  Button,
  Badge,
  Spinner,
  Center,
  NativeSelect,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuSearch,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  useAdminVocabularyTerms,
  useAdminLessons,
  useDeleteVocabularyTerm,
} from "../../hooks/useAdmin";
import type { AdminVocabularyTerm } from "../../services/admin-api";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

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

export function VocabularyListPage() {
  const { data: terms, isLoading: termsLoading, error: termsError } = useAdminVocabularyTerms();
  const { data: lessons } = useAdminLessons();
  const deleteMutation = useDeleteVocabularyTerm();

  const [searchQuery, setSearchQuery] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [termToDelete, setTermToDelete] = useState<AdminVocabularyTerm | null>(null);

  // Client-side filtering
  const filteredTerms = useMemo(() => {
    if (!terms) return [];

    return terms.filter((term) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());

      // Lesson filter
      const matchesLesson = !lessonFilter || term.lesson_id === lessonFilter;

      // Difficulty filter
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
      // Error is handled by the mutation
    }
  };

  if (!terms && termsLoading) {
    return (
      <Box
        minH="60vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="60vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (termsError) {
    return (
      <Container maxW="container.xl" py={12}>
        <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
          <Card.Body>
            <Text color="red.300">
              Error loading vocabulary terms:{" "}
              {termsError instanceof Error ? termsError.message : "Unknown error"}
            </Text>
          </Card.Body>
        </Card.Root>
      </Container>
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

      <Container maxW="container.xl" py={12}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="start">
            <Box>
              <Heading
                size="2xl"
                color="white"
                mb={2}
                fontFamily="'JetBrains Mono', monospace"
              >
                Vocabulary Terms
              </Heading>
              <Text color="gray.400" fontSize="lg">
                {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""}{" "}
                {searchQuery || lessonFilter || difficultyFilter ? "matching filters" : "total"}
              </Text>
            </Box>
            <RouterLink to="/admin/vocabulary/new">
              <Button
                bg="cyan.600"
                color="white"
                _hover={{ bg: "cyan.500" }}
              >
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
                {/* Search */}
                <Box flex="1" minW="200px">
                  <HStack>
                    <Box color="gray.500" fontSize="16px">
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

                {/* Lesson Filter */}
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

                {/* Difficulty Filter */}
                <Box minW="150px">
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
                    <Text color="gray.500" fontSize="lg">
                      {terms?.length === 0
                        ? "No vocabulary terms yet"
                        : "No terms match your filters"}
                    </Text>
                    {terms?.length === 0 && (
                      <RouterLink to="/admin/vocabulary/new">
                        <Button
                          bg="cyan.600"
                          color="white"
                          _hover={{ bg: "cyan.500" }}
                        >
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
            <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px" overflow="hidden">
              <Table.Root size="sm" variant="outline" bg="gray.900">
                <Table.Header>
                  <Table.Row bg="gray.800">
                    <Table.ColumnHeader color="gray.400" py={3}>
                      Term
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400" py={3}>
                      Definition
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400" py={3}>
                      Lesson
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400" py={3}>
                      Difficulty
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400" py={3} textAlign="right">
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredTerms.map((term) => (
                    <Table.Row
                      key={term.id}
                      _hover={{ bg: "gray.800/50" }}
                      borderBottom="1px solid"
                      borderColor="gray.800"
                    >
                      <Table.Cell py={3}>
                        <Text color="white" fontWeight="medium">
                          {term.term}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} maxW="300px">
                        <Text color="gray.400" lineClamp={2}>
                          {term.definition}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3}>
                        <Badge colorPalette="cyan" variant="subtle">
                          {term.lesson_title}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell py={3}>
                        <Badge
                          colorPalette={DIFFICULTY_COLORS[term.difficulty]}
                          variant="subtle"
                        >
                          {term.difficulty}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell py={3}>
                        <HStack gap={2} justify="flex-end">
                          <RouterLink to={`/admin/vocabulary/${term.id}/edit`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "white", bg: "gray.700" }}
                            >
                              <Box fontSize="16px">
                                <LuPencil />
                              </Box>
                            </Button>
                          </RouterLink>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "red.400", bg: "gray.700" }}
                            onClick={() => setTermToDelete(term)}
                          >
                            <Box fontSize="16px">
                              <LuTrash2 />
                            </Box>
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Root>
          )}
        </VStack>
      </Container>
    </>
  );
}
