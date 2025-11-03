"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiClient, type VectorTable, type VectorRecord } from "@/lib/api";
import { Database, ArrowLeft, Plus, Search, Download } from "lucide-react";
import { motion } from "framer-motion";

// Utility to download current view as CSV
function downloadCSV(rows: VectorRecord[], columns: string[], filename: string = "data.csv") {
  if (!rows.length || !columns.length) return;
  const csvRows = [
    columns.join(","),
    ...rows.map(row => columns.map(col => JSON.stringify(row.data[col] ?? "")).join(","))
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
  const tableId = params.id as string;
  
  const [table, setTable] = useState<VectorTable | null>(null);
  const [records, setRecords] = useState<VectorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VectorRecord[]>([]);
  const [searching, setSearching] = useState(false);

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
      } catch (error) {
        console.error("Failed to load table data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (tableId) { loadData(); }
  }, [tableId, getToken]);

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
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-600">Table not found</p>
            <Button onClick={() => router.push("/tables")} className="mt-4 bg-slate-800 text-white hover:bg-slate-900">
              Back to Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns: string[] = table.columns ? table.columns.map(col => col.name) : [];
  const displayRecords = searchResults.length > 0 ? searchResults : records;

  return (
    <div className="mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top Bar */}
        <div className="mb-6 flex items-center  gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 ml-2">
            {table.display_name || table.name}
          </h1>
          {/* <span className="text-sm text-slate-500 ml-2">{table.description}</span> */}
        </div>

        {/* Schema Info Panel */}
        {/* <Card className="mb-6">
          <CardHeader>
            <CardTitle>Table Schema</CardTitle>
            <CardDescription>
              Column definitions for <span className="font-mono">{table.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-[430px] w-full text-sm border-separate border-spacing-y-[2px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 font-medium text-left">Name</th>
                    <th className="px-3 py-2 font-medium text-left">Type</th>
                    <th className="px-3 py-2 font-medium text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map(col => (
                    <tr key={col.name} className="bg-white">
                      <td className="px-3 py-2">{col.name}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded font-medium
                          ${col.type === "string" ? "bg-blue-100 text-blue-700"
                          : col.type === "number" ? "bg-green-100 text-green-800"
                          : col.type === "date" ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"}
                        `}>{col.type}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card> */}

        {/* Search and Add Record Bar */}
        <div className="mb-4 flex gap-2 items-center">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search records..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            <Search className="h-4 w-4 mr-2" />
            {searching ? "Searching..." : "Search"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tables/${tableId}/records/new`)}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(displayRecords, columns, `${table.name}-records.csv`)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* DataGrid Table */}
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
              <p className="text-slate-500 text-center py-8">No records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[500px] w-full border-separate border-spacing-y-[2px] text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {columns.map(col => (
                        <th key={col} className="px-4 py-2 text-left font-semibold text-slate-700">{col}</th>
                      ))}
                      {displayRecords.some(r => 'similarity' in r) && (
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Similarity</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecords.map(record => (
                      <tr key={record.id} className="bg-white">
                        {columns.map(col => (
                          <td key={col} className="px-4 py-2 text-slate-900">
                            {typeof record.data[col] === "object"
                              ? JSON.stringify(record.data[col])
                              : String(record.data[col] ?? "")}
                          </td>
                        ))}
                        {'similarity' in record && (
                          <td className="px-4 py-2 text-slate-500">
                            {(record as any).similarity.toFixed(3)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
