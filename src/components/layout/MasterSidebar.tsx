import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Globe,
  Users,
  Shield,
  Settings,
  LogOut,
  X,
  FileText,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/master" },
  { icon: Building2, label: "Empresas", path: "/master/empresas" },
  { icon: Globe, label: "Domínios", path: "/master/dominios" },
  { icon: Users, label: "Usuários", path: "/master/usuarios" },
  { icon: Shield, label: "Permissões", path: "/master/permissoes" },
  { icon: BarChart3, label: "Relatórios Globais", path: "/master/relatorios" },
  { icon: Settings, label: "Configurações", path: "/master/configuracoes" },
  { icon: FileText, label: "Documentação", path: "/master/documentacao" },
];

interface MasterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function MasterSidebar({ isOpen = true, onClose, collapsed = false, onToggleCollapse }: MasterSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-16 w-64" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/master" className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">MASTER</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="hidden lg:flex hover:bg-secondary/50" title={collapsed ? "Expandir menu" : "Recolher menu"}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-secondary/50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                      collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5",
                      isActive ? "text-amber-400" : "text-sidebar-foreground hover:text-foreground"
                    )}
                  >
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-l from-amber-400/0 via-amber-400/0 to-transparent opacity-0 group-hover:from-amber-400/10 group-hover:via-amber-400/5 group-hover:opacity-100 transition-all duration-300" />
                    )}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-l from-amber-400/25 via-amber-400/10 to-transparent rounded-xl" />
                        <div className="absolute right-0 top-1 bottom-1 w-1 bg-amber-400 rounded-full shadow-[0_0_12px_4px_rgb(251_191_36/0.6)]" />
                        <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-amber-400/20 to-transparent blur-sm" />
                      </>
                    )}
                    <item.icon className={cn(
                      "relative z-10 h-5 w-5 transition-all duration-300",
                      isActive ? "text-amber-400 drop-shadow-[0_0_6px_rgb(251_191_36)]" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {!collapsed && <span className="relative z-10 flex-1">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200",
              collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"
            )}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>
    </>
  );
}
