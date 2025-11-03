"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createApiClient, type Agent, type ColumnSchema } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Save, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function NewTablePage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.id as string;
  
  // Check if we're in a flow
  const isFlow = searchParams.get('flow') === 'true';
  const returnTo = searchParams.get('returnTo');
  const step = searchParams.get('step');
  const agentParam = searchParams.get('agent');

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
      { name: "", type: "string", description: "" }
    ] as ColumnSchema[]
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
        console.error("Failed to load agent:", error);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) loadAgent();
  }, [agentId, getToken]);

  const addColumn = () => {
    setTableData({
      ...tableData,
      columns: [...tableData.columns, { name: "", type: "string", description: "" }]
    });
  };

  const removeColumn = (index: number) => {
    if (tableData.columns.length > 1) {
      setTableData({
        ...tableData,
        columns: tableData.columns.filter((_, i) => i !== index)
      });
    }
  };

  const updateColumn = (index: number, field: keyof ColumnSchema, value: string) => {
    const updatedColumns = [...tableData.columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setTableData({ ...tableData, columns: updatedColumns });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      
      const table = await api.createTable({
        agent_id: agentId,
        name: tableData.name,
        display_name: tableData.display_name,
        description: tableData.description,
        columns: tableData.columns.filter(col => col.name.trim() !== "")
      });
      
      // If we're in a flow, redirect back to the flow with success state
      if (isFlow && returnTo && step && agentParam) {
        router.push(`${returnTo}?step=${step}&agent=${agentParam}&tableCreated=${table.id}&tableSuccess=true`);
      } else {
        router.push(`/tables/${table.id}`);
      }
    } catch (error: any) {
      console.error("Failed to create table:", error);
      setError(error.response?.data?.detail || "Failed to create table. Please check your input and try again.");
    } finally {
      setSaving(false);
    }
  };

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
        undefined, // Don't send display_name, let backend generate it
        tableData.description
      );
      
      // If we're in a flow, redirect back to the flow with success state
      if (isFlow && returnTo && step && agentParam) {
        router.push(`${returnTo}?step=${step}&agent=${agentParam}&tableCreated=${result.table_id}&tableSuccess=true`);
      } else {
        router.push(`/tables/${result.table_id}`);
      }
    } catch (error: any) {
      console.error("Failed to import CSV:", error);
      setError(error.response?.data?.detail || "Failed to import CSV file. Please check the file format and try again.");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Agent not found</p>
            <Button
              onClick={() => router.push("/agents")}
              className="mt-4 bg-slate-800 text-white hover:bg-slate-900"
            >
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (isFlow && returnTo && step && agentParam) {
                router.push(`${returnTo}?step=${step}&agent=${agentParam}`);
              } else {
                router.back();
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Create Data Table</h1>
          <p className="text-slate-600 mt-2">
            Add a data table for <span className="font-medium">{agent.name}</span>
          </p>
        </div>

        {/* Import Mode Toggle */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setImportMode("manual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                importMode === "manual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manual Setup
            </button>
            <button
              onClick={() => setImportMode("csv")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                importMode === "csv"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Import CSV
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {importMode === "manual" ? "Manual Table Setup" : "CSV Import"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importMode === "manual" ? (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Table Name *</Label>
                    <Input
                      id="name"
                      value={tableData.name}
                      onChange={(e) => setTableData({ ...tableData, name: e.target.value })}
                      placeholder="e.g., medicines, products, faqs"
                      required
                    />
                  </div>
                  {/* <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={tableData.display_name}
                      onChange={(e) => setTableData({ ...tableData, display_name: e.target.value })}
                      placeholder="e.g., Medicine Inventory"
                    />
                  </div> */}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={tableData.description}
                    onChange={(e) => setTableData({ ...tableData, description: e.target.value })}
                    placeholder="Describe what this table contains..."
                    rows={3}
                  />
                </div>

                {/* Columns */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Columns</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColumn}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {tableData.columns.map((column, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Column Name</Label>
                            <Input
                              value={column.name}
                              onChange={(e) => updateColumn(index, "name", e.target.value)}
                              placeholder="e.g., medicine_name"
                              required
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <select
                              value={column.type}
                              onChange={(e) => updateColumn(index, "type", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                            </select>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={column.description}
                              onChange={(e) => updateColumn(index, "description", e.target.value)}
                              placeholder="Column description"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
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

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-800 text-white hover:bg-slate-900"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Creating..." : "Create Table"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (isFlow && returnTo && step && agentParam) {
                        router.push(`${returnTo}?step=${step}&agent=${agentParam}`);
                      } else {
                        router.back();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCsvImport} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <Label htmlFor="csv_name">Table Name *</Label>
                  <Input
                    id="csv_name"
                    value={tableData.name}
                    onChange={(e) => setTableData({ ...tableData, name: e.target.value })}
                    placeholder="e.g., medicines, products"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Use lowercase with underscores (e.g., medicine_inventory). Display name will be auto-generated.
                  </p>
                </div>

                <div>
                  <Label htmlFor="csv_description">Description</Label>
                  <Textarea
                    id="csv_description"
                    value={tableData.description}
                    onChange={(e) => setTableData({ ...tableData, description: e.target.value })}
                    placeholder="Describe what this table contains..."
                    rows={3}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="csv_file">CSV File *</Label>
                  <input
                    id="csv_file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Upload a CSV file. Column names will be automatically detected from the first row.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={importing || !csvFile}
                    className="bg-slate-800 text-white hover:bg-slate-900"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importing ? "Importing..." : "Import CSV"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (isFlow && returnTo && step && agentParam) {
                        router.push(`${returnTo}?step=${step}&agent=${agentParam}`);
                      } else {
                        router.back();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}