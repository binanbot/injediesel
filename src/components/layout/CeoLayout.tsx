import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CeoSidebar } from "./CeoSidebar";
import { Topbar } from "./Topbar";
import { CeoFiltersProvider } from "@/contexts/CeoFiltersContext";
import { CeoGlobalFilterBar } from "@/components/ceo/CeoGlobalFilterBar";

export function CeoLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <CeoSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className={sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"} style={{ transition: "margin-left 300ms" }}>
        <Topbar
          unitName="CEO"
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton
        />
        <CeoFiltersProvider>
          <CeoGlobalFilterBar />
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </CeoFiltersProvider>
      </div>
    </div>
  );
}
