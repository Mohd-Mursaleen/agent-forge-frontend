"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { createApiClient, type VectorTable } from "@/lib/api";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export default function EditTablePage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
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
        toast({
          title: "Failed to load table",
          description: "Could not fetch table details.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (tableId) loadTable();
  }, [tableId, getToken]);

  /** Saves updated table metadata. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.updateTable(tableId, formData);
      toast({
        title: "Table updated",
        description: "Your changes have been saved.",
      });
      router.push(`/tables/${tableId}`);
    } catch (error) {
      console.error("Failed to update table:", error);
      toast({
        title: "Save failed",
        description: "Could not update the table. Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Permanently deletes the table after confirmation. */
  const handleDelete = () => {
    confirm({
      title: "Delete Table",
      description:
        "This will permanently delete the table and all its records. This action cannot be undone.",
      confirmText: "Delete Table",
      variant: "destructive",
      onConfirm: async () => {
        setDeleting(true);
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteTable(tableId);
          toast({
            title: "Table deleted",
            description: "The table and all records have been removed.",
          });
          router.push("/tables");
        } catch (error) {
          console.error("Failed to delete table:", error);
          toast({
            title: "Delete failed",
            description: "Could not delete the table. Please try again.",
            variant: "error",
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Table not found</p>
            <Button onClick={() => router.push("/tables")} className="mt-4">
              Back to Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Table</h1>
        <p className="text-sm text-slate-500 mt-1">Update table metadata</p>
      </div>

      <div className="space-y-6">
        {/* Table Info Form */}
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
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="Human-readable table name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what this table contains..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
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

        {/* Schema (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Table Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Column
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr key={col.name} className="border-b border-border">
                      <td className="px-3 py-2 font-mono text-sm">
                        {col.name}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            col.type === "string"
                              ? "default"
                              : col.type === "number"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {col.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {col.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Column schema cannot be modified after table creation. Create a
              new table if you need different columns.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">Delete Table</h4>
                <p className="text-sm text-slate-600">
                  This will permanently delete the table and all its records.
                  This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Table"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog />
    </div>
  );
}
