import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Upload,
  FolderOpen,
  RefreshCw,
  HeadphonesIcon,
  BookOpen,
  Palette,
  MessageSquare,
  User,
  LogOut,
  X,
  Bell,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

// Dados mockados de notificações - em produção viriam do banco de dados
const notifications: Record<string, number> = {
  "/franqueado/arquivos": 2, // 2 arquivos prontos para download
  "/franqueado/atualizacoes": 3, // 3 novas atualizações
  "/franqueado/mensagens": 2, // 2 mensagens não lidas
};

const menuItems = [
  { icon: Home, label: "Página Inicial", path: "/franqueado" },
  { icon: Upload, label: "Enviar Arquivo", path: "/franqueado/enviar" },
  { icon: FolderOpen, label: "Meus Arquivos", path: "/franqueado/arquivos" },
  { icon: BarChart3, label: "Relatórios", path: "/franqueado/relatorios" },
  { icon: RefreshCw, label: "Atualizações", path: "/franqueado/atualizacoes" },
  { icon: HeadphonesIcon, label: "Suporte", path: "/franqueado/suporte" },
  { icon: BookOpen, label: "Tutoriais", path: "/franqueado/tutoriais" },
  { icon: Palette, label: "Materiais MKT", path: "/franqueado/materiais" },
  { icon: MessageSquare, label: "Mensagens", path: "/franqueado/mensagens" },
  { icon: User, label: "Perfil", path: "/franqueado/perfil" },
];

interface FranchiseeSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FranchiseeSidebar({ isOpen = true, onClose }: FranchiseeSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 glass-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/20">
          <Link to="/franqueado" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-secondary/50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const notificationCount = notifications[item.path] || 0;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {/* Glow effect - solid light point on right with gradient propagation */}
                    {isActive && (
                      <>
                        {/* Background gradient from right to left */}
                        <div className="absolute inset-0 bg-gradient-to-l from-primary/25 via-primary/10 to-transparent rounded-xl" />
                        {/* Solid light bar on right edge */}
                        <div className="absolute right-0 top-1 bottom-1 w-1 bg-primary rounded-full shadow-[0_0_12px_4px_hsl(var(--primary)/0.6)]" />
                        {/* Light propagation glow */}
                        <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-primary/20 to-transparent blur-sm" />
                      </>
                    )}
                    <item.icon className={cn(
                      "relative z-10 h-5 w-5 transition-all duration-300",
                      isActive ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="relative z-10 flex-1">{item.label}</span>
                    
                    {notificationCount > 0 && (
                      <span className="relative z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
                        <Bell className="h-3 w-3" />
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border/20">
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  );
}
