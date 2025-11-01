"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type Agent } from "@/lib/api";
import { Bot, Plus, ArrowRight, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AgentsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const data = await api.getAgents();
        setAgents(data);
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [getToken]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.deleteAgent(id);
      setAgents(agents.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
    }
  };

  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">Agents</h1>
            <p className="text-lg text-gray-600">Manage your AI agents</p>
          </div>
          <Button onClick={() => router.push("/agents/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : agents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-6">Create your first AI agent to get started</p>
              <Button onClick={() => router.push("/agents/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                          <Bot className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                          {agent.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {agent.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {agent.system_prompt}
                    </p>
                  </CardContent>
                  <CardContent className="pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/agents/${agent.id}`)}
                    >
                      View
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/agents/${agent.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </LayoutWrapper>
  );
}

