/**
 * 🔧 ENHANCED TRUST SCORE CALCULATOR - INTEGRATED VERSION
 * 
 * This integrates the fixes from updated-trust-score-fixes.js into the actual platform
 * Updated to use the REAL 11-component trust score system that allows 100 as max score
 */

export interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  avatar?: string
  username?: string
  occupation?: string
  company?: string
  interests?: string[]
  phoneVerified?: boolean
  emailVerified?: boolean
  friendsCount?: number
  eventsAttended?: number
  created_at?: string
  joinDate?: string
  connectedAccounts?: any[]
  postsCount?: number
  reviewsCount?: number
  commentsCount?: number
  averageContentRating?: number
  totalInteractions?: number
  positiveInteractions?: number
  flagsSubmitted?: number
  accurateFlags?: number
  helpfulReviews?: number
  eventsCreated?: number
  mentoringSessions?: number
}

/**
 * The ACTUAL trust score calculation function found in the compiled code
 * Updated to allow maximum score of 100 instead of 95
 */
export function calculateTrustScore(connectedAccountsCount: number): number {
    if (connectedAccountsCount === 0) return 50;
    
    let baseScore = 50 + 10 * Math.min(connectedAccountsCount, 5);
    
    if (connectedAccountsCount > 5) {
        baseScore += 2 * Math.min(connectedAccountsCount - 5, 10);
    }
    
    // Updated: Allow scores up to 100 instead of 95
    return Math.min(baseScore, 100);
}

/**
 * The REAL trust score system with 11 components as shown on the platform
 */
export class TrustScoreManager {
    components: string[]
    
    constructor() {
        this.components = [
            'Account Verification',
            'Profile Completeness', 
            'Connected Accounts',
            'Time on Platform',
            'Community Activity',
            'Content Quality',
            'Social Engagement',
            'Events Participation',
            'Positive Interactions',
            'Flagging Accuracy',
            'Platform Contribution'
        ];
    }

    /**
     * Calculate individual trust score components based on user data
     */
    calculateComponents(user: User): Record<string, { score: number; status: string }> {
        const components: Record<string, { score: number; status: string }> = {};

        // 1. Account Verification (0-100)
        components['Account Verification'] = {
            score: this.calculateAccountVerification(user),
            status: user.phoneVerified && user.emailVerified ? 'Verified' : 'Pending verification'
        };

        // 2. Profile Completeness (0-100) 
        components['Profile Completeness'] = {
            score: this.calculateProfileCompleteness(user),
            status: `${this.calculateProfileCompleteness(user)}% complete`
        };

        // 3. Connected Accounts (0-100)
        const connectedCount = user.connectedAccounts?.length || 0;
        components['Connected Accounts'] = {
            score: connectedCount === 0 ? 30 : Math.min(100, 30 + (connectedCount * 15)),
            status: `${connectedCount} social accounts`
        };

        // 4. Time on Platform (0-100)
        components['Time on Platform'] = {
            score: this.calculateTimeOnPlatform(user),
            status: this.getTimeOnPlatformStatus(user)
        };

        // 5. Community Activity (0-100)
        components['Community Activity'] = {
            score: this.calculateCommunityActivity(user),
            status: this.getCommunityActivityStatus(user)
        };

        // 6. Content Quality (0-100)
        components['Content Quality'] = {
            score: this.calculateContentQuality(user),
            status: this.getContentQualityStatus(user)
        };

        // 7. Social Engagement (0-100)
        components['Social Engagement'] = {
            score: this.calculateSocialEngagement(user),
            status: this.getSocialEngagementStatus(user)
        };

        // 8. Events Participation (0-100)
        components['Events Participation'] = {
            score: this.calculateEventsParticipation(user),
            status: this.getEventsParticipationStatus(user)
        };

        // 9. Positive Interactions (0-100)
        components['Positive Interactions'] = {
            score: this.calculatePositiveInteractions(user),
            status: this.getPositiveInteractionsStatus(user)
        };

        // 10. Flagging Accuracy (0-100)
        components['Flagging Accuracy'] = {
            score: this.calculateFlaggingAccuracy(user),
            status: this.getFlaggingAccuracyStatus(user)
        };

        // 11. Platform Contribution (0-100)
        components['Platform Contribution'] = {
            score: this.calculatePlatformContribution(user),
            status: this.getPlatformContributionStatus(user)
        };

        return components;
    }

