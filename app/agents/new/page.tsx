"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AgentFormStepper, FormData } from "@/components/agent-form-stepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api";

export default function NewAgentPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    system_prompt: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const agent = await api.createAgent(formData);
      router.push(`/agents/${agent.id}`);
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("Failed to create agent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Create New Agent</h1>
          <p className="text-lg text-slate-600">Build your AI agent step by step</p>
        </div>
        <AgentFormStepper
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </motion.div>
    </div>
  );
}
