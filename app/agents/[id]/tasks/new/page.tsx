"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent, type VectorTable } from "@/lib/api";
import { ArrowLeft, Database, Sparkles, Eye } from "lucide-react";

function NewTaskPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const agentId = params.id as string;

  const isFlow = searchParams.get("flow") === "true";
  const returnTo = searchParams.get("returnTo");
  const step = searchParams.get("step");
  const agentParam = searchParams.get("agent");
  const tableCreated = searchParams.get("tableCreated");

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
        toast({
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (agentId) loadData();
  }, [agentId, getToken]);

  /** Calls the AI to enhance the task description. */
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
      toast({
        title: "Failed to enhance description",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setEnhancing(false);
    }
  };

  /** Creates the task and navigates to its detail page or back to the wizard flow. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);

      const finalDescription = enhancedDescription
        ? enhancedDescription
        : taskData.task_description;

      const task = await api.createTaskWithEnhancement(
        {
          agent_id: agentId,
          task_name: taskData.task_name,
          task_description: finalDescription,
          table_id: taskData.table_id,
        },
        !enhancedDescription
      );

      if (isFlow && returnTo && agentParam) {
        router.push(
          `${returnTo}?step=${step}&agent=${agentParam}${
            tableCreated ? `&tableCreated=${tableCreated}` : ""
          }&taskCreated=${task.id}&taskSuccess=true`
        );
      } else {
        router.push(`/tasks/${task.id}`);
      }
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Navigates back, respecting the wizard flow state if applicable. */
  const handleBack = () => {
    if (isFlow && returnTo && step && agentParam) {
      router.push(
        `${returnTo}?step=${step}&agent=${agentParam}${
          tableCreated ? `&tableCreated=${tableCreated}` : ""
        }`
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card>
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
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Create Task</h1>
        <p className="text-sm text-slate-600 mt-1">
          Add a new task for <span className="font-medium">{agent.name}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Task Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="task_name">Task Name *</Label>
              <Input
                id="task_name"
                value={taskData.task_name}
                onChange={(e) => setTaskData({ ...taskData, task_name: e.target.value })}
                placeholder="e.g., Search Products, Add Customer Record"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="task_description">Task Description *</Label>
                {taskData.task_name && taskData.task_description && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceDescription}
                    disabled={enhancing}
                  >
                    <Sparkles className="w-3 h-3" />
                    {enhancing ? "Enhancing..." : "Preview Enhancement"}
                  </Button>
                )}
              </div>
              <Textarea
                id="task_description"
                value={
                  showEnhancedDescription && enhancedDescription
                    ? enhancedDescription
                    : taskData.task_description
                }
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
                <div className="flex items-center gap-2">
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
                  >
                    <Eye className="w-3 h-3" />
                    View Original
                  </Button>
                </div>
              )}
              <p className="text-sm text-slate-400">
                {showEnhancedDescription
                  ? "This is the AI-enhanced version. You can edit it or switch back to the original."
                  : "This description is used by AI to generate the tool. Enable AI enhancement for a more detailed description."}
              </p>
            </div>

            {tables.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">No data tables found</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Consider creating a data table first if your task needs to work with
                      structured data.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/agents/${agentId}/tables/new`)}
                      className="mt-2"
                    >
                      Create Table
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 mb-2">How it works</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>AI will analyze your task description</li>
                <li>Generate appropriate parameters and tool definition</li>
                <li>Create a callable function for your agent</li>
                <li>The agent can then use this tool during conversations</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="default" disabled={saving}>
                {saving ? "Creating..." : "Create Task"}
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      }
    >
      <NewTaskPageContent />
    </Suspense>
  );
}
