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
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EditTablePage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadTable = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const tableData = await api.getTable(tableId);
        setTable(tableData);
        setFormData({
          display_name: tableData.display_name || "",
          description: tableData.description || "",
        });
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
      // Note: API client needs updateTable method
      await api.updateTable(tableId, formData);
      router.push(`/tables/${tableId}`);
    } catch (error) {
      console.error("Failed to update table:", error);
      // Could be replaced with toast notification
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this table? This action cannot be undone.")) return;
    
    setDeleting(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.deleteTable(tableId);
      router.push("/tables");
    } catch (error) {
      console.error("Failed to delete table:", error);
      // Could be replaced with toast notification
    } finally {
      setDeleting(false);
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Edit Table</h1>
          <p className="text-slate-600 mt-2">Update table metadata</p>
        </div>

        <div className="space-y-6">
          {/* Table Info */}
          <Card>
            <CardHeader>
              <CardTitle>Table Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Table Name (Read-only)</Label>
                  <Input
                    id="name"
                    value={table.name}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Table name cannot be changed after creation
                  </p>
                </div>

                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Human-readable table name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this table contains..."
                    rows={4}
                  />
                </div>

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

          {/* Schema Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Table Schema (Read-only)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left font-medium">Column</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name} className="border-t">
                        <td className="px-3 py-2 font-mono">{col.name}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            col.type === "string" ? "bg-blue-100 text-blue-700" :
                            col.type === "number" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Column schema cannot be modified after table creation. Create a new table if you need different columns.
              </p>
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
                  <h4 className="font-medium text-red-800">Delete Table</h4>
                  <p className="text-sm text-red-600">
                    This will permanently delete the table and all its records. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Table"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}