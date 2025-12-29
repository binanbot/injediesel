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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-injediesel.png";

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
          <Link to="/franqueado" className="flex items-center gap-2">
            <img src={logo} alt="Injediesel" className="h-8 w-auto" />
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

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
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                    <span className="flex-1">{item.label}</span>
                    
                    {notificationCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold animate-pulse">
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