"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type Agent } from "@/lib/api";
import { Bot, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { ChatWindow } from "@/components/chat-window";

export default function ChatPage() {
  const { getToken } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const data = await api.getAgents();
        setAgents(data);
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [getToken]);

  if (loading) {
    return (
      <LayoutWrapper>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Agent List */}
        <div className="w-80">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Chat</h1>
            <Card>
              <CardContent className="p-0">
                {agents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No agents available</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedAgentId === agent.id ? "bg-emerald-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                            <Bot className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                            {agent.description && (
                              <p className="text-sm text-gray-600 truncate">{agent.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedAgentId ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ChatWindow agentId={selectedAgentId} onClose={() => setSelectedAgentId(null)} />
            </motion.div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Agent</h3>
                <p className="text-gray-600">Choose an agent from the list to start chatting</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}

