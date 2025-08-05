/**
 * 🚨 POST CREATION FIXES
 * 
 * Comprehensive fixes for the "unable to post at the time" error
 * Addresses authentication, validation, error handling, and user feedback
 */

// Enhanced Post Creation Handler
const EnhancedPostCreation = {
    // Replace the existing handleSubmit function in create-post/page.tsx
    async handleSubmit(e, formData, selectedUser, router, setIsSubmitting) {
        e.preventDefault()

        // Validate form data first
        const validation = this.validatePostData(formData, selectedUser)
        if (!validation.isValid) {
            alert(validation.error)
            return
        }

        setIsSubmitting(true)

        try {
            // Check authentication before posting
            const authCheck = await this.checkAuthentication()
            if (!authCheck.isAuthenticated) {
                alert('Please sign in to create a post')
                router.push('/signin')
                return
            }

            console.log('🔐 Authentication verified, proceeding with post creation')

            // Create enhanced post data
            const postData = {
                reviewFor: selectedUser.id,
                reviewForName: selectedUser.name,
                category: formData.category,
                content: formData.content,
                tags: formData.tags,
                isPublic: true,
                type: formData.category,
                userId: authCheck.userId, // Add user ID for backend
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
                credentials: 'include', // Ensure cookies are sent
                body: JSON.stringify(postData)
            })

            console.log('📊 Post creation response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            })

            // Parse response
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
                
                // Show enhanced success message
                this.showSuccessMessage(`Your post about ${selectedUser.name} has been created!`)
                
                // Optional: Update local cache or state
                this.updateLocalCache(result.post)
                
                // Redirect with success indicator
                setTimeout(() => {
                    router.push('/?postCreated=true')
                }, 1500)
                
            } else {
                // Handle specific error cases
                const errorMessage = this.getErrorMessage(response.status, result)
                console.error('❌ Post creation failed:', errorMessage)
                this.showErrorMessage(errorMessage)
                setIsSubmitting(false)
            }

        } catch (error) {
            console.error('💥 Post creation error:', error)
            
            // Determine error type and show appropriate message
            let errorMessage = 'Unable to post at this time'
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error - please check your connection and try again'
            } else if (error.message.includes('authentication')) {
                errorMessage = 'Authentication failed - please sign in and try again'
            } else if (error.message.includes('invalid response')) {
                errorMessage = 'Server error - please try again in a moment'
            }
            
            this.showErrorMessage(errorMessage)
            setIsSubmitting(false)
        }
    },

    // Validate post data before submission
    validatePostData(formData, selectedUser) {
        if (!selectedUser) {
            return { isValid: false, error: 'Please select a friend to review' }
        }

        if (!formData.category) {
            return { isValid: false, error: 'Please select a review category' }
        }

        if (!formData.content || formData.content.trim().length === 0) {
            return { isValid: false, error: 'Please write some content for your review' }
        }

        if (formData.content.length > 300) {
            return { isValid: false, error: 'Review content must be 300 characters or less' }
        }

        if (formData.content.trim().length < 10) {
            return { isValid: false, error: 'Review content must be at least 10 characters long' }
        }

        return { isValid: true }
    },

    // Enhanced authentication check
    async checkAuthentication() {
        try {
            console.log('🔍 Checking authentication status...')
            
            // Check for session cookie first
            const cookies = document.cookie.split(';')
            const sessionCookie = cookies.find(c => c.trim().startsWith('appSession='))
            
            if (!sessionCookie) {
                console.log('❌ No session cookie found')
                return { isAuthenticated: false, error: 'No session cookie' }
            }

            // Verify with backend
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (response.ok) {
                const authData = await response.json()
                console.log('✅ Authentication verified:', authData)
                
                return {
                    isAuthenticated: true,
                    userId: authData.user?.id || authData.session?.id,
                    user: authData.user || authData.session
                }
            } else {
                console.log('❌ Authentication verification failed:', response.status)
                return { isAuthenticated: false, error: 'Session expired' }
            }

        } catch (error) {
            console.error('💥 Authentication check error:', error)
            return { isAuthenticated: false, error: 'Network error' }
        }
    },

    // Get specific error message based on response
    getErrorMessage(status, result) {
        const errorMessages = {
            400: 'Invalid post data - please check your content and try again',
            401: 'Authentication required - please sign in and try again',
            403: 'You don\'t have permission to create posts',
            404: 'Post creation service not found',
            413: 'Post content is too large - please shorten your message',
            429: 'Too many posts - please wait a moment before posting again',
            500: 'Server error - please try again in a moment',
            502: 'Service temporarily unavailable - please try again later',
            503: 'Service maintenance - please try again later'
        }

        // Use specific error from result if available
        if (result && result.error) {
            return result.error
        }

        // Use status-specific message
        return errorMessages[status] || `Server error (${status}) - please try again`
    },

    // Show success message with better UX
    showSuccessMessage(message) {
        // Create success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300'
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>${message}</span>
            </div>
        `

        document.body.appendChild(notification)

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)'
        }, 100)

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)'
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 3000)
    },

    // Show error message with better UX
    showErrorMessage(message) {
        // Create error notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300'
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>${message}</span>
            </div>
        `

        document.body.appendChild(notification)

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)'
        }, 100)

        // Remove after 5 seconds (longer for errors)
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)'
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 5000)
    },

    // Update local cache after successful post
    updateLocalCache(post) {
        try {
            // Update recent posts cache
            const recentPosts = JSON.parse(localStorage.getItem('recentPosts') || '[]')
            recentPosts.unshift(post)
            
            // Keep only last 10 posts
            const updatedPosts = recentPosts.slice(0, 10)
            localStorage.setItem('recentPosts', JSON.stringify(updatedPosts))

            // Dispatch event for other components to listen
            window.dispatchEvent(new CustomEvent('postCreated', { 
                detail: { post, timestamp: new Date().toISOString() } 
            }))

            console.log('📱 Local cache updated with new post')
        } catch (error) {
            console.warn('⚠️ Failed to update local cache:', error)
        }
    },

    // Retry mechanism for failed posts
    async retryPost(originalData, maxRetries = 3) {
        let attempts = 0
        
        while (attempts < maxRetries) {
            attempts++
            console.log(`🔄 Retry attempt ${attempts}/${maxRetries}`)

            try {
                // Wait before retry (exponential backoff)
                const delay = Math.pow(2, attempts - 1) * 1000
                await new Promise(resolve => setTimeout(resolve, delay))

                // Try the post again
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(originalData)
                })

                if (response.ok) {
                    const result = await response.json()
                    if (result.success) {
                        console.log(`✅ Post succeeded on retry ${attempts}`)
                        return { success: true, result }
                    }
                }

            } catch (error) {
                console.log(`❌ Retry ${attempts} failed:`, error.message)
                
                if (attempts === maxRetries) {
                    return { 
                        success: false, 
                        error: `Failed after ${maxRetries} attempts: ${error.message}` 
                    }
                }
            }
        }

        return { success: false, error: 'All retry attempts failed' }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedPostCreation }
}

console.log(`
🚨 POST CREATION FIXES READY!

IMPROVEMENTS:
✅ Enhanced authentication checking
✅ Comprehensive form validation
✅ Better error handling and messages
✅ Network error detection
✅ Success/error notifications
✅ Local cache updates
✅ Retry mechanism for failures
✅ Proper cookie handling
✅ User feedback improvements

IMPLEMENTATION:
Replace the handleSubmit function in create-post/page.tsx with:
EnhancedPostCreation.handleSubmit(e, formData, selectedUser, router, setIsSubmitting)

This fixes the "unable to post at the time" error with comprehensive debugging!
`);