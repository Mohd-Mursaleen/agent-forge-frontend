"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent } from "@/lib/api";
import { Bot, Plus, MessageSquare, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Dashboard overview page.
 * Shows agent count, a quick-create CTA, and the full agent grid.
 */
export default function DashboardPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
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
        toast({
          title: "Failed to load agents",
          description: "Please try refreshing the page.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, [getToken]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">Manage your AI agents</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Bot className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Agents</p>
                {loading ? (
                  <Skeleton className="h-7 w-10 mt-0.5" />
                ) : (
                  <p className="text-2xl font-semibold text-slate-900">
                    {agents.length}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Plus className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quick Actions</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">
                    Create a new agent
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => router.push("/agents/new")}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Agent grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 mb-4">
            <Bot className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No agents yet
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Create your first AI agent to get started.
          </p>
          <Button onClick={() => router.push("/agents/new")}>
            <Plus className="h-4 w-4" />
            Create Your First Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Bot className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{agent.name}</CardTitle>
                    {agent.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-0">
                {agent.system_prompt && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {agent.system_prompt}
                  </p>
                )}
              </CardContent>

              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => router.push(`/chat?agent=${agent.id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/agents/${agent.id}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
