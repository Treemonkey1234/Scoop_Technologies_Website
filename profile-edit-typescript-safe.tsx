// TypeScript-safe version of the problematic section

// REPLACE this section in app/profile/edit/page.tsx around line 340-370:

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

      // TypeScript-safe payload cleaning (no dynamic indexing)
      interface PayloadData {
        name?: string
        email?: string  
        phone?: string
        bio?: string
        location?: string
        website?: string
        birthDate?: string
        gender?: string
        occupation?: string
        company?: string
        interests?: string[]
        updateType?: string
        timestamp?: string
      }

      const finalPayload: PayloadData = {}
      
      // Explicitly handle each field (TypeScript-safe)
      if (updatePayload.name && updatePayload.name.trim() !== '') finalPayload.name = updatePayload.name
      if (updatePayload.email && updatePayload.email.trim() !== '') finalPayload.email = updatePayload.email
      if (updatePayload.phone && updatePayload.phone.trim() !== '') finalPayload.phone = updatePayload.phone
      if (updatePayload.bio && updatePayload.bio.trim() !== '') finalPayload.bio = updatePayload.bio
      if (updatePayload.location && updatePayload.location.trim() !== '') finalPayload.location = updatePayload.location
      if (updatePayload.website && updatePayload.website.trim() !== '') finalPayload.website = updatePayload.website
      if (updatePayload.birthDate) finalPayload.birthDate = updatePayload.birthDate
      if (updatePayload.gender) finalPayload.gender = updatePayload.gender
      if (updatePayload.occupation && updatePayload.occupation.trim() !== '') finalPayload.occupation = updatePayload.occupation
      if (updatePayload.company && updatePayload.company.trim() !== '') finalPayload.company = updatePayload.company
      if (updatePayload.interests && updatePayload.interests.length > 0) finalPayload.interests = updatePayload.interests
      if (updatePayload.updateType) finalPayload.updateType = updatePayload.updateType
      if (updatePayload.timestamp) finalPayload.timestamp = updatePayload.timestamp

      console.log('📤 Sending profile update:', finalPayload)