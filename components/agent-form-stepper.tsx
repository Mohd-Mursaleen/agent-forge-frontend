import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export type FormData = {
  name: string;
  description: string;
  system_prompt: string;
};

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  loading: boolean;
  onSubmit: () => void;
};

const steps = [
  { id: 1, title: "Basic Information", description: "Name and description" },
  { id: 2, title: "System Prompt", description: "Define agent behavior" },
  { id: 3, title: "Review", description: "Review and create" },
];

export const AgentFormStepper: React.FC<Props> = ({
  formData,
  setFormData,
  loading,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = React.useState(1);

  const canProceed = () => {
    if (currentStep === 1) return formData.name.trim().length > 0;
    if (currentStep === 2) return formData.system_prompt.trim().length > 0;
    return true;
  };

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    currentStep >= step.id
                      ? "border-slate-700 bg-slate-700 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 transition-all duration-200 ${
                    currentStep > step.id ? "bg-slate-700" : "bg-slate-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Card */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Medical Shop Assistant"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what this agent does"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="system_prompt">System Prompt *</Label>
                  <Textarea
                    id="system_prompt"
                    placeholder="You are a helpful assistant. Use your tools to help users..."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    className="mt-1"
                    rows={8}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Define how your agent should behave and interact with users.
                  </p>
                </div>
              </motion.div>
            )}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Name</p>
                    <p className="text-base text-slate-900">{formData.name}</p>
                  </div>
                  {formData.description && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Description</p>
                      <p className="text-base text-slate-900">{formData.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-500">System Prompt</p>
                    <p className="text-base text-slate-900 whitespace-pre-wrap">{formData.system_prompt}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={loading || !canProceed()}
              >
                {loading ? "Creating..." : "Create Agent"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
