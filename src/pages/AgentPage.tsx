import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
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
  LuWrench,
  LuBot,
  LuUser,
} from "react-icons/lu";
import {
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

function ToolCallCard({ tool }: { tool: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      bg="gray.800"
      borderWidth="1px"
      borderColor="cyan.800/50"
      borderRadius="md"
      px={3}
      py={2}
      cursor="pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <HStack gap={2}>
        <Box color="cyan.400" fontSize="12px">
          <LuWrench />
        </Box>
        <Text color="cyan.300" fontSize="xs" fontFamily="'JetBrains Mono', monospace">
          {tool.toolName}
        </Text>
        <Text color="gray.600" fontSize="xs">
          {expanded ? "collapse" : "expand"}
        </Text>
      </HStack>
      {expanded && (
        <Box mt={2}>
          <Text color="gray.500" fontSize="xs" mb={1}>
            Arguments:
          </Text>
          <Text
            color="gray.400"
            fontSize="xs"
            fontFamily="'JetBrains Mono', monospace"
            whiteSpace="pre-wrap"
          >
            {JSON.stringify(tool.arguments, null, 2)}
          </Text>
          {tool.result && (
            <>
              <Text color="gray.500" fontSize="xs" mt={2} mb={1}>
                Result:
              </Text>
              <Text
                color="gray.400"
                fontSize="xs"
                whiteSpace="pre-wrap"
                maxH="200px"
                overflow="auto"
              >
                {tool.result}
              </Text>
            </>
          )}
        </Box>
      )}
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
            >
              <Text
                color="gray.200"
                fontSize="sm"
                whiteSpace="pre-wrap"
                lineHeight="1.6"
              >
                {content}
              </Text>
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
            >
              <Text
                color="gray.200"
                fontSize="sm"
                whiteSpace="pre-wrap"
                lineHeight="1.6"
              >
                {content}
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
              </Text>
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
  const { data: conversation } = useAgentConversation(conversationId);
  const sendMutation = useSendMessage();
  const { data: weeks } = useWeeks();

  const [input, setInput] = useState("");
  const [weekSlug, setWeekSlug] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [streamToolCalls, setStreamToolCalls] = useState<ToolCallInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamContent, scrollToBottom]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;

    setInput("");
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
      setIsStreaming(false);
      // Refetch conversation to get the saved messages
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
              {conversation?.title || "AI Study Assistant"}
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
    <Container maxW="container.xl" py={0} px={0} h="calc(100vh - 64px)">
      <HStack gap={0} h="full" align="stretch">
        {/* Sidebar */}
        <Box
          w="260px"
          borderRight="1px solid"
          borderColor="gray.800"
          bg="gray.900"
          p={4}
          flexShrink={0}
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
    </Container>
  );
}
