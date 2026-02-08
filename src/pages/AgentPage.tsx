import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Spinner,
  NativeSelect,
} from "@chakra-ui/react";
import {
  LuMessageSquare,
  LuPlus,
  LuSend,
  LuTrash2,
  LuSearch,
  LuBookOpen,
  LuChartBar,
  LuCircleHelp,
  LuList,
  LuFileText,
  LuBot,
  LuUser,
} from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import {
  agentKeys,
  useAgentConversations,
  useAgentConversation,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from "../hooks/useAgentChat";
import { useWeeks } from "../hooks/useWeeks";
import type { SSEEvent, ToolCallInfo } from "../services/agent-api";

// ============================================
// Tool Call Card
// ============================================

const TOOL_DISPLAY: Record<string, { label: string; icon: React.ReactNode; argKey: string }> = {
  search_course_materials: { label: "Searched course materials", icon: <LuSearch />, argKey: "query" },
  get_week_lessons: { label: "Looked up week lessons", icon: <LuList />, argKey: "week_slug" },
  get_vocabulary_terms: { label: "Fetched vocabulary", icon: <LuBookOpen />, argKey: "lesson_slug" },
  get_vocabulary_stats: { label: "Checked mastery stats", icon: <LuChartBar />, argKey: "lesson_slug" },
  generate_practice_question: { label: "Generated practice question", icon: <LuCircleHelp />, argKey: "week_slug" },
  get_lesson_content: { label: "Fetched lesson content", icon: <LuFileText />, argKey: "lesson_slug" },
};

function ToolCallCard({ tool }: { tool: ToolCallInfo }) {
  const display = TOOL_DISPLAY[tool.toolName];
  const label = display?.label ?? tool.toolName;
  const icon = display?.icon ?? <LuSearch />;
  const summary = display?.argKey
    ? (tool.arguments[display.argKey] as string) ?? null
    : null;

  return (
    <HStack gap={2} px={3} py={1.5}>
      <Box color="cyan.400/70" fontSize="11px" flexShrink={0}>
        {icon}
      </Box>
      <Text color="gray.500" fontSize="xs">
        {label}
        {summary && (
          <Text as="span" color="gray.400"> — "{summary}"</Text>
        )}
      </Text>
    </HStack>
  );
}

// ============================================
// Markdown Content
// ============================================

function MarkdownContent({ content }: { content: string }) {
  return (
    <Box
      css={{
        "& p": { margin: 0 },
        "& p + p": { marginTop: "0.5em" },
        "& strong": { color: "var(--chakra-colors-gray-100)", fontWeight: 600 },
        "& em": { fontStyle: "italic" },
        "& ul, & ol": { paddingLeft: "1.5em", margin: "0.4em 0" },
        "& li": { marginBottom: "0.2em" },
        "& li + li": { marginTop: "0.15em" },
        "& code": {
          background: "var(--chakra-colors-gray-700)",
          padding: "0.1em 0.35em",
          borderRadius: "4px",
          fontSize: "0.85em",
          fontFamily: "'JetBrains Mono', monospace",
        },
        "& pre": {
          background: "var(--chakra-colors-gray-700)",
          padding: "0.75em",
          borderRadius: "6px",
          overflow: "auto",
          margin: "0.5em 0",
        },
        "& pre code": {
          background: "none",
          padding: 0,
        },
        "& h1, & h2, & h3": {
          color: "var(--chakra-colors-gray-100)",
          fontWeight: 600,
          marginTop: "0.6em",
          marginBottom: "0.3em",
        },
        "& h2": { fontSize: "1.05em" },
        "& h3": { fontSize: "0.95em" },
        "& hr": {
          borderColor: "var(--chakra-colors-gray-700)",
          margin: "0.5em 0",
        },
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}

// ============================================
// Message Bubble
// ============================================

function MessageBubble({
  role,
  content,
  toolCalls,
}: {
  role: string;
  content: string | null;
  toolCalls?: ToolCallInfo[] | null;
}) {
  const isUser = role === "user";

  return (
    <Box
      alignSelf={isUser ? "flex-end" : "flex-start"}
      maxW="80%"
    >
      <HStack gap={2} align="start" flexDirection={isUser ? "row-reverse" : "row"}>
        <Box
          w={7}
          h={7}
          borderRadius="full"
          bg={isUser ? "blue.600/20" : "cyan.600/20"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={isUser ? "blue.400" : "cyan.400"}
          fontSize="14px"
          flexShrink={0}
          mt={0.5}
        >
          {isUser ? <LuUser /> : <LuBot />}
        </Box>
        <VStack gap={2} align="stretch">
          {toolCalls && toolCalls.length > 0 && (
            <VStack gap={1} align="stretch">
              {toolCalls.map((tool, i) => (
                <ToolCallCard key={i} tool={tool} />
              ))}
            </VStack>
          )}
          {content && (
            <Box
              bg={isUser ? "blue.600/15" : "gray.800"}
              borderWidth="1px"
              borderColor={isUser ? "blue.700/30" : "gray.700"}
              borderRadius="lg"
              px={4}
              py={3}
              color="gray.200"
              fontSize="sm"
              lineHeight="1.6"
            >
              {isUser ? (
                <Text whiteSpace="pre-wrap">{content}</Text>
              ) : (
                <MarkdownContent content={content} />
              )}
            </Box>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

// ============================================
// Streaming Message
// ============================================

function StreamingMessage({
  content,
  toolCalls,
}: {
  content: string;
  toolCalls: ToolCallInfo[];
}) {
  return (
    <Box alignSelf="flex-start" maxW="80%">
      <HStack gap={2} align="start">
        <Box
          w={7}
          h={7}
          borderRadius="full"
          bg="cyan.600/20"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="cyan.400"
          fontSize="14px"
          flexShrink={0}
          mt={0.5}
        >
          <LuBot />
        </Box>
        <VStack gap={2} align="stretch">
          {toolCalls.length > 0 && (
            <VStack gap={1} align="stretch">
              {toolCalls.map((tool, i) => (
                <ToolCallCard key={i} tool={tool} />
              ))}
            </VStack>
          )}
          {content ? (
            <Box
              bg="gray.800"
              borderWidth="1px"
              borderColor="gray.700"
              borderRadius="lg"
              px={4}
              py={3}
              color="gray.200"
              fontSize="sm"
              lineHeight="1.6"
            >
              <MarkdownContent content={content} />
              <Box
                as="span"
                display="inline-block"
                w="2px"
                h="14px"
                bg="cyan.400"
                ml={0.5}
                animation="blink 1s step-end infinite"
                css={{ "@keyframes blink": { "50%": { opacity: 0 } } }}
              />
            </Box>
          ) : (
            <HStack gap={2} px={4} py={3}>
              <Spinner size="xs" color="cyan.400" />
              <Text color="gray.500" fontSize="sm">
                Thinking...
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

// ============================================
// Conversation Sidebar
// ============================================

function ConversationList({
  onSelect,
  onNew,
  selectedId,
}: {
  onSelect: (id: string) => void;
  onNew: () => void;
  selectedId: string | null;
}) {
  const { data: conversations, isLoading } = useAgentConversations();
  const deleteMutation = useDeleteConversation();

  return (
    <VStack gap={2} align="stretch" h="full">
      <Button
        bg="cyan.600"
        color="white"
        _hover={{ bg: "cyan.500" }}
        size="sm"
        onClick={onNew}
      >
        <Box fontSize="14px" mr={1}>
          <LuPlus />
        </Box>
        New Chat
      </Button>

      {isLoading ? (
        <Center h="100px">
          <Spinner size="sm" color="cyan.400" />
        </Center>
      ) : (
        <VStack gap={1} align="stretch" overflow="auto" flex="1">
          {(conversations ?? []).map((conv) => (
            <Box
              key={conv.id}
              px={3}
              py={2}
              borderRadius="md"
              bg={selectedId === conv.id ? "gray.800" : "transparent"}
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{ bg: "gray.800" }}
              onClick={() => onSelect(conv.id)}
            >
              <HStack justify="space-between">
                <HStack gap={2} flex="1" minW={0}>
                  <Box color="gray.500" fontSize="12px" flexShrink={0}>
                    <LuMessageSquare />
                  </Box>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    lineClamp={1}
                  >
                    {conv.title || "New conversation"}
                  </Text>
                </HStack>
                <Box
                  as="button"
                  p={1}
                  borderRadius="sm"
                  color="gray.700"
                  _hover={{ color: "red.400" }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    deleteMutation.mutate(conv.id);
                  }}
                  flexShrink={0}
                >
                  <Box fontSize="10px">
                    <LuTrash2 />
                  </Box>
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// Needed because Center is used above
function Center({ children, ...props }: { children: React.ReactNode; h?: string }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" {...props}>
      {children}
    </Box>
  );
}

// ============================================
// Chat View
// ============================================

function ChatView({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const { data: conversation } = useAgentConversation(conversationId);
  const sendMutation = useSendMessage();
  const { data: weeks } = useWeeks();

  const [input, setInput] = useState("");
  const [weekSlug, setWeekSlug] = useState(() => {
    // Will be overridden by useEffect when conversation loads
    return "";
  });
  const [weekSlugInitialized, setWeekSlugInitialized] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamToolCalls, setStreamToolCalls] = useState<ToolCallInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select week dropdown when conversation has a weekId
  useEffect(() => {
    if (weekSlugInitialized) return;
    if (!conversation?.weekId || !weeks) return;
    const match = weeks.find((w) => w.id === conversation.weekId);
    if (match) {
      setWeekSlug(match.slug);
      setWeekSlugInitialized(true);
    }
  }, [conversation?.weekId, weeks, weekSlugInitialized]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamContent, pendingUserMessage, scrollToBottom]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;

    setInput("");
    setPendingUserMessage(msg);
    setStreamContent("");
    setStreamToolCalls([]);
    setIsStreaming(true);

    try {
      const stream = await sendMutation.mutateAsync({
        conversationId,
        message: msg,
        weekSlug: weekSlug || undefined,
      });

      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const event = value as SSEEvent;

        if (event.type === "content" && event.token) {
          setStreamContent((prev) => prev + event.token);
        } else if (event.type === "tool_call") {
          setStreamToolCalls((prev) => [
            ...prev,
            {
              toolName: event.tool_name || "",
              arguments: event.arguments || {},
              result: null,
            },
          ]);
        } else if (event.type === "tool_result") {
          setStreamToolCalls((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].toolName === event.tool_name) {
                updated[i] = { ...updated[i], result: event.result || null };
                break;
              }
            }
            return updated;
          });
        } else if (event.type === "done") {
          // Stream complete
        } else if (event.type === "error") {
          setStreamContent(
            (prev) => prev + `\n\nError: ${event.message || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      setStreamContent(
        `Error: ${error instanceof Error ? error.message : "Failed to send message"}`
      );
    } finally {
      // Refetch conversation to get the saved messages BEFORE hiding streaming UI
      await queryClient.refetchQueries({
        queryKey: agentKeys.conversation(conversationId),
      });
      await queryClient.invalidateQueries({
        queryKey: agentKeys.conversations(),
      });
      setPendingUserMessage(null);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const messages = conversation?.messages ?? [];

  return (
    <VStack gap={0} h="full" align="stretch">
      {/* Header */}
      <Box
        px={6}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.800"
        bg="gray.900"
      >
        <HStack justify="space-between">
          <HStack gap={2}>
            <Box color="cyan.400" fontSize="16px">
              <LuBot />
            </Box>
            <Text color="white" fontSize="sm" fontWeight="medium">
              {weekSlug
                ? weeks?.find((w) => w.slug === weekSlug)?.title ?? "AI Study Assistant"
                : "AI Study Assistant"}
            </Text>
          </HStack>
          <HStack gap={2}>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={weekSlug}
                onChange={(e) => setWeekSlug(e.target.value)}
                bg="gray.800"
                borderColor="gray.700"
                color="gray.400"
                fontSize="xs"
                _focusVisible={{
                  outline: "none",
                  boxShadow: "none",
                  borderColor: "cyan.500",
                }}
                w="180px"
              >
                <option value="">All weeks</option>
                {(weeks ?? []).map((w) => (
                  <option key={w.slug} value={w.slug}>
                    Week {w.weekNumber}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </HStack>
        </HStack>
      </Box>

      {/* Messages */}
      <Box flex="1" overflow="auto" px={6} py={4}>
        <VStack gap={4} align="stretch">
          {messages.length === 0 && !isStreaming && (
            <Box py={12} textAlign="center">
              <Box
                w={12}
                h={12}
                borderRadius="full"
                bg="cyan.600/10"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="cyan.400"
                fontSize="24px"
                mx="auto"
                mb={4}
              >
                <LuBot />
              </Box>
              <Heading size="md" color="white" mb={2}>
                AI Study Assistant
              </Heading>
              <Text color="gray.500" fontSize="sm" maxW="400px" mx="auto">
                Ask me about course materials, vocabulary, or request practice
                questions. I can search the knowledge base and help you study.
              </Text>
            </Box>
          )}

          {messages
            .filter((m) => m.role !== "system")
            .map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                toolCalls={msg.toolCalls}
              />
            ))}

          {pendingUserMessage && (
            <MessageBubble role="user" content={pendingUserMessage} />
          )}

          {isStreaming && (
            <StreamingMessage
              content={streamContent}
              toolCalls={streamToolCalls}
            />
          )}

          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input */}
      <Box px={6} py={4} borderTop="1px solid" borderColor="gray.800">
        <HStack gap={2}>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about course materials..."
            bg="gray.800"
            borderColor="gray.700"
            color="white"
            _placeholder={{ color: "gray.500" }}
            _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
            _focusVisible={{ outline: "none", boxShadow: "none" }}
            disabled={isStreaming}
          />
          <Button
            bg="cyan.600"
            color="white"
            _hover={{ bg: "cyan.500" }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            loading={isStreaming}
            px={4}
          >
            <LuSend />
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
}

// ============================================
// Main Page
// ============================================

export function AgentPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const createMutation = useCreateConversation();

  const handleNewChat = async () => {
    const conv = await createMutation.mutateAsync({});
    navigate(`/agent/${conv.id}`);
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/agent/${id}`);
  };

  return (
    <Box h="calc(100vh - 64px)" overflow="hidden" display="flex">
      <HStack gap={0} h="full" align="stretch" flex="1">
        {/* Sidebar */}
        <Box
          w="260px"
          borderRight="1px solid"
          borderColor="gray.800"
          bg="gray.900"
          p={4}
          flexShrink={0}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <ConversationList
            onSelect={handleSelectConversation}
            onNew={handleNewChat}
            selectedId={conversationId ?? null}
          />
        </Box>

        {/* Main chat area */}
        <Box flex="1" bg="gray.950">
          {conversationId ? (
            <ChatView conversationId={conversationId} />
          ) : (
            <Box
              h="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <VStack gap={4}>
                <Box
                  w={16}
                  h={16}
                  borderRadius="full"
                  bg="cyan.600/10"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="cyan.400"
                  fontSize="32px"
                >
                  <LuBot />
                </Box>
                <Heading size="lg" color="white">
                  AI Study Assistant
                </Heading>
                <Text color="gray.500" textAlign="center" maxW="400px">
                  Start a new conversation to ask questions about AI engineering
                  concepts, review vocabulary, or generate practice questions.
                </Text>
                <Button
                  bg="cyan.600"
                  color="white"
                  _hover={{ bg: "cyan.500" }}
                  onClick={handleNewChat}
                  loading={createMutation.isPending}
                >
                  <Box fontSize="16px" mr={2}>
                    <LuPlus />
                  </Box>
                  Start New Chat
                </Button>
              </VStack>
            </Box>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
