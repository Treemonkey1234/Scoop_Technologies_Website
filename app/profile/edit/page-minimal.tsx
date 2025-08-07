'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { useAuth } from '@/hooks/useAuth'
import {
  UserIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function EditProfilePage() {
  const router = useRouter()
  const { authState, user: currentUser, isLoading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    birthDate: '',
    gender: '',
    occupation: '',
    company: '',
    interests: [] as string[]
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!authState.isAuthenticated) {
        router.push('/signin')
        return
      }
      setIsLoadingData(false)
    }
  }, [authLoading, authState.isAuthenticated, router])

  // MINIMAL TYPESCRIPT-SAFE FORM SUBMISSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Basic validation
      if (!formData.fullName || formData.fullName.trim().length === 0) {
        setError('Full name is required')
        setIsLoading(false)
        return
      }

      if (!formData.email || formData.email.trim().length === 0) {
        setError('Email address is required')
        setIsLoading(false)
        return
      }

      // Create payload with EXPLICIT TypeScript-safe approach (NO dynamic indexing)
      const payload = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        updateType: 'profile_data',
        timestamp: new Date().toISOString()
      }

      // Add optional fields explicitly (TypeScript-safe)
      if (formData.phone && formData.phone.trim()) {
        (payload as any).phone = formData.phone.trim()
      }
      if (formData.bio && formData.bio.trim()) {
        (payload as any).bio = formData.bio.trim()
      }
      if (formData.location && formData.location.trim()) {
        (payload as any).location = formData.location.trim()
      }
      if (formData.website && formData.website.trim()) {
        (payload as any).website = formData.website.trim()
      }
      if (formData.birthDate) {
        (payload as any).birthDate = formData.birthDate
      }
      if (formData.gender) {
        (payload as any).gender = formData.gender
      }
      if (formData.occupation && formData.occupation.trim()) {
        (payload as any).occupation = formData.occupation.trim()
      }
      if (formData.company && formData.company.trim()) {
        (payload as any).company = formData.company.trim()
      }
      if (formData.interests && formData.interests.length > 0) {
        (payload as any).interests = formData.interests
      }

      console.log('📤 Sending profile update:', payload)

      // Simple fetch request
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('✅ Profile updated successfully')
          setShowSuccessMessage(true)
          setTimeout(() => setShowSuccessMessage(false), 3000)
        } else {
          throw new Error(result.error || 'Update failed')
        }
      } else {
        throw new Error(`Server error: ${response.status}`)
      }

    } catch (error) {
      console.error('❌ Profile update error:', error)
      setError((error as Error).message || 'Failed to save profile changes')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoadingData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {showSuccessMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">✅ Profile updated successfully!</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}