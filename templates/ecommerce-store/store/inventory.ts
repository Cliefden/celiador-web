import { create } from 'zustand'
import { Product } from '@/types'

interface InventoryItem {
  productId: string
  quantity: number
  reserved: number
  lastUpdated: Date
  reorderPoint: number
  supplier?: string
}

interface InventoryStore {
  inventory: InventoryItem[]
  lowStockItems: InventoryItem[]
  
  getInventory: (productId: string) => InventoryItem | null
  updateStock: (productId: string, quantity: number) => void
  reserveStock: (productId: string, quantity: number) => boolean
  releaseReservedStock: (productId: string, quantity: number) => void
  processOrder: (items: { productId: string; quantity: number }[]) => boolean
  getLowStockItems: () => InventoryItem[]
  addProduct: (productId: string, initialStock: number, reorderPoint?: number) => void
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  inventory: [
    // Initialize with sample inventory data
    { productId: '1', quantity: 50, reserved: 2, lastUpdated: new Date(), reorderPoint: 10 },
    { productId: '2', quantity: 25, reserved: 0, lastUpdated: new Date(), reorderPoint: 5 },
    { productId: '3', quantity: 15, reserved: 1, lastUpdated: new Date(), reorderPoint: 8 },
    { productId: '4', quantity: 8, reserved: 0, lastUpdated: new Date(), reorderPoint: 10 },
    { productId: '5', quantity: 30, reserved: 0, lastUpdated: new Date(), reorderPoint: 15 },
    { productId: '6', quantity: 12, reserved: 0, lastUpdated: new Date(), reorderPoint: 5 },
    { productId: '7', quantity: 0, reserved: 0, lastUpdated: new Date(), reorderPoint: 10 },
    { productId: '8', quantity: 22, reserved: 0, lastUpdated: new Date(), reorderPoint: 8 },
  ],
  lowStockItems: [],

  getInventory: (productId) => {
    const { inventory } = get()
    return inventory.find(item => item.productId === productId) || null
  },

  updateStock: (productId, quantity) => {
    set(state => ({
      inventory: state.inventory.map(item =>
        item.productId === productId
          ? { ...item, quantity, lastUpdated: new Date() }
          : item
      )
    }))
  },

  reserveStock: (productId, quantity) => {
    const { inventory } = get()
    const item = inventory.find(item => item.productId === productId)
    
    if (!item || (item.quantity - item.reserved) < quantity) {
      return false
    }

    set(state => ({
      inventory: state.inventory.map(invItem =>
        invItem.productId === productId
          ? { ...invItem, reserved: invItem.reserved + quantity, lastUpdated: new Date() }
          : invItem
      )
    }))
    
    return true
  },

  releaseReservedStock: (productId, quantity) => {
    set(state => ({
      inventory: state.inventory.map(item =>
        item.productId === productId
          ? { ...item, reserved: Math.max(0, item.reserved - quantity), lastUpdated: new Date() }
          : item
      )
    }))
  },

  processOrder: (items) => {
    const { inventory } = get()
    
    // Check if all items are available
    for (const orderItem of items) {
      const inventoryItem = inventory.find(item => item.productId === orderItem.productId)
      if (!inventoryItem || (inventoryItem.quantity - inventoryItem.reserved) < orderItem.quantity) {
        return false
      }
    }

    // Process the order - reduce quantities and reserved stock
    set(state => ({
      inventory: state.inventory.map(invItem => {
        const orderItem = items.find(item => item.productId === invItem.productId)
        if (orderItem) {
          return {
            ...invItem,
            quantity: invItem.quantity - orderItem.quantity,
            reserved: Math.max(0, invItem.reserved - orderItem.quantity),
            lastUpdated: new Date()
          }
        }
        return invItem
      })
    }))

    return true
  },

  getLowStockItems: () => {
    const { inventory } = get()
    return inventory.filter(item => item.quantity <= item.reorderPoint)
  },

  addProduct: (productId, initialStock, reorderPoint = 10) => {
    set(state => ({
      inventory: [
        ...state.inventory,
        {
          productId,
          quantity: initialStock,
          reserved: 0,
          lastUpdated: new Date(),
          reorderPoint
        }
      ]
    }))
  }
}))

// Initialize low stock items on store creation
useInventoryStore.subscribe((state) => {
  const lowStock = state.getLowStockItems()
  useInventoryStore.setState({ lowStockItems: lowStock })
})