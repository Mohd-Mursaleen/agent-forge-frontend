"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient, type ApiKey } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Copy, Check, Key, Plus, Code, Globe, FileText, Code2 } from "lucide-react";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { API_BASE_URL } from "@/lib/utils";

interface ApiKeyGeneratorProps {
  agentId: string;
}

export default function ApiKeyGenerator({ agentId }: ApiKeyGeneratorProps) {
  const { getToken } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyOrigins, setNewKeyOrigins] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);
  const [activeSnippetType, setActiveSnippetType] = useState<"iframe" | "javascript" | "react">("iframe");
  const { confirm, ConfirmDialog } = useConfirmDialog();

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

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert("Please enter a key name");
      return;
    }

    try {
      setCreating(true);
      const token = await getToken();
      const api = createApiClient(token || undefined);
      
      // Parse allowed origins from comma-separated string
      const origins = newKeyOrigins
        .split(",")
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
      
      // If no origins specified, default to localhost
      const allowedOrigins = origins.length > 0 ? origins : ["http://localhost:3000"];

      const newKey = await api.createApiKey(agentId, newKeyName.trim(), allowedOrigins);
      
      // Reload keys to get the full list
      await loadApiKeys();
      
      // Show the newly created key
      setNewlyCreatedKey(newKey);
      setShowCreateForm(false);
      setNewKeyName("");
      setNewKeyOrigins("");
    } catch (error: any) {
      console.error("Failed to create API key:", error);
      alert(error.response?.data?.detail || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    confirm({
      title: "Delete Key",
      description: `Are you sure you want to delete the  key "${keyName}"? This action cannot be undone and the key will no longer work.`,
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
        } catch (error) {
          console.error("Failed to delete API key:", error);
          alert("Failed to delete API key");
        }
      }
    });
  };

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
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  // Generate embed code snippets matching backend format
  const getEmbedSnippets = (key: ApiKey): { iframe: string; javascript: string; react: string } => {
    if (!key.api_key) {
      return {
        iframe: "",
        javascript: "",
        react: "",
      };
    }

    const apiKey = key.api_key;
    const embedUrl = `${API_BASE_URL}/embed/${agentId}?api_key=${apiKey}`;

    // Iframe snippet (matches backend format)
    const iframeSnippet = `<!-- Chatbot Widget - Embed this on your website -->
<iframe 
    src="${embedUrl}"
    width="100%"
    height="600"
    frameborder="0"
    allow="microphone; camera"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>`;

    // JavaScript snippet (matches backend format)
    const jsSnippet = `<!-- Add this script to your website -->
<script src="${API_BASE_URL}/static/chatbot-widget.js"></script>
<script>
    ChatbotWidget.init({
        agentId: '${agentId}',
        apiKey: '${apiKey}',
        position: 'bottom-right',
        theme: 'light'
    });
</script>`;

    // React snippet (matches backend format)
    const reactSnippet = `import ChatbotWidget from '@yourdomain/chatbot-react';

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

    return {
      iframe: iframeSnippet,
      javascript: jsSnippet,
      react: reactSnippet,
    };
  };

  // Get current snippet based on active type
  const getCurrentSnippet = (key: ApiKey): string => {
    const snippets = getEmbedSnippets(key);
    return snippets[activeSnippetType] || "";
  };

  // Helper to safely get allowed origins
  const getAllowedOrigins = (key: ApiKey): string[] => {
    return key.allowed_origins || [];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-slate-200 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Plug and Use
              </CardTitle>
              <CardDescription>
                Generate API keys to embed your agent on external websites
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-slate-800 text-white hover:bg-slate-900"
            >
              {showCreateForm ? "Cancel" : "Generate Key"}
            </Button>
          </div>
        </CardHeader>

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
                <Label htmlFor="key-origins">
                  Allowed Origins (comma-separated)
                </Label>
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
                className="bg-slate-800 text-white hover:bg-slate-900"
              >
                {creating ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {newlyCreatedKey && newlyCreatedKey.api_key && (
        <Card className="bg-emerald-50 border-2 border-emerald-500 rounded-xl">
          <CardHeader>
            <CardTitle className="text-emerald-900">New API Key Created!</CardTitle>
            <CardDescription className="text-emerald-700">
              Copy this key now - you won't be able to see it again
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-emerald-900">API Key</Label>
              <div className="flex items-center gap-2 mt-2">
                <pre className="flex-1 bg-white p-3 rounded-lg border border-emerald-300 text-sm overflow-x-auto">
                  {newlyCreatedKey.api_key}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newlyCreatedKey.api_key!, "key", newlyCreatedKey.id)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {copiedKeyId === newlyCreatedKey.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-emerald-900">Embed Code</Label>
              <div className="flex items-start gap-2 mt-2">
                <pre className="flex-1 bg-white p-3 rounded-lg border border-emerald-300 text-xs overflow-x-auto">
                  {getCurrentSnippet(newlyCreatedKey)}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getCurrentSnippet(newlyCreatedKey), "embed", newlyCreatedKey.id)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {copiedEmbedId === newlyCreatedKey.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
        </div>
            <Button
              onClick={() => setNewlyCreatedKey(null)}
              variant="outline"
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-slate-200 rounded-xl">
        <CardHeader>
          <CardTitle>Generated API Keys</CardTitle>
          <CardDescription>
            Manage your API keys and view embed codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No API keys yet. Create one to get started.</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <Card key={key.id} className="border border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{key.name}</h4>
                          {key.api_key && (
                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">
                              New
                            </span>
                          )}
                          {key.is_active === false && (
                            <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            <span>
                              {(() => {
                                const origins = getAllowedOrigins(key);
                                return origins.length > 0 ? origins.join(", ") : "No restrictions";
                              })()}
                            </span>
                          </div>
                          <div>
                            Created: {formatDate(key.created_at)}
                          </div>
                          {key.last_used && (
                            <div>
                              Last used: {formatDate(key.last_used)}
                            </div>
                          )}
                          {key.masked_key && (
                            <div className="text-xs text-slate-500 font-mono">
                              {key.masked_key}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {key.api_key && (
                      <div className="space-y-3 pt-4 border-t border-slate-200">
                        <div>
                          <Label className="text-sm">Access Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <pre className="flex-1 bg-slate-50 p-2 rounded text-xs overflow-x-auto">
                              {key.api_key}
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(key.api_key!, "key", key.id)}
                              className="border-slate-300"
                            >
                              {copiedKeyId === key.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm flex items-center gap-2 mb-2">
                            <Code className="h-3 w-3" />
                            Embed Code
                          </Label>
                          
                          {/* Snippet Type Tabs for existing keys */}
                          <div className="flex gap-2 mb-2">
                            <Button
                              size="sm"
                              variant={activeSnippetType === "iframe" ? "default" : "outline"}
                              onClick={() => setActiveSnippetType("iframe")}
                              className={activeSnippetType === "iframe" ? "bg-slate-800 text-white" : "border-slate-300"}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Iframe
                            </Button>
                            <Button
                              size="sm"
                              variant={activeSnippetType === "javascript" ? "default" : "outline"}
                              onClick={() => setActiveSnippetType("javascript")}
                              className={activeSnippetType === "javascript" ? "bg-slate-800 text-white" : "border-slate-300"}
                            >
                              <Code className="h-3 w-3 mr-1" />
                              JS
                            </Button>
                            <Button
                              size="sm"
                              variant={activeSnippetType === "react" ? "default" : "outline"}
                              onClick={() => setActiveSnippetType("react")}
                              className={activeSnippetType === "react" ? "bg-slate-800 text-white" : "border-slate-300"}
                            >
                              <Code2 className="h-3 w-3 mr-1" />
                              React
                            </Button>
                          </div>

                          <div className="flex items-start gap-2 mt-1">
                            <pre className="flex-1 bg-slate-50 p-2 rounded text-xs overflow-x-auto">
                              {getCurrentSnippet(key)}
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(getCurrentSnippet(key), "embed", key.id)}
                              className="border-slate-300"
                            >
                              {copiedEmbedId === key.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                      <p className="text-sm text-slate-500 mb-2">
                          The Access key value is not shown for security reasons. If you need to embed this agent, create a new API key to get the embed code.
                        </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
