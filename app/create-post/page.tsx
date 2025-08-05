'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { UserIcon, MagnifyingGlassIcon, XMarkIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'

// Sample data - this would normally come from your API
const sampleUsers = [
  { id: 1, name: 'Emma Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6c0ca5e?w=400', location: 'San Francisco' },
  { id: 2, name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', location: 'New York' },
  { id: 3, name: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', location: 'Austin' },
  { id: 4, name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', location: 'Seattle' },
  { id: 5, name: 'Lisa Thompson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', location: 'Portland' }
]

const categories = [
  { id: 'experience', name: 'Experience', icon: '✨', description: 'Share what happened' },
  { id: 'recommendation', name: 'Recommendation', icon: '👍', description: 'Recommend this person' },
  { id: 'collaboration', name: 'Collaboration', icon: '🤝', description: 'Working together' },
  { id: 'social', name: 'Social', icon: '🎉', description: 'Social interaction' },
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Work-related' },
  { id: 'community', name: 'Community', icon: '🏘️', description: 'Community involvement' }
]

const suggestedTags = [
  'Reliable', 'Creative', 'Helpful', 'Professional', 'Friendly', 'Knowledgeable',
  'Punctual', 'Organized', 'Collaborative', 'Innovative', 'Supportive', 'Skilled'
]

interface FormData {
  reviewFor: string
  category: string
  content: string
  tags: string[]
  photo?: File
}

function CreatePostContent() {
  const router = useRouter()
  const { authState, user: currentUser, isLoading: authLoading } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    reviewFor: '',
    category: '',
    content: '',
    tags: []
  })

  const [friendSearch, setFriendSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userFriends, setUserFriends] = useState<any[]>([])

  // Authentication check
  useEffect(() => {
    console.log('🔍 CREATE POST: Auth state:', { authLoading, isAuthenticated: authState.isAuthenticated })

    if (!authLoading) {
      if (!authState.isAuthenticated) {
        console.log('🔍 CREATE POST: User not authenticated, redirecting to signin')
        router.push('/signin')
        return
      }

      // Load user's friends
      loadUserFriends()
    }
  }, [authLoading, authState.isAuthenticated, router])

  const loadUserFriends = async () => {
    try {
      console.log('👥 CREATE POST: Loading user friends...')
      
      const response = await fetch('/api/friends', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ CREATE POST: Loaded friends:', data.friends?.length || 0)
        setUserFriends(data.friends || [])
      } else {
        console.log('⚠️ CREATE POST: Friends API not available, using sample data')
        setUserFriends(sampleUsers)
      }
    } catch (error) {
      console.error('❌ CREATE POST: Error loading friends:', error)
      setUserFriends(sampleUsers)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTagAdd = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enhanced validation
    const selectedUser = userFriends.find(f => f.id === parseInt(formData.reviewFor)) ||
                        sampleUsers.find(u => u.id === parseInt(formData.reviewFor))

    if (!selectedUser) {
      alert('Please select a friend to review')
      return
    }

    if (!formData.category) {
      alert('Please select a review category')
      return
    }

    if (!formData.content || formData.content.trim().length === 0) {
      alert('Please write some content for your review')
      return
    }

    if (formData.content.length > 300) {
      alert('Review content must be 300 characters or less')
      return
    }

    if (formData.content.trim().length < 10) {
      alert('Review content must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      // Check authentication before posting
      console.log('🔍 Checking authentication status...')
      
      const cookies = document.cookie.split(';')
      const sessionCookie = cookies.find(c => c.trim().startsWith('appSession='))
      
      if (!sessionCookie) {
        alert('Please sign in to create a post')
        router.push('/signin')
        return
      }

      // Verify with backend
      const authResponse = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })

      if (!authResponse.ok) {
        alert('Authentication failed - please sign in again')
        router.push('/signin')
        return
      }

      const authData = await authResponse.json()
      console.log('✅ Authentication verified, proceeding with post creation')

      // Create enhanced post data
      const postData = {
        reviewFor: selectedUser.id,
        reviewForName: selectedUser.name,
        category: formData.category,
        content: formData.content,
        tags: formData.tags,
        isPublic: true,
        type: formData.category,
        userId: authData.user?.id || authData.session?.id,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Creating post with enhanced data:', postData)

      // Make API call with enhanced error handling
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(postData)
      })

      console.log('📊 Post creation response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError)
        throw new Error('Server returned invalid response')
      }

      console.log('📝 Post creation result:', result)

      if (response.ok && result.success) {
        console.log('✅ Post created successfully:', result)
        
        // Show enhanced success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Your post about ${selectedUser.name} has been created!</span>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
          document.body.removeChild(notification)
          router.push('/?postCreated=true')
        }, 2000)
        
      } else {
        // Handle specific error cases
        let errorMessage = 'Unable to post at this time'
        
        if (response.status === 400) {
          errorMessage = 'Invalid post data - please check your content and try again'
        } else if (response.status === 401) {
          errorMessage = 'Authentication required - please sign in and try again'
        } else if (response.status === 403) {
          errorMessage = 'You don\'t have permission to create posts'
        } else if (response.status >= 500) {
          errorMessage = 'Server error - please try again in a moment'
        } else if (result && result.error) {
          errorMessage = result.error
        }
        
        console.error('❌ Post creation failed:', errorMessage)
        alert(errorMessage)
        setIsSubmitting(false)
      }

    } catch (error) {
      console.error('💥 Post creation error:', error)
      
      let errorMessage = 'Unable to post at this time'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection and try again'
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed - please sign in and try again'
      } else if (error.message.includes('invalid response')) {
        errorMessage = 'Server error - please try again in a moment'
      }
      
      alert(errorMessage)
      setIsSubmitting(false)
    }
  }

  const characterCount = formData.content.length
  const maxCharacters = 300

  // Filter friends based on search
  const filteredFriends = userFriends.filter(friend =>
    friend.name.toLowerCase().includes(friendSearch.toLowerCase())
  )

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-slate-800 mb-2">Loading...</h1>
            <p className="text-slate-600">Setting up your post creation...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-soft">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">✨ Quick Review</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!formData.reviewFor || !formData.category || !formData.content.trim() || isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Post...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Post</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Who */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
              <UserIcon className="w-5 h-5" />
              <span>👤 WHO?</span>
            </h3>

            {/* Friend Search */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a friend's name to search..."
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                />
                {friendSearch && (
                  <button
                    type="button"
                    onClick={() => setFriendSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Friends List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, reviewFor: friend.id.toString() }))}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                      formData.reviewFor === friend.id.toString()
                        ? 'bg-cyan-50 border-2 border-cyan-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-slate-800">{friend.name}</h4>
                      <p className="text-sm text-slate-500">{friend.location}</p>
                    </div>
                    {formData.reviewFor === friend.id.toString() && (
                      <CheckIcon className="w-5 h-5 text-cyan-600" />
                    )}
                  </button>
                ))
              ) : friendSearch ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No friends found matching "{friendSearch}"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Loading your friends...</p>
                </div>
              )}
            </div>
          </div>

          {/* What Type */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🏷️ WHAT TYPE?</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  className={`p-4 rounded-xl transition-all text-left ${
                    formData.category === category.id
                      ? 'bg-cyan-50 border-2 border-cyan-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-slate-800">{category.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">✍️ YOUR REVIEW</h3>
            <div className="relative">
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Share your experience or thoughts..."
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={maxCharacters}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">
                  Make it meaningful and helpful for others
                </span>
                <span className={`text-sm ${
                  characterCount > maxCharacters * 0.9 ? 'text-orange-500' : 'text-slate-400'
                }`}>
                  {characterCount}/{maxCharacters}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🏷️ TAGS (Optional)</h3>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-cyan-500 hover:text-cyan-700"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2">
              {suggestedTags
                .filter(tag => !formData.tags.includes(tag))
                .slice(0, 8)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagAdd(tag)}
                    disabled={formData.tags.length >= 5}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
            
            {formData.tags.length >= 5 && (
              <p className="text-xs text-orange-500 mt-2">Maximum 5 tags allowed</p>
            )}
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <CreatePostContent />
    </Suspense>
  )
}