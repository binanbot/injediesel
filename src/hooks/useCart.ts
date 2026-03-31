import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  product_id: string;
  available: boolean;
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
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data } = await supabase
        .rpc("is_franchisor_admin", { _user_id: user.id });
      
      return !!data;
    },
  });

  // Fetch units for admin
  const { data: units } = useQuery({
    queryKey: ["units-for-cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const resolveCurrentUnitId = useCallback(
    async (requireSelection = false): Promise<string | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Não autenticado");

      if (isAdmin) {
        if (selectedUnitId) return selectedUnitId;
        if (requireSelection) {
          throw new Error("Selecione uma unidade antes de adicionar produtos ao carrinho");
        }
        return null;
      }

      const { data: unitId, error: unitError } = await supabase.rpc("get_user_unit_id", {
        _user_id: user.id,
      });

      if (unitError) throw unitError;
      if (!unitId) {
        throw new Error("Sua conta não possui unidade vinculada");
      }

      return unitId;
    },
    [isAdmin, selectedUnitId]
  );

  const fetchOrCreateCartByUnit = useCallback(async (unitId: string) => {
    const { data: existingCart, error: cartError } = await supabase
      .from("carts")
      .select("id, unit_id")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cartError) throw cartError;
    if (existingCart) return existingCart;

    const { data: newCart, error: createError } = await supabase
      .from("carts")
      .insert({ unit_id: unitId })
      .select("id, unit_id")
      .single();

    if (createError) throw createError;
    return newCart;
  }, []);

  const fetchCartByUnit = useCallback(
    async (unitId: string): Promise<Cart> => {
      const existingCart = await fetchOrCreateCartByUnit(unitId);

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

      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      return {
        id: existingCart.id,
        unit_id: existingCart.unit_id,
        items: cartItems,
        total,
      };
    },
    [fetchOrCreateCartByUnit]
  );

  // Fetch or create cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart", selectedUnitId, isAdmin],
    queryFn: async () => {
      const unitId = await resolveCurrentUnitId(false);
      if (!unitId) return null;
      return fetchCartByUnit(unitId);
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: isAdmin !== undefined && (!isAdmin || !!selectedUnitId),
  });

  // Add item to cart
  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1, productName }: { productId: string; quantity?: number; productName?: string }) => {
      const unitId = await resolveCurrentUnitId(true);
      if (!unitId) throw new Error("Selecione uma unidade antes de adicionar produtos ao carrinho");

      const cartData = cart?.unit_id === unitId ? cart : await fetchCartByUnit(unitId);

      // Check if item already exists
      const existingItem = cartData.items.find((item) => item.product_id === productId);

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
            cart_id: cartData.id,
            product_id: productId,
            quantity,
          });
        
        if (error) throw error;
      }

      return { productName, quantity };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      if (data?.productName) {
        toast.success(`${data.quantity}x ${data.productName} adicionado ao carrinho`);
      } else {
        toast.success("Produto adicionado ao carrinho");
      }
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
  const needsUnitSelection = isAdmin && !selectedUnitId;

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
    // Admin-specific
    isAdmin,
    units,
    selectedUnitId,
    setSelectedUnitId,
    needsUnitSelection,
  };
}
