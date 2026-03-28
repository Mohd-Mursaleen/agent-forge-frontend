"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { createApiClient, type VectorTable, type VectorRecord } from "@/lib/api";
import {
  Database,
  ArrowLeft,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Settings,
  RefreshCw,
} from "lucide-react";

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

/**
 * Downloads an array of records as a CSV file.
 * @param rows - Array of VectorRecord objects to export
 * @param columns - Column names to include
 * @param filename - Output filename
 */
function downloadCSV(
  rows: VectorRecord[],
  columns: string[],
  filename: string = "data.csv"
) {
  if (!rows.length || !columns.length) return;
  const csvRows = [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((col) => JSON.stringify(row.data[col] ?? "")).join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function TableDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableId = params.id as string;

  const [table, setTable] = useState<VectorTable | null>(null);
  const [records, setRecords] = useState<VectorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VectorRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

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
        setRecords(recordsData);
      } catch (error: any) {
        console.error("Failed to load table data:", error);
        if (error.response?.status === 404) {
          setError(
            "Table not found. It may have been deleted or you don't have access to it."
          );
        } else {
          setError("Failed to load table data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    if (tableId) {
      loadData();
    }
  }, [tableId, getToken]);

  /** Performs a semantic search on records. */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const results = await api.searchRecords(tableId, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Something went wrong while searching records.",
        variant: "error",
      });
    } finally {
      setSearching(false);
    }
  };

  /** Reloads all table data and records. */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      const api = createApiClient(token || undefined);
      const [tableData, recordsData] = await Promise.all([
        api.getTable(tableId),
        api.getRecords(tableId),
      ]);
      setTable(tableData);
      setRecords(recordsData);
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast({
        title: "Refresh failed",
        description: "Could not reload the table data.",
        variant: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-20" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {error ? "Error Loading Table" : "Table Not Found"}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {error ||
                "The table you're looking for doesn't exist or has been deleted."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/tables")}>
                Back to Tables
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columnInfo = table.columns
    ? table.columns.map((col) => ({
        name: col.name,
        displayName: col.description || col.name,
      }))
    : [];

  const displayRecords =
    searchResults.length > 0 ? searchResults : records;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900 ml-1">
          {table.display_name || table.name}
        </h1>
      </div>

      {/* Action Bar */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search records..."
            className="max-w-sm"
          />
          <Button onClick={handleSearch} disabled={searching} size="sm">
            <Search className="h-4 w-4 mr-1" />
            {searching ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tables/${tableId}/edit`)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tables/${tableId}/records/new`)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Record
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(
                displayRecords,
                columnInfo.map((c) => c.name),
                `${table.name}-records.csv`
              )
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            {searchResults.length > 0
              ? `Search results (${searchResults.length})`
              : `All records (${records.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayRecords.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No records found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {columnInfo.map((col) => (
                      <th
                        key={col.name}
                        className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        {col.displayName}
                      </th>
                    ))}
                    {displayRecords.some((r) => "similarity" in r) && (
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Similarity
                      </th>
                    )}
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 border-b border-border"
                    >
                      {columnInfo.map((col) => {
                        let value = record.data[col.name];
                        if (value === undefined || value === null) {
                          const dataKeys = Object.keys(record.data);
                          const matchingKey = dataKeys.find(
                            (key) =>
                              toSnakeCase(key) === col.name ||
                              key.toLowerCase() === col.name.toLowerCase()
                          );
                          if (matchingKey) {
                            value = record.data[matchingKey];
                          }
                        }
                        return (
                          <td
                            key={col.name}
                            className="px-4 py-2.5 text-slate-900"
                          >
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value ?? "")}
                          </td>
                        );
                      })}
                      {"similarity" in record && (
                        <td className="px-4 py-2.5 text-slate-500">
                          {(record as any).similarity.toFixed(3)}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/tables/${tableId}/records/${record.id}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              confirm({
                                title: "Delete Record",
                                description:
                                  "Are you sure you want to delete this record? This action cannot be undone.",
                                confirmText: "Delete Record",
                                variant: "destructive",
                                onConfirm: async () => {
                                  try {
                                    const token = await getToken();
                                    const api = createApiClient(
                                      token || undefined
                                    );
                                    await api.deleteRecord(
                                      tableId,
                                      record.id
                                    );
                                    const updatedRecords =
                                      await api.getRecords(tableId);
                                    setRecords(updatedRecords);
                                    setSearchResults([]);
                                    toast({
                                      title: "Record deleted",
                                      description:
                                        "The record has been permanently removed.",
                                    });
                                  } catch (error) {
                                    console.error(
                                      "Failed to delete record:",
                                      error
                                    );
                                    toast({
                                      title: "Delete failed",
                                      description:
                                        "Could not delete the record. Please try again.",
                                      variant: "error",
                                    });
                                  }
                                },
                              });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
