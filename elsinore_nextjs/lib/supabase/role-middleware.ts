import { redirect } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { hasRole } from './roles'

/**
 * Middleware function to protect routes based on user role
 */
export async function roleMiddleware(requiredRole: UserRole) {
  const hasRequiredRole = await hasRole(requiredRole)
  
  if (!hasRequiredRole) {
    redirect('/unauthorized')
  }
  
  return true
} 