import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FranchiseeSidebar } from "./FranchiseeSidebar";
import { Topbar } from "./Topbar";
import { useFileStatusNotifications } from "@/hooks/useFileStatusNotifications";

export function FranchiseeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Escuta notificações de mudança de status de arquivos
  useFileStatusNotifications();

  return (
    <div className="min-h-screen bg-background">
      <FranchiseeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Topbar 
          unitName="Unidade São Paulo" 
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
