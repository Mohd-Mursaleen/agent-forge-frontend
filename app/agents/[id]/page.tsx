"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type Agent, type VectorTable, type Task } from "@/lib/api";
import { Bot, Database, MessageSquare, Plus, Settings, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChatWindow } from "@/components/chat-window";

export default function AgentDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tables, setTables] = useState<VectorTable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
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
        console.error("Failed to load agent data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      loadData();
    }
  }, [agentId, getToken]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.deleteAgent(agentId);
      router.push("/agents");
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
      </LayoutWrapper>
    );
  }

  if (!agent) {
    return (
      <LayoutWrapper>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Agent not found</p>
            <Button onClick={() => router.push("/agents")} className="mt-4">
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showChat ? "w-1/2" : "w-full"}`}>
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{agent.name}</h1>
                  {agent.description && (
                    <p className="text-gray-600">{agent.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/agents/${agentId}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{agent.system_prompt}</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Button
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-6 w-6" />
                <span>{showChat ? "Hide Chat" : "Chat with Agent"}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push(`/agents/${agentId}/tables/new`)}
              >
                <Database className="h-6 w-6" />
                <span>Add Table</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push(`/agents/${agentId}/tasks/new`)}
              >
                <Plus className="h-6 w-6" />
                <span>Add Task</span>
              </Button>
            </div>

            {/* Vector Tables */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vector Tables</CardTitle>
                    <CardDescription>Data tables for this agent</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/agents/${agentId}/tables/new`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Table
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tables.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tables yet</p>
                ) : (
                  <div className="space-y-3">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/tables/${table.id}`)}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{table.display_name || table.name}</p>
                          {table.description && (
                            <p className="text-sm text-gray-600">{table.description}</p>
                          )}
                        </div>
                        <Database className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>AI-generated tools for this agent</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/agents/${agentId}/tasks/new`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.task_name}</p>
                            <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                            {task.tools && (
                              <div className="mt-2 text-xs text-gray-500">
                                {task.tools.parameters?.length || 0} parameters
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              task.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chat Window */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-1/2"
          >
            <ChatWindow agentId={agentId} onClose={() => setShowChat(false)} />
          </motion.div>
        )}
      </div>
    </LayoutWrapper>
  );
}

