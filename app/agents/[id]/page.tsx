"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent, type VectorTable, type Task } from "@/lib/api";
import { Database, MessageSquare, Plus, ArrowLeft, Edit, Trash2, X } from "lucide-react";
import { ChatWindow } from "@/components/chat-window";
import { useConfirmDialog } from "@/components/confirm-dialog";
import ApiKeyGenerator from "@/components/api-key-generator";

export default function AgentDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { toast } = useToast();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [tables, setTables] = useState<VectorTable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    /**
     * Loads agent details, associated tables, and tasks in parallel.
     */
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const [agentData, tablesData, tasksData] = await Promise.all([
          api.getAgent(agentId),
          api.getAgentTables(agentId),
          api.getAgentTasks(agentId),
        ]);
        setAgent(agentData);
        setTables(tablesData);
        setTasks(tasksData);
      } catch (error) {
        toast({
          title: "Failed to load agent",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (agentId) loadData();
  }, [agentId, getToken]);

  /**
   * Deletes the agent after user confirmation via the confirm dialog.
   */
  const handleDelete = async () => {
    confirm({
      title: "Delete Agent",
      description: `Are you sure you want to delete "${agent?.name}"? This action cannot be undone and will also delete all associated tables and tasks.`,
      confirmText: "Delete Agent",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteAgent(agentId);
          toast({ title: "Agent deleted", variant: "success" });
          router.push("/agents");
        } catch (error) {
          toast({
            title: "Failed to delete agent",
            description: error instanceof Error ? error.message : "Something went wrong",
            variant: "error",
          });
        }
      },
    });
  };

  /**
   * Deletes a task by ID, refreshes the tasks list, and shows a toast.
   */
  const handleDeleteTask = (task: Task) => {
    confirm({
      title: "Delete Task",
      description: `Are you sure you want to delete the task "${task.task_name}"? This action cannot be undone.`,
      confirmText: "Delete Task",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteTask(task.id);
          const updatedTasks = await api.getAgentTasks(agentId);
          setTasks(updatedTasks);
          toast({ title: "Task deleted", variant: "success" });
        } catch (error) {
          toast({
            title: "Failed to delete task",
            description: error instanceof Error ? error.message : "Something went wrong",
            variant: "error",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Card className="rounded-xl">
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Agent not found</p>
            <Button variant="default" onClick={() => router.push("/agents")}>
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{agent.name}</h1>
            {agent.description && (
              <p className="text-sm text-slate-600 mt-1">{agent.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setShowChat(true)}>
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/agents/${agentId}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Knowledge Tables */}
      <Card className="rounded-xl mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Knowledge Tables</CardTitle>
              <Badge variant="secondary">{tables.length}</Badge>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => router.push(`/agents/${agentId}/tables/new`)}
            >
              <Plus className="h-4 w-4" />
              New Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No tables yet</p>
          ) : (
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/tables/${table.id}`)}
                >
                  <Database className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {table.display_name || table.name}
                    </p>
                    {table.description && (
                      <p className="text-sm text-slate-500 truncate">{table.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="rounded-xl mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => router.push(`/agents/${agentId}/tasks/new`)}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <p className="text-sm font-medium text-slate-900">{task.task_name}</p>
                    <p className="text-sm text-slate-500 truncate">{task.task_description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge variant={task.is_active ? "success" : "secondary"}>
                      {task.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/tasks/${task.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteTask(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API & Embed */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">API & Embed</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyGenerator agentId={agentId} />
        </CardContent>
      </Card>

      {/* Slide-over Chat Panel */}
      {showChat && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowChat(false)}
          />
          <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Chat with {agent.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow agentId={agentId} onClose={() => setShowChat(false)} />
            </div>
          </div>
        </>
      )}

      <ConfirmDialog />
    </div>
  );
}
