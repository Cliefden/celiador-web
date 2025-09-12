import { create } from 'zustand'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product, quantity?: number, selectedVariants?: { [key: string]: string }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  
  addItem: (product, quantity = 1, selectedVariants = {}) => {
    set((state) => {
      const existingItem = state.items.find(
        item => item.product.id === product.id && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      )
      
      if (existingItem) {
        return {
          items: state.items.map(item =>
            item === existingItem 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
      }
      
      return {
        items: [...state.items, { product, quantity, selectedVariants }]
      }
    })
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.product.id !== productId)
    }))
  },
  
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: quantity <= 0 
        ? state.items.filter(item => item.product.id !== productId)
        : state.items.map(item =>
            item.product.id === productId 
              ? { ...item, quantity }
              : item
          )
    }))
  },
  
  clearCart: () => {
    set({ items: [] })
  },
  
  toggleCart: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },
  
  getTotal: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  },
  
  getItemCount: () => {
    const { items } = get()
    return items.reduce((count, item) => count + item.quantity, 0)
  },
}))