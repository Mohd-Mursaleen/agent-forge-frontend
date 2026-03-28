"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent } from "@/lib/api";
import { ArrowLeft, ArrowRight, Bot, Database, Settings, Check, Sparkles, Eye } from "lucide-react";

type Step = "agent" | "table" | "tasks" | "complete";

function NewAgentPageContent() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<Step>("agent");
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [createdTableId, setCreatedTableId] = useState<string | null>(null);

  const [agentData, setAgentData] = useState({
    name: "",
    description: "",
    system_prompt: "",
  });

  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false);

  /** Restores wizard flow state from URL search params on mount/change. */
  useEffect(() => {
    const step = searchParams.get("step") as Step;
    const agentId = searchParams.get("agent");
    const tableCreated = searchParams.get("tableCreated");

    if (step && agentId) {
      if (step !== currentStep) {
        setCurrentStep(step);
      }
      if (agentId && !createdAgent) {
        loadAgentData(agentId);
      }
      if (tableCreated && !createdTableId) {
        setCreatedTableId(tableCreated);
      }
    }
  }, [searchParams, currentStep, createdAgent, createdTableId]);

  /**
   * Fetches agent data by ID to restore the wizard state.
   * @param agentId - The agent ID to load
   */
  const loadAgentData = async (agentId: string) => {
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const agent = await api.getAgent(agentId);
      setCreatedAgent(agent);
    } catch (error) {
      toast({
        title: "Failed to load agent",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    }
  };

  const steps = [
    { id: "agent", title: "Agent Details", icon: Bot },
    { id: "table", title: "Data Table", icon: Database },
    { id: "tasks", title: "Tasks", icon: Settings },
    { id: "complete", title: "Complete", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  /**
   * Calls the enhance-prompt API to get an AI-improved system prompt.
   */
  const handleEnhancePrompt = async () => {
    if (!agentData.name || !agentData.system_prompt) return;

    setEnhancing(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const result = await api.enhanceSystemPrompt(
        agentData.name,
        agentData.description,
        agentData.system_prompt
      );
      setEnhancedPrompt(result.enhanced_prompt);
      setShowEnhancedPrompt(true);
    } catch (error) {
      toast({
        title: "Failed to enhance prompt",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setEnhancing(false);
    }
  };

  /**
   * Creates the agent and advances to the table step on success.
   */
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);

      const finalPrompt =
        showEnhancedPrompt && enhancedPrompt ? enhancedPrompt : agentData.system_prompt;

      const agent = await api.createAgent({
        ...agentData,
        system_prompt: finalPrompt,
      });

      setCreatedAgent(agent);
      setCurrentStep("table");
    } catch (error) {
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Skips the table step and advances to the tasks step. */
  const handleSkipTable = () => {
    setCurrentStep("tasks");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("tableSuccess");
    newUrl.searchParams.set("step", "tasks");
    if (createdAgent?.id) {
      newUrl.searchParams.set("agent", createdAgent.id);
    }
    if (createdTableId) {
      newUrl.searchParams.set("tableCreated", createdTableId);
    }
    window.history.replaceState({}, "", newUrl.toString());
  };

  /** Skips the tasks step and advances to the complete step. */
  const handleSkipTasks = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("taskSuccess");
    newUrl.searchParams.set("step", "complete");
    if (createdAgent?.id) {
      newUrl.searchParams.set("agent", createdAgent.id);
    }
    if (createdTableId) {
      newUrl.searchParams.set("tableCreated", createdTableId);
    }
    window.history.replaceState({}, "", newUrl.toString());
    setCurrentStep("complete");
  };

  /** Navigates to the agent detail page when the wizard is finished. */
  const handleComplete = () => {
    if (createdAgent) {
      router.push(`/agents/${createdAgent.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
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
        <h1 className="text-2xl font-semibold text-slate-900">Create Agent</h1>
        <p className="text-sm text-slate-600 mt-1">Set up your AI agent step by step</p>
      </div>

      {/* Stepper */}
      <div className="mb-6">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                      isCompleted
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : isActive
                          ? "border-indigo-500 text-indigo-600"
                          : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm hidden sm:block ${
                      isActive ? "font-medium text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      isCompleted ? "bg-indigo-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="rounded-xl">
        <CardContent className="p-6">
          {/* Step 1: Agent Details */}
          {currentStep === "agent" && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-semibold">Agent Configuration</CardTitle>
              </CardHeader>
              <form onSubmit={handleCreateAgent} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={agentData.name}
                    onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                    placeholder="e.g., Medical Assistant, Customer Support Bot"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Input
                    id="description"
                    value={agentData.description}
                    onChange={(e) =>
                      setAgentData({ ...agentData, description: e.target.value })
                    }
                    placeholder="Brief description of what this agent does"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system_prompt">System Prompt *</Label>
                    {agentData.name && agentData.system_prompt && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEnhancePrompt}
                        disabled={enhancing}
                      >
                        <Sparkles className="w-3 h-3" />
                        {enhancing ? "Enhancing..." : "Preview Enhancement"}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="system_prompt"
                    value={
                      showEnhancedPrompt && enhancedPrompt
                        ? enhancedPrompt
                        : agentData.system_prompt
                    }
                    onChange={(e) => {
                      if (showEnhancedPrompt) {
                        setEnhancedPrompt(e.target.value);
                      } else {
                        setAgentData({ ...agentData, system_prompt: e.target.value });
                      }
                    }}
                    placeholder="Define how your agent should behave, its personality, and capabilities..."
                    rows={showEnhancedPrompt ? 12 : 6}
                    required
                    className={showEnhancedPrompt ? "border-blue-200 bg-blue-50" : ""}
                  />
                  {showEnhancedPrompt && enhancedPrompt && (
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
                          setShowEnhancedPrompt(false);
                          setEnhancedPrompt(null);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        View Original
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-slate-400 mt-1">
                    {showEnhancedPrompt
                      ? "This is the AI-enhanced version. You can edit it or switch back to the original."
                      : "This defines your agent's personality and behavior. Enable AI enhancement for a more detailed prompt."}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="default" disabled={loading}>
                    {loading ? "Creating..." : "Create Agent"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Data Table */}
          {currentStep === "table" && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-semibold">
                  Add Data Table (Optional)
                </CardTitle>
              </CardHeader>
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  Add a data table to give your agent access to structured information like
                  products, FAQs, or any domain-specific data.
                </p>

                {(createdTableId || searchParams.get("tableSuccess")) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 font-medium">
                          Table created successfully!
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">
                          Your table has been added to the agent. You can create more tables or
                          continue to the next step.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="default"
                    onClick={() =>
                      router.push(
                        `/agents/${createdAgent?.id}/tables/new?flow=true&returnTo=/agents/new&step=table&agent=${createdAgent?.id}`
                      )
                    }
                  >
                    <Database className="h-4 w-4" />
                    {createdTableId || searchParams.get("tableSuccess")
                      ? "Create Another Table"
                      : "Create Table"}
                  </Button>
                  <Button variant="outline" onClick={handleSkipTable}>
                    {createdTableId || searchParams.get("tableSuccess")
                      ? "Continue to Tasks"
                      : "Skip for Now"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {(createdTableId || searchParams.get("tableSuccess")) && (
                  <p className="text-sm text-slate-400 text-center">
                    You can always add more tables later from the agent dashboard
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Tasks */}
          {currentStep === "tasks" && (
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-semibold">Add Tasks (Optional)</CardTitle>
              </CardHeader>
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  Tasks are AI-generated tools that define what your agent can do. You can add
                  them now or later from the agent dashboard.
                </p>

                {(searchParams.get("taskCreated") || searchParams.get("taskSuccess")) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 font-medium">
                          Task created successfully!
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">
                          Your task has been added to the agent. You can create more tasks or
                          finish the setup.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="default"
                    onClick={() =>
                      router.push(
                        `/agents/${createdAgent?.id}/tasks/new?flow=true&returnTo=/agents/new&step=tasks&agent=${createdAgent?.id}${createdTableId ? `&tableCreated=${createdTableId}` : ""}`
                      )
                    }
                  >
                    <Settings className="h-4 w-4" />
                    {searchParams.get("taskCreated") || searchParams.get("taskSuccess")
                      ? "Create Another Task"
                      : "Create Task"}
                  </Button>
                  <Button variant="outline" onClick={handleSkipTasks}>
                    {searchParams.get("taskCreated") || searchParams.get("taskSuccess")
                      ? "Finish Setup"
                      : "Skip for Now"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {(searchParams.get("taskCreated") || searchParams.get("taskSuccess")) && (
                  <p className="text-sm text-slate-400 text-center">
                    You can always add more tasks later from the agent dashboard
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === "complete" && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {createdAgent?.name} is ready!
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Your agent has been created successfully with the following components:
                </p>

                <div className="bg-slate-50 rounded-lg p-4 text-left max-w-sm mx-auto space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-900">
                      Agent: {createdAgent?.name}
                    </span>
                  </div>
                  {(createdTableId || searchParams.get("tableCreated")) && (
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Data tables configured</span>
                    </div>
                  )}
                  {(searchParams.get("taskCreated") || searchParams.get("taskSuccess")) && (
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Tasks configured</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-400 mt-4">
                  You can now start chatting with your agent or add more tables and tasks from
                  the dashboard.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="default" onClick={handleComplete}>
                  View Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/chat?agent=${createdAgent?.id}`)}
                >
                  Start Chatting
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <NewAgentPageContent />
    </Suspense>
  );
}
