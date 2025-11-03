"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createApiClient, type Task } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function EditTaskPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
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
        console.error("Failed to load task:", error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) loadTask();
  }, [taskId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.updateTask(taskId, formData);
      router.push(`/tasks/${taskId}`);
    } catch (error) {
      console.error("Failed to update task:", error);
      // Could be replaced with toast notification
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

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
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
    <div className="max-w-2xl mx-auto px-6 py-10">
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
          <h1 className="text-3xl font-bold text-slate-900">Edit Task</h1>
          <p className="text-slate-600 mt-2">Update task configuration</p>
        </div>

        <div className="space-y-6">
          {/* Task Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="task_name">Task Name</Label>
                  <Input
                    id="task_name"
                    value={formData.task_name}
                    onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                    placeholder="Enter task name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="task_description">Task Description</Label>
                  <Textarea
                    id="task_description"
                    value={formData.task_description}
                    onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                    placeholder="Describe what this task should do..."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    This description is used to generate the AI tool. Be specific about what the task should accomplish.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">
                    Active
                    <span className="ml-2 text-sm text-slate-500">
                      {formData.is_active ? "Task is available to the agent" : "Task is disabled"}
                    </span>
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-800 text-white hover:bg-slate-900"
                  >
                    <Save className="h-4 w-4 mr-2" />
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
                <CardTitle>Generated Tool (Read-only)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Operation Type</Label>
                    <Input value={task.tools.operation_type} disabled className="bg-slate-50" />
                  </div>
                  
                  <div>
                    <Label>Tool Description</Label>
                    <Textarea 
                      value={task.tools.description} 
                      disabled 
                      className="bg-slate-50" 
                      rows={3}
                    />
                  </div>

                  {task.tools.parameters && task.tools.parameters.length > 0 && (
                    <div>
                      <Label>Parameters</Label>
                      <div className="space-y-2 mt-2">
                        {task.tools.parameters.map((param: any, index: number) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium">{param.name}</span>
                              <span className="text-xs bg-slate-200 px-2 py-1 rounded">{param.type}</span>
                            </div>
                            <p className="text-sm text-slate-600">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-500">
                    Tool configuration is automatically generated based on the task description. 
                    To modify the tool, update the task description and the system will regenerate it.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}