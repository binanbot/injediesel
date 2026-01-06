import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  isAdding?: boolean;
}

export function ProductCard({ product, onAddToCart, isAdding }: ProductCardProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full group hover:border-primary/30 transition-all duration-300">
      {/* Image */}
      <div className="aspect-square mb-4 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="h-16 w-16 text-muted-foreground/50" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Category & Availability */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          )}
          {!product.available && (
            <Badge variant="destructive" className="text-xs">
              Indisponível
            </Badge>
          )}
        </div>

        {/* SKU / Ref */}
        <p className="text-xs text-muted-foreground mb-1">
          Ref: {product.ref || product.sku}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        {product.description_short && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {product.description_short}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/30">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            onClick={() => onAddToCart(product.id)}
            disabled={!product.available || isAdding}
            className="gap-1"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
