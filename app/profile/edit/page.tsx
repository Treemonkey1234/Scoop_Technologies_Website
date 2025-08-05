'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { trustScoreManager, getTrustScoreDisplay } from '@/lib/enhanced-trustScoreCalculator'
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

  const [socialAccounts, setSocialAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  // Authentication check and data loading
  useEffect(() => {
    console.log('🔍 EDIT PROFILE: Auth state:', { authLoading, isAuthenticated: authState.isAuthenticated })

    if (!authLoading) {
      if (!authState.isAuthenticated) {
        console.log('🔍 EDIT PROFILE: User not authenticated, redirecting to signin')
        router.push('/signin')
        return
      }

      loadUserData()
    }
  }, [authLoading, authState.isAuthenticated, router])

  const loadUserData = async () => {
    try {
      setIsLoadingData(true)
      console.log('🔍 EDIT PROFILE: Loading user data for editing...')

      // Get current user data from API
      const response = await fetch('/api/user', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const user = data.user || data.session

        if (user) {
          console.log('✅ EDIT PROFILE: Loaded user data:', user)

          // Populate form with user data
          setFormData({
            fullName: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            birthDate: user.birth_date || user.birthDate || '',
            gender: user.gender || '',
            occupation: user.occupation || '',
            company: user.company || '',
            interests: Array.isArray(user.interests) ? user.interests :
                      (typeof user.interests === 'string' ? JSON.parse(user.interests || '[]') : [])
          })

          // TODO: Load social accounts from connected accounts API
          setSocialAccounts([])
        }
      }
    } catch (error) {
      console.error('❌ EDIT PROFILE: Error loading user data:', error)
      setError('Failed to load profile data')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleSocialAccountUpdate = (index: number, field: string, value: any) => {
    setSocialAccounts(prev =>
      prev.map((account, i) =>
        i === index ? { ...account, [field]: value } : account
      )
    )
  }

  // Enhanced photo upload functionality
  const handlePhotoUpload = async () => {
    return new Promise<void>((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/gif,image/webp'
      input.multiple = false

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          resolve()
          return
        }

        try {
          // Validate file
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          const maxSize = 5 * 1024 * 1024 // 5MB

          if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please use JPG, PNG, GIF, or WEBP.')
            resolve()
            return
          }

          if (file.size > maxSize) {
            setError('File too large. Maximum size is 5MB.')
            resolve()
            return
          }

          if (file.size < 1024) {
            setError('File too small. Please select a valid image.')
            resolve()
            return
          }

          console.log('📸 Processing photo upload:', file.name)

          // Show upload progress
          const progressElement = document.createElement('div')
          progressElement.id = 'photo-upload-progress'
          progressElement.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50'
          progressElement.innerHTML = `
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading photo...</span>
            </div>
          `
          document.body.appendChild(progressElement)

          // Convert to base64
          const reader = new FileReader()
          reader.onload = async () => {
            try {
              const base64 = reader.result as string
              
              const payload = {
                profilePhoto: base64,
                photoType: file.type,
                photoName: file.name,
                photoSize: file.size,
                updateType: 'photo_only'
              }

              console.log('📤 Uploading photo to backend')

              const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
              })

              // Hide progress
              const progress = document.getElementById('photo-upload-progress')
              if (progress) document.body.removeChild(progress)

              if (response.ok) {
                const result = await response.json()
                
                if (result.success) {
                  // Update profile photo in UI immediately
                  const photoElements = document.querySelectorAll('[data-profile-photo], .profile-photo, img[alt="Profile"]')
                  photoElements.forEach(element => {
                    if (element.tagName === 'IMG') {
                      (element as HTMLImageElement).src = result.user?.profilePhoto || base64
                    }
                  })
                  
                  // Show success notification
                  const notification = document.createElement('div')
                  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
                  notification.innerHTML = `
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Photo updated successfully!</span>
                    </div>
                  `
                  document.body.appendChild(notification)
                  setTimeout(() => document.body.removeChild(notification), 3000)

                  resolve()
                } else {
                  setError(result.error || 'Upload failed')
                  resolve()
                }
              } else {
                const errorText = await response.text()
                setError(`Server error (${response.status}): ${errorText}`)
                resolve()
              }

            } catch (error) {
              console.error('📸 Backend upload error:', error)
              setError('Network error during upload')
              
              const progress = document.getElementById('photo-upload-progress')
              if (progress) document.body.removeChild(progress)
              
              resolve()
            }
          }
          
          reader.onerror = () => {
            setError('Failed to read file')
            
            const progress = document.getElementById('photo-upload-progress')
            if (progress) document.body.removeChild(progress)
            
            resolve()
          }
          
          reader.readAsDataURL(file)

        } catch (error) {
          console.error('📸 Photo upload error:', error)
          setError('Upload failed: ' + (error as Error).message)
          resolve()
        }
      }

      input.click()
    })
  }

  // Enhanced form submission with validation and persistence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Enhanced validation
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

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }

      // Bio length check
      if (formData.bio && formData.bio.length > 500) {
        setError('Bio must be 500 characters or less')
        setIsLoading(false)
        return
      }

      // Website URL validation (if provided)
      if (formData.website && formData.website.trim().length > 0) {
        try {
          new URL(formData.website)
        } catch {
          setError('Please enter a valid website URL')
          setIsLoading(false)
          return
        }
      }

      // Phone number basic validation (if provided)
      if (formData.phone && formData.phone.trim().length > 0) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          setError('Please enter a valid phone number')
          setIsLoading(false)
          return
        }
      }

      console.log('💾 Saving profile data:', formData)

      // Create comprehensive profile update payload
      const updatePayload = {
        name: formData.fullName?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        bio: formData.bio?.trim(),
        location: formData.location?.trim(),
        website: formData.website?.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        occupation: formData.occupation?.trim(),
        company: formData.company?.trim(),
        interests: Array.isArray(formData.interests) ? formData.interests : [],
        updateType: 'profile_data',
        timestamp: new Date().toISOString()
      }

      // Remove empty strings and undefined values
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === '' || updatePayload[key] === undefined) {
          delete updatePayload[key]
        }
      })

      console.log('📤 Sending profile update:', updatePayload)

      // Make profile update request with retry logic
      let attempts = 0
      const maxRetries = 3
      let response

      while (attempts < maxRetries) {
        attempts++
        
        try {
          console.log(`📡 Profile update attempt ${attempts}/${maxRetries}`)

          response = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updatePayload)
          })

          console.log('📊 Profile update response:', response.status)

          if (response.ok) {
            const result = await response.json()
            
            if (result.success) {
              console.log('✅ Profile updated successfully:', result)

              // Update local user data
              try {
                const existingUser = JSON.parse(localStorage.getItem('user') || '{}')
                const mergedUser = { ...existingUser, ...result.user }
                localStorage.setItem('user', JSON.stringify(mergedUser))

                const existingSession = JSON.parse(sessionStorage.getItem('userSession') || '{}')
                const mergedSession = { ...existingSession, user: mergedUser }
                sessionStorage.setItem('userSession', JSON.stringify(mergedSession))
              } catch (error) {
                console.warn('⚠️ Failed to update local user data:', error)
              }

              // Show success message
              setShowSuccessMessage(true)
              
              // Dispatch update event for other components
              window.dispatchEvent(new CustomEvent('profileUpdated', { 
                detail: result.user 
              }))

              // Redirect after delay
              setTimeout(() => {
                setShowSuccessMessage(false)
                router.push('/profile')
              }, 2000)

              break
            } else {
              throw new Error(result.error || 'Update failed')
            }
          } else {
            const errorText = await response.text()
            
            // Don't retry on authentication errors
            if (response.status === 401 || response.status === 403) {
              throw new Error('Authentication failed - please sign in again')
            }
            
            // Retry on server errors
            if (response.status >= 500 && attempts < maxRetries) {
              console.log(`🔄 Retrying due to server error (${response.status})`)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
              continue
            }
            
            throw new Error(`Server error (${response.status}): ${errorText}`)
          }

        } catch (error) {
          console.error(`❌ Profile update attempt ${attempts} failed:`, error)
          
          if (attempts === maxRetries) {
            throw new Error('Network error - please check your connection and try again')
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }

    } catch (error) {
      console.error('❌ Profile update error:', error)
      setError((error as Error).message || 'Failed to save profile changes')
    } finally {
      setIsLoading(false)
    }
  }

  const availableInterests = [
    'Food & Dining', 'Community Events', 'Photography', 'Travel', 'Music', 'Sports',
    'Technology', 'Art & Culture', 'Fitness', 'Business', 'Education', 'Health & Wellness'
  ]

  // Show loading state while checking auth or loading data
  if (authLoading || isLoadingData) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-slate-800 mb-2">Loading Profile...</h1>
            <p className="text-slate-600">Getting your information...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Edit Profile</h1>
          <p className="text-slate-600">Update your profile information and preferences</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-green-800 font-medium">Profile updated successfully!</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="card-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Photo</h2>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={currentUser?.profilePhoto || "https://images.unsplash.com/photo-1494790108755-2616b6c0ca5e?w=400"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                  data-profile-photo="true"
                />
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors duration-200"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Change Photo
                </button>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, or WEBP. Max size 5MB.</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="card-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell others about yourself..."
                />
                <p className="text-xs text-slate-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="card-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Details</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-slate-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Your job title"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Where you work"
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="card-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Interests</h2>
            <p className="text-sm text-slate-600 mb-4">Select topics you're interested in to help others find you</p>

            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    formData.interests.includes(interest)
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Social Media Accounts */}
          <div className="card-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Social Media Accounts</h2>

            <div className="space-y-4">
              {socialAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">{account.platform.charAt(0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">{account.platform}</span>
                      <p className="text-sm text-slate-500">{account.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.verified && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Verified
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSocialAccountUpdate(index, 'public', !account.public)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {account.public ? (
                        <EyeIcon className="w-4 h-4" />
                      ) : (
                        <EyeSlashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-300 transition-colors duration-200"
              >
                <span className="text-slate-600">Add Social Media Account</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 btn-primary ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}