"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createApiClient, type VectorTable } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function NewRecordPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTable = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const tableData = await api.getTable(tableId);
        setTable(tableData);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        tableData.columns.forEach(column => {
          initialData[column.name] = column.type === "number" ? "" : "";
        });
        setFormData(initialData);
      } catch (error) {
        console.error("Failed to load table:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tableId) loadTable();
  }, [tableId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.addRecord(tableId, { data: formData });
      router.push(`/tables/${tableId}`);
    } catch (error) {
      console.error("Failed to create record:", error);
      // Could be replaced with toast notification
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Table not found</p>
            <Button
              onClick={() => router.push("/tables")}
              className="mt-4 bg-slate-800 text-white hover:bg-slate-900"
            >
              Back to Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Add New Record</h1>
          <p className="text-slate-600 mt-2">
            Add a new record to {table.display_name || table.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record Data</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {table.columns.map((column) => (
                <div key={column.name}>
                  <Label htmlFor={column.name}>
                    {column.description || column.name}
                    <span className="ml-2 text-xs text-slate-500">({column.type})</span>
                  </Label>
                  {column.description && column.description !== column.name && (
                    <p className="text-sm text-slate-500 mb-2">Database field: {column.name}</p>
                  )}
                  
                  {column.type === "string" && column.name.includes("description") ? (
                    <Textarea
                      id={column.name}
                      value={formData[column.name] || ""}
                      onChange={(e) => handleFieldChange(column.name, e.target.value)}
                      placeholder={`Enter ${column.description || column.name}`}
                      rows={3}
                    />
                  ) : column.type === "number" ? (
                    <Input
                      id={column.name}
                      type="number"
                      step="any"
                      value={formData[column.name] || ""}
                      onChange={(e) => handleFieldChange(column.name, parseFloat(e.target.value) || "")}
                      placeholder={`Enter ${column.description || column.name}`}
                    />
                  ) : (
                    <Input
                      id={column.name}
                      value={formData[column.name] || ""}
                      onChange={(e) => handleFieldChange(column.name, e.target.value)}
                      placeholder={`Enter ${column.description || column.name}`}
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-800 text-white hover:bg-slate-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Add Record"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}