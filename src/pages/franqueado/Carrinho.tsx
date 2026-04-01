import { useNavigate } from "react-router-dom";
import { ShoppingCart, ShoppingBag, Plus, Minus, Trash2, CreditCard, Landmark, QrCode, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/stores/useCartStore";
import { useState } from "react";

const paymentMethods = [
  { id: "pix", label: "PIX", icon: QrCode, description: "Pagamento instantâneo" },
  { id: "boleto", label: "Boleto Bancário", icon: Landmark, description: "Vencimento em 3 dias úteis" },
  { id: "cartao_credito", label: "Cartão de Crédito", icon: CreditCard, description: "Até 12x sem juros" },
];

export default function Carrinho() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [installments, setInstallments] = useState("1");

  const { items, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCheckout = () => {
    navigate("/franqueado/loja/checkout", {
      state: { paymentMethod, installments: parseInt(installments) },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/loja")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Meu Carrinho
          </h1>
          <p className="text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "itens"} no carrinho
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-lg">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">
                Adicione produtos da loja para continuar
              </p>
            </div>
            <Button onClick={() => navigate("/franqueado/loja")}>
              <Package className="h-4 w-4 mr-2" />
              Ver produtos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
                <CardDescription>Revise os itens do seu pedido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-muted/20">
                    <div className="h-20 w-20 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{item.name}</p>
                      {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatPrice(item.price)} cada
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment & Summary */}
          <div className="space-y-4">
            <Card className="glass-card border border-amber-600/40 bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                        <method.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {paymentMethod === "credit" && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <Label htmlFor="installments" className="text-sm">Parcelas</Label>
                    <Select value={installments} onValueChange={setInstallments}>
                      <SelectTrigger id="installments" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x de {formatPrice(total / n)} {n <= 6 ? "sem juros" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} itens)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
                {paymentMethod === "credit" && parseInt(installments) > 1 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {installments}x de {formatPrice(total / parseInt(installments))}
                  </p>
                )}
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg" onClick={handleCheckout}>
                  Finalizar Compra
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/franqueado/loja")}>
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
