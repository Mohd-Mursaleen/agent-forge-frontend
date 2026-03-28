"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, type Agent } from "@/lib/api";
import { Bot, MessageSquare } from "lucide-react";
import { ChatWindow } from "@/components/chat-window";

function ChatPageContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
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

        const agentParam = searchParams.get("agent");
        if (agentParam && data.some((agent) => agent.id === agentParam)) {
          setSelectedAgentId(agentParam);
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [getToken, searchParams]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.0))]">
      {/* Left panel - agent list */}
      <div className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="px-4 py-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Conversations
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bot className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">No agents available</p>
            </div>
          ) : (
            <div className="px-2 space-y-0.5">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedAgentId === agent.id
                      ? "bg-primary-light text-primary"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      selectedAgentId === agent.id
                        ? "bg-primary/10"
                        : "bg-slate-100"
                    }`}
                  >
                    <Bot
                      className={`h-4.5 w-4.5 ${
                        selectedAgentId === agent.id
                          ? "text-primary"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {agent.name}
                    </p>
                    {agent.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - chat window or empty state */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedAgentId ? (
          <ChatWindow
            agentId={selectedAgentId}
            onClose={() => setSelectedAgentId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-surface-secondary">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Select an agent
              </h3>
              <p className="text-sm text-slate-400">
                Choose an agent from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-theme(spacing.0))]">
          <div className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
            <div className="px-4 py-5">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="px-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-surface-secondary">
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
