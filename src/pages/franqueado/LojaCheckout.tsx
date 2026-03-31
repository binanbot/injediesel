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

interface FranchiseeData {
  unitName: string;
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

const formatMoney = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const buildWhatsAppMessage = (
  franchisee: FranchiseeData,
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
Unidade: ${franchisee.unitName}
Razão Social: ${franchisee.companyName}
CNPJ: ${franchisee.cnpj}
Telefone: ${franchisee.phone}
E-mail: ${franchisee.email}

*ENDEREÇO*
Rua: ${franchisee.street}, ${franchisee.number}
Bairro: ${franchisee.district}
Cidade: ${franchisee.city} - ${franchisee.state}
CEP: ${franchisee.zipCode}

*ITENS DO PEDIDO*

${itemsText}

*TOTAL DO PEDIDO: ${formatMoney(total)}*
`.trim();
};

const sendOrderToWhatsApp = (
  franchisee: FranchiseeData,
  items: CartItem[]
) => {
  const phone = "5545998590384";
  if (!items.length) {
    toast.error("O carrinho está vazio.");
    return;
  }
  const message = buildWhatsAppMessage(franchisee, items);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(url, "_blank");
};

export default function LojaCheckout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  const [step, setStep] = useState<CheckoutStep>("review");
  const [deliveryData, setDeliveryData] = useState({
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Fetch franchisee profile data
  const { data: franchiseeProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["checkout-franchisee-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });

      const [profileRes, unitRes] = await Promise.all([
        supabase
          .from("profiles_franchisees")
          .select("display_name, email, cnpj, first_name, last_name, cidade")
          .eq("user_id", user.id)
          .maybeSingle(),
        unitId
          ? supabase.from("units").select("name, city, state").eq("id", unitId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const profile = profileRes.data;
      const unit = unitRes.data;

      return {
        unitName: unit?.name ?? "",
        companyName: profile?.display_name ?? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
        cnpj: profile?.cnpj ?? "",
        phone: "",
        email: profile?.email ?? user.email ?? "",
        city: unit?.city ?? profile?.cidade ?? "",
        state: unit?.state ?? "",
      };
    },
  });

  const handleSendWhatsApp = () => {
    if (!franchiseeProfile) {
      toast.error("Dados do perfil não carregados");
      return;
    }

    const franchisee: FranchiseeData = {
      unitName: franchiseeProfile.unitName,
      companyName: franchiseeProfile.companyName,
      cnpj: franchiseeProfile.cnpj,
      phone: franchiseeProfile.phone,
      email: franchiseeProfile.email,
      street: deliveryData.street,
      number: deliveryData.number,
      district: deliveryData.district,
      city: deliveryData.city || franchiseeProfile.city,
      state: deliveryData.state || franchiseeProfile.state,
      zipCode: deliveryData.zipCode,
    };

    sendOrderToWhatsApp(franchisee, items);
    clearCart();
    toast.success("Pedido enviado via WhatsApp!");
    navigate("/franqueado/loja");
  };

  if (profileLoading) {
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      placeholder="Nome da rua"
                      value={deliveryData.street}
                      onChange={(e) => setDeliveryData((d) => ({ ...d, street: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      placeholder="Nº"
                      value={deliveryData.number}
                      onChange={(e) => setDeliveryData((d) => ({ ...d, number: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Bairro</Label>
                  <Input
                    id="district"
                    placeholder="Bairro"
                    value={deliveryData.district}
                    onChange={(e) => setDeliveryData((d) => ({ ...d, district: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder={franchiseeProfile?.city || "Cidade"}
                      value={deliveryData.city}
                      onChange={(e) => setDeliveryData((d) => ({ ...d, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder={franchiseeProfile?.state || "UF"}
                      value={deliveryData.state}
                      onChange={(e) => setDeliveryData((d) => ({ ...d, state: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    value={deliveryData.zipCode}
                    onChange={(e) => setDeliveryData((d) => ({ ...d, zipCode: e.target.value }))}
                  />
                </div>

                {franchiseeProfile && (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm space-y-1">
                    <p className="text-muted-foreground font-medium">Dados da unidade:</p>
                    <p>{franchiseeProfile.unitName} • {franchiseeProfile.email}</p>
                    {franchiseeProfile.cnpj && <p>CNPJ: {franchiseeProfile.cnpj}</p>}
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
                  <p className="text-sm">{franchiseeProfile?.unitName} • {franchiseeProfile?.companyName}</p>
                  {franchiseeProfile?.cnpj && <p className="text-sm">CNPJ: {franchiseeProfile.cnpj}</p>}
                  <p className="text-sm">{franchiseeProfile?.email}</p>
                </div>

                {deliveryData.street && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Endereço de entrega</p>
                    <p className="text-sm">
                      {deliveryData.street}, {deliveryData.number} — {deliveryData.district}
                    </p>
                    <p className="text-sm">
                      {deliveryData.city || franchiseeProfile?.city} - {deliveryData.state || franchiseeProfile?.state} • CEP: {deliveryData.zipCode}
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
                  <Button variant="outline" className="flex-1" onClick={() => { const prev = steps[currentStepIndex - 1]; if (prev) setStep(prev.key); }}>
                    Voltar
                  </Button>
                )}
                <Button
                  className={cn("flex-1 gap-2", step === "confirm" && "bg-green-600 hover:bg-green-700")}
                  onClick={() => {
                    if (step === "confirm") {
                      handleSendWhatsApp();
                    } else {
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
