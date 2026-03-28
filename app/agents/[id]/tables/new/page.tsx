"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createApiClient, type Agent, type ColumnSchema } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";

/**
 * Converts a display name string to snake_case for data key matching.
 * @param str - The display name to convert
 * @returns snake_case version of the string
 */
function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function NewTablePageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const agentId = params.id as string;

  const isFlow = searchParams.get("flow") === "true";
  const returnTo = searchParams.get("returnTo");
  const step = searchParams.get("step");
  const agentParam = searchParams.get("agent");

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableData, setTableData] = useState({
    name: "",
    display_name: "",
    description: "",
    columns: [
      { name: "", displayName: "", type: "string", description: "" },
    ] as (ColumnSchema & { displayName?: string })[],
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"manual" | "csv">("manual");

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const agentData = await api.getAgent(agentId);
        setAgent(agentData);
      } catch (error) {
        toast({
          title: "Failed to load agent",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (agentId) loadAgent();
  }, [agentId, getToken]);

  const addColumn = () => {
    setTableData({
      ...tableData,
      columns: [
        ...tableData.columns,
        { name: "", displayName: "", type: "string", description: "" },
      ],
    });
  };

  const removeColumn = (index: number) => {
    if (tableData.columns.length > 1) {
      setTableData({
        ...tableData,
        columns: tableData.columns.filter((_, i) => i !== index),
      });
    }
  };

  const updateColumn = (
    index: number,
    field: keyof (ColumnSchema & { displayName?: string }),
    value: string
  ) => {
    const updatedColumns = [...tableData.columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };

    if (field === "displayName") {
      updatedColumns[index].name = toSnakeCase(value);
    }

    setTableData({ ...tableData, columns: updatedColumns });
  };

  /** Creates a table with manually defined columns. */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);

      const processedColumns = tableData.columns
        .filter((col) => col.displayName?.trim() || col.name.trim())
        .map((col) => ({
          name: col.name || toSnakeCase(col.displayName || ""),
          type: col.type,
          description: col.displayName || col.description || col.name,
        }));

      const table = await api.createTable({
        agent_id: agentId,
        name: tableData.name,
        display_name: tableData.display_name,
        description: tableData.description,
        columns: processedColumns,
      });

      if (isFlow && returnTo && step && agentParam) {
        router.push(
          `${returnTo}?step=${step}&agent=${agentParam}&tableCreated=${table.id}&tableSuccess=true`
        );
      } else {
        router.push(`/tables/${table.id}`);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
          "Failed to create table. Please check your input and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /** Creates a table by importing a CSV file. */
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    setError(null);

    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);

      const result = await api.importCSV(
        agentId,
        csvFile,
        tableData.name,
        undefined,
        tableData.description
      );

      if (isFlow && returnTo && step && agentParam) {
        router.push(
          `${returnTo}?step=${step}&agent=${agentParam}&tableCreated=${result.table_id}&tableSuccess=true`
        );
      } else {
        router.push(`/tables/${result.table_id}`);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
          "Failed to import CSV file. Please check the file format and try again."
      );
    } finally {
      setImporting(false);
    }
  };

  /** Navigates back, respecting the wizard flow state if applicable. */
  const handleBack = () => {
    if (isFlow && returnTo && step && agentParam) {
      router.push(`${returnTo}?step=${step}&agent=${agentParam}`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Agent not found</p>
            <Button variant="default" onClick={() => router.push("/agents")}>
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Create Data Table</h1>
        <p className="text-sm text-slate-600 mt-1">
          Add a data table for <span className="font-medium">{agent.name}</span>
        </p>
      </div>

      {/* Import Mode Toggle */}
      <div className="mb-6">
        <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setImportMode("manual")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              importMode === "manual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Manual Setup
          </button>
          <button
            type="button"
            onClick={() => setImportMode("csv")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              importMode === "csv"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Import CSV
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {importMode === "manual" ? "Manual Table Setup" : "CSV Import"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importMode === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Table Name *</Label>
                  <Input
                    id="display_name"
                    value={tableData.display_name}
                    onChange={(e) => {
                      const displayName = e.target.value;
                      setTableData({
                        ...tableData,
                        display_name: displayName,
                        name: toSnakeCase(displayName),
                      });
                    }}
                    placeholder="e.g., Medicine Inventory"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={tableData.description}
                  onChange={(e) =>
                    setTableData({ ...tableData, description: e.target.value })
                  }
                  placeholder="Describe what this table contains..."
                  rows={3}
                />
              </div>

              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Columns</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4" />
                    Add Column
                  </Button>
                </div>

                <div className="space-y-3">
                  {tableData.columns.map((column, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Column Name</Label>
                          <Input
                            value={column.displayName || ""}
                            onChange={(e) =>
                              updateColumn(index, "displayName", e.target.value)
                            }
                            placeholder="e.g., Medicine Name"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <select
                            value={column.type}
                            onChange={(e) =>
                              updateColumn(index, "type", e.target.value)
                            }
                            className="w-full h-9 px-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={column.description}
                            onChange={(e) =>
                              updateColumn(index, "description", e.target.value)
                            }
                            placeholder="Column description"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeColumn(index)}
                            disabled={tableData.columns.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="default" disabled={saving}>
                  {saving ? "Creating..." : "Create Table"}
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCsvImport} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv_display_name">Table Name *</Label>
                <Input
                  id="csv_display_name"
                  value={tableData.display_name}
                  onChange={(e) => {
                    const displayName = e.target.value;
                    setTableData({
                      ...tableData,
                      display_name: displayName,
                      name: toSnakeCase(displayName),
                    });
                  }}
                  placeholder="e.g., Medicine Inventory"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv_description">Description</Label>
                <Textarea
                  id="csv_description"
                  value={tableData.description}
                  onChange={(e) =>
                    setTableData({ ...tableData, description: e.target.value })
                  }
                  placeholder="Describe what this table contains..."
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="csv_file">CSV File *</Label>
                <input
                  id="csv_file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full h-9 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  required
                />
                <p className="text-sm text-slate-400">
                  Upload a CSV file. Column names will be automatically detected from the first row.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="default" disabled={importing || !csvFile}>
                  <Upload className="h-4 w-4" />
                  {importing ? "Importing..." : "Import CSV"}
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTablePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <NewTablePageContent />
    </Suspense>
  );
}
