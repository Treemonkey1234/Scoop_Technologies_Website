/**
 * 🔧 UPDATED TRUST SCORE FIXES 
 * 
 * Based on analysis of the ACTUAL 11-component trust score system
 * found on the platform and the real calculation function.
 */

// =============================================================================
// 🎯 CORRECT TRUST SCORE CALCULATION FUNCTION (Updated to allow 100)
// =============================================================================

/**
 * The ACTUAL trust score calculation function found in the compiled code
 * Updated to allow maximum score of 100 instead of 95
 */
function calculateTrustScore(connectedAccountsCount) {
    if (connectedAccountsCount === 0) return 50;
    
    let baseScore = 50 + 10 * Math.min(connectedAccountsCount, 5);
    
    if (connectedAccountsCount > 5) {
        baseScore += 2 * Math.min(connectedAccountsCount - 5, 10);
    }
    
    // Updated: Allow scores up to 100 instead of 95
    return Math.min(baseScore, 100);
}

// =============================================================================
// 🏗️ 11-COMPONENT TRUST SCORE SYSTEM
// =============================================================================

/**
 * The REAL trust score system with 11 components as shown on the platform
 */
class TrustScoreManager {
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
    calculateComponents(user) {
        const components = {};

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
    calculateOverallTrustScore(user) {
        const components = this.calculateComponents(user);
        
        // Component weights (must add up to 1.0)
        const weights = {
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
    calculateAccountVerification(user) {
        let score = 30; // Base score
        if (user.emailVerified) score += 35;
        if (user.phoneVerified) score += 35;
        return Math.min(100, score);
    }

    calculateProfileCompleteness(user) {
        let score = 0;
        if (user.name) score += 15;
        if (user.bio) score += 15;
        if (user.location) score += 10;
        if (user.avatar && user.avatar !== 'default-avatar.jpg') score += 15;
        if (user.birthDate) score += 10;
        if (user.occupation) score += 10;
        if (user.interests && user.interests.length > 0) score += 15;
        if (user.website) score += 10;
        return Math.min(100, score);
    }

    calculateTimeOnPlatform(user) {
        const joinDate = new Date(user.joinDate || user.created_at);
        const now = new Date();
        const daysOnPlatform = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
        
        if (daysOnPlatform < 7) return 40;
        if (daysOnPlatform < 30) return 65;
        if (daysOnPlatform < 90) return 80;
        if (daysOnPlatform < 365) return 90;
        return 100;
    }

    calculateCommunityActivity(user) {
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

    calculateContentQuality(user) {
        const postsCount = user.postsCount || 0;
        if (postsCount === 0) return 50;
        
        // Could be enhanced with actual quality metrics
        const averageRating = user.averageContentRating || 3.5;
        return Math.min(100, Math.round(20 + (averageRating / 5) * 80));
    }

    calculateSocialEngagement(user) {
        const friendsCount = user.friendsCount || 0;
        if (friendsCount === 0) return 45;
        
        const base = 45;
        const bonus = Math.min(50, friendsCount * 2);
        return Math.min(100, base + bonus);
    }

    calculateEventsParticipation(user) {
        const eventsAttended = user.eventsAttended || 0;
        if (eventsAttended === 0) return 40;
        
        return Math.min(100, 40 + (eventsAttended * 8));
    }

    calculatePositiveInteractions(user) {
        const totalInteractions = user.totalInteractions || 0;
        const positiveInteractions = user.positiveInteractions || 0;
        
        if (totalInteractions === 0) return 75; // Good standing by default
        
        const ratio = positiveInteractions / totalInteractions;
        return Math.round(ratio * 100);
    }

    calculateFlaggingAccuracy(user) {
        const flagsSubmitted = user.flagsSubmitted || 0;
        if (flagsSubmitted === 0) return 60; // No flags yet
        
        const accurateFlags = user.accurateFlags || 0;
        const ratio = accurateFlags / flagsSubmitted;
        return Math.round(ratio * 100);
    }

    calculatePlatformContribution(user) {
        const helpfulReviews = user.helpfulReviews || 0;
        const eventsCreated = user.eventsCreated || 0;
        const mentoringSessions = user.mentoringSessions || 0;
        
        const totalContribution = helpfulReviews + (eventsCreated * 2) + (mentoringSessions * 3);
        
        if (totalContribution === 0) return 50;
        return Math.min(100, 50 + (totalContribution * 5));
    }

    // Status message methods
    getTimeOnPlatformStatus(user) {
        const joinDate = new Date(user.joinDate || user.created_at);
        const now = new Date();
        const daysOnPlatform = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
        
        if (daysOnPlatform < 7) return "New member";
        if (daysOnPlatform < 30) return "Getting started";
        if (daysOnPlatform < 90) return "Active member";
        if (daysOnPlatform < 365) return "Established member";
        return "Veteran member";
    }

    getCommunityActivityStatus(user) {
        const totalActivity = (user.postsCount || 0) + (user.reviewsCount || 0) + (user.commentsCount || 0);
        
        if (totalActivity === 0) return "Getting started";
        if (totalActivity < 5) return "Occasional contributor";
        if (totalActivity < 15) return "Regular contributor";
        if (totalActivity < 50) return "Active contributor";
        return "Power contributor";
    }

    getContentQualityStatus(user) {
        const postsCount = user.postsCount || 0;
        if (postsCount === 0) return "No posts yet";
        if (postsCount < 5) return "Building portfolio";
        return "Quality contributor";
    }

    getSocialEngagementStatus(user) {
        const friendsCount = user.friendsCount || 0;
        if (friendsCount === 0) return "Building network";
        if (friendsCount < 10) return "Growing network";
        if (friendsCount < 50) return "Connected member";
        return "Social hub";
    }

    getEventsParticipationStatus(user) {
        const eventsAttended = user.eventsAttended || 0;
        if (eventsAttended === 0) return "No events yet";
        if (eventsAttended < 3) return "Event newcomer";
        if (eventsAttended < 10) return "Event regular";
        return "Event enthusiast";
    }

    getPositiveInteractionsStatus(user) {
        const totalInteractions = user.totalInteractions || 0;
        if (totalInteractions === 0) return "Good standing";
        
        const ratio = (user.positiveInteractions || 0) / totalInteractions;
        if (ratio >= 0.9) return "Excellent standing";
        if (ratio >= 0.8) return "Very good standing";
        if (ratio >= 0.7) return "Good standing";
        return "Needs improvement";
    }

    getFlaggingAccuracyStatus(user) {
        const flagsSubmitted = user.flagsSubmitted || 0;
        if (flagsSubmitted === 0) return "No flags yet";
        
        const ratio = (user.accurateFlags || 0) / flagsSubmitted;
        if (ratio >= 0.9) return "Highly accurate";
        if (ratio >= 0.8) return "Very accurate";
        if (ratio >= 0.7) return "Accurate";
        return "Needs improvement";
    }

    getPlatformContributionStatus(user) {
        const totalContribution = (user.helpfulReviews || 0) + ((user.eventsCreated || 0) * 2) + ((user.mentoringSessions || 0) * 3);
        
        if (totalContribution === 0) return "Starting journey";
        if (totalContribution < 10) return "Contributing member";
        if (totalContribution < 25) return "Valuable contributor";
        return "Platform champion";
    }
}

// =============================================================================
// 🚀 IMPLEMENTATION INSTRUCTIONS
// =============================================================================

console.log(`
🔧 UPDATED TRUST SCORE IMPLEMENTATION GUIDE:

1. REPLACE OLD TRUST SCORE CALCULATION:
   - Find all instances of the old calculateTrustScore function
   - Replace with the new 11-component TrustScoreManager

2. UPDATE MAXIMUM SCORES:
   - Change all instances of "Math.min(score, 95)" to "Math.min(score, 100)"
   - Update trust score displays to allow 100 as maximum

3. IMPLEMENT 11-COMPONENT SYSTEM:
   - Replace simple trust score displays with TrustScoreManager.calculateComponents()
   - Use TrustScoreManager.calculateOverallTrustScore() for the main score
   - Display individual component scores and statuses

4. UPDATE TRUST SCORE BREAKDOWN:
   - Replace hardcoded component scores with calculated ones
   - Use real user data for accurate calculations
   - Show proper status messages for each component

EXAMPLE USAGE:
const trustManager = new TrustScoreManager();
const user = getCurrentUser();
const components = trustManager.calculateComponents(user);
const overallScore = trustManager.calculateOverallTrustScore(user);

COMPONENT WEIGHTS:
- Account Verification: 15% (High)
- Connected Accounts: 15% (High) 
- Community Activity: 12% (High)
- Content Quality: 12% (High)
- Profile Completeness: 10% (Medium)
- Social Engagement: 10% (High)
- Time on Platform: 8% (Medium)
- Events Participation: 6% (Medium)
- Positive Interactions: 6% (Medium)
- Flagging Accuracy: 3% (Low)
- Platform Contribution: 3% (Low)
`);

// Export for use in components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateTrustScore,
        TrustScoreManager
    };
}