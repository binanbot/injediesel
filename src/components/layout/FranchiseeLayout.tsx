import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FranchiseeSidebar } from "./FranchiseeSidebar";
import { Topbar } from "./Topbar";
import { useFileStatusNotifications } from "@/hooks/useFileStatusNotifications";

export function FranchiseeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  useFileStatusNotifications();

  return (
    <div className="min-h-screen bg-background">
      <FranchiseeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className={sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"} style={{ transition: "margin-left 300ms" }}>
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton
        />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
