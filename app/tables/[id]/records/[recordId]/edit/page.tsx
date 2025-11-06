"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createApiClient, type VectorTable, type VectorRecord } from "@/lib/api";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EditRecordPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;
  const recordId = params.recordId as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [record, setRecord] = useState<VectorRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const [tableData, recordsData] = await Promise.all([
          api.getTable(tableId),
          api.getRecords(tableId),
        ]);
        
        setTable(tableData);
        const foundRecord = recordsData.find(r => r.id === recordId);
        if (foundRecord) {
          setRecord(foundRecord);
          setFormData(foundRecord.data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tableId && recordId) loadData();
  }, [tableId, recordId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      // Note: API client needs updateRecord method
      await api.updateRecord(tableId, recordId, { data: formData });
      router.push(`/tables/${tableId}`);
    } catch (error) {
      console.error("Failed to update record:", error);
      // Could be replaced with toast notification
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    
    setDeleting(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      // Note: API client needs deleteRecord method
      await api.deleteRecord(tableId, recordId);
      router.push(`/tables/${tableId}`);
    } catch (error) {
      console.error("Failed to delete record:", error);
      // Could be replaced with toast notification
    } finally {
      setDeleting(false);
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

  if (!table || !record) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Record not found</p>
            <Button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="mt-4 bg-slate-800 text-white hover:bg-slate-900"
            >
              Back to Table
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
          <h1 className="text-3xl font-bold text-slate-900">Edit Record</h1>
          <p className="text-slate-600 mt-2">
            Update record in {table.display_name || table.name}
          </p>
        </div>

        <div className="space-y-6">
          {/* Record Form */}
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
                    {saving ? "Saving..." : "Save Changes"}
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

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-800">Delete Record</h4>
                  <p className="text-sm text-red-600">
                    This will permanently delete this record. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Record"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}