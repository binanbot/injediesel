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
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  sku: string;
  ref: string | null;
  name: string;
  brand: string;
  price: number;
  available: boolean;
  category: string | null;
  image_url: string | null;
  description_short: string | null;
  models: string[] | null;
}

export default function Loja() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const {
    cart,
    isLoading: cartLoading,
    isOpen,
    setIsOpen,
    addItem,
    updateQuantity,
    removeItem,
    itemCount,
  } = useCart();

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
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // Search filter
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

  const handleAddToCart = (productId: string) => {
    addItem.mutate({ productId });
  };

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
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          items={cart?.items || []}
          total={cart?.total || 0}
          itemCount={itemCount}
          onUpdateQuantity={(itemId, quantity) => 
            updateQuantity.mutate({ itemId, quantity })
          }
          onRemoveItem={(itemId) => removeItem.mutate(itemId)}
          isUpdating={updateQuantity.isPending || removeItem.isPending}
        />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, referência ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
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

        {/* Active Filters */}
        {(searchTerm || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Busca: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!productsLoading && (
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      )}

      {/* Products Grid */}
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
              isAdding={addItem.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
