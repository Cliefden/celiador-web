'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  profile: UserProfile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    middle_name: profile.middle_name || '',
    pre_last_name: profile.pre_last_name || '',
    last_name: profile.last_name || '',
    personal_id: profile.personal_id || '',
    name_prefix: profile.name_prefix || '',
    name_suffix: profile.name_suffix || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      router.refresh()
      router.push('/protected')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middle_name">Middle Name</Label>
          <Input
            id="middle_name"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            placeholder="Enter your middle name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pre_last_name">Pre-last Name</Label>
          <Input
            id="pre_last_name"
            name="pre_last_name"
            value={formData.pre_last_name}
            onChange={handleChange}
            placeholder="Enter your pre-last name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="personal_id">Personal ID</Label>
          <Input
            id="personal_id"
            name="personal_id"
            value={formData.personal_id}
            onChange={handleChange}
            placeholder="Enter your personal ID"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name_prefix">Name Prefix</Label>
          <Input
            id="name_prefix"
            name="name_prefix"
            value={formData.name_prefix}
            onChange={handleChange}
            placeholder="Enter your name prefix"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name_suffix">Name Suffix</Label>
          <Input
            id="name_suffix"
            name="name_suffix"
            value={formData.name_suffix}
            onChange={handleChange}
            placeholder="Enter your name suffix"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/protected')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 