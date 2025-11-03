import { Bot } from "lucide-react";

export function AgentCard({
  name,
  description,
  onEdit,
  onDelete
}: {
  name: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card bg-white border border-slate-200 rounded-xl shadow-sm p-6 w-full max-w-md mx-auto mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
          <Bot className="h-5 w-5 text-slate-500" />
        </span>
        <h2 className="font-semibold text-slate-900 text-lg">{name}</h2>
      </div>
      <p className="text-slate-600 text-[15px] mb-4">{description}</p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="px-4 py-2 rounded-md bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
