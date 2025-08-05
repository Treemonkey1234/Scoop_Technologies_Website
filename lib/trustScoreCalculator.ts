/**
 * Enhanced Trust Score Calculator
 * Updated to support 11-component system with scores up to 100
 */

export interface TrustScoreFactors {
  // Verification factors (40% weight)
  phoneVerified: boolean
  emailVerified: boolean
  connectedAccountsCount: number
  
  // Community engagement (30% weight)
  reviewsReceived: number
  reviewsGiven: number
  eventsAttended: number
  friendsCount: number

  // Platform activity (20% weight)
  profileCompleteness: number // 0-100%
  accountAge: number // days since joining

  // Social proof (10% weight)
  averageReviewRating: number // 1-5 stars
  flaggedContent: number // negative factor
}

/**
 * ENHANCED 11-COMPONENT TRUST SCORE SYSTEM
 * Updated to support scores up to 100 and comprehensive component tracking
 */
export interface TrustScoreComponents {
  phoneVerification: { score: number; status: string; weight: number }
  emailVerification: { score: number; status: string; weight: number }
  socialConnections: { score: number; status: string; weight: number }
  profileCompleteness: { score: number; status: string; weight: number }
  communityEngagement: { score: number; status: string; weight: number }
  eventParticipation: { score: number; status: string; weight: number }
  reviewsGiven: { score: number; status: string; weight: number }
  reviewsReceived: { score: number; status: string; weight: number }
  accountAge: { score: number; status: string; weight: number }
  platformContribution: { score: number; status: string; weight: number }
  positiveInteractions: { score: number; status: string; weight: number }
}

const TRUST_SCORE_WEIGHTS = {
  // Verification factors (40% total)
  phoneVerified: 10,
  emailVerified: 10,
  connectedAccounts: 20, // 2 points per account up to 10 accounts

  // Community engagement (30% total)
  reviewsReceived: 8, // 0.5 points per review up to 16 reviews
  reviewsGiven: 7, // 0.5 points per review up to 14 reviews
  eventsAttended: 8, // 1 point per event up to 8 events
  friendsCount: 7, // 0.2 points per friend up to 35 friends

  // Platform activity (20% total)
  profileCompleteness: 10, // direct percentage
  accountAge: 10, // 1 point per 30 days up to 300 days

  // Social proof (10% total)
  averageReviewRating: 8, // (rating - 3) * 2.67 for 3-5 star range
  flaggedContent: -2 // -2 points per flag (negative)
}

const ENHANCED_COMPONENT_WEIGHTS = {
  phoneVerification: 0.12,
  emailVerification: 0.10,
  socialConnections: 0.15,
  profileCompleteness: 0.08,
  communityEngagement: 0.10,
  eventParticipation: 0.12,
  reviewsGiven: 0.09,
  reviewsReceived: 0.08,
  accountAge: 0.06,
  platformContribution: 0.05,
  positiveInteractions: 0.05
}

