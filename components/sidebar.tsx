"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { 
  Bot, 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  Plus,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Tables", href: "/tables", icon: Database },
  { name: "Chat", href: "/chat", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarOpen") !== "false";
    }
    return true;
  });

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", String(newState));
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 z-40 h-screen w-80 bg-white/95 backdrop-blur-lg border-r border-emerald-100/50 shadow-xl"
            >
              <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-20 items-center justify-between border-b border-emerald-100/50 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
                      <Bot className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">AgentForge</span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 px-4 py-6">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href);
                          if (window.innerWidth < 1024) {
                            toggleSidebar();
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200",
                          isActive
                            ? "bg-emerald-50 text-emerald-700 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-6 w-6 transition-colors",
                            isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        {item.name}
                      </motion.button>
                    );
                  })}
                </nav>

                {/* User section */}
                <div className="border-t border-emerald-100/50 p-5">
                  <div className="flex items-center justify-between">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "h-12 w-12",
                        },
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        router.push("/agents/new");
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                    >
                      <Plus className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Toggleable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-80 bg-white/95 backdrop-blur-lg border-r border-emerald-100/50 shadow-lg"
          >
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-20 items-center justify-between border-b border-emerald-100/50 px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">AgentForge</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2 px-4 py-6">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <motion.button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-6 w-6 transition-colors",
                          isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      {item.name}
                    </motion.button>
                  );
                })}
              </nav>

              {/* User section */}
              <div className="border-t border-emerald-100/50 p-5">
                <div className="flex items-center justify-between">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "h-12 w-12",
                      },
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/agents/new")}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                  >
                    <Plus className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Toggle Button - When Sidebar is Closed */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleSidebar}
          className="hidden lg:flex fixed top-4 left-4 z-50 h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </motion.button>
      )}
    </>
  );
}
