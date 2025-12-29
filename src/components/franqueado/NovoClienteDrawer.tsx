import { useState } from "react";
import { X, UserPlus, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

interface NovoClienteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCriado: (cliente: { id: string; nome: string; telefone: string; email?: string; cidade?: string }) => void;
}

export function NovoClienteDrawer({ open, onOpenChange, onClienteCriado }: NovoClienteDrawerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    cidade: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e telefone do cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simula criação (mock)
    setTimeout(() => {
      const novoCliente = {
        id: `cli-${Date.now()}`,
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim() || undefined,
        cidade: formData.cidade.trim() || undefined,
      };

      onClienteCriado(novoCliente);
      setFormData({ nome: "", telefone: "", email: "", cidade: "" });
      setIsSubmitting(false);
      onOpenChange(false);

      toast({
        title: "Cliente cadastrado!",
        description: `${novoCliente.nome} foi adicionado com sucesso.`,
      });
    }, 800);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-card border-t border-border/30">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <span>Novo Cliente</span>
            </DrawerTitle>
            <DrawerDescription>
              Cadastre um novo cliente para vincular ao serviço.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="px-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do cliente *</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="glass-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="glass-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cidade"
                  placeholder="Cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <DrawerFooter className="px-0">
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Salvar cliente
                  </>
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
