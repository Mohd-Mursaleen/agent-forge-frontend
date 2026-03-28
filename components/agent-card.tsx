"use client";

import { Bot, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AgentCardProps {
  /** Unique identifier for the agent. */
  id: string;
  /** Display name of the agent. */
  name: string;
  /** Short description of the agent's purpose. */
  description: string;
  /** Called when the user clicks the edit action. */
  onEdit: () => void;
  /** Called when the user clicks the delete action. */
  onDelete: () => void;
  /** Optional override for chat navigation; defaults to /chat?agent={id}. */
  onChat?: () => void;
}

/**
 * Renders a single agent as a styled card with chat, edit, and delete actions.
 * All buttons use the Button component from the design system.
 */
export function AgentCard({
  id,
  name,
  description,
  onEdit,
  onDelete,
  onChat,
}: AgentCardProps) {
  const router = useRouter();

  const handleChat = () => {
    if (onChat) {
      onChat();
    } else {
      router.push(`/chat?agent=${id}`);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Bot className="h-5 w-5 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{name}</CardTitle>
          </div>
        </div>
        {description && (
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleChat} className="flex-1">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit agent"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            aria-label="Delete agent"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
