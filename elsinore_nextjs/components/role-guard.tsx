'use client'

interface RoleGuardProps {
  children: React.ReactNode
  userHasRole: boolean
  fallback?: React.ReactNode
}

export function RoleGuard({ children, userHasRole, fallback = null }: RoleGuardProps) {
  if (!userHasRole) {
    return fallback
  }

  return <>{children}</>
} 