    /**
     * Calculate overall trust score using weighted average of all components
     */
    calculateOverallTrustScore(user: User): number {
        const components = this.calculateComponents(user);
        
        // Component weights (must add up to 1.0)
        const weights: Record<string, number> = {
            'Account Verification': 0.15,      // High weight
            'Profile Completeness': 0.10,     // Medium weight
            'Connected Accounts': 0.15,       // High weight
            'Time on Platform': 0.08,         // Medium weight
            'Community Activity': 0.12,       // High weight
            'Content Quality': 0.12,          // High weight
            'Social Engagement': 0.10,        // High weight
            'Events Participation': 0.06,     // Medium weight
            'Positive Interactions': 0.06,    // Medium weight
            'Flagging Accuracy': 0.03,        // Low weight
            'Platform Contribution': 0.03     // Low weight
        };

        let weightedSum = 0;
        let totalWeight = 0;

        for (const [componentName, data] of Object.entries(components)) {
            const weight = weights[componentName] || 0;
            weightedSum += data.score * weight;
            totalWeight += weight;
        }

        return Math.round(weightedSum / totalWeight);
    }

    // Individual component calculation methods
    calculateAccountVerification(user: User): number {
        let score = 30; // Base score
        if (user.emailVerified) score += 35;
        if (user.phoneVerified) score += 35;
        return Math.min(100, score);
    }

    calculateProfileCompleteness(user: User): number {
        let score = 0;
        if (user.name) score += 15;
        if (user.bio) score += 15;
        if (user.location) score += 10;
        if (user.avatar && user.avatar !== 'default-avatar.jpg') score += 15;
        if (user.created_at || user.joinDate) score += 10;
        if (user.occupation) score += 10;
        if (user.interests && user.interests.length > 0) score += 15;
        if (user.website) score += 10;
        return Math.min(100, score);
    }

