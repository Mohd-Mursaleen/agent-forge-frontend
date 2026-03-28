"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createApiClient, type VectorTable, type Agent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Database } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

export default function TablesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
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
        agentsData.forEach((agent) => {
          agentsMap[agent.id] = agent;
        });
        setAgents(agentsMap);

        const allTables: VectorTable[] = [];
        for (const agent of agentsData) {
          const agentTables = await api.getAgentTables(agent.id);
          allTables.push(...agentTables);
        }
        setTables(allTables);
      } catch (error) {
        console.error("Failed to load tables:", error);
        toast({
          title: "Failed to load tables",
          description: "Something went wrong while fetching your tables.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getToken]);

  const columns: ColumnDef<VectorTable>[] = [
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: (info) => (
        <span className="font-medium text-slate-900">
          {String(info.getValue() || "")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => (
        <span className="text-slate-600">
          {String(info.getValue() || "")}
        </span>
      ),
    },
    {
      id: "agent",
      header: "Agent",
      cell: ({ row }) => {
        const table = row.original;
        const agent = agents[table.agent_id];
        return (
          <span className="text-slate-600">{agent?.name || "Unknown"}</span>
        );
      },
    },
  ];

  const tableInstance = useReactTable({
    data: tables,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Knowledge Base
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your agent data tables and vector stores
        </p>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div>
            <div className="bg-slate-50 px-5 py-3 flex gap-8">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-5 py-4 border-b border-border flex gap-8"
              >
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Database className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No tables yet
            </h3>
            <p className="text-sm text-slate-500 max-w-sm text-center">
              Create a data table from an agent page to start storing and
              querying structured data.
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              {tableInstance.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableInstance.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 cursor-pointer border-b border-border"
                  onClick={() => router.push(`/tables/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
