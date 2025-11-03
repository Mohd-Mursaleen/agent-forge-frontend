"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createApiClient, type Agent } from "@/lib/api";
import { ArrowLeft, ArrowRight, Bot, Database, Settings, Check, Sparkles, Eye } from "lucide-react";
import { motion } from "framer-motion";

type Step = "agent" | "table" | "tasks" | "complete";

export default function NewAgentPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const [useEnhancement, setUseEnhancement] = useState(true);

  // Check URL parameters to restore flow state
  useEffect(() => {
    const step = searchParams.get('step') as Step;
    const agentId = searchParams.get('agent');
    const tableCreated = searchParams.get('tableCreated');
    const taskCreated = searchParams.get('taskCreated');
    
    if (step && agentId) {
      setCurrentStep(step);
      // Load agent data if we're returning to the flow
      if (agentId) {
        loadAgentData(agentId);
      }
      if (tableCreated) {
        setCreatedTableId(tableCreated);
      }
    }
  }, [searchParams]);

  const loadAgentData = async (agentId: string) => {
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const agent = await api.getAgent(agentId);
      setCreatedAgent(agent);
    } catch (error) {
      console.error("Failed to load agent:", error);
    }
  };

  const steps = [
    { id: "agent", title: "Agent Details", icon: Bot },
    { id: "table", title: "Data Table", icon: Database },
    { id: "tasks", title: "Tasks", icon: Settings },
    { id: "complete", title: "Complete", icon: Check },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

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
      console.error("Failed to enhance prompt:", error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      
      // Use enhanced prompt if available and user wants enhancement
      const finalPrompt = useEnhancement && enhancedPrompt ? enhancedPrompt : agentData.system_prompt;
      
      const agent = await api.createAgentWithEnhancement({
        ...agentData,
        system_prompt: finalPrompt,
      }, useEnhancement && !enhancedPrompt); // Only auto-enhance if we don't have a preview
      
      setCreatedAgent(agent);
      setCurrentStep("table");
    } catch (error) {
      console.error("Failed to create agent:", error);
      // Replace alert with toast or inline error
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleSkipTable = () => {
    // Clear success states when moving to next step
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('tableSuccess');
    window.history.replaceState({}, '', newUrl.toString());
    setCurrentStep("tasks");
  };

  const handleSkipTasks = () => {
    // Clear success states when moving to next step
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('taskSuccess');
    window.history.replaceState({}, '', newUrl.toString());
    setCurrentStep("complete");
  };

  const handleComplete = () => {
    if (createdAgent) {
      router.push(`/agents/${createdAgent.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Create New Agent</h1>
          <p className="text-slate-600 mt-2">Set up your AI agent step by step</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? "bg-green-500 border-green-500 text-white" 
                      : isActive 
                        ? "border-slate-900 text-slate-900" 
                        : "border-slate-300 text-slate-400"
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? "text-slate-900" : "text-slate-500"
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? "bg-green-500" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === "agent" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Agent Configuration</CardTitle>
                </CardHeader>
                <form onSubmit={handleCreateAgent} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={agentData.name}
                      onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                      placeholder="e.g., Medical Assistant, Customer Support Bot"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Company Description</Label>
                    <Input
                      id="description"
                      value={agentData.description}
                      onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                      placeholder="Brief description of what this agent does"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="system_prompt">System Prompt *</Label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={useEnhancement}
                            onChange={(e) => setUseEnhancement(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-slate-600">Use AI Enhancement</span>
                        </label>
                        {agentData.name && agentData.system_prompt && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEnhancePrompt}
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
                      id="system_prompt"
                      value={showEnhancedPrompt && enhancedPrompt ? enhancedPrompt : agentData.system_prompt}
                      onChange={(e) => {
                        if (showEnhancedPrompt) {
                          setEnhancedPrompt(e.target.value);
                        } else {
                          setAgentData({ ...agentData, system_prompt: e.target.value });
                        }
                      }}
                      placeholder="Define how your agent should behave, its personality, and capabilities..."
                      rows={showEnhancedPrompt ? 12 : 8}
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
                          className="text-xs text-slate-500"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Original
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-1">
                      {showEnhancedPrompt 
                        ? "This is the AI-enhanced version. You can edit it or switch back to the original."
                        : "This defines your agent's personality and behavior. Enable AI enhancement for a more detailed prompt."
                      }
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-slate-800 text-white hover:bg-slate-900"
                    >
                      {loading ? "Creating..." : "Create Agent"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === "table" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Add Data Table (Optional)</CardTitle>
                </CardHeader>
                <div className="space-y-6">
                  <p className="text-slate-600">
                    Add a data table to give your agent access to structured information like products, 
                    FAQs, or any domain-specific data.
                  </p>
                  
                  {(createdTableId || searchParams.get('tableSuccess')) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-green-800 font-medium">Table created successfully!</p>
                          <p className="text-sm text-green-600 mt-1">
                            Your table has been added to the agent. You can create more tables or continue to the next step.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => router.push(`/agents/${createdAgent?.id}/tables/new?flow=true&returnTo=/agents/new&step=table&agent=${createdAgent?.id}`)}
                      className="bg-slate-800 text-white hover:bg-slate-900"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      {createdTableId || searchParams.get('tableSuccess') ? "Create Another Table" : "Create Table"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkipTable}
                      className="border-slate-300"
                    >
                      {createdTableId || searchParams.get('tableSuccess') ? "Continue to Tasks" : "Skip for Now"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  {(createdTableId || searchParams.get('tableSuccess')) && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500">
                        You can always add more tables later from the agent dashboard
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "tasks" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Add Tasks (Optional)</CardTitle>
                </CardHeader>
                <div className="space-y-6">
                  <p className="text-slate-600">
                    Tasks are AI-generated tools that define what your agent can do. 
                    You can add them now or later from the agent dashboard.
                  </p>
                  
                  {(searchParams.get('taskCreated') || searchParams.get('taskSuccess')) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-green-800 font-medium">Task created successfully!</p>
                          <p className="text-sm text-green-600 mt-1">
                            Your task has been added to the agent. You can create more tasks or finish the setup.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => router.push(`/agents/${createdAgent?.id}/tasks/new?flow=true&returnTo=/agents/new&step=tasks&agent=${createdAgent?.id}${createdTableId ? `&tableCreated=${createdTableId}` : ''}`)}
                      className="bg-slate-800 text-white hover:bg-slate-900"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {searchParams.get('taskCreated') || searchParams.get('taskSuccess') ? "Create Another Task" : "Create Task"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkipTasks}
                      className="border-slate-300"
                    >
                      {searchParams.get('taskCreated') || searchParams.get('taskSuccess') ? "Finish Setup" : "Skip for Now"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  {(searchParams.get('taskCreated') || searchParams.get('taskSuccess')) && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500">
                        You can always add more tasks later from the agent dashboard
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "complete" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Agent Created Successfully!</CardTitle>
                </CardHeader>
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {createdAgent?.name} is ready!
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Your agent has been created successfully with the following components:
                    </p>
                    
                    {/* Summary of what was created */}
                    <div className="bg-slate-50 rounded-lg p-4 text-left max-w-md mx-auto">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium">Agent: {createdAgent?.name}</span>
                        </div>
                        {(createdTableId || searchParams.get('tableCreated')) && (
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-slate-600" />
                            <span className="text-sm">Data tables configured</span>
                          </div>
                        )}
                        {(searchParams.get('taskCreated') || searchParams.get('taskSuccess')) && (
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-slate-600" />
                            <span className="text-sm">Tasks configured</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm">
                      You can now start chatting with your agent or add more tables and tasks from the dashboard.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleComplete}
                      className="bg-slate-800 text-white hover:bg-slate-900"
                    >
                      View Agent Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/chat?agent=${createdAgent?.id}`)}
                    >
                      Start Chatting
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}