    calculateTimeOnPlatform(user: User): number {
        const joinDate = new Date(user.joinDate || user.created_at || new Date());
        const now = new Date();
        const daysOnPlatform = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOnPlatform < 7) return 40;
        if (daysOnPlatform < 30) return 65;
        if (daysOnPlatform < 90) return 80;
        if (daysOnPlatform < 365) return 90;
        return 100;
    }

    calculateCommunityActivity(user: User): number {
        const postsCount = user.postsCount || 0;
        const reviewsCount = user.reviewsCount || 0;
        const commentsCount = user.commentsCount || 0;
        
        const totalActivity = postsCount + reviewsCount + commentsCount;
        
        if (totalActivity === 0) return 40;
        if (totalActivity < 5) return 50;
        if (totalActivity < 15) return 65;
        if (totalActivity < 50) return 80;
        return 95;
    }

    calculateContentQuality(user: User): number {
        const postsCount = user.postsCount || 0;
        if (postsCount === 0) return 50;
        
        const averageRating = user.averageContentRating || 3.5;
        return Math.min(100, Math.round(20 + (averageRating / 5) * 80));
    }

    calculateSocialEngagement(user: User): number {
        const friendsCount = user.friendsCount || 0;
        if (friendsCount === 0) return 45;
        
        const base = 45;
        const bonus = Math.min(50, friendsCount * 2);
        return Math.min(100, base + bonus);
    }

    calculateEventsParticipation(user: User): number {
        const eventsAttended = user.eventsAttended || 0;
        if (eventsAttended === 0) return 40;
        
        return Math.min(100, 40 + (eventsAttended * 8));
    }

    calculatePositiveInteractions(user: User): number {
        const totalInteractions = user.totalInteractions || 0;
        const positiveInteractions = user.positiveInteractions || 0;
        
        if (totalInteractions === 0) return 75; // Good standing by default
        
        const ratio = positiveInteractions / totalInteractions;
        return Math.round(ratio * 100);
    }

    calculateFlaggingAccuracy(user: User): number {
        const flagsSubmitted = user.flagsSubmitted || 0;
        if (flagsSubmitted === 0) return 60; // No flags yet
        
        const accurateFlags = user.accurateFlags || 0;
        const ratio = accurateFlags / flagsSubmitted;
        return Math.round(ratio * 100);
    }

    calculatePlatformContribution(user: User): number {
        const helpfulReviews = user.helpfulReviews || 0;
        const eventsCreated = user.eventsCreated || 0;
        const mentoringSessions = user.mentoringSessions || 0;
        
        const totalContribution = helpfulReviews + (eventsCreated * 2) + (mentoringSessions * 3);
        
        if (totalContribution === 0) return 50;
        return Math.min(100, 50 + (totalContribution * 5));
    }

    // Status message methods
    getTimeOnPlatformStatus(user: User): string {
        const joinDate = new Date(user.joinDate || user.created_at || new Date());
        const now = new Date();
        const daysOnPlatform = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOnPlatform < 7) return "New member";
        if (daysOnPlatform < 30) return "Getting started";
        if (daysOnPlatform < 90) return "Active member";
        if (daysOnPlatform < 365) return "Established member";
        return "Veteran member";
    }

    getCommunityActivityStatus(user: User): string {
        const totalActivity = (user.postsCount || 0) + (user.reviewsCount || 0) + (user.commentsCount || 0);
        
        if (totalActivity === 0) return "Getting started";
        if (totalActivity < 5) return "Occasional contributor";
        if (totalActivity < 15) return "Regular contributor";
        if (totalActivity < 50) return "Active contributor";
        return "Power contributor";
    }

    getContentQualityStatus(user: User): string {
        const postsCount = user.postsCount || 0;
        if (postsCount === 0) return "No posts yet";
        if (postsCount < 5) return "Building portfolio";
        return "Quality contributor";
    }

    getSocialEngagementStatus(user: User): string {
        const friendsCount = user.friendsCount || 0;
        if (friendsCount === 0) return "Building network";
        if (friendsCount < 10) return "Growing network";
        if (friendsCount < 50) return "Connected member";
        return "Social hub";
    }

    getEventsParticipationStatus(user: User): string {
        const eventsAttended = user.eventsAttended || 0;
        if (eventsAttended === 0) return "No events yet";
        if (eventsAttended < 3) return "Event newcomer";
        if (eventsAttended < 10) return "Event regular";
        return "Event enthusiast";
    }

    getPositiveInteractionsStatus(user: User): string {
        const totalInteractions = user.totalInteractions || 0;
        if (totalInteractions === 0) return "Good standing";
        
        const ratio = (user.positiveInteractions || 0) / totalInteractions;
        if (ratio >= 0.9) return "Excellent standing";
        if (ratio >= 0.8) return "Very good standing";
        if (ratio >= 0.7) return "Good standing";
        return "Needs improvement";
    }

    getFlaggingAccuracyStatus(user: User): string {
        const flagsSubmitted = user.flagsSubmitted || 0;
        if (flagsSubmitted === 0) return "No flags yet";
        
        const ratio = (user.accurateFlags || 0) / flagsSubmitted;
        if (ratio >= 0.9) return "Highly accurate";
        if (ratio >= 0.8) return "Very accurate";
        if (ratio >= 0.7) return "Accurate";
        return "Needs improvement";
    }

    getPlatformContributionStatus(user: User): string {
        const totalContribution = (user.helpfulReviews || 0) + ((user.eventsCreated || 0) * 2) + ((user.mentoringSessions || 0) * 3);
        
        if (totalContribution === 0) return "Starting journey";
        if (totalContribution < 10) return "Contributing member";
        if (totalContribution < 25) return "Valuable contributor";
        return "Platform champion";
    }
}

// Export singleton instance for use across the platform
export const trustScoreManager = new TrustScoreManager();

// For backward compatibility with existing code
export function getUserTrustScore(user: User): number {
    return trustScoreManager.calculateOverallTrustScore(user);
}

// For direct integration with profile pages
export function getTrustScoreDisplay(user: User): { score: number; components: Record<string, { score: number; status: string }> } {
    const components = trustScoreManager.calculateComponents(user);
    const score = trustScoreManager.calculateOverallTrustScore(user);
    
    return { score, components };
}

console.log('✅ Enhanced Trust Score Calculator integrated into platform - supporting 11 components with max score of 100!');