"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient, type VectorTable, type VectorRecord } from "@/lib/api";
import { Database, ArrowLeft, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

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

    if (tableId) {
      loadData();
    }
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
      <LayoutWrapper>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
      </LayoutWrapper>
    );
  }

  if (!table) {
    return (
      <LayoutWrapper>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Table not found</p>
            <Button onClick={() => router.push("/tables")} className="mt-4">
              Back to Tables
            </Button>
          </CardContent>
        </Card>
      </LayoutWrapper>
    );
  }

  const displayRecords = searchResults.length > 0 ? searchResults : records;

  return (
    <LayoutWrapper>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {table.display_name || table.name}
          </h1>
          {table.description && (
            <p className="text-gray-600">{table.description}</p>
          )}
        </div>

        {/* Table Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Table Schema</CardTitle>
            <CardDescription>Column definitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {table.columns.map((column) => (
                <div
                  key={column.name}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-900">{column.name}</p>
                  <p className="text-sm text-gray-600">{column.type}</p>
                  {column.description && (
                    <p className="text-xs text-gray-500 mt-1">{column.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Records</CardTitle>
            <CardDescription>Semantic search across table data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search records..."
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Found {searchResults.length} result(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Records</CardTitle>
                <CardDescription>
                  {searchResults.length > 0
                    ? `Search results (${searchResults.length})`
                    : `All records (${records.length})`}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/tables/${tableId}/records/new`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {displayRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No records found</p>
            ) : (
              <div className="space-y-4">
                {displayRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(record.data).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm font-medium text-gray-500">{key}</p>
                          <p className="text-base text-gray-900 mt-1">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {"similarity" in record && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Similarity: {(record as any).similarity.toFixed(3)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </LayoutWrapper>
  );
}

