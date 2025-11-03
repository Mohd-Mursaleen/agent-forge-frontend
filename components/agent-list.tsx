import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Trash2, Edit, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export type Agents = {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
};

type Props = {
  agents: Agents[];
  loading?: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AgentList({ agents, loading, onCreate, onEdit, onDelete }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <Card className="text-center py-12 bg-white border border-slate-200 rounded-xl">
        <CardContent>
          <Bot className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No agents yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first AI agent to get started
          </p>
          <Button
            onClick={onCreate}
            className="bg-slate-800 text-white hover:bg-slate-900 transition"
          >
            Create Your First Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full flex flex-col bg-white border border-slate-200 rounded-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 shrink-0">
                    <Bot className="h-8 w-8 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate text-slate-900">{agent.name}</CardTitle>
                    {agent.description && (
                      <CardDescription className="mt-1 line-clamp-2 text-slate-600">
                        {agent.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                {agent.system_prompt}
              </p>
            </CardContent>
            <CardContent className="pt-0 space-y-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-slate-800 text-white hover:bg-slate-900"
                  onClick={() => router.push(`/chat?agent=${agent.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-900 hover:bg-slate-100"
                  onClick={() => router.push(`/agents/${agent.id}`)}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
              {/* <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(agent.id)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(agent.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div> */}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
