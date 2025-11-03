"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AgentList, Agents } from "@/components/agent-list";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/confirm-dialog";

import { createApiClient, type Agent } from "@/lib/api";

import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
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
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, [getToken]);

  const handleDelete = async (id: string) => {
    const agent = agents.find(a => a.id === id);
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
          setAgents(agents.filter(a => a.id !== id));
        } catch (error) {
          console.error("Failed to delete agent:", error);
          // Could be replaced with toast notification
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Agents</h1>
          <p className="text-lg text-slate-600">Manage your AI agents</p>
        </div>
        <Button
          onClick={() => router.push("/agents/new")}
          className="bg-slate-800 text-white hover:bg-slate-900 transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>
      <AgentList
        agents={agents}
        loading={loading}
        onCreate={() => router.push("/agents/new")}
        onEdit={id => router.push(`/agents/${id}/edit`)}
        onDelete={handleDelete}
      />
      <ConfirmDialog />
    </div>
  );
}
