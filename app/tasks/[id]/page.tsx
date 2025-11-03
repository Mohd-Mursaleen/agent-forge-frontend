"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createApiClient, type Task, type Agent, type VectorTable } from "@/lib/api";
import { ArrowLeft, Edit, Trash2, Settings, Database, Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function TaskDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [table, setTable] = useState<VectorTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const taskData = await api.getTask(taskId);
        setTask(taskData);

        // Load related agent and table
        const [agentData, tableData] = await Promise.all([
          api.getAgent(taskData.agent_id),
          taskData.table_reference?.table_id ? api.getTable(taskData.table_reference.table_id) : null,
        ]);
        
        setAgent(agentData);
        if (tableData) setTable(tableData);
      } catch (error) {
        console.error("Failed to load task data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) loadData();
  }, [taskId, getToken]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.deleteTask(taskId);
      router.push(`/agents/${task?.agent_id}`);
    } catch (error) {
      console.error("Failed to delete task:", error);
      // Could be replaced with toast notification
    }
  };

  const toggleTaskStatus = async () => {
    if (!task) return;
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const updatedTask = await api.updateTask(taskId, { is_active: !task.is_active });
      setTask(updatedTask);
    } catch (error) {
      console.error("Failed to update task status:", error);
      // Could be replaced with toast notification
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Task not found</p>
            <Button
              onClick={() => router.push("/agents")}
              className="mt-4 bg-slate-800 text-white hover:bg-slate-900"
            >
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{task.task_name}</h1>
              <p className="text-slate-600">{task.task_description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleTaskStatus}
                className={task.is_active ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50"}
              >
                {task.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/tasks/${taskId}/edit`)}
                className="border-slate-300 text-slate-900 hover:bg-slate-100"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
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
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Task Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant={task.is_active ? "default" : "secondary"}>
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
                  <CardTitle>Generated Tool Configuration</CardTitle>
                  <CardDescription>
                    AI-generated tool definition for this task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Operation Type</h4>
                      <Badge variant="outline">{task.tools.operation_type}</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                      <p className="text-slate-700">{task.tools.description}</p>
                    </div>

                    {task.tools.parameters && task.tools.parameters.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">Parameters</h4>
                        <div className="space-y-3">
                          {task.tools.parameters.map((param: any, index: number) => (
                            <div key={index} className="p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-medium">{param.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {param.type}
                                </Badge>
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
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => router.push(`/agents/${agent.id}`)}
                  >
                    <p className="font-medium text-slate-900">{agent.name}</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => router.push(`/tables/${table.id}`)}
                  >
                    <p className="font-medium text-slate-900">{table.display_name || table.name}</p>
                    {table.description && (
                      <p className="text-sm text-slate-600 mt-1">{table.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        {table.columns.length} columns
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Created</p>
                  <p className="text-sm text-slate-600">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Last Updated</p>
                  <p className="text-sm text-slate-600">
                    {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Task ID</p>
                  <p className="text-xs text-slate-500 font-mono">{task.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}