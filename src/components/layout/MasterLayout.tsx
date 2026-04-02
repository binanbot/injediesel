import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MasterSidebar } from "./MasterSidebar";
import { Topbar } from "./Topbar";

export function MasterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MasterSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className={sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"} style={{ transition: "margin-left 300ms" }}>
        <Topbar
          unitName="Master Admin"
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
