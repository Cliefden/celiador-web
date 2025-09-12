import { create } from 'zustand'
import { Order } from '@/types'

interface OrderStore {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  
  createOrder: (orderData: Partial<Order>) => Promise<string>
  getOrder: (orderId: string) => Order | null
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  getUserOrders: (userId: string) => Order[]
  clearError: () => void
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null })
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const orderId = Math.random().toString(36).substr(2, 9).toUpperCase()
      const newOrder: Order = {
        id: orderId,
        userId: orderData.userId || '',
        items: orderData.items || [],
        total: orderData.total || 0,
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        status: 'pending',
        createdAt: new Date(),
        shippingAddress: orderData.shippingAddress!,
        billingAddress: orderData.billingAddress!,
      }
      
      set(state => ({
        orders: [...state.orders, newOrder],
        currentOrder: newOrder,
        isLoading: false
      }))
      
      return orderId
    } catch (error) {
      set({ error: 'Failed to create order', isLoading: false })
      throw error
    }
  },

  getOrder: (orderId) => {
    const { orders } = get()
    return orders.find(order => order.id === orderId) || null
  },

  updateOrderStatus: (orderId, status) => {
    set(state => ({
      orders: state.orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    }))
  },

  getUserOrders: (userId) => {
    const { orders } = get()
    return orders.filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  clearError: () => {
    set({ error: null })
  }
}))