import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    image_url: string | null;
    available: boolean;
  };
}

interface Cart {
  id: string;
  unit_id: string;
  items: CartItem[];
  total: number;
}

export function useCart() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch or create cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      // Get current user's unit_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Get unit_id using the database function
      const { data: unitData, error: unitError } = await supabase
        .rpc("get_user_unit_id", { _user_id: user.id });
      
      if (unitError || !unitData) {
        throw new Error("Unidade não encontrada");
      }

      const unitId = unitData;

      // Try to get existing cart
      let { data: existingCart, error: cartError } = await supabase
        .from("carts")
        .select("*")
        .eq("unit_id", unitId)
        .maybeSingle();

      // If no cart exists, create one
      if (!existingCart) {
        const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert({ unit_id: unitId })
          .select()
          .single();
        
        if (createError) throw createError;
        existingCart = newCart;
      }

      // Get cart items with product details
      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            sku,
            price,
            image_url,
            available
          )
        `)
        .eq("cart_id", existingCart.id);

      if (itemsError) throw itemsError;

      const cartItems: CartItem[] = (items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products,
      }));

      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      return {
        id: existingCart.id,
        unit_id: existingCart.unit_id,
        items: cartItems,
        total,
      } as Cart;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Add item to cart
  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!cart) throw new Error("Carrinho não disponível");

      // Check if item already exists
      const existingItem = cart.items.find((item) => item.product_id === productId);

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produto adicionado ao carrinho");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar produto: " + error.message);
    },
  });

  // Update item quantity
  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar quantidade: " + error.message);
    },
  });

  // Remove item from cart
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produto removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover produto: " + error.message);
    },
  });

  // Clear cart
  const clearCart = useMutation({
    mutationFn: async () => {
      if (!cart) return;
      
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cart.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return {
    cart,
    isLoading,
    isOpen,
    setIsOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  };
}
