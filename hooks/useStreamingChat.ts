import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{ tool: string; input: any; output: string }>;
  isStreaming?: boolean;
  isThinking?: boolean;
}

interface UseStreamingChatReturn {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useStreamingChat(agentId: string): UseStreamingChatReturn {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    setIsStreaming(true);
    setError(null);

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    // Add placeholder for assistant message with thinking state
    const assistantMessageIndex = newMessages.length;
    const messagesWithPlaceholder = [
      ...newMessages,
      { role: 'assistant' as const, content: '', isThinking: true, isStreaming: false }
    ];
    setMessages(messagesWithPlaceholder);

    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);

      await api.streamChat(
        {
          agent_id: agentId,
          message: message,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        // onMessage callback
        (delta: string, fullContent: string) => {
          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: fullContent,
                isStreaming: true,
                isThinking: false, // Stop thinking when content starts
              };
            }
            return updated;
          });
        },
        // onComplete callback
        (finalMessage: string) => {
          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: finalMessage,
                isStreaming: false,
                isThinking: false,
              };
            }
            return updated;
          });
          setIsStreaming(false);
        },
        // onError callback
        (errorMessage: string) => {
          setError(errorMessage);
          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false,
                isThinking: false,
              };
            }
            return updated;
          });
          setIsStreaming(false);
        },
        token || undefined
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: 'Sorry, I encountered an error. Please try again.',
            isStreaming: false,
          };
        }
        return updated;
      });
      setIsStreaming(false);
    }
  }, [agentId, getToken, messages, isStreaming]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}