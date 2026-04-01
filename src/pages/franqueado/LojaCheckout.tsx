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
import { toast } from "sonner";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { cn } from "@/lib/utils";
import { createOrderFromCart } from "@/services/orderService";
import {
  DeliveryAddressForm,
  DeliveryAddress,
  FranchiseProfile,
  emptyAddress,
  buildDefaultDeliveryAddress,
} from "@/components/franqueado/DeliveryAddressForm";

type CheckoutStep = "review" | "delivery" | "confirm";

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const buildWhatsAppMessage = (address: DeliveryAddress, items: CartItem[]) => {
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
Responsável: ${address.recipient_name}
Razão Social: ${address.company_name}
CNPJ: ${address.cnpj}
Telefone: ${address.phone}
E-mail: ${address.email}

*ENDEREÇO DE ENTREGA*
${address.street}, ${address.number}
${address.complement ? `Complemento: ${address.complement}` : ""}
Bairro: ${address.district}
Cidade: ${address.city} - ${address.state}
CEP: ${address.zip_code}

*ITENS DO PEDIDO*

${itemsText}

*TOTAL DO PEDIDO: ${formatMoney(total)}*
`.trim();
};

export default function LojaCheckout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  const [step, setStep] = useState<CheckoutStep>("review");
  const [delivery, setDelivery] = useState<DeliveryAddress>(emptyAddress);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["checkout-franchise-profile"],
    queryFn: async (): Promise<FranchiseProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });

      const [profileRes, unitRes] = await Promise.all([
        supabase
          .from("profiles_franchisees")
          .select("id, display_name, email, cnpj, first_name, last_name, cidade, delivery_address, phone, zip_code, street, address_number, complement, district, state")
          .eq("user_id", user.id)
          .maybeSingle(),
        unitId
          ? supabase.from("units").select("name, city, state").eq("id", unitId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const p = profileRes.data;
      const u = unitRes.data;

      const fp: FranchiseProfile = {
        id: p?.id ?? "",
        unit_name: u?.name ?? "",
        company_name: p?.display_name ?? `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim(),
        cnpj: p?.cnpj ?? "",
        phone: (p as any)?.phone ?? "",
        email: p?.email ?? user.email ?? "",
        zip_code: (p as any)?.zip_code ?? "",
        street: (p as any)?.street ?? "",
        number: (p as any)?.address_number ?? "",
        complement: (p as any)?.complement ?? "",
        district: (p as any)?.district ?? "",
        city: u?.city ?? p?.cidade ?? "",
        state: u?.state ?? (p as any)?.state ?? "",
        delivery_address: p?.delivery_address as DeliveryAddress | null,
      };

      return fp;
    },
  });

  const prefillDelivery = () => {
    if (!profile) return;
    if (profile.delivery_address) {
      setDelivery(profile.delivery_address);
    } else {
      setDelivery(buildDefaultDeliveryAddress(profile));
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSendWhatsApp = async () => {
    const phone = "5545998590384";
    if (!items.length) {
      toast.error("O carrinho está vazio.");
      return;
    }
    if (!profile?.id) {
      toast.error("Perfil não encontrado.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });

      const order = await createOrderFromCart({
        items,
        delivery,
        franchiseProfileId: profile.id,
        unitId: unitId ?? null,
      });

      const message = buildWhatsAppMessage(delivery, items);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
      clearCart();
      toast.success(`Pedido ${order.order_number} criado e enviado via WhatsApp!`);
      navigate("/franqueado/meus-pedidos");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao criar pedido.");
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-sm text-muted-foreground mb-4">Adicione produtos ao carrinho para continuar</p>
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
        <Button variant="ghost" size="icon" onClick={() => {
          if (step === "review") {
            navigate("/franqueado/loja");
          } else {
            const prev = steps[currentStepIndex - 1];
            if (prev) setStep(prev.key);
          }
        }}>
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
              <CardContent className="pt-6">
                <DeliveryAddressForm
                  address={delivery}
                  onChange={setDelivery}
                  profile={profile}
                  showSaveButton
                />
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
                  <p className="text-sm">{delivery.recipient_name} • {delivery.company_name}</p>
                  {delivery.cnpj && <p className="text-sm">CNPJ: {delivery.cnpj}</p>}
                  <p className="text-sm">{delivery.email}</p>
                  {delivery.phone && <p className="text-sm">Tel: {delivery.phone}</p>}
                </div>

                {delivery.street && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Endereço de entrega</p>
                    <p className="text-sm">
                      {delivery.street}, {delivery.number}{delivery.complement ? ` - ${delivery.complement}` : ""} — {delivery.district}
                    </p>
                    <p className="text-sm">
                      {delivery.city} - {delivery.state} • CEP: {delivery.zip_code}
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
                    Ao confirmar, o pedido será enviado via <strong>WhatsApp</strong> para a equipe Promax.
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
                  className={cn("flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white", step === "confirm" && "bg-green-700 hover:bg-green-800")}
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
