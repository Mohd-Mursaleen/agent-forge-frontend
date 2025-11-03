"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiClient, type ChatResponse } from "@/lib/api";
import { Send, X, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  tool_calls?: Array<{ tool: string; input: any; output: string }>;
}

interface ChatWindowProps {
  agentId: string;
  onClose: () => void;
}

export function ChatWindow({ agentId, onClose }: ChatWindowProps) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
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
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 28, scale: 0.96 }}
      className="fixed top-12 right-12 max-w-lg w-full rounded-3xl glass shadow-2xl border-0 z-50 flex flex-col"
      style={{ height: "70vh", minWidth: 370 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-white/40">
        <div className="flex items-center gap-2">
          <Bot className="text-emerald-500 w-6 h-6" />
          <span className="text-2xl font-bold text-gray-900">Agent Chat</span>
        </div>
        <Button variant="ghost" className="rounded-full! p-2" onClick={onClose}>
          <X className="text-gray-500 w-6 h-6" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-5 overflow-y-auto space-y-3" style={{ background: "transparent" }}>
        {messages.length === 0 ? (
          <div className="mt-2 text-base text-gray-400 text-center">Start a conversation with your agent</div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              <div
                className={`flex items-end gap-2 max-w-lg ${
                  message.role === "assistant" ? "" : "flex-row-reverse"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-6 h-6 rounded-full bg-emerald-50 p-1 shadow" />
                ) : (
                  <User className="w-6 h-6 rounded-full bg-indigo-200 p-1 shadow" />
                )}
                <div
                  className={`p-3 rounded-2xl shadow-md text-base leading-relaxed whitespace-pre-line
                  ${
                    message.role === "assistant"
                      ? "bg-white/70 text-gray-800 glass"
                      : "bg-linear-to-tr from-emerald-400 to-indigo-400 text-white font-medium"
                  }`}
                  style={{
                    borderBottomRightRadius: message.role === "user" ? 6 : 24,
                    borderBottomLeftRadius: message.role === "assistant" ? 6 : 24,
                  }}
                >
                  {message.content}
                  {message.tool_calls &&
                    message.tool_calls.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {message.tool_calls.map((toolCall, tIdx) => (
                          <div key={tIdx} className="mb-1">
                            <span className="font-semibold">{toolCall.tool}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex w-full justify-start">
            <div className="p-3 rounded-2xl glass bg-white/60 text-gray-400 shadow text-base animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-3 bg-white/40 glass px-5 py-4 border-t border-white/30"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 rounded-xl! p-3! bg-white/70! border-0! text-base shadow"
        />
        <Button
          type="submit"
          className="rounded-xl! px-4 py-3 ml-1 bg-linear-to-tr from-emerald-400 to-indigo-400 text-white shadow-md text-base flex items-center gap-1 disabled:opacity-70"
          disabled={loading || !input.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </motion.div>
    </div>
  );
}
