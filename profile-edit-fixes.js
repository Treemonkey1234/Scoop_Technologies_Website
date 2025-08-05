/**
 * 📸 PROFILE EDIT FIXES
 * 
 * Comprehensive fixes for photo upload and form persistence issues
 * Adds functional photo upload and ensures all form data saves properly
 */

// Enhanced Profile Photo Upload Handler
const EnhancedProfileEdit = {
    // Photo upload functionality to replace the non-functional "Change Photo" button
    async handlePhotoUpload(fileInputElement, userId) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/jpeg,image/png,image/gif,image/webp'
            input.multiple = false

            input.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) {
                    resolve({ success: false, error: 'No file selected' })
                    return
                }

                try {
                    // Validate file
                    const validation = this.validatePhotoFile(file)
                    if (!validation.isValid) {
                        resolve({ success: false, error: validation.error })
                        return
                    }

                    console.log('📸 Processing photo upload:', file.name)

                    // Show upload progress
                    this.showUploadProgress('Uploading photo...')

                    // Convert to base64
                    const base64 = await this.fileToBase64(file)
                    
                    // Upload to backend
                    const uploadResult = await this.uploadPhotoToBackend(file, base64)
                    
                    if (uploadResult.success) {
                        this.hideUploadProgress()
                        this.showSuccessMessage('Photo updated successfully!')
                        resolve(uploadResult)
                    } else {
                        this.hideUploadProgress()
                        resolve(uploadResult)
                    }

                } catch (error) {
                    console.error('📸 Photo upload error:', error)
                    this.hideUploadProgress()
                    resolve({ 
                        success: false, 
                        error: 'Upload failed: ' + error.message 
                    })
                }
            }

            input.click()
        })
    },

    // Validate photo file before upload
    validatePhotoFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!validTypes.includes(file.type)) {
            return { 
                isValid: false, 
                error: 'Invalid file type. Please use JPG, PNG, GIF, or WEBP.' 
            }
        }

        if (file.size > maxSize) {
            return { 
                isValid: false, 
                error: 'File too large. Maximum size is 5MB.' 
            }
        }

        if (file.size < 1024) { // Less than 1KB
            return { 
                isValid: false, 
                error: 'File too small. Please select a valid image.' 
            }
        }

        return { isValid: true }
    },

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = () => {
                try {
                    const result = reader.result
                    console.log('📸 File converted to base64, size:', result.length)
                    resolve(result)
                } catch (error) {
                    reject(new Error('Failed to convert file to base64'))
                }
            }
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'))
            }
            
            reader.readAsDataURL(file)
        })
    },

    // Upload photo to backend
    async uploadPhotoToBackend(file, base64) {
        try {
            const payload = {
                profilePhoto: base64,
                photoType: file.type,
                photoName: file.name,
                photoSize: file.size,
                updateType: 'photo_only'
            }

            console.log('📤 Uploading photo to backend:', {
                type: file.type,
                size: file.size,
                name: file.name
            })

            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            console.log('📊 Photo upload response:', response.status)

            if (response.ok) {
                const result = await response.json()
                
                if (result.success) {
                    // Update profile photo in UI immediately
                    this.updateProfilePhotoInUI(result.user?.profilePhoto || base64)
                    
                    return { 
                        success: true, 
                        photoUrl: result.user?.profilePhoto,
                        message: 'Photo uploaded successfully!'
                    }
                } else {
                    return { 
                        success: false, 
                        error: result.error || 'Upload failed' 
                    }
                }
            } else {
                const errorText = await response.text()
                return { 
                    success: false, 
                    error: `Server error (${response.status}): ${errorText}` 
                }
            }

        } catch (error) {
            console.error('📸 Backend upload error:', error)
            return { 
                success: false, 
                error: 'Network error during upload: ' + error.message 
            }
        }
    },

    // Enhanced form submission with validation and persistence
    async handleFormSubmit(e, formData, setIsLoading, setError, setShowSuccessMessage, router) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Validate form data
            const validation = this.validateProfileData(formData)
            if (!validation.isValid) {
                setError(validation.error)
                setIsLoading(false)
                return
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

            // Make API call with retries
            const response = await this.makeProfileUpdateRequest(updatePayload)

            if (response.success) {
                console.log('✅ Profile updated successfully:', response.result)

                // Update local user data
                this.updateLocalUserData(response.result.user)

                // Show success message
                setShowSuccessMessage(true)
                
                // Dispatch update event for other components
                window.dispatchEvent(new CustomEvent('profileUpdated', { 
                    detail: response.result.user 
                }))

                // Redirect after delay
                setTimeout(() => {
                    setShowSuccessMessage(false)
                    router.push('/profile')
                }, 2000)

            } else {
                throw new Error(response.error || 'Failed to update profile')
            }

        } catch (error) {
            console.error('❌ Profile update error:', error)
            setError(error.message || 'Failed to save profile changes')
        } finally {
            setIsLoading(false)
        }
    },

    // Validate profile data before submission
    validateProfileData(formData) {
        // Required fields
        if (!formData.fullName || formData.fullName.trim().length === 0) {
            return { isValid: false, error: 'Full name is required' }
        }

        if (!formData.email || formData.email.trim().length === 0) {
            return { isValid: false, error: 'Email address is required' }
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            return { isValid: false, error: 'Please enter a valid email address' }
        }

        // Bio length check
        if (formData.bio && formData.bio.length > 500) {
            return { isValid: false, error: 'Bio must be 500 characters or less' }
        }

        // Website URL validation (if provided)
        if (formData.website && formData.website.trim().length > 0) {
            try {
                new URL(formData.website)
            } catch {
                return { isValid: false, error: 'Please enter a valid website URL' }
            }
        }

        // Phone number basic validation (if provided)
        if (formData.phone && formData.phone.trim().length > 0) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                return { isValid: false, error: 'Please enter a valid phone number' }
            }
        }

        return { isValid: true }
    },

    // Make profile update request with retry logic
    async makeProfileUpdateRequest(payload, maxRetries = 3) {
        let attempts = 0

        while (attempts < maxRetries) {
            attempts++
            
            try {
                console.log(`📡 Profile update attempt ${attempts}/${maxRetries}`)

                const response = await fetch('/api/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                })

                console.log('📊 Profile update response:', response.status)

                if (response.ok) {
                    const result = await response.json()
                    
                    if (result.success) {
                        return { success: true, result }
                    } else {
                        return { success: false, error: result.error || 'Update failed' }
                    }
                } else {
                    const errorText = await response.text()
                    
                    // Don't retry on authentication errors
                    if (response.status === 401 || response.status === 403) {
                        return { 
                            success: false, 
                            error: 'Authentication failed - please sign in again' 
                        }
                    }
                    
                    // Retry on server errors
                    if (response.status >= 500 && attempts < maxRetries) {
                        console.log(`🔄 Retrying due to server error (${response.status})`)
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
                        continue
                    }
                    
                    return { 
                        success: false, 
                        error: `Server error (${response.status}): ${errorText}` 
                    }
                }

            } catch (error) {
                console.error(`❌ Profile update attempt ${attempts} failed:`, error)
                
                if (attempts === maxRetries) {
                    return { 
                        success: false, 
                        error: 'Network error - please check your connection and try again' 
                    }
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
            }
        }

        return { success: false, error: 'All retry attempts failed' }
    },

    // Update profile photo in UI immediately
    updateProfilePhotoInUI(photoUrl) {
        try {
            // Find profile photo elements and update them
            const photoElements = document.querySelectorAll('[data-profile-photo], .profile-photo, img[alt="Profile"]')
            
            photoElements.forEach(element => {
                if (element.tagName === 'IMG') {
                    element.src = photoUrl
                } else {
                    element.style.backgroundImage = `url(${photoUrl})`
                }
            })

            console.log('📸 Profile photo updated in UI')
        } catch (error) {
            console.warn('⚠️ Failed to update profile photo in UI:', error)
        }
    },

    // Update local user data cache
    updateLocalUserData(updatedUser) {
        try {
            // Update localStorage if user data exists
            const existingUser = JSON.parse(localStorage.getItem('user') || '{}')
            const mergedUser = { ...existingUser, ...updatedUser }
            localStorage.setItem('user', JSON.stringify(mergedUser))

            // Update sessionStorage
            const existingSession = JSON.parse(sessionStorage.getItem('userSession') || '{}')
            const mergedSession = { ...existingSession, user: mergedUser }
            sessionStorage.setItem('userSession', JSON.stringify(mergedSession))

            console.log('💾 Local user data updated')
        } catch (error) {
            console.warn('⚠️ Failed to update local user data:', error)
        }
    },

    // Show upload progress indicator
    showUploadProgress(message) {
        const progressElement = document.createElement('div')
        progressElement.id = 'photo-upload-progress'
        progressElement.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50'
        progressElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>${message}</span>
            </div>
        `

        document.body.appendChild(progressElement)
    },

    // Hide upload progress indicator
    hideUploadProgress() {
        const progressElement = document.getElementById('photo-upload-progress')
        if (progressElement) {
            document.body.removeChild(progressElement)
        }
    },

    // Show success message
    showSuccessMessage(message) {
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>${message}</span>
            </div>
        `

        document.body.appendChild(notification)

        setTimeout(() => {
            document.body.removeChild(notification)
        }, 3000)
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedProfileEdit }
}

console.log(`
📸 PROFILE EDIT FIXES READY!

PHOTO UPLOAD IMPROVEMENTS:
✅ Functional photo upload with file validation
✅ Support for JPEG, PNG, GIF, WEBP formats
✅ 5MB file size limit with validation
✅ Base64 conversion for API transmission
✅ Upload progress indicators
✅ Immediate UI updates after upload
✅ Error handling for failed uploads

FORM PERSISTENCE IMPROVEMENTS:
✅ Comprehensive form validation
✅ Required field checking
✅ Email format validation
✅ Phone number validation
✅ Website URL validation
✅ Bio length limits
✅ Retry logic for network failures
✅ Local cache updates
✅ Success/error notifications

IMPLEMENTATION:
1. Replace "Change Photo" button click handler with:
   EnhancedProfileEdit.handlePhotoUpload()

2. Replace form handleSubmit function with:
   EnhancedProfileEdit.handleFormSubmit(e, formData, setIsLoading, setError, setShowSuccessMessage, router)

This ensures photo uploads work and all form data persists properly!
`);