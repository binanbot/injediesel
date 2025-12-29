import { Bell, Search, Menu } from "lucide-react";
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

interface TopbarProps {
  unitName?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Topbar({ unitName = "Unidade São Paulo", onMenuClick, showMenuButton = false }: TopbarProps) {
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
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer focus:bg-secondary/50">
                <span className="font-medium text-foreground">Contrato próximo do vencimento</span>
                <span className="text-xs text-muted-foreground">Seu contrato vence em 15 dias</span>
              </DropdownMenuItem>
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