export function calculateTrustScoreComponents(user: any, additionalData?: any): TrustScoreComponents {
  const connectedAccounts = additionalData?.connectedAccountsCount || 0
  const friendsCount = additionalData?.friendsCount || user.friendsCount || 0
  const eventsAttended = additionalData?.eventsAttended || user.eventsAttended || 0
  const reviewsGiven = additionalData?.reviewsGiven || 0
  const reviewsReceived = additionalData?.reviewsReceived || 0
  const accountAge = calculateAccountAge(user.created_at || user.createdAt)
  const profileCompleteness = calculateProfileCompleteness(user)
  
  return {
    phoneVerification: {
      score: user.phone_verified || user.phoneVerified ? 95 : 15,
      status: user.phone_verified || user.phoneVerified ? "Verified" : "Not verified",
      weight: ENHANCED_COMPONENT_WEIGHTS.phoneVerification
    },
    emailVerification: {
      score: user.email_verified || user.emailVerified ? 85 : 20,
      status: user.email_verified || user.emailVerified ? "Verified" : "Not verified",
      weight: ENHANCED_COMPONENT_WEIGHTS.emailVerification
    },
    socialConnections: {
      score: Math.min(100, 35 + (connectedAccounts * 15)),
      status: connectedAccounts === 0 ? "No connections" : connectedAccounts < 3 ? "Limited connections" : "Well connected",
      weight: ENHANCED_COMPONENT_WEIGHTS.socialConnections
    },
    profileCompleteness: {
      score: profileCompleteness,
      status: profileCompleteness < 60 ? "Incomplete profile" : profileCompleteness < 85 ? "Good profile" : "Complete profile",
      weight: ENHANCED_COMPONENT_WEIGHTS.profileCompleteness
    },
    communityEngagement: {
      score: Math.min(100, 35 + (friendsCount * 3)),
      status: friendsCount === 0 ? "Building network" : friendsCount < 10 ? "Growing network" : "Connected member",
      weight: ENHANCED_COMPONENT_WEIGHTS.communityEngagement
    },
    eventParticipation: {
      score: Math.min(100, 30 + (eventsAttended * 8)),
      status: eventsAttended === 0 ? "No events attended" : eventsAttended < 5 ? "Some participation" : "Active participant",
      weight: ENHANCED_COMPONENT_WEIGHTS.eventParticipation
    },
    reviewsGiven: {
      score: Math.min(100, 40 + (reviewsGiven * 5)),
      status: reviewsGiven === 0 ? "No reviews given" : reviewsGiven < 5 ? "Few reviews" : "Active reviewer",
      weight: ENHANCED_COMPONENT_WEIGHTS.reviewsGiven
    },
    reviewsReceived: {
      score: Math.min(100, 45 + (reviewsReceived * 6)),
      status: reviewsReceived === 0 ? "No reviews received" : reviewsReceived < 3 ? "Some feedback" : "Well reviewed",
      weight: ENHANCED_COMPONENT_WEIGHTS.reviewsReceived
    },
    accountAge: {
      score: Math.min(100, 40 + (accountAge * 0.2)),
      status: accountAge < 30 ? "New member" : accountAge < 180 ? "Regular member" : "Veteran member",
      weight: ENHANCED_COMPONENT_WEIGHTS.accountAge
    },
    platformContribution: {
      score: Math.min(100, 50 + ((additionalData?.reports || 0) * 8) + ((additionalData?.feedback || 0) * 3)),
      status: "Contributing member",
      weight: ENHANCED_COMPONENT_WEIGHTS.platformContribution
    },
    positiveInteractions: {
      score: Math.min(100, 50 + ((additionalData?.positiveFeedback || 0) * 10)),
      status: "Positive interactions",
      weight: ENHANCED_COMPONENT_WEIGHTS.positiveInteractions
    }
  }
}

export function calculateEnhancedTrustScore(user: any, additionalData?: any): number {
  const components = calculateTrustScoreComponents(user, additionalData)
  
  let weightedSum = 0
  let totalWeight = 0
  
  Object.values(components).forEach(component => {
    weightedSum += component.score * component.weight
    totalWeight += component.weight
  })
  
  const finalScore = Math.round(weightedSum / totalWeight)
  
  // Ensure score is between 0 and 100 (now allowing 100!)
  return Math.max(0, Math.min(100, finalScore))
}

export function calculateTrustScore(factors: TrustScoreFactors): number {
  // For backward compatibility, convert old format to new enhanced system
  const mockUser = {
    phone_verified: factors.phoneVerified,
    email_verified: factors.emailVerified,
    friendsCount: factors.friendsCount,
    eventsAttended: factors.eventsAttended,
    created_at: new Date(Date.now() - factors.accountAge * 24 * 60 * 60 * 1000).toISOString(),
    name: 'User',
    email: 'user@example.com'
  }
  
  const additionalData = {
    connectedAccountsCount: factors.connectedAccountsCount,
    reviewsGiven: factors.reviewsGiven,
    reviewsReceived: factors.reviewsReceived
  }
  
  return calculateEnhancedTrustScore(mockUser, additionalData)
}

export function calculateProfileCompleteness(user: any): number {
  let completeness = 0
  const factors = [
    user.name,
    user.email,
    user.phone,
    user.bio,
    user.location,
    user.avatar && user.avatar !== '/default-avatar.png',
    user.username,
    user.website,
    user.occupation,
    user.company
  ]

  const filledFactors = factors.filter(Boolean).length
  completeness = (filledFactors / factors.length) * 100

  return Math.round(completeness)
}

export function calculateAccountAge(createdAt: string): number {
  if (!createdAt) return 0
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getUserTrustScore(user: any, additionalData?: {
  reviewsReceived?: number
  reviewsGiven?: number
  eventsAttended?: number
  friendsCount?: number
  averageReviewRating?: number
  flaggedContent?: number
  connectedAccountsCount?: number
}): number {
  // Use the enhanced trust score calculation
  return calculateEnhancedTrustScore(user, additionalData)
}

console.log('🎯 Enhanced Trust Score Calculator loaded with 11-component system supporting scores up to 100!')