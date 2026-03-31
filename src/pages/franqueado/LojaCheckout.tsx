import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ShoppingCart, Check, Loader2, Package, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { cn } from "@/lib/utils";

type CheckoutStep = "review" | "delivery" | "confirm";

type DeliveryAddress = {
  recipient_name: string;
  company_name: string;
  cnpj: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

type FranchiseProfile = {
  id: string;
  unit_name: string;
  company_name: string;
  cnpj: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  delivery_address?: DeliveryAddress | null;
};

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const buildWhatsAppMessage = (
  address: DeliveryAddress,
  items: CartItem[]
) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const itemsText = items
    .map((item, index) => {
      const subtotal = item.price * item.quantity;
      return (
        `${index + 1}. ${item.name}\n` +
        `Ref: ${item.sku || "-"}\n` +
        `Qtd: ${item.quantity}\n` +
        `Valor unitário: ${formatMoney(item.price)}\n` +
        `Subtotal: ${formatMoney(subtotal)}`
      );
    })
    .join("\n\n");

  return `
*NOVO PEDIDO PROMAX*

*DADOS DO FRANQUEADO*
Destinatário: ${address.recipient_name}
Razão Social: ${address.company_name}
CNPJ: ${address.cnpj}
Telefone: ${address.phone}
E-mail: ${address.email}

*ENDEREÇO DE ENTREGA*
Rua: ${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}
Bairro: ${address.district}
Cidade: ${address.city} - ${address.state}
CEP: ${address.zip_code}

*ITENS DO PEDIDO*

${itemsText}

*TOTAL DO PEDIDO: ${formatMoney(total)}*
`.trim();
};

const buildDefaultDeliveryAddress = (profile: FranchiseProfile): DeliveryAddress => ({
  recipient_name: profile.unit_name || "",
  company_name: profile.company_name || "",
  cnpj: profile.cnpj || "",
  phone: profile.phone || "",
  email: profile.email || "",
  zip_code: profile.zip_code || "",
  street: profile.street || "",
  number: profile.number || "",
  complement: profile.complement || "",
  district: profile.district || "",
  city: profile.city || "",
  state: profile.state || "",
});

const sendOrderToWhatsApp = (address: DeliveryAddress, items: CartItem[]) => {
  const phone = "5545998590384";
  if (!items.length) {
    toast.error("O carrinho está vazio.");
    return;
  }
  const message = buildWhatsAppMessage(address, items);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
};

export default function LojaCheckout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  const [step, setStep] = useState<CheckoutStep>("review");
  const [delivery, setDelivery] = useState<DeliveryAddress>({
    recipient_name: "",
    company_name: "",
    cnpj: "",
    phone: "",
    email: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["checkout-franchise-profile"],
    queryFn: async (): Promise<FranchiseProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });

      const [profileRes, unitRes] = await Promise.all([
        supabase
          .from("profiles_franchisees")
          .select("id, display_name, email, cnpj, first_name, last_name, cidade")
          .eq("user_id", user.id)
          .maybeSingle(),
        unitId
          ? supabase.from("units").select("name, city, state").eq("id", unitId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const p = profileRes.data;
      const u = unitRes.data;

      return {
        id: p?.id ?? "",
        unit_name: u?.name ?? "",
        company_name: p?.display_name ?? `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim(),
        cnpj: p?.cnpj ?? "",
        phone: "",
        email: p?.email ?? user.email ?? "",
        zip_code: "",
        street: "",
        number: "",
        complement: "",
        district: "",
        city: u?.city ?? p?.cidade ?? "",
        state: u?.state ?? "",
      };
    },
  });

  const prefillDelivery = () => {
    if (!profile) return;
    setDelivery((prev) => {
      const defaults = buildDefaultDeliveryAddress(profile);
      return Object.fromEntries(
        Object.keys(defaults).map((k) => [k, prev[k as keyof DeliveryAddress] || defaults[k as keyof DeliveryAddress]])
      ) as DeliveryAddress;
    });
  };

  const handleSendWhatsApp = () => {
    sendOrderToWhatsApp(delivery, items);
    clearCart();
    toast.success("Pedido enviado via WhatsApp!");
    navigate("/franqueado/loja");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/franqueado/loja")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a loja
        </Button>
        <div className="glass-card p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Carrinho vazio</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione produtos ao carrinho para continuar
          </p>
          <Button onClick={() => navigate("/franqueado/loja")}>Ir para a loja</Button>
        </div>
      </div>
    );
  }

  const steps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
    { key: "review", label: "Revisar", icon: ShoppingCart },
    { key: "delivery", label: "Entrega", icon: Package },
    { key: "confirm", label: "Enviar", icon: MessageCircle },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const updateField = (field: keyof DeliveryAddress, value: string) =>
    setDelivery((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/loja")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
          <p className="text-muted-foreground">Revise e envie seu pedido via WhatsApp</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors",
                index < currentStepIndex ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStepIndex ? "border-primary text-primary"
                  : "border-muted text-muted-foreground"
              )}>
                {index < currentStepIndex ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={cn("text-sm font-medium hidden sm:block", index === currentStepIndex ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {index < steps.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step: Review */}
          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Revise seu pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
                    <div className="h-16 w-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Ref: {item.sku ?? "-"}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity}x {formatMoney(item.price)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatMoney(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step: Delivery */}
          {step === "delivery" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Endereço de entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Destinatário</Label>
                    <Input placeholder="Nome do destinatário" value={delivery.recipient_name} onChange={(e) => updateField("recipient_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input placeholder="Razão social" value={delivery.company_name} onChange={(e) => updateField("company_name", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" value={delivery.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input placeholder="(00) 00000-0000" value={delivery.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input placeholder="email@exemplo.com" value={delivery.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input placeholder="00000-000" value={delivery.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Rua</Label>
                    <Input placeholder="Nome da rua" value={delivery.street} onChange={(e) => updateField("street", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input placeholder="Nº" value={delivery.number} onChange={(e) => updateField("number", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input placeholder="Apto, bloco, etc." value={delivery.complement} onChange={(e) => updateField("complement", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input placeholder="Bairro" value={delivery.district} onChange={(e) => updateField("district", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input placeholder={profile?.city || "Cidade"} value={delivery.city} onChange={(e) => updateField("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input placeholder={profile?.state || "UF"} value={delivery.state} onChange={(e) => updateField("state", e.target.value)} />
                  </div>
                </div>

                {profile && (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm space-y-1">
                    <p className="text-muted-foreground font-medium">Dados da unidade:</p>
                    <p>{profile.unit_name} • {profile.email}</p>
                    {profile.cnpj && <p>CNPJ: {profile.cnpj}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Confirme e envie via WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Dados do franqueado</p>
                  <p className="text-sm">{delivery.recipient_name || profile?.company_name} • {delivery.company_name || profile?.company_name}</p>
                  {delivery.cnpj && <p className="text-sm">CNPJ: {delivery.cnpj}</p>}
                  <p className="text-sm">{delivery.email || profile?.email}</p>
                  {delivery.phone && <p className="text-sm">Tel: {delivery.phone}</p>}
                </div>

                {delivery.street && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Endereço de entrega</p>
                    <p className="text-sm">
                      {delivery.street}, {delivery.number}{delivery.complement ? ` - ${delivery.complement}` : ""} — {delivery.district}
                    </p>
                    <p className="text-sm">
                      {delivery.city || profile?.city} - {delivery.state || profile?.state} • CEP: {delivery.zip_code}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Itens do pedido</p>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o pedido será enviado via <strong>WhatsApp</strong> para a equipe Promax com todos os detalhes preenchidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader><CardTitle className="text-lg">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span>
                <span>{formatMoney(total)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg text-primary">{formatMoney(total)}</span>
              </div>
              <div className="flex gap-2">
                {step !== "review" && (
                  <Button variant="outline" className="flex-1" onClick={() => {
                    const prev = steps[currentStepIndex - 1];
                    if (prev) setStep(prev.key);
                  }}>
                    Voltar
                  </Button>
                )}
                <Button
                  className={cn("flex-1 gap-2", step === "confirm" && "bg-green-600 hover:bg-green-700")}
                  onClick={() => {
                    if (step === "confirm") {
                      handleSendWhatsApp();
                    } else {
                      if (step === "review") prefillDelivery();
                      const next = steps[currentStepIndex + 1];
                      if (next) setStep(next.key);
                    }
                  }}
                >
                  {step === "confirm" ? (
                    <><MessageCircle className="h-4 w-4" />Enviar via WhatsApp</>
                  ) : (
                    "Continuar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
