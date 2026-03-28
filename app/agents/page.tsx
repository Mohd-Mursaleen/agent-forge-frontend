"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AgentList, Agents } from "@/components/agent-list";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent } from "@/lib/api";
import { useRouter } from "next/navigation";

/**
 * Agents listing page.
 * Displays all agents in a grid with create, edit, and delete flows.
 */
export default function AgentsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, ConfirmDialog } = useConfirmDialog();

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

  /**
   * Prompts confirmation then deletes the agent and removes it from state.
   * @param id - The agent id to delete.
   */
  const handleDelete = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    confirm({
      title: "Delete Agent",
      description: `Are you sure you want to delete "${agent?.name}"? This action cannot be undone and will also delete all associated tables and tasks.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteAgent(id);
          setAgents(agents.filter((a) => a.id !== id));
          toast({
            title: "Agent deleted",
            description: `"${agent?.name}" has been removed.`,
            variant: "success",
          });
        } catch (error) {
          console.error("Failed to delete agent:", error);
          toast({
            title: "Failed to delete agent",
            description: "Something went wrong. Please try again.",
            variant: "error",
          });
        }
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500">
            Create and manage your AI agents
          </p>
        </div>
        <Button onClick={() => router.push("/agents/new")}>
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <AgentList
        agents={agents}
        loading={loading}
        onCreate={() => router.push("/agents/new")}
        onEdit={(id) => router.push(`/agents/${id}/edit`)}
        onDelete={handleDelete}
      />

      <ConfirmDialog />
    </div>
  );
}
