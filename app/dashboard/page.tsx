"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type Agent } from "@/lib/api";
import { Bot, Plus, ArrowRight, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardPage() {
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

  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your AI agents and their capabilities</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Activity className="h-7 w-7 text-emerald-600" />
                    <span className="text-xl">Total Agents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Bot className="h-7 w-7 text-emerald-600" />
                    <span className="text-xl">Active Agents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Plus className="h-7 w-7 text-emerald-600" />
                    <span className="text-xl">Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push("/agents/new")}
                    className="w-full"
                  >
                    Create Agent
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Your Agents</h2>
              <Button onClick={() => router.push("/agents/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>

            {agents.length === 0 ? (
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
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                              <Bot className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              {agent.description && (
                                <CardDescription className="mt-1">
                                  {agent.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {agent.system_prompt}
                        </p>
                      </CardContent>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/agents/${agent.id}`)}
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </LayoutWrapper>
  );
}

