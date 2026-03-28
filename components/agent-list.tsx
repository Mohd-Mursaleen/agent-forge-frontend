"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, MessageSquare, ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export type Agents = {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
};

interface AgentListProps {
  /** Array of agents to display in the grid. */
  agents: Agents[];
  /** Whether the agent data is still loading. */
  loading?: boolean;
  /** Called when the user clicks the "Create Agent" CTA. */
  onCreate: () => void;
  /** Called with an agent id when the user clicks "Details". */
  onEdit: (id: string) => void;
  /** Called with an agent id when the user requests deletion. */
  onDelete: (id: string) => void;
}

/**
 * Renders a grid of agent cards with loading skeletons and an empty state.
 * No framer-motion -- relies on the design system for consistent styling.
 */
export function AgentList({ agents, loading, onCreate, onEdit, onDelete }: AgentListProps) {
  const router = useRouter();

  if (loading) {
    return (
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
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 mb-4">
          <Bot className="h-7 w-7 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No agents yet</h3>
        <p className="text-sm text-slate-500 mb-6">
          Create your first AI agent to get started.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Bot className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-900 truncate">
                  {agent.name}
                </p>
                {agent.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                    {agent.description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 mt-auto">
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
  );
}
