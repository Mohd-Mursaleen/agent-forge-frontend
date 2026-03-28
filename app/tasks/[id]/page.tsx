"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { createApiClient, type Task, type Agent, type VectorTable } from "@/lib/api";
import { ArrowLeft, Edit, Trash2, Settings, Database, Bot } from "lucide-react";

export default function TaskDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [table, setTable] = useState<VectorTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Loads task data along with related agent and table info.
     */
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const taskData = await api.getTask(taskId);
        setTask(taskData);

        const [agentData, tableData] = await Promise.all([
          api.getAgent(taskData.agent_id),
          taskData.table_reference?.table_id ? api.getTable(taskData.table_reference.table_id) : null,
        ]);

        setAgent(agentData);
        if (tableData) setTable(tableData);
      } catch (error) {
        toast({
          title: "Failed to load task",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (taskId) loadData();
  }, [taskId, getToken]);

  /** Deletes the task after user confirmation. */
  const handleDelete = () => {
    confirm({
      title: "Delete Task",
      description: `Are you sure you want to delete "${task?.task_name}"? This action cannot be undone.`,
      confirmText: "Delete Task",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteTask(taskId);
          toast({ title: "Task deleted", variant: "success" });
          router.push(`/agents/${task?.agent_id}`);
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

  /** Toggles the task active/inactive status. */
  const toggleTaskStatus = async () => {
    if (!task) return;

    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const updatedTask = await api.updateTask(taskId, { is_active: !task.is_active });
      setTask(updatedTask);
      toast({
        title: updatedTask.is_active ? "Task activated" : "Task deactivated",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to update task status",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Task not found</p>
            <Button variant="default" onClick={() => router.push("/agents")}>
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
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
            <h1 className="text-2xl font-semibold text-slate-900">{task.task_name}</h1>
            <p className="text-sm text-slate-600 mt-1">{task.task_description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTaskStatus}
            >
              {task.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/tasks/${taskId}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Task Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant={task.is_active ? "success" : "secondary"}>
                  {task.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-slate-600">
                  {task.is_active ? "This task is available to the agent" : "This task is disabled"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tool Configuration */}
          {task.tools && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Generated Tool Configuration</CardTitle>
                <CardDescription>
                  AI-generated tool definition for this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-1.5">Operation Type</h4>
                    <Badge variant="secondary">{task.tools.operation_type}</Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-1.5">Description</h4>
                    <p className="text-sm text-slate-700">{task.tools.description}</p>
                  </div>

                  {task.tools.parameters && task.tools.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {task.tools.parameters.map((param: any, index: number) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium">{param.name}</span>
                              <Badge variant="secondary">{param.type}</Badge>
                            </div>
                            <p className="text-sm text-slate-600">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Agent */}
          {agent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => router.push(`/agents/${agent.id}`)}
                >
                  <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                  {agent.description && (
                    <p className="text-sm text-slate-600 mt-1">{agent.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Table */}
          {table && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => router.push(`/tables/${table.id}`)}
                >
                  <p className="text-sm font-medium text-slate-900">{table.display_name || table.name}</p>
                  {table.description && (
                    <p className="text-sm text-slate-600 mt-1">{table.description}</p>
                  )}
                  <span className="text-xs text-slate-500 mt-2 inline-block">
                    {table.columns.length} columns
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created</p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Task ID</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{task.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
}
