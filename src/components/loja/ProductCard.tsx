import { useState } from "react";
import { Package, ShoppingCart, Minus, Plus, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity: number) => void;
  isAdding?: boolean;
}

export function ProductCard({ product, onAddToCart, isAdding }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const hasPromo = product.promo_price && product.promo_type && product.promo_value;
  const displayPrice = hasPromo ? product.promo_price! : product.price;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(999, prev + 1));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setQuantity(1);
    } else {
      const num = Math.max(1, Math.min(999, parseInt(value, 10)));
      setQuantity(num);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
    setQuantity(1);
  };

  return (
    <div className={`glass-card p-4 flex flex-col h-full group transition-all duration-300 relative overflow-hidden ${
      hasPromo 
        ? "border-green-500/50 hover:border-green-500 ring-1 ring-green-500/20" 
        : "hover:border-primary/30"
    }`}>
      {/* Promo Badge */}
      {hasPromo && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-lg flex items-center gap-1 shadow-lg">
            <Sparkles className="h-3 w-3" />
            {product.promo_type === "percent" ? (
              <span>{product.promo_value}% OFF</span>
            ) : (
              <span>-{formatPrice(product.promo_value!)}</span>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      <div className={`aspect-square mb-4 rounded-lg flex items-center justify-center overflow-hidden ${
        hasPromo ? "bg-gradient-to-br from-green-500/5 to-emerald-500/10" : "bg-muted/30"
      }`}>
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

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-border/30">
          {hasPromo ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                  <Percent className="h-2.5 w-2.5 mr-0.5" />
                  PROMO
                </Badge>
              </div>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(displayPrice)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          )}
        </div>

        {/* Quantity Selector & Add Button */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center border border-border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={handleDecrement}
              disabled={quantity <= 1 || !product.available}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={!product.available}
              className="w-10 h-8 text-center text-sm font-medium bg-transparent border-x border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={handleIncrement}
              disabled={!product.available}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.available || isAdding}
            className={`flex-1 gap-1 ${hasPromo ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
