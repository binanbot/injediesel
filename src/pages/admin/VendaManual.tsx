import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  User,
  Users,
  Phone,
  MessageSquare,
  Store,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchActiveSellers, type SellerRow } from "@/services/employeeService";
import { createManualSale, type ManualSaleItem } from "@/services/manualSaleService";
import { usePermissions } from "@/hooks/usePermissions";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const channelOptions = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "telefone", label: "Telefone", icon: Phone },
  { value: "balcao", label: "Balcão", icon: Store },
] as const;

type CartLine = ManualSaleItem & { _key: string };

export default function VendaManual() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { company } = useCompany();
  const { can } = usePermissions();
  const canAssignSeller = can("vendas", "assign_seller");

  const companyId = company?.id;

  // --- Customer search ---
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedSearch = useDebounce(customerSearch, 400);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [sellerAutoSuggested, setSellerAutoSuggested] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customer-search", debouncedSearch, companyId],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, cpf, cnpj, phone, email, unit_id, primary_seller_id")
        .or(
          `full_name.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%,cnpj.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`
        )
        .eq("is_active", true)
        .limit(10);
      return data || [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  // --- Sellers ---
  const { data: sellers = [] } = useQuery({
    queryKey: ["active-sellers", companyId],
    queryFn: () => fetchActiveSellers(companyId!, { canSellProducts: true }),
    enabled: !!companyId,
  });

  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [saleChannel, setSaleChannel] = useState<string>("");

  const selectedSeller = useMemo(
    () => sellers.find((s) => s.seller_profile?.id === selectedSellerId),
    [sellers, selectedSellerId]
  );

  // --- Cart lines ---
  const [lines, setLines] = useState<CartLine[]>([]);

  // --- Product search ---
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 400);

  const { data: products = [] } = useQuery({
    queryKey: ["product-search", debouncedProductSearch, companyId],
    queryFn: async () => {
      if (!debouncedProductSearch || debouncedProductSearch.length < 2) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price, available")
        .eq("available", true)
        .or(
          `name.ilike.%${debouncedProductSearch}%,sku.ilike.%${debouncedProductSearch}%`
        )
        .limit(10);
      return data || [];
    },
    enabled: debouncedProductSearch.length >= 2,
  });

  const addProduct = (product: any) => {
    const exists = lines.find((l) => l.product_id === product.id);
    if (exists) {
      setLines((prev) =>
        prev.map((l) =>
          l.product_id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        )
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          _key: crypto.randomUUID(),
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          unit_price: Number(product.price),
          quantity: 1,
          discount_amount: 0,
        },
      ]);
    }
    setProductSearch("");
  };

  const updateLine = (key: string, field: keyof CartLine, value: number) => {
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, [field]: value } : l))
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  // --- Totals ---
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const totalDiscount = lines.reduce((s, l) => s + l.discount_amount * l.quantity, 0);
  const totalAmount = subtotal - totalDiscount;
  const maxDiscountPct = selectedSeller?.seller_profile?.max_discount_pct || 0;
  const currentDiscountPct = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const discountExceeded = currentDiscountPct > maxDiscountPct;

  // --- Notes / payment ---
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // --- Franchise profile (needed for order) ---
  const { data: franchiseProfile } = useQuery({
    queryKey: ["franchise-profile-for-sale", selectedCustomer?.unit_id],
    queryFn: async () => {
      if (!selectedCustomer?.unit_id) return null;
      const { data } = await supabase
        .from("units")
        .select("franchisee_id")
        .eq("id", selectedCustomer.unit_id)
        .single();
      return data;
    },
    enabled: !!selectedCustomer?.unit_id,
  });

  // --- Submit ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error("Selecione um cliente");
      if (!selectedSellerId) throw new Error("Selecione um vendedor");
      if (!saleChannel) throw new Error("Selecione o canal da venda");
      if (!lines.length) throw new Error("Adicione pelo menos um item");
      if (!franchiseProfile?.franchisee_id)
        throw new Error("Unidade do cliente não encontrada");

      return createManualSale({
        customer_id: selectedCustomer.id,
        seller_profile_id: selectedSellerId,
        sale_channel: saleChannel as "whatsapp" | "telefone" | "balcao",
        franchise_profile_id: franchiseProfile.franchisee_id,
        unit_id: selectedCustomer.unit_id,
        company_id: companyId,
        items: lines.map(({ _key, ...rest }) => rest),
        payment_method: paymentMethod || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-ranking"] });
      toast.success("Venda manual registrada com sucesso!");
      navigate(-1);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // If user has their own seller profile, preselect it
  const ownSeller = useMemo(
    () => sellers.find((s) => s.user_id === user?.id),
    [sellers, user]
  );

  // Filter sellers for assignment
  const assignableSellers = useMemo(() => {
    if (canAssignSeller) return sellers;
    return ownSeller ? [ownSeller] : [];
  }, [sellers, canAssignSeller, ownSeller]);

  // Filter sellers by selected channel
  const channelFilteredSellers = useMemo(() => {
    if (!saleChannel) return assignableSellers;
    return assignableSellers.filter((s) => {
      const channels = (s.seller_profile as any)?.allowed_sales_channels || ["whatsapp", "telefone", "balcao"];
      return channels.includes(saleChannel);
    });
  }, [assignableSellers, saleChannel]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Venda Manual Assistida
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre uma venda e atribua ao vendedor responsável
          </p>
        </div>
      </div>

      {/* Block 1: Customer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
              <div>
                <p className="font-medium">{selectedCustomer.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.cpf || selectedCustomer.cnpj} • {selectedCustomer.phone || selectedCustomer.email || ""}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setSellerAutoSuggested(false); setSelectedSellerId(""); }}>
                Trocar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nome, CPF, CNPJ ou telefone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              {customers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-secondary/50 border-b last:border-b-0 transition-colors"
                     onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                        // Auto-suggest primary seller
                        if (c.primary_seller_id) {
                          const match = sellers.find((s) => s.seller_profile?.id === c.primary_seller_id);
                          if (match) {
                            setSelectedSellerId(c.primary_seller_id);
                            setSellerAutoSuggested(true);
                          }
                        } else {
                          setSellerAutoSuggested(false);
                        }
                      }
                    >
                      <p className="text-sm font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.cpf || c.cnpj || ""} {c.phone ? `• ${c.phone}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 2: Commercial Attribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Atribuição Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Canal da venda *</Label>
              <Select value={saleChannel} onValueChange={setSaleChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value}>
                      <span className="flex items-center gap-2">
                        <ch.icon className="h-4 w-4" />
                        {ch.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vendedor responsável *</Label>
              <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {channelFilteredSellers.map((s) => (
                    <SelectItem key={s.seller_profile!.id} value={s.seller_profile!.id}>
                      {s.display_name || "Sem nome"} ({s.seller_profile!.seller_mode === "ecu" ? "ECU" : s.seller_profile!.seller_mode === "parts" ? "Peças" : "Misto"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canAssignSeller && (
                <p className="text-xs text-muted-foreground">
                  Você só pode atribuir vendas a si mesmo.
                </p>
              )}
            </div>
          </div>

          {/* Operator info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <User className="h-4 w-4" />
            <span>Operador: <strong>{user?.email}</strong></span>
            {selectedSellerId && ownSeller?.seller_profile?.id !== selectedSellerId && (
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atribuída a terceiro
              </Badge>
            )}
            {sellerAutoSuggested && selectedCustomer?.primary_seller_id === selectedSellerId && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vendedor da carteira
              </Badge>
            )}
            {selectedCustomer?.primary_seller_id && selectedSellerId && selectedCustomer.primary_seller_id !== selectedSellerId && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fora da carteira
              </Badge>
            )}
          </div>

          {/* Seller capabilities */}
          {selectedSeller && (
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedSeller.seller_profile?.commission_enabled ? "default" : "outline"} className="text-xs">
                {selectedSeller.seller_profile?.commission_enabled ? "✓" : "✗"} Comissão
              </Badge>
              <Badge variant={selectedSeller.seller_profile?.target_enabled ? "default" : "outline"} className="text-xs">
                {selectedSeller.seller_profile?.target_enabled ? "✓" : "✗"} Meta
              </Badge>
              <Badge variant="outline" className="text-xs">
                Desc. máx: {selectedSeller.seller_profile?.max_discount_pct || 0}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3: Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Itens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar produto por nome ou SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          {products.length > 0 && productSearch && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 hover:bg-secondary/50 border-b last:border-b-0 flex items-center justify-between transition-colors"
                  onClick={() => addProduct(p)}
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="text-sm font-bold">{fmtCurrency(Number(p.price))}</span>
                </button>
              ))}
            </div>
          )}

          {/* Cart lines */}
          {lines.length > 0 ? (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <span className="col-span-4">Produto</span>
                <span className="col-span-2 text-right">Preço</span>
                <span className="col-span-2 text-center">Qtd</span>
                <span className="col-span-2 text-right">Desc. (R$)</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              {lines.map((line) => {
                const lineTotal = (line.unit_price - line.discount_amount) * line.quantity;
                return (
                  <div
                    key={line._key}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border bg-secondary/20"
                  >
                    <div className="col-span-4">
                      <p className="text-sm font-medium truncate">{line.product_name}</p>
                      <p className="text-xs text-muted-foreground">{line.product_sku}</p>
                    </div>
                    <div className="col-span-2 text-right text-sm">
                      {fmtCurrency(line.unit_price)}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Input
                        type="number"
                        min={1}
                        className="w-16 h-8 text-center text-sm"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line._key, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-sm text-right"
                        value={line.discount_amount}
                        onChange={(e) =>
                          updateLine(line._key, "discount_amount", Math.max(0, parseFloat(e.target.value) || 0))
                        }
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-bold">
                      {fmtCurrency(lineTotal)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLine(line._key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Busque e adicione produtos acima.
            </div>
          )}

          {/* Totals */}
          {lines.length > 0 && (
            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmtCurrency(subtotal)}</span>
              </div>
              <div className={cn("flex justify-between", discountExceeded && "text-destructive")}>
                <span>
                  Desconto ({currentDiscountPct.toFixed(1)}%)
                  {discountExceeded && (
                    <AlertTriangle className="inline h-3 w-3 ml-1" />
                  )}
                </span>
                <span>-{fmtCurrency(totalDiscount)}</span>
              </div>
              {discountExceeded && (
                <p className="text-xs text-destructive">
                  Desconto excede o máximo de {maxDiscountPct}% permitido para este vendedor.
                </p>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{fmtCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 4: Payment & Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pagamento e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="nao_definido">Não definido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações internas da venda..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <p>
                <strong>Operador:</strong> {user?.email}
              </p>
              <p>
                <strong>Vendedor:</strong>{" "}
                {selectedSeller?.display_name || "Não selecionado"}
              </p>
              <p>
                <strong>Canal:</strong>{" "}
                {channelOptions.find((c) => c.value === saleChannel)?.label || "Não selecionado"}
              </p>
              <p>
                <strong>Total:</strong> {fmtCurrency(totalAmount)}
              </p>
            </div>
            <Button
              size="lg"
              disabled={
                submitMutation.isPending ||
                !selectedCustomer ||
                !selectedSellerId ||
                !saleChannel ||
                !lines.length ||
                discountExceeded
              }
              onClick={() => submitMutation.mutate()}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                "Registrando..."
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Registrar Venda
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
