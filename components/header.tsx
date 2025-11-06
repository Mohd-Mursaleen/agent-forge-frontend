"use client";
import { useRouter, usePathname } from "next/navigation";
import { Bot, LayoutDashboard } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Tables", href: "/tables", icon: Bot }
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-content">
        {/* Brand */}
        <div className="navbar-brand">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
          <span className="navbar-logo">
            <Bot size={20} />
          </span>
          <span className="text-lg font-semibold tracking-tight">AgentForge</span>
        </button>

        </div>
        {/* Links */}
        <nav className="navbar-links">
          {navigation
            .filter(item => {
              // Hide the current page's navigation button
              if (item.href === "/dashboard" && pathname === "/dashboard") return false;
              if (item.href === "/agents" && (pathname === "/agents" || pathname.startsWith("/agents/"))) return false;
              return true;
            })
            .map(item => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="navbar-link"
                type="button"
              >
                <item.icon size={17} style={{ color: "#5e6e97" }} />
                {item.name}
              </button>
            ))}
        </nav>
      </div>
    </header>
  );
}
