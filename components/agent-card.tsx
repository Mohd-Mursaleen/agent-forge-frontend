import { Bot, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AgentCard({
  id,
  name,
  description,
  onEdit,
  onDelete,
  onChat
}: {
  id: string;
  name: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
  onChat?: () => void;
}) {
  const router = useRouter();

  const handleChat = () => {
    if (onChat) {
      onChat();
    } else {
      router.push(`/chat?agent=${id}`);
    }
  };

  return (
    <div className="card bg-white border border-slate-200 rounded-xl shadow-sm p-6 w-full max-w-md mx-auto mb-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
          <Bot className="h-5 w-5 text-slate-500" />
        </span>
        <h2 className="font-semibold text-slate-900 text-lg">{name}</h2>
      </div>
      <p className="text-slate-600 text-[15px] mb-4 line-clamp-2">{description}</p>
      <div className="flex gap-2">
        <button
          className="flex-1 px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-900 transition flex items-center justify-center gap-2"
          onClick={handleChat}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          className="px-3 py-2 rounded-md bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition"
          onClick={onEdit}
          title="Edit Agent"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="px-3 py-2 rounded-md bg-red-50 text-red-600 font-medium hover:bg-red-100 transition"
          onClick={onDelete}
          title="Delete Agent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
