import { Bell, Search, Menu, Clock, AlertTriangle, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useContractStatus } from "@/hooks/useContractStatus";
import { useCart } from "@/hooks/useCart";
interface TopbarProps {
  unitName?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Topbar({ unitName = "Unidade São Paulo", onMenuClick, showMenuButton = false }: TopbarProps) {
  const contractStatus = useContractStatus();
  const showContractAlert = contractStatus.isNearExpiration || contractStatus.isExpired;
  const { itemCount, setIsOpen } = useCart();
  const navigate = useNavigate();
  return (
    <header className="h-16 glass-topbar sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-64 lg:w-80 pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-secondary/50"
            onClick={() => navigate("/franqueado/loja/carrinho")}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                {itemCount > 9 ? "9+" : itemCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-secondary/50">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card border-border/40">
              <DropdownMenuLabel className="text-foreground">Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer focus:bg-secondary/50">
                <span className="font-medium text-foreground">Arquivo processado</span>
                <span className="text-xs text-muted-foreground">Seu arquivo ABC-1234 foi concluído</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer focus:bg-secondary/50">
                <span className="font-medium text-foreground">Nova atualização disponível</span>
                <span className="text-xs text-muted-foreground">AlienTech v3.2 disponível para download</span>
              </DropdownMenuItem>
              {showContractAlert && (
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-warning/10">
                  <Link to="/franqueado/perfil" className="flex items-start gap-2 p-2">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${contractStatus.isExpired ? "text-destructive" : "text-warning"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${contractStatus.isExpired ? "text-destructive" : "text-warning"}`}>
                          {contractStatus.isExpired ? "Contrato vencido" : "Contrato próximo do vencimento"}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={contractStatus.isExpired 
                            ? "bg-destructive/20 text-destructive border-destructive/40 text-xs animate-pulse" 
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs"
                          }
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {contractStatus.isExpired 
                            ? "Vencido" 
                            : `${contractStatus.daysRemaining} dias`
                          }
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Clique para renovar agora</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border/30">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{unitName}</p>
              <p className="text-xs text-muted-foreground">Franqueado</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-secondary/50">
                  <Avatar className="h-10 w-10 border border-border/30">
                    <AvatarImage src="/placeholder.svg" alt="Avatar" />
                    <AvatarFallback className="bg-primary/20 text-primary">SP</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-border/40">
                <DropdownMenuLabel className="text-foreground">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem className="focus:bg-secondary/50 text-foreground">Perfil</DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-secondary/50 text-foreground">Configurações</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
