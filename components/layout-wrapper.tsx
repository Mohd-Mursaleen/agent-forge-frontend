"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleSidebarToggle = () => {
      // Listen for sidebar state changes from localStorage or context
      const isOpen = localStorage.getItem("sidebarOpen") !== "false";
      setSidebarOpen(isOpen);
    };

    // Check initial state
    const isOpen = localStorage.getItem("sidebarOpen") !== "false";
    setSidebarOpen(isOpen);

    // Listen for storage changes
    window.addEventListener("storage", handleSidebarToggle);
    return () => window.removeEventListener("storage", handleSidebarToggle);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-green-50/20">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 p-6 lg:p-8 pt-20 lg:pt-8`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
