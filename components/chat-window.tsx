"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type ChatResponse } from "@/lib/api";
import { Send, X, Bot, ChevronDown, ChevronRight, Wrench } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  tool_calls?: Array<{ tool: string; input: any; output: string }>;
}

interface ChatWindowProps {
  agentId: string;
  onClose: () => void;
}

/**
 * Chat interface for conversing with an AI agent.
 * Handles message history, API communication, and tool call display.
 */
export function ChatWindow({ agentId, onClose }: ChatWindowProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  /**
   * Toggles the expanded state of a tool call detail section.
   * @param key - Unique identifier for the tool call (messageIdx-toolIdx)
   */
  const toggleTool = (key: string) => {
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Sends the current input message to the agent API and appends the response.
   * Clears input on send, shows toast on error.
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const response: ChatResponse = await api.chat({
        agent_id: agentId,
        message: userMessage,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.message,
          tool_calls: response.tool_calls,
        },
      ]);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
      // Remove the user message that failed to get a response
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-slate-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Agent Chat
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4 text-slate-400" />
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Start a conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div key={idx}>
                {/* Message bubble */}
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-2xl rounded-br-md"
                        : "bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {/* Tool calls - collapsible card below assistant message */}
                {message.role === "assistant" &&
                  message.tool_calls &&
                  message.tool_calls.length > 0 && (
                    <div className="mt-2 ml-0 max-w-[75%] space-y-1.5">
                      {message.tool_calls.map((toolCall, tIdx) => {
                        const key = `${idx}-${tIdx}`;
                        const isExpanded = expandedTools[key] ?? false;

                        return (
                          <div
                            key={tIdx}
                            className="border border-border rounded-lg bg-surface overflow-hidden"
                          >
                            <button
                              onClick={() => toggleTool(key)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )}
                              <Wrench className="h-3 w-3 text-slate-400 shrink-0" />
                              <Badge variant="secondary" className="text-[11px]">
                                Used tool: {toolCall.tool}
                              </Badge>
                            </button>

                            {isExpanded && (
                              <div className="px-3 pb-3 border-t border-border">
                                {toolCall.input && (
                                  <div className="mt-2">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                                      Input
                                    </p>
                                    <pre className="text-xs text-slate-700 bg-slate-50 rounded-md p-2 overflow-x-auto">
                                      {typeof toolCall.input === "string"
                                        ? toolCall.input
                                        : JSON.stringify(toolCall.input, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {toolCall.output && (
                                  <div className="mt-2">
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                                      Output
                                    </p>
                                    <pre className="text-xs text-slate-700 bg-slate-50 rounded-md p-2 overflow-x-auto max-h-40 overflow-y-auto">
                                      {toolCall.output}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            ))}

            {/* Loading indicator - three animated dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-slate-400"
                      style={{
                        animation: "chat-dot-bounce 1.4s ease-in-out infinite",
                        animationDelay: "0s",
                      }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-slate-400"
                      style={{
                        animation: "chat-dot-bounce 1.4s ease-in-out infinite",
                        animationDelay: "0.2s",
                      }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-slate-400"
                      style={{
                        animation: "chat-dot-bounce 1.4s ease-in-out infinite",
                        animationDelay: "0.4s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

    </div>
  );
}
