"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Task } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditTaskPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    task_name: "",
    task_description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /**
     * Loads task data and populates form fields.
     */
    const loadTask = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const taskData = await api.getTask(taskId);
        setTask(taskData);
        setFormData({
          task_name: taskData.task_name,
          task_description: taskData.task_description,
          is_active: taskData.is_active,
        });
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

    if (taskId) loadTask();
  }, [taskId, getToken]);

  /**
   * Submits updated task data and navigates back on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.updateTask(taskId, formData);
      toast({ title: "Task updated", variant: "success" });
      router.push(`/tasks/${taskId}`);
    } catch (error) {
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Task not found</p>
            <Button variant="ghost" size="sm" onClick={() => router.push("/agents")}>
              <ArrowLeft className="h-4 w-4" />
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
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Task</h1>
        <p className="text-sm text-slate-600 mt-1">Update task configuration</p>
      </div>

      <div className="space-y-6">
        {/* Task Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Task Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="task_name">Task Name</Label>
                <Input
                  id="task_name"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_description">Task Description</Label>
                <Textarea
                  id="task_description"
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  placeholder="Describe what this task should do..."
                  rows={6}
                  required
                />
                <p className="text-sm text-slate-400">
                  This description is used to generate the AI tool. Be specific about what the task should accomplish.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="mb-0">
                  Active
                  <span className="ml-2 text-sm text-slate-500 font-normal">
                    {formData.is_active ? "Task is available to the agent" : "Task is disabled"}
                  </span>
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="default" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tool Information (Read-only) */}
        {task.tools && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Generated Tool (Read-only)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Operation Type</Label>
                  <Input value={task.tools.operation_type} disabled className="bg-slate-50" />
                </div>

                <div className="space-y-2">
                  <Label>Tool Description</Label>
                  <Textarea
                    value={task.tools.description}
                    disabled
                    className="bg-slate-50"
                    rows={3}
                  />
                </div>

                {task.tools.parameters && task.tools.parameters.length > 0 && (
                  <div className="space-y-2">
                    <Label>Parameters</Label>
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

                <p className="text-sm text-slate-400">
                  Tool configuration is automatically generated based on the task description.
                  To modify the tool, update the task description and the system will regenerate it.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
