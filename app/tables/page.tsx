"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type VectorTable, type Agent } from "@/lib/api";
import { Database, Plus, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function TablesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<VectorTable[]>([]);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        
        const agentsData = await api.getAgents();
        const agentsMap: Record<string, Agent> = {};
        agentsData.forEach(agent => {
          agentsMap[agent.id] = agent;
        });
        setAgents(agentsMap);

        // Load all tables
        const allTables: VectorTable[] = [];
        for (const agent of agentsData) {
          const agentTables = await api.getAgentTables(agent.id);
          allTables.push(...agentTables);
        }
        setTables(allTables);
      } catch (error) {
        console.error("Failed to load tables:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getToken]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.deleteTable(id);
      setTables(tables.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete table:", error);
      alert("Failed to delete table");
    }
  };

  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Vector Tables</h1>
            <p className="text-gray-600">Manage your data tables</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : tables.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tables yet</h3>
              <p className="text-gray-600 mb-6">Create your first vector table to get started</p>
              <Button onClick={() => router.push("/agents")}>
                <Plus className="h-4 w-4 mr-2" />
                Go to Agents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table, index) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0">
                          <Database className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {table.display_name || table.name}
                          </CardTitle>
                          {table.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {table.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Columns:</span> {table.columns.length}
                      </div>
                      {agents[table.agent_id] && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Agent:</span> {agents[table.agent_id].name}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardContent className="pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/tables/${table.id}`)}
                    >
                      View
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(table.id)}
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

