'use client'

import { useState } from 'react'
import { UserRole, UserProfile } from '@/lib/types'

type UserProfileWithName = UserProfile & { fullName?: string };

interface UserManagementClientProps {
  profiles: UserProfileWithName[]
  currentUserRole: UserRole
}

export function UserManagementClient({ profiles, currentUserRole }: UserManagementClientProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Only super admins can change roles
    if (currentUserRole !== UserRole.SUPER) {
      window.alert('Only super admins can change user roles')
      return
    }
    
    setIsLoading(prev => ({ ...prev, [userId]: true }))
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user role')
      }
      
      window.alert('User role updated successfully')
    } catch (error) {
      console.error('Error updating user role:', error)
      window.alert(error instanceof Error ? error.message : 'Failed to update user role')
    } finally {
      setIsLoading(prev => ({ ...prev, [userId]: false }))
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Created At</th>
              {currentUserRole === UserRole.SUPER && (
                <th className="px-4 py-2">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile: UserProfileWithName) => (
              <tr key={profile.id}>
                <td className="px-4 py-2">{profile.fullName || profile.email}</td>
                <td className="px-4 py-2">{profile.email}</td>
                <td className="px-4 py-2">{profile.role}</td>
                <td className="px-4 py-2">
                  {profile.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-GB') 
                    : 'N/A'}
                </td>
                {currentUserRole === UserRole.SUPER && (
                  <td className="px-4 py-2">
                    <select
                      value={profile.role}
                      onChange={e => handleRoleChange(profile.id, e.target.value as UserRole)}
                      disabled={isLoading[profile.id]}
                      className="w-32 p-2 border rounded"
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.SUPER}>Super</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 