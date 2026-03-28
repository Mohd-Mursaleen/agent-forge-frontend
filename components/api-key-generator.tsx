"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient, type ApiKey } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { API_BASE_URL } from "@/lib/utils";
import {
  Trash2,
  Copy,
  Check,
  Key,
  Code,
  Globe,
  FileText,
  Code2,
} from "lucide-react";

interface ApiKeyGeneratorProps {
  agentId: string;
}

type SnippetType = "iframe" | "javascript" | "react";

/** Tab selector for embed code format (iframe / JS / React). */
function SnippetTabs({
  active,
  onChange,
}: {
  active: SnippetType;
  onChange: (t: SnippetType) => void;
}) {
  const tabs: { value: SnippetType; label: string; icon: React.ReactNode }[] = [
    { value: "iframe", label: "Iframe", icon: <FileText className="h-3 w-3" /> },
    { value: "javascript", label: "JS", icon: <Code className="h-3 w-3" /> },
    { value: "react", label: "React", icon: <Code2 className="h-3 w-3" /> },
  ];

  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            active === tab.value
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Dark-themed code block with optional copy button. */
function CodeBlock({
  code,
  copied,
  onCopy,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
      <div className="absolute top-2 right-2">
        <Button size="sm" variant="outline" onClick={onCopy} className="h-7 px-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

export default function ApiKeyGenerator({ agentId }: ApiKeyGeneratorProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyOrigins, setNewKeyOrigins] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);
  const [activeSnippetType, setActiveSnippetType] = useState<SnippetType>("iframe");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /** Load all API keys for the current agent. */
  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const keys = await api.getApiKeys(agentId);
      setApiKeys(keys);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }, [agentId, getToken]);

  useEffect(() => {
    if (agentId) {
      loadApiKeys();
    }
  }, [agentId, loadApiKeys]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Create a new API key with the given name and allowed origins. */
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Please enter a key name", variant: "warning" });
      return;
    }

    try {
      setCreating(true);
      const token = await getToken();
      const api = createApiClient(token || undefined);

      const origins = newKeyOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

      const allowedOrigins = origins.length > 0 ? origins : ["http://localhost:3000"];

      const newKey = await api.createApiKey(agentId, newKeyName.trim(), allowedOrigins);

      await loadApiKeys();

      setNewlyCreatedKey(newKey);
      setShowCreateForm(false);
      setNewKeyName("");
      setNewKeyOrigins("");
      toast({ title: "API key created", variant: "success" });
    } catch (error: any) {
      console.error("Failed to create API key:", error);
      toast({
        title: "Failed to create API key",
        description: error.response?.data?.detail || "Something went wrong",
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  /** Delete an API key after user confirms via dialog. */
  const handleDeleteKey = async (keyId: string, keyName: string) => {
    confirm({
      title: "Delete Key",
      description: `Are you sure you want to delete the key "${keyName}"? This action cannot be undone and the key will no longer work.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteApiKey(keyId);
          await loadApiKeys();
          if (newlyCreatedKey?.id === keyId) {
            setNewlyCreatedKey(null);
          }
          toast({ title: "API key deleted", variant: "success" });
        } catch (error) {
          console.error("Failed to delete API key:", error);
          toast({ title: "Failed to delete API key", variant: "error" });
        }
      },
    });
  };

  /** Copy text to clipboard and briefly show a check icon. */
  const copyToClipboard = async (text: string, type: "key" | "embed", id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
      } else {
        setCopiedEmbedId(id);
        setTimeout(() => setCopiedEmbedId(null), 2000);
      }
      toast({ title: "Copied to clipboard", variant: "success" });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({ title: "Failed to copy", variant: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // Embed snippets
  // ---------------------------------------------------------------------------

  /** Generate embed code snippets matching backend format. */
  const getEmbedSnippets = (key: ApiKey): Record<SnippetType, string> => {
    if (!key.api_key) {
      return { iframe: "", javascript: "", react: "" };
    }

    const apiKey = key.api_key;
    const embedUrl = `${API_BASE_URL}/embed/${agentId}?api_key=${apiKey}`;

    const iframe = `<!-- Chatbot Widget - Embed this on your website -->
<iframe
    src="${embedUrl}"
    width="100%"
    height="600"
    frameborder="0"
    allow="microphone; camera"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>`;

    const javascript = `<!-- Add this script to your website -->
<script src="${API_BASE_URL}/static/chatbot-widget.js"></script>
<script>
    ChatbotWidget.init({
        agentId: '${agentId}',
        apiKey: '${apiKey}',
        position: 'bottom-right',
        theme: 'light'
    });
</script>`;

    const react = `import ChatbotWidget from '@yourdomain/chatbot-react';

export default function MyPage() {
  return (
    <ChatbotWidget
      agentId="${agentId}"
      apiKey="${apiKey}"
      position="bottom-right"
      theme="light"
    />
  );
}`;

    return { iframe, javascript, react };
  };

  /** Return the snippet for the currently selected tab. */
  const getCurrentSnippet = (key: ApiKey): string => {
    return getEmbedSnippets(key)[activeSnippetType] || "";
  };

  /** Safely access allowed_origins on a key. */
  const getAllowedOrigins = (key: ApiKey): string[] => {
    return key.allowed_origins || [];
  };

  /** Format a date string for display. */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /** Skeleton placeholder rows shown while keys are loading. */
  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );

  /** Embed code section with tab selector and dark code block. */
  const renderEmbedSection = (key: ApiKey) => {
    if (!key.api_key) return null;

    return (
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-2">
            <Code className="h-3.5 w-3.5" />
            Embed Code
          </Label>
          <SnippetTabs active={activeSnippetType} onChange={setActiveSnippetType} />
        </div>

        <CodeBlock
          code={getCurrentSnippet(key)}
          copied={copiedEmbedId === key.id}
          onCopy={() => copyToClipboard(getCurrentSnippet(key), "embed", key.id)}
        />
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Section 1: API Keys Card (header + create form) ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Generate API keys for external integrations
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "Generate Key"}
            </Button>
          </div>
        </CardHeader>

        {/* Create form (toggled) */}
        {showCreateForm && (
          <CardContent className="border-t border-slate-200 pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production Website Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="key-origins">Allowed Origins (comma-separated)</Label>
                <Input
                  id="key-origins"
                  placeholder="e.g., https://example.com, https://app.example.com"
                  value={newKeyOrigins}
                  onChange={(e) => setNewKeyOrigins(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Leave empty to allow localhost only. Separate multiple origins with commas.
                </p>
              </div>
              <Button
                onClick={handleCreateKey}
                disabled={creating || !newKeyName.trim()}
              >
                {creating ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ---- Section 2: Newly created key alert ---- */}
      {newlyCreatedKey && newlyCreatedKey.api_key && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-emerald-900">New API Key Created</CardTitle>
            <CardDescription>
              Copy this key now -- you will not be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API key value */}
            <div>
              <Label>API Key</Label>
              <div className="flex items-center gap-2 mt-2">
                <pre className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                  {newlyCreatedKey.api_key}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(newlyCreatedKey.api_key!, "key", newlyCreatedKey.id)
                  }
                >
                  {copiedKeyId === newlyCreatedKey.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Embed code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-3.5 w-3.5" />
                  Embed Code
                </Label>
                <SnippetTabs active={activeSnippetType} onChange={setActiveSnippetType} />
              </div>
              <CodeBlock
                code={getCurrentSnippet(newlyCreatedKey)}
                copied={copiedEmbedId === newlyCreatedKey.id}
                onCopy={() =>
                  copyToClipboard(
                    getCurrentSnippet(newlyCreatedKey),
                    "embed",
                    newlyCreatedKey.id
                  )
                }
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setNewlyCreatedKey(null)}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Section 3: Key list ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Generated API Keys</CardTitle>
          <CardDescription>Manage your API keys and view embed codes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderLoadingSkeleton()
          ) : apiKeys.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  {/* Key header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{key.name}</h4>
                        {key.api_key && <Badge variant="success">New</Badge>}
                        {key.is_active === false && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>

                      {/* Masked key */}
                      {key.masked_key && (
                        <p className="text-xs text-slate-400 font-mono mb-2">
                          {key.masked_key}
                        </p>
                      )}

                      {/* Meta: origins, dates */}
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {(() => {
                              const origins = getAllowedOrigins(key);
                              return origins.length > 0
                                ? origins.join(", ")
                                : "No restrictions";
                            })()}
                          </span>
                        </div>
                        <div>Created: {formatDate(key.created_at)}</div>
                        {key.last_used && (
                          <div>Last used: {formatDate(key.last_used)}</div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteKey(key.id, key.name)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Newly created key: show raw key + embed code */}
                  {key.api_key && (
                    <div className="space-y-3 pt-4 mt-4 border-t border-slate-200">
                      <div>
                        <Label className="text-sm">Access Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <pre className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                            {key.api_key}
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(key.api_key!, "key", key.id)
                            }
                          >
                            {copiedKeyId === key.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {renderEmbedSection(key)}
                    </div>
                  )}

                  {/* For existing keys without a visible api_key */}
                  {!key.api_key && (
                    <p className="text-sm text-slate-400 mt-3">
                      The access key value is not shown for security reasons. Create a
                      new API key to get the embed code.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
