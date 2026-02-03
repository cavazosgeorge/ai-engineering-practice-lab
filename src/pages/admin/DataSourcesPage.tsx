import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Input,
  Button,
  Spinner,
  Center,
  Badge,
  Breadcrumb,
  Textarea,
  NativeSelect,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import {
  LuPlus,
  LuTrash2,
  LuTriangleAlert,
  LuFileText,
  LuLink,
  LuUpload,
  LuCheck,
  LuX,
  LuLoader,
} from "react-icons/lu";
import {
  useDataSources,
  useDataSourceStats,
  useIngestText,
  useIngestURL,
  useIngestPDF,
  useDeleteDataSource,
  useAdminWeeks,
} from "../../hooks/useAdmin";
import type { DataSource, AdminWeek } from "../../services/admin-api";

// ============================================
// Status badge component
// ============================================

function StatusBadge({ status }: { status: DataSource["status"] }) {
  const config = {
    pending: { color: "gray", icon: <LuLoader />, label: "Pending" },
    processing: { color: "blue", icon: <LuLoader />, label: "Processing" },
    processed: { color: "green", icon: <LuCheck />, label: "Processed" },
    error: { color: "red", icon: <LuX />, label: "Error" },
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
// Delete confirmation
// ============================================

function DeleteConfirmation({
  source,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  source: DataSource;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
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
                Delete Data Source
              </Heading>
            </HStack>
            <Text color="gray.300">
              Are you sure you want to delete "{source.title}"? This will remove
              all associated chunks from the vector store.
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

// ============================================
// Add source form
// ============================================

function AddSourceForm({
  week,
  onClose,
}: {
  week: AdminWeek;
  onClose: () => void;
}) {
  const [sourceType, setSourceType] = useState<"text" | "url" | "pdf">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const ingestTextMutation = useIngestText();
  const ingestURLMutation = useIngestURL();
  const ingestPDFMutation = useIngestPDF();

  const isSubmitting =
    ingestTextMutation.isPending ||
    ingestURLMutation.isPending ||
    ingestPDFMutation.isPending;

  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (sourceType === "text" && content.trim()) {
      await ingestTextMutation.mutateAsync({
        weekId: week.id,
        weekSlug: week.slug,
        title,
        content,
      });
    } else if (sourceType === "url" && url.trim()) {
      await ingestURLMutation.mutateAsync({
        weekId: week.id,
        weekSlug: week.slug,
        title,
        url,
      });
    } else if (sourceType === "pdf" && file) {
      const formData = new FormData();
      formData.append("weekId", week.id);
      formData.append("weekSlug", week.slug);
      formData.append("title", title);
      formData.append("file", file);
      await ingestPDFMutation.mutateAsync(formData);
    }

    onClose();
  };

  return (
    <Card.Root bg="gray.900" borderColor="cyan.800" borderWidth="1px">
      <Card.Body p={6}>
        <VStack gap={4} align="stretch">
          <Heading size="md" color="white">
            Add Data Source
          </Heading>

          <Box>
            <Text color="gray.400" fontSize="sm" mb={1}>
              Source Type
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={sourceType}
                onChange={(e) =>
                  setSourceType(e.target.value as "text" | "url" | "pdf")
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
                <option value="text">Paste Text</option>
                <option value="url">URL</option>
                <option value="pdf">PDF Upload</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          <Box>
            <Text color="gray.400" fontSize="sm" mb={1}>
              Title
            </Text>
            <Input
              placeholder="e.g., Attention Is All You Need"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              bg="gray.800"
              borderColor="gray.700"
              color="white"
              _placeholder={{ color: "gray.500" }}
              _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
            />
          </Box>

          {sourceType === "text" ? (
            <Box>
              <Text color="gray.400" fontSize="sm" mb={1}>
                Content
              </Text>
              <Textarea
                placeholder="Paste article or paper text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                _focusVisible={{ outline: "none", boxShadow: "none" }}
                rows={8}
              />
            </Box>
          ) : sourceType === "url" ? (
            <Box>
              <Text color="gray.400" fontSize="sm" mb={1}>
                URL
              </Text>
              <Input
                placeholder="https://arxiv.org/abs/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                _focusVisible={{ outline: "none", boxShadow: "none" }}
              />
            </Box>
          ) : (
            <Box>
              <Text color="gray.400" fontSize="sm" mb={1}>
                PDF File
              </Text>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                bg="gray.800"
                borderColor="gray.700"
                color="white"
                p={1.5}
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                _focusVisible={{ outline: "none", boxShadow: "none" }}
                css={{
                  "&::file-selector-button": {
                    background: "var(--chakra-colors-gray-700)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    marginRight: "8px",
                    cursor: "pointer",
                  },
                }}
              />
              <Text color="gray.500" fontSize="xs" mt={1}>
                Max 10MB
              </Text>
            </Box>
          )}

          <HStack gap={3} justify="flex-end">
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "gray.800" }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              bg="cyan.600"
              color="white"
              _hover={{ bg: "cyan.500" }}
              onClick={handleSubmit}
              loading={isSubmitting}
              loadingText="Processing..."
              disabled={
                !title.trim() ||
                (sourceType === "text"
                  ? !content.trim()
                  : sourceType === "url"
                  ? !url.trim()
                  : !file)
              }
            >
              Ingest
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ============================================
// Main page
// ============================================

export function DataSourcesPage() {
  const { weekId } = useParams<{ weekId: string }>();
  const { data: weeks } = useAdminWeeks();
  const { data: sources, isLoading, error } = useDataSources(weekId || "");
  const { data: stats } = useDataSourceStats(weekId || "");
  const deleteMutation = useDeleteDataSource();

  const [showAddForm, setShowAddForm] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<DataSource | null>(null);

  const week = weeks?.find((w) => w.id === weekId);

  const handleDelete = async () => {
    if (!sourceToDelete) return;
    try {
      await deleteMutation.mutateAsync(sourceToDelete.id);
      setSourceToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (!weekId) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.400">No week selected</Text>
      </Container>
    );
  }

  if (!sources && isLoading) {
    return (
      <Container
        maxW="container.xl"
        py={12}
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="40vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={12}>
        <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
          <Card.Body>
            <Text color="red.300">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          </Card.Body>
        </Card.Root>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      {sourceToDelete && (
        <DeleteConfirmation
          source={sourceToDelete}
          onConfirm={handleDelete}
          onCancel={() => setSourceToDelete(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

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
              <Breadcrumb.Link asChild color="gray.400">
                <Link to="/admin/dashboard?tab=weeks">Weeks</Link>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink color="white">
                {week ? `Week ${week.weekNumber} Data Sources` : "Data Sources"}
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
            {week ? week.title : "Data Sources"}
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Manage course materials for RAG processing
          </Text>
        </Box>

        {/* Stats */}
        {stats && (
          <HStack gap={6}>
            <HStack gap={2}>
              <Text color="gray.400" fontSize="sm">
                Sources:
              </Text>
              <Text
                color="white"
                fontSize="sm"
                fontFamily="'JetBrains Mono', monospace"
              >
                {stats.totalSources}
              </Text>
            </HStack>
            <HStack gap={2}>
              <Text color="gray.400" fontSize="sm">
                Chunks:
              </Text>
              <Text
                color="white"
                fontSize="sm"
                fontFamily="'JetBrains Mono', monospace"
              >
                {stats.totalChunks}
              </Text>
            </HStack>
            {stats.byStatus.processed && (
              <Badge colorPalette="green" variant="subtle">
                {stats.byStatus.processed} processed
              </Badge>
            )}
            {stats.byStatus.error && (
              <Badge colorPalette="red" variant="subtle">
                {stats.byStatus.error} errors
              </Badge>
            )}
          </HStack>
        )}

        {/* Add source button / form */}
        {showAddForm && week ? (
          <AddSourceForm
            week={week}
            onClose={() => setShowAddForm(false)}
          />
        ) : (
          <Button
            bg="cyan.600"
            color="white"
            _hover={{ bg: "cyan.500" }}
            onClick={() => setShowAddForm(true)}
            alignSelf="flex-start"
          >
            <Box fontSize="16px" mr={2}>
              <LuPlus />
            </Box>
            Add Data Source
          </Button>
        )}

        {/* Source list */}
        {(sources?.length ?? 0) === 0 ? (
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
            <Card.Body py={12}>
              <Center>
                <VStack gap={4}>
                  <Text color="gray.400" fontSize="lg">
                    No data sources for this week yet
                  </Text>
                  <Text color="gray.500" fontSize="sm">
                    Add articles, papers, or text content to power RAG features
                  </Text>
                </VStack>
              </Center>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack gap={3} align="stretch">
            {(sources ?? []).map((source) => (
              <Card.Root
                key={source.id}
                bg="gray.900"
                borderColor="gray.800"
                borderWidth="1px"
              >
                <Card.Body p={4}>
                  <HStack justify="space-between" align="center">
                    <HStack gap={4} flex="1">
                      <Box
                        p={2}
                        bg="gray.800"
                        borderRadius="md"
                        color={
                          source.sourceType === "text"
                            ? "cyan.400"
                            : source.sourceType === "url"
                            ? "blue.400"
                            : "purple.400"
                        }
                        fontSize="18px"
                      >
                        {source.sourceType === "text" ? (
                          <LuFileText />
                        ) : source.sourceType === "url" ? (
                          <LuLink />
                        ) : (
                          <LuUpload />
                        )}
                      </Box>
                      <Box flex="1">
                        <Text color="white" fontWeight="medium" fontSize="sm">
                          {source.title}
                        </Text>
                        <HStack gap={3} mt={1}>
                          <StatusBadge status={source.status} />
                          {source.chunkCount > 0 && (
                            <Text color="gray.400" fontSize="xs">
                              {source.chunkCount} chunks
                            </Text>
                          )}
                          {source.url && (
                            <Text
                              color="gray.500"
                              fontSize="xs"
                              lineClamp={1}
                              maxW="300px"
                            >
                              {source.url}
                            </Text>
                          )}
                          {source.errorMessage && (
                            <Text color="red.400" fontSize="xs" lineClamp={1}>
                              {source.errorMessage}
                            </Text>
                          )}
                        </HStack>
                      </Box>
                    </HStack>
                    <Box
                      as="button"
                      p={1.5}
                      borderRadius="md"
                      color="gray.500"
                      transition="all 0.15s ease"
                      _hover={{ color: "red.400", bg: "gray.800" }}
                      onClick={() => setSourceToDelete(source)}
                    >
                      <Box fontSize="14px">
                        <LuTrash2 />
                      </Box>
                    </Box>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
