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
import { createApiClient, type VectorTable } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function NewRecordPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableId = params.id as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /**
     * Loads table schema and initializes form fields.
     */
    const loadTable = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const tableData = await api.getTable(tableId);
        setTable(tableData);

        const initialData: Record<string, any> = {};
        tableData.columns.forEach((column) => {
          initialData[column.name] = "";
        });
        setFormData(initialData);
      } catch (error) {
        toast({
          title: "Failed to load table",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (tableId) loadTable();
  }, [tableId, getToken]);

  /**
   * Submits the new record and navigates back on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      await api.addRecord(tableId, { data: formData });
      toast({ title: "Record added", variant: "success" });
      router.push(`/tables/${tableId}`);
    } catch (error) {
      toast({
        title: "Failed to create record",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
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

  if (!table) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600 mb-4">Table not found</p>
            <Button variant="default" onClick={() => router.push("/tables")}>
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
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Add New Record</h1>
        <p className="text-sm text-slate-600 mt-1">
          Add a new record to {table.display_name || table.name}
        </p>
      </div>

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
    </div>
  );
}
