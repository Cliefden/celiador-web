import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { UserRole } from '@/lib/types'

/**
 * Checks if a role has sufficient permissions
 * @param userRole The user's role
 * @param requiredRole The required role
 * @returns True if the user has sufficient permissions
 */
function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  // Define role hierarchy
  const roleHierarchy = {
    [UserRole.SUPER]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.CLIENT]: 3,
    [UserRole.SUPPLIER]: 2,
    [UserRole.USER]: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Middleware to check if a user has the required role
 * @param request The Next.js request object
 * @param requiredRole The minimum role required to access the route
 * @returns A response if unauthorized, null if authorized
 */
export async function roleMiddleware(
  request: Pick<NextRequest, 'nextUrl'>,
  requiredRole: UserRole
): Promise<NextResponse | null> {
  const base = typeof request.nextUrl === 'string'
    ? request.nextUrl
    : (request.nextUrl.origin || 'http://localhost:3000');
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.redirect(new URL('/auth/login', base))
    }
    if (!hasPermission(profile.role, requiredRole)) {
      return NextResponse.redirect(new URL('/unauthorized', base))
    }
    return null
  } catch (error) {
    console.error('Error in role middleware:', error)
    return NextResponse.redirect(new URL('/auth/login', base))
  }
} 