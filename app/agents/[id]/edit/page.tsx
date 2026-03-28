"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditAgentPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { toast } = useToast();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /**
     * Loads agent data and populates form fields.
     */
    const loadAgent = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const agentData = await api.getAgent(agentId);
        setAgent(agentData);
        setFormData({
          name: agentData.name,
          description: agentData.description || "",
          system_prompt: agentData.system_prompt,
        });
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

    if (agentId) loadAgent();
  }, [agentId, getToken]);

  /**
   * Submits updated agent data and navigates back on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.updateAgent(agentId, formData);
      toast({ title: "Agent updated", variant: "success" });
      router.push(`/agents/${agentId}`);
    } catch (error) {
      toast({
        title: "Failed to update agent",
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
        <Card className="rounded-xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card className="rounded-xl">
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Agent not found</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agents")}
            >
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
        <h1 className="text-2xl font-semibold text-slate-900">Edit Agent</h1>
        <p className="text-sm text-slate-600 mt-1">Update your agent&apos;s configuration</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Agent Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter agent name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your agent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="Define how your agent should behave..."
                rows={6}
                required
              />
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
    </div>
  );
}
