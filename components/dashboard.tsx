import { AgentCard } from "./agent-card";
import { Plus, Activity, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

type Agent = {
  name: string;
  description: string;
  id: string;
};

export function Dashboard({
  agents,
  onCreate,
  onEdit,
  onDelete,
}: {
  agents: Agent[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <section className="w-full max-w-7xl mx-auto py-6">
      {/* Header and quick summary */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-lg text-slate-600 mb-6">
          Manage your AI agents and track their usage.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Agents */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <span className="bg-slate-100 rounded-full p-2">
              <Activity className="h-7 w-7 text-slate-600" />
            </span>
            <div>
              <div className="text-sm text-slate-500">Total Agents</div>
              <div className="text-2xl font-semibold text-slate-900">{agents.length}</div>
            </div>
          </div>
          {/* Active Agents (for demo, using total again) */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <span className="bg-slate-100 rounded-full p-2">
              <Bot className="h-7 w-7 text-slate-600" />
            </span>
            <div>
              <div className="text-sm text-slate-500">Active Agents</div>
              <div className="text-2xl font-semibold text-slate-900">{agents.length}</div>
            </div>
          </div>
          {/* Quick Action */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between">
            <div className="text-sm text-slate-500 mb-3">Quick Action</div>
            <button
              onClick={onCreate}
              className="flex items-center justify-center px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Agent
            </button>
          </div>
        </div>
      </div>
      {/* Agents Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Your Agents</h2>
        <button
          className="flex items-center px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Agent
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-xl">
            <Bot className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No agents yet</h3>
            <p className="text-slate-600 mb-4">Create your first AI agent to get started.</p>
            <button
              onClick={onCreate}
              className="inline-flex items-center px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          agents.map(agent => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              description={agent.description}
              onEdit={() => onEdit(agent.id)}
              onDelete={() => onDelete(agent.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
