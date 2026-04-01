import { useState } from "react";
import { UserPlus, Phone, Mail, MapPin } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface NovoClienteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCriado: (cliente: { id: string; full_name: string }) => void;
}

export function NovoClienteDrawer({ open, onOpenChange, onClienteCriado }: NovoClienteDrawerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address_city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e telefone do cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get unit_id via RPC
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { data: unitId, error: unitError } = await supabase.rpc("get_user_unit_id", {
        _user_id: userData.user.id,
      });

      if (unitError || !unitId) throw new Error("Unidade não encontrada");

      const { data, error } = await supabase
        .from("customers")
        .insert({
          unit_id: unitId,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address_city: formData.address_city.trim() || null,
          type: "PF",
        } as any)
        .select("id, full_name")
        .single();

      if (error) throw error;

      onClienteCriado({ id: data.id, full_name: data.full_name });
      setFormData({ full_name: "", phone: "", email: "", address_city: "" });
      onOpenChange(false);

      toast({
        title: "Cliente cadastrado!",
        description: `${data.full_name} foi adicionado com sucesso.`,
      });
    } catch (err: any) {
      console.error("Erro ao criar cliente:", err);
      toast({
        title: "Erro ao cadastrar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <span>Cadastro Rápido de Cliente</span>
            </DrawerTitle>
            <DrawerDescription>
              Preencha os dados básicos. Para cadastro completo, use a área de Clientes.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="px-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome do cliente *</Label>
              <Input
                id="full_name"
                placeholder="Nome completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="glass-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <Label htmlFor="address_city">Cidade</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address_city"
                  placeholder="Cidade"
                  value={formData.address_city}
                  onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
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
