"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { createApiClient, type VectorTable, type VectorRecord } from "@/lib/api";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function EditRecordPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const tableId = params.id as string;
  const recordId = params.recordId as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [record, setRecord] = useState<VectorRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /**
     * Loads table schema and record data.
     */
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const [tableData, recordsData] = await Promise.all([
          api.getTable(tableId),
          api.getRecords(tableId),
        ]);

        setTable(tableData);
        const foundRecord = recordsData.find((r) => r.id === recordId);
        if (foundRecord) {
          setRecord(foundRecord);
          setFormData(foundRecord.data);
        }
      } catch (error) {
        toast({
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (tableId && recordId) loadData();
  }, [tableId, recordId, getToken]);

  /**
   * Submits updated record data and navigates back.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.updateRecord(tableId, recordId, { data: formData });
      toast({ title: "Record updated", variant: "success" });
      router.push(`/tables/${tableId}`);
    } catch (error) {
      toast({
        title: "Failed to update record",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Deletes the record after user confirmation. */
  const handleDelete = () => {
    confirm({
      title: "Delete Record",
      description: "Are you sure you want to delete this record? This action cannot be undone.",
      confirmText: "Delete Record",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const token = await getToken();
          const api = createApiClient(token || undefined);
          await api.deleteRecord(tableId, recordId);
          toast({ title: "Record deleted", variant: "success" });
          router.push(`/tables/${tableId}`);
        } catch (error) {
          toast({
            title: "Failed to delete record",
            description: error instanceof Error ? error.message : "Something went wrong",
            variant: "error",
          });
        }
      },
    });
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-6 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!table || !record) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Record not found</p>
            <Button variant="default" onClick={() => router.push(`/tables/${tableId}`)}>
              Back to Table
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
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Record</h1>
        <p className="text-sm text-slate-600 mt-1">
          Update record in {table.display_name || table.name}
        </p>
      </div>

      <div className="space-y-6">
        {/* Record Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Record Data</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {table.columns.map((column) => (
                <div key={column.name} className="space-y-2">
                  <Label htmlFor={column.name}>
                    {column.description || column.name}
                    <span className="ml-2 text-xs text-slate-400 font-normal">({column.type})</span>
                  </Label>

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

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="default" disabled={saving}>
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
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Delete Record</h4>
                <p className="text-sm text-slate-600">
                  This will permanently delete this record. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog />
    </div>
  );
}
