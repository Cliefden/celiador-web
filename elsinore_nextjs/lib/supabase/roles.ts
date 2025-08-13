import { getUserProfile } from './profile'
import { UserRole } from '@/lib/types'

/**
 * Checks if the current user has the specified role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const profile = await getUserProfile()
  if (!profile) return false

  switch (requiredRole) {
    case UserRole.SUPER:
      return profile.role === UserRole.SUPER
    case UserRole.ADMIN:
      return profile.role === UserRole.SUPER || profile.role === UserRole.ADMIN
    case UserRole.USER:
      return true // All authenticated users have USER role
    default:
      return false
  }
}

/**
 * Convenience function to check if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN)
}

/**
 * Convenience function to check if user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole(UserRole.SUPER)
}

/**
 * Gets the current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile()
  return profile?.role || null
} 