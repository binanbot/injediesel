import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileDown,
  MapPin,
  MessageSquare,
  Headphones,
  BarChart3,
  Settings,
  LogOut,
  X,
  ImageIcon,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Franqueados", path: "/admin/franqueados" },
  { icon: FileDown, label: "Arquivos Recebidos", path: "/admin/arquivos" },
  { icon: AlertCircle, label: "Correções", path: "/admin/correcoes" },
  { icon: ImageIcon, label: "Banners", path: "/admin/banners" },
  { icon: MapPin, label: "Áreas de Atuação", path: "/admin/areas" },
  { icon: Headphones, label: "Suporte", path: "/admin/suporte" },
  { icon: MessageSquare, label: "Mensagens", path: "/admin/mensagens" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
  { icon: FileText, label: "Documentação", path: "/admin/documentacao" },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">ADM</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
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
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group overflow-hidden",
                      isActive
                        ? "text-white"
                        : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Hover glow effect for non-active items */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-l from-primary/0 via-primary/0 to-transparent opacity-0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:opacity-100 transition-all duration-300" />
                    )}
                    {/* Active glow effect - solid light point on right with gradient propagation */}
                    {isActive && (
                      <>
                        {/* Background gradient from right to left */}
                        <div className="absolute inset-0 bg-gradient-to-l from-primary/25 via-primary/10 to-transparent rounded-lg" />
                        {/* Solid light bar on right edge */}
                        <div className="absolute right-0 top-1 bottom-1 w-1 bg-primary rounded-full shadow-[0_0_12px_4px_hsl(var(--primary)/0.6)]" />
                        {/* Light propagation glow */}
                        <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-primary/20 to-transparent blur-sm" />
                      </>
                    )}
                    <item.icon className={cn(
                      "relative z-10 h-5 w-5 transition-all duration-300",
                      isActive && "text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )} />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  );
}
