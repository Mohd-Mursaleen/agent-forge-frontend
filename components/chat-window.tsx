"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="w-full h-full bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-slate-600" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Agent Chat</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 bg-slate-50 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Start a conversation with your agent</p>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[80%] ${
                  message.role === "assistant" ? "" : "flex-row-reverse"
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  {message.role === "assistant" ? (
                    <Bot className="w-5 h-5 text-slate-600" />
                  ) : (
                    <User className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-line ${
                    message.role === "assistant"
                      ? "bg-white text-slate-800 border border-slate-200"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  
                    {message.content}
                     
                  {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                      {message.tool_calls.map((toolCall, tIdx) => (
                        <div key={tIdx} className="mb-1">
                          <span className="font-medium">Used tool: {toolCall.tool}</span>
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
            <div className="flex items-start gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-slate-600" />
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  Thinking...
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-3 p-4 border-t border-slate-200 bg-white rounded-b-xl"
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
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !input.trim()}
          className="bg-slate-800 hover:bg-slate-900"
        >
         
            <Send className="w-4 h-4" />
        </Button>
      </form>
    </motion.div>
  );
}
