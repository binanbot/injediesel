import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/loja/ProductCard";
import { CartDrawer } from "@/components/loja/CartDrawer";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string;
  ref: string | null;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  promo_type: "percent" | "fixed" | null;
  promo_value: number | null;
  available: boolean;
  category: string | null;
  image_url: string | null;
  description_short: string | null;
  models: string[] | null;
}

export default function Loja() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { items, addItem, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Extract unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = products
      .map((p) => p.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(search);
        const matchesRef = product.ref?.toLowerCase().includes(search);
        const matchesSku = product.sku.toLowerCase().includes(search);
        const matchesModels = product.models?.some((m) => 
          m.toLowerCase().includes(search)
        );
        return matchesName || matchesRef || matchesSku || matchesModels;
      }
      return true;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const hasPromo = product.promo_price && product.promo_type && product.promo_value;
    const displayPrice = hasPromo ? product.promo_price! : product.price;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: displayPrice,
        image: product.image_url ?? undefined,
      });
    }
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho`);
  };

  const itemCount = getItemCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Loja Promax Peças</h1>
          <p className="text-muted-foreground">
            Encontre peças e equipamentos para sua oficina
          </p>
        </div>
        <CartDrawer
          isOpen={isCartOpen}
          onOpenChange={setIsCartOpen}
          items={items}
          total={getTotal()}
          itemCount={itemCount}
          onUpdateQuantity={(itemId, quantity) => updateQuantity(itemId, quantity)}
          onRemoveItem={(itemId) => removeItem(itemId)}
          isUpdating={false}
        />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, referência ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Busca: {searchTerm}
                <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {!productsLoading && (
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      )}

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou realizar outra busca
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              isAdding={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
