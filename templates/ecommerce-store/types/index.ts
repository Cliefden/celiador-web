export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  subcategory?: string
  brand: string
  rating: number
  reviewCount: number
  inStock: boolean
  variants?: ProductVariant[]
  tags: string[]
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  price?: number
  inStock: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  selectedVariants?: { [key: string]: string }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  addresses?: Address[]
}

export interface Address {
  id: string
  type: 'billing' | 'shipping'
  firstName: string
  lastName: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  subtotal: number
  tax: number
  shipping: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  shippingAddress: Address
  billingAddress: Address
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  subcategories?: Category[]
}