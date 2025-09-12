import { create } from 'zustand'
import { User } from '@/types'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful login
      if (email && password) {
        const mockUser: User = {
          id: '1',
          email,
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        }
        
        set({ user: mockUser, isAuthenticated: true })
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  },

  register: async (userData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful registration
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email!,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        avatar: userData.avatar,
      }
      
      set({ user: mockUser, isAuthenticated: true })
      return true
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (userData) => {
    set(state => ({
      user: state.user ? { ...state.user, ...userData } : null
    }))
  },
}))