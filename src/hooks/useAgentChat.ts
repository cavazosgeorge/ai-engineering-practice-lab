import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as agentApi from "../services/agent-api";

export const agentKeys = {
  all: ["agent"] as const,
  conversations: () => [...agentKeys.all, "conversations"] as const,
  conversation: (id: string) => [...agentKeys.all, "conversation", id] as const,
};

export function useAgentConversations() {
  return useQuery({
    queryKey: agentKeys.conversations(),
    queryFn: agentApi.fetchConversations,
    staleTime: 10_000,
  });
}

export function useAgentConversation(id: string | undefined) {
  return useQuery({
    queryKey: agentKeys.conversation(id || ""),
    queryFn: () => agentApi.fetchConversation(id!),
    enabled: !!id,
    staleTime: 5_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentApi.deleteConversation,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      message,
      weekSlug,
    }: {
      conversationId: string;
      message: string;
      weekSlug?: string;
    }) => agentApi.sendMessage(conversationId, message, weekSlug),
    onSuccess: (_, { conversationId }) => {
      // Invalidate conversation to refresh messages after stream completes
      queryClient.invalidateQueries({
        queryKey: agentKeys.conversation(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations() });
    },
  });
}
