import { Link, useLocation, useNavigate } from "react-router-dom";
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
  GraduationCap,
  Facebook,
  Instagram,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useSocialLinks } from "@/hooks/useSocialLinks";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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
  { icon: ShoppingBag, label: "Loja Promax", path: "/franqueado/loja" },
  { icon: ShoppingCart, label: "Meu Carrinho", path: "/franqueado/loja/carrinho" },
  { icon: BarChart3, label: "Relatórios", path: "/franqueado/relatorios" },
  { icon: RefreshCw, label: "Atualizações", path: "/franqueado/atualizacoes" },
  { icon: HeadphonesIcon, label: "Suporte", path: "/franqueado/suporte" },
  { icon: GraduationCap, label: "Cursos", path: "/franqueado/cursos" },
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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { socialLinks, loading: loadingSocial } = useSocialLinks();
  const { itemCount } = useCart();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const hasSocialLinks = !loadingSocial && (
    socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.shop
  );

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
              // Use cart item count for cart menu item
              const isCartItem = item.path === "/franqueado/loja/carrinho";
              const notificationCount = isCartItem ? itemCount : (notifications[item.path] || 0);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground hover:text-foreground"
                    )}
                  >
                    {/* Hover glow effect for non-active items */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-l from-primary/0 via-primary/0 to-transparent opacity-0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:opacity-100 transition-all duration-300" />
                    )}
                    {/* Active glow effect - solid light point on right with gradient propagation */}
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

        {/* Social Links */}
        {hasSocialLinks && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-center gap-3">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-600/10 transition-all duration-200"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-all duration-200"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  title="TikTok"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              )}
              {socialLinks.shop && (
                <a
                  href={socialLinks.shop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-600/10 transition-all duration-200"
                  title="Loja"
                >
                  <ShoppingBag className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-border/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
