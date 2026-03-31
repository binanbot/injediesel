import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  QrCode, 
  FileText,
  Check,
  Loader2,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

type PaymentMethod = "pix" | "card" | "boleto";
type CheckoutStep = "review" | "payment" | "confirm";

export default function LojaCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, clearCart, isLoading: cartLoading } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>("review");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [installments, setInstallments] = useState<number>(1);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: async () => {
      if (!cart || cart.items.length === 0) {
        throw new Error("Carrinho vazio");
      }

      // Get user's unit_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase
        .rpc("get_user_unit_id", { _user_id: user.id });

      if (!unitId) throw new Error("Unidade não encontrada");

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          unit_id: unitId,
          total: cart.total,
          payment_method: paymentMethod,
          installments: paymentMethod === "pix" ? 1 : installments,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart after successful order
      await clearCart.mutateAsync();

      return order;
    },
    onSuccess: (order) => {
      toast.success("Pedido realizado com sucesso!");
      navigate("/franqueado/loja/pedidos/" + order.id);
    },
    onError: (error) => {
      toast.error("Erro ao finalizar pedido: " + error.message);
    },
  });

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
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
          <Button onClick={() => navigate("/franqueado/loja")}>
            Ir para a loja
          </Button>
        </div>
      </div>
    );
  }

  const steps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
    { key: "review", label: "Revisar", icon: ShoppingCart },
    { key: "payment", label: "Pagamento", icon: CreditCard },
    { key: "confirm", label: "Confirmar", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/loja")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Finalizar Compra</h1>
          <p className="text-muted-foreground">
            Complete seu pedido em poucos passos
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors",
                  index < currentStepIndex
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStepIndex
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  index === currentStepIndex ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-border mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Revise seu pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
                    <div className="h-16 w-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => {
                    setPaymentMethod(v as PaymentMethod);
                    if (v === "pix") setInstallments(1);
                  }}
                  className="space-y-3"
                >
                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium">Pix</p>
                          <p className="text-sm text-muted-foreground">
                            Pagamento à vista via Pix
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium">Cartão de Crédito</p>
                          <p className="text-sm text-muted-foreground">
                            Parcele em até 4x
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === "boleto" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium">Boleto Bancário</p>
                          <p className="text-sm text-muted-foreground">
                            Parcele em até 4x
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Installments */}
                {(paymentMethod === "card" || paymentMethod === "boleto") && (
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select 
                      value={String(installments)} 
                      onValueChange={(v) => setInstallments(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de {formatPrice(cart.total / n)}
                            {n === 1 ? " à vista" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === "confirm" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Confirme seu pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Forma de pagamento</p>
                  <p className="font-medium flex items-center gap-2">
                    {paymentMethod === "pix" && <QrCode className="h-4 w-4" />}
                    {paymentMethod === "card" && <CreditCard className="h-4 w-4" />}
                    {paymentMethod === "boleto" && <FileText className="h-4 w-4" />}
                    {paymentMethod === "pix" ? "Pix" : paymentMethod === "card" ? "Cartão de Crédito" : "Boleto"}
                    {paymentMethod !== "pix" && ` - ${installments}x de ${formatPrice(cart.total / installments)}`}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Itens do pedido</p>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, você concorda com os termos de compra e será gerado um pedido que deverá ser pago conforme a forma de pagamento selecionada.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({cart.items.length} {cart.items.length === 1 ? "item" : "itens"})
                  </span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg text-primary">{formatPrice(cart.total)}</span>
              </div>

              {paymentMethod !== "pix" && installments > 1 && step !== "review" && (
                <p className="text-sm text-muted-foreground text-center">
                  ou {installments}x de {formatPrice(cart.total / installments)}
                </p>
              )}

              <div className="flex gap-2">
                {step !== "review" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const prevStep = steps[currentStepIndex - 1];
                      if (prevStep) setStep(prevStep.key);
                    }}
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (step === "confirm") {
                      createOrder.mutate();
                    } else {
                      const nextStep = steps[currentStepIndex + 1];
                      if (nextStep) setStep(nextStep.key);
                    }
                  }}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : step === "confirm" ? (
                    "Confirmar Pedido"
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
