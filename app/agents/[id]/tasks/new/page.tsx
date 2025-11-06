"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createApiClient, type Agent, type VectorTable } from "@/lib/api";
import { ArrowLeft, Save, Database, Sparkles, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function NewTaskPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.id as string;
  
  // Check if we're in a flow
  const isFlow = searchParams.get('flow') === 'true';
  const returnTo = searchParams.get('returnTo');
  const step = searchParams.get('step');
  const agentParam = searchParams.get('agent');
  const tableCreated = searchParams.get('tableCreated');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [tables, setTables] = useState<VectorTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [taskData, setTaskData] = useState({
    task_name: "",
    task_description: "",
    table_id: "",
  });
  
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
  const [showEnhancedDescription, setShowEnhancedDescription] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const [agentData, tablesData] = await Promise.all([
          api.getAgent(agentId),
          api.getAgentTables(agentId),
        ]);
        setAgent(agentData);
        setTables(tablesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) loadData();
  }, [agentId, getToken]);

  const handleEnhanceDescription = async () => {
    if (!taskData.task_name || !taskData.task_description) return;
    
    setEnhancing(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const result = await api.enhanceTaskDescription(
        taskData.task_name,
        taskData.task_description,
        agentId
      );
      setEnhancedDescription(result.enhanced_description);
      setShowEnhancedDescription(true);
    } catch (error) {
      console.error("Failed to enhance description:", error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      
      // Use enhanced description if available and user wants enhancement
      const finalDescription =  enhancedDescription ? enhancedDescription : taskData.task_description;
      
      const task = await api.createTaskWithEnhancement({
        agent_id: agentId,
        task_name: taskData.task_name,
        task_description: finalDescription,
        table_id: taskData.table_id,
      }, !enhancedDescription); // Only auto-enhance if we don't have a preview
      
      // If we're in a flow, redirect back to the flow with success state
      if (isFlow && returnTo && agentParam) {
        router.push(`${returnTo}?step=${step}&agent=${agentParam}${tableCreated ? `&tableCreated=${tableCreated}` : ''}&taskCreated=${task.id}&taskSuccess=true`);
      } else {
        router.push(`/tasks/${task.id}`);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Agent not found</p>
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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (isFlow && returnTo && step && agentParam) {
                router.push(`${returnTo}?step=${step}&agent=${agentParam}${tableCreated ? `&tableCreated=${tableCreated}` : ''}`);
              } else {
                router.back();
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Create Task</h1>
          <p className="text-slate-600 mt-2">
            Add a new task for <span className="font-medium">{agent.name}</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* <div>
                <Label htmlFor="task_name">Task Name *</Label>
                <Input
                  id="task_name"
                  value={taskData.task_name}
                  onChange={(e) => setTaskData({ ...taskData, task_name: e.target.value })}
                  placeholder="e.g., search_medicines, create_order, answer_questions"
                  required
                />
                <p className="text-sm text-slate-500 mt-1">
                  A unique identifier for this task (use underscores instead of spaces)
                </p>
              </div> */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="task_description">Task Description *</Label>
                  <div className="flex items-center gap-2">
                    {/* <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useEnhancement}
                        onChange={(e) => setUseEnhancement(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-slate-600">Use AI Enhancement</span>
                    </label> */}
                    {taskData.task_name && taskData.task_description && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEnhanceDescription}
                        disabled={enhancing}
                        className="text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {enhancing ? "Enhancing..." : "Preview Enhancement"}
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="task_description"
                  value={showEnhancedDescription && enhancedDescription ? enhancedDescription : taskData.task_description}
                  onChange={(e) => {
                    if (showEnhancedDescription) {
                      setEnhancedDescription(e.target.value);
                    } else {
                      setTaskData({ ...taskData, task_description: e.target.value });
                    }
                  }}
                  placeholder="Describe what this task should do. Be specific about the functionality, inputs, and expected outputs..."
                  rows={showEnhancedDescription ? 12 : 8}
                  required
                  className={showEnhancedDescription ? "border-blue-200 bg-blue-50" : ""}
                />
                {showEnhancedDescription && enhancedDescription && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Enhanced Version</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowEnhancedDescription(false);
                        setEnhancedDescription(null);
                      }}
                      className="text-xs text-slate-500"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Original
                    </Button>
                  </div>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {showEnhancedDescription 
                    ? "This is the AI-enhanced version. You can edit it or switch back to the original."
                    : "This description is used by AI to generate the tool. Enable AI enhancement for a more detailed description."
                  }
                </p>
              </div>

              {/* <div>
                <Label htmlFor="table_id">Data Source (Optional)</Label>
                <select
                  id="table_id"
                  value={taskData.table_id}
                  onChange={(e) => setTaskData({ ...taskData, table_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">No data source</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.display_name || table.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-slate-500 mt-1">
                  Select a data table if this task needs to search or manipulate data
                </p>
                {tableCreated && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✓ A table was just created in this flow. You can select it above if this task should use it.
                    </p>
                  </div>
                )}
              </div> */}

              {tables.length === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">No data tables found</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Consider creating a data table first if your task needs to work with structured data.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/agents/${agentId}/tables/new`)}
                        className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Create Table
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">How it works</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• AI will analyze your task description</li>
                  <li>• Generate appropriate parameters and tool definition</li>
                  <li>• Create a callable function for your agent</li>
                  <li>• The agent can then use this tool during conversations</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-800 text-white hover:bg-slate-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Creating..." : "Create Task"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isFlow && returnTo && step && agentParam) {
                      router.push(`${returnTo}?step=${step}&agent=${agentParam}${tableCreated ? `&tableCreated=${tableCreated}` : ''}`);
                    } else {
                      router.back();
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}