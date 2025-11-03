"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient, type VectorTable , type Agent} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

// Utility: download array of objects as CSV
function downloadCSV(data: any[], filename = "table.csv") {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function TablesPage() {
  const { getToken } = useAuth();
  const [tables, setTables] = useState<VectorTable[]>([]);
  const [agents, setAgents] = useState<Record<string, Agent>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token || undefined);
        const agentsData = await api.getAgents();
        const agentsMap: Record<string, Agent> = {};
        agentsData.forEach(agent => {
          agentsMap[agent.id] = agent;
        });
        setAgents(agentsMap);
        // Load all tables
        const allTables: VectorTable[] = [];
        for (const agent of agentsData) {
          const agentTables = await api.getAgentTables(agent.id);
          allTables.push(...agentTables);
        }
        setTables(allTables);
      } catch (error) {
        console.error("Failed to load tables:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getToken]);

  // Table columns
  const columns: ColumnDef<VectorTable>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: info => <span className="font-semibold text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: info => <span className="text-slate-600">{info.getValue()}</span>,
    },
    {
      accessorKey: "row_count",
      header: "Rows",
      cell: info => <span className="text-slate-900">{info.getValue()}</span>,
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: info => <span className="text-slate-700">{info.getValue()}</span>,
    },
  ];

  const tableInstance = useReactTable({
    data: tables,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Database Tables</h1>
        <Button
          className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900"
          onClick={() => downloadCSV(tables)}
          disabled={tables.length === 0}
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-700"></div>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center text-slate-500 py-16">No tables found.</div>
        ) : (
          <table className="min-w-full text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50">
              {tableInstance.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-5 py-3 text-left font-semibold text-slate-800"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableInstance.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-5 py-3 border-t border-slate-100 text-slate-700"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
