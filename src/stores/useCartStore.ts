import { create } from 'zustand'

export type CartItem = {
  id: string
  name: string
  sku?: string
  price: number
  quantity: number
  image?: string
}

type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
          ),
        }
      }
      return {
        items: [...state.items, { ...item, quantity }],
      }
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () =>
    get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  getItemCount: () =>
    get().items.reduce((acc, item) => acc + item.quantity, 0),
}))
