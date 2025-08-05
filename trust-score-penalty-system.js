/**
 * 🚨 TRUST SCORE PENALTY & RESTRICTION SYSTEM
 * 
 * Handles negative behaviors, penalties, and progressive account restrictions
 * Bad actors face consequences that limit their platform abilities
 */

class TrustScorePenaltySystem {
    constructor() {
        this.penalties = {
            // Content violations
            flaggedPost: { 
                points: -15, 
                message: "🚩 -15 points: Post flagged by community",
                category: 'content',
                severity: 'medium'
            },
            removedPost: { 
                points: -25, 
                message: "🗑️ -25 points: Post removed by moderators",
                category: 'content',
                severity: 'high'
            },
            falseInformation: { 
                points: -30, 
                message: "❌ -30 points: Spreading false information",
                category: 'content',
                severity: 'high'
            },
            spamPosting: { 
                points: -20, 
                message: "📢 -20 points: Spam or promotional abuse",
                category: 'content',
                severity: 'medium'
            },
            
            // Comment violations
            flaggedComment: { 
                points: -8, 
                message: "💬 -8 points: Comment flagged by community",
                category: 'interaction',
                severity: 'low'
            },
            harassmentComment: { 
                points: -35, 
                message: "😡 -35 points: Harassment or bullying",
                category: 'interaction',
                severity: 'critical'
            },
            hateSpeech: { 
                points: -50, 
                message: "🚫 -50 points: Hate speech violation",
                category: 'interaction',
                severity: 'critical'
            },
            
            // Social violations
            fakeReview: { 
                points: -40, 
                message: "⭐ -40 points: Fake or manipulated review",
                category: 'trust',
                severity: 'high'
            },
            sockPuppeting: { 
                points: -60, 
                message: "🎭 -60 points: Multiple fake accounts detected",
                category: 'trust',
                severity: 'critical'
            },
            
            // Event violations
            noShowEvent: { 
                points: -5, 
                message: "📅 -5 points: No-show to confirmed event",
                category: 'reliability',
                severity: 'low'
            },
            disruptiveEvent: { 
                points: -25, 
                message: "🎪 -25 points: Disruptive behavior at event",
                category: 'reliability',
                severity: 'medium'
            },
            fakeEventCreation: { 
                points: -45, 
                message: "🏗️ -45 points: Creating fake or misleading events",
                category: 'trust',
                severity: 'high'
            },
            
            // Platform abuse
            falseFlagging: { 
                points: -12, 
                message: "🏳️ -12 points: False flagging detected",
                category: 'trust',
                severity: 'medium'
            },
            systemGaming: { 
                points: -75, 
                message: "🎮 -75 points: Attempting to game the trust system",
                category: 'trust',
                severity: 'critical'
            },
            
            // Repeated offenses (escalating penalties)
            repeatOffender: {
                multiplier: 1.5,
                message: "🔄 Repeat offense: 1.5x penalty multiplier"
            }
        };

        this.restrictionTiers = {
            // Progressive restrictions based on trust score
            50: {
                name: 'Probation',
                color: 'yellow',
                restrictions: [],
                message: '⚠️ Low trust score - be careful with your actions'
            },
            40: {
                name: 'Limited Access',
                color: 'orange', 
                restrictions: ['no_event_creation', 'post_approval_required'],
                message: '🚧 Limited access - events and posts require approval'
            },
            30: {
                name: 'Restricted User',
                color: 'red',
                restrictions: ['no_event_creation', 'no_posting', 'no_comments', 'limited_flagging'],
                message: '🚨 Restricted - can only upvote, attend events, and view content'
            },
            20: {
                name: 'Severe Restrictions',
                color: 'dark-red',
                restrictions: ['no_event_creation', 'no_posting', 'no_comments', 'no_flagging', 'no_friend_requests'],
                message: '⛔ Severe restrictions - minimal platform access'
            },
            10: {
                name: 'Account Under Review',
                color: 'black',
                restrictions: ['view_only', 'no_interactions'],
                message: '🔒 Account under review - view-only access pending investigation'
            }
        };

        this.recoveryPaths = {
            // Ways to recover from low trust scores
            restrictedUser: [
                { action: 'attend_events', points: 3, limit: 5, message: '+3 per event (max 5 events)' },
                { action: 'positive_reactions', points: 1, limit: 10, message: '+1 per helpful upvote (max 10)' },
                { action: 'profile_improvements', points: 5, limit: 2, message: '+5 per profile enhancement (max 2)' },
                { action: 'social_connections', points: 2, limit: 3, message: '+2 per verified friend (max 3)' },
                { action: 'time_based_recovery', points: 2, period: 'weekly', message: '+2 per week of good behavior' }
            ]
        };
    }

    /**
     * Apply penalty for negative behavior
     */
    applyPenalty(user, violationType, context = {}) {
        const penalty = this.penalties[violationType];
        if (!penalty) {
            console.error(`Unknown violation type: ${violationType}`);
            return null;
        }

        // Calculate actual penalty points
        let penaltyPoints = penalty.points;
        
        // Check for repeat offender multiplier
        const recentViolations = this.getRecentViolations(user, 30); // Last 30 days
        const sameTypeViolations = recentViolations.filter(v => v.type === violationType).length;
        
        if (sameTypeViolations > 0) {
            penaltyPoints = Math.round(penaltyPoints * this.penalties.repeatOffender.multiplier);
        }

        // Apply penalty with context
        const penaltyResult = {
            violationType,
            originalPenalty: penalty.points,
            actualPenalty: penaltyPoints,
            repeatOffense: sameTypeViolations > 0,
            severity: penalty.severity,
            category: penalty.category,
            message: penalty.message,
            context,
            timestamp: new Date(),
            appealable: penalty.severity !== 'critical'
        };

        // Calculate new scores
        const currentScore = user.trustScore || 50;
        const newScore = Math.max(5, currentScore + penaltyPoints); // Never go below 5
        
        // Determine restriction changes
        const oldRestrictions = this.getUserRestrictions(currentScore);
        const newRestrictions = this.getUserRestrictions(newScore);
        const restrictionChanged = oldRestrictions.name !== newRestrictions.name;

        return {
            ...penaltyResult,
            oldScore: currentScore,
            newScore,
            scoreDrop: currentScore - newScore,
            oldRestrictions,
            newRestrictions,
            restrictionChanged,
            recoveryPlan: newScore < 40 ? this.generateRecoveryPlan(newScore) : null
        };
    }

    /**
     * Get user restrictions based on trust score
     */
    getUserRestrictions(trustScore) {
        // Find the appropriate restriction tier
        const tiers = Object.keys(this.restrictionTiers)
            .map(Number)
            .sort((a, b) => b - a); // Sort descending
        
        const applicableTier = tiers.find(tier => trustScore <= tier);
        
        if (!applicableTier) {
            return {
                name: 'Full Access',
                color: 'green',
                restrictions: [],
                message: '✅ Full platform access'
            };
        }

        return this.restrictionTiers[applicableTier];
    }

    /**
     * Check if user can perform specific action
     */
    canUserPerformAction(user, action) {
        const restrictions = this.getUserRestrictions(user.trustScore || 50);
        
        const actionMap = {
            'create_event': !restrictions.restrictions.includes('no_event_creation'),
            'create_post': !restrictions.restrictions.includes('no_posting'),
            'comment': !restrictions.restrictions.includes('no_comments'),
            'flag_content': !restrictions.restrictions.includes('no_flagging'),
            'send_friend_request': !restrictions.restrictions.includes('no_friend_requests'),
            'upvote': !restrictions.restrictions.includes('view_only'),
            'attend_event': !restrictions.restrictions.includes('view_only'),
            'view_content': true // Everyone can view content
        };

        return {
            allowed: actionMap[action] !== false,
            restriction: restrictions,
            message: actionMap[action] === false ? 
                `Action blocked: ${restrictions.message}` : 
                'Action allowed'
        };
    }

    /**
     * Generate recovery plan for restricted users
     */
    generateRecoveryPlan(currentScore) {
        const targetScore = 50; // Goal to reach unrestricted status
        const pointsNeeded = targetScore - currentScore;
        
        const recoveryActions = this.recoveryPaths.restrictedUser.map(action => ({
            ...action,
            totalPossible: action.points * (action.limit || 1),
            description: this.getRecoveryDescription(action.action)
        }));

        const maxRecoveryPoints = recoveryActions.reduce((sum, action) => 
            sum + action.totalPossible, 0);

        return {
            currentScore,
            targetScore,
            pointsNeeded,
            maxPossibleRecovery: maxRecoveryPoints,
            estimatedTimeframe: this.estimateRecoveryTime(pointsNeeded),
            actions: recoveryActions,
            priorityActions: recoveryActions
                .sort((a, b) => b.totalPossible - a.totalPossible)
                .slice(0, 3),
            tips: [
                'Focus on attending events - guaranteed positive points',
                'Engage positively with content through upvotes', 
                'Connect with verified community members',
                'Avoid any actions that could trigger more penalties',
                'Be patient - recovery takes time but is achievable'
            ]
        };
    }

    /**
     * Track violation history and patterns
     */
    trackViolation(user, violation) {
        if (!user.violationHistory) {
            user.violationHistory = [];
        }

        const violationRecord = {
            id: Date.now(),
            type: violation.violationType,
            severity: violation.severity,
            category: violation.category,
            points: violation.actualPenalty,
            timestamp: violation.timestamp,
            context: violation.context,
            appealable: violation.appealable,
            appealed: false,
            upheld: null
        };

        user.violationHistory.push(violationRecord);

        // Check for concerning patterns
        const patterns = this.detectViolationPatterns(user.violationHistory);
        
        return {
            violationRecord,
            patterns,
            riskLevel: this.calculateRiskLevel(user.violationHistory),
            recommendedAction: this.getRecommendedModeratorAction(patterns)
        };
    }

    /**
     * Detect patterns in violation history
     */
    detectViolationPatterns(violationHistory) {
        const last30Days = violationHistory.filter(v => 
            (Date.now() - new Date(v.timestamp).getTime()) <= (30 * 24 * 60 * 60 * 1000)
        );

        const last7Days = violationHistory.filter(v => 
            (Date.now() - new Date(v.timestamp).getTime()) <= (7 * 24 * 60 * 60 * 1000)
        );

        return {
            totalViolations: violationHistory.length,
            recentViolations: last30Days.length,
            weeklyViolations: last7Days.length,
            criticalViolations: violationHistory.filter(v => v.severity === 'critical').length,
            categories: this.groupViolationsByCategory(violationHistory),
            escalating: last7Days.length > 2,
            frequentOffender: last30Days.length > 5,
            diverseViolations: new Set(violationHistory.map(v => v.category)).size > 2
        };
    }

    /**
     * Calculate user risk level
     */
    calculateRiskLevel(violationHistory) {
        const patterns = this.detectViolationPatterns(violationHistory);
        
        let riskScore = 0;
        
        // Add risk for recent violations
        riskScore += patterns.weeklyViolations * 3;
        riskScore += patterns.recentViolations * 1;
        
        // Add risk for severe violations
        riskScore += patterns.criticalViolations * 5;
        
        // Add risk for patterns
        if (patterns.escalating) riskScore += 5;
        if (patterns.frequentOffender) riskScore += 8;
        if (patterns.diverseViolations) riskScore += 3;

        if (riskScore >= 20) return 'critical';
        if (riskScore >= 12) return 'high';
        if (riskScore >= 6) return 'medium';
        if (riskScore >= 2) return 'low';
        return 'minimal';
    }

    /**
     * Generate moderator action recommendations
     */
    getRecommendedModeratorAction(patterns) {
        if (patterns.criticalViolations > 2) {
            return {
                action: 'account_suspension',
                duration: '7 days',
                reason: 'Multiple critical violations detected'
            };
        }

        if (patterns.escalating && patterns.weeklyViolations > 3) {
            return {
                action: 'manual_review',
                priority: 'high',
                reason: 'Escalating violation pattern requires intervention'
            };
        }

        if (patterns.frequentOffender) {
            return {
                action: 'enhanced_monitoring',
                duration: '30 days',
                reason: 'Frequent violations require closer oversight'
            };
        }

        return {
            action: 'automated_handling',
            reason: 'Violations within normal parameters'
        };
    }

    // Helper methods
    getRecentViolations(user, days) {
        if (!user.violationHistory) return [];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return user.violationHistory.filter(v => 
            new Date(v.timestamp) >= cutoffDate
        );
    }

    groupViolationsByCategory(violations) {
        return violations.reduce((groups, violation) => {
            const category = violation.category;
            groups[category] = (groups[category] || 0) + 1;
            return groups;
        }, {});
    }

    getRecoveryDescription(action) {
        const descriptions = {
            'attend_events': 'Attend community events to show positive engagement',
            'positive_reactions': 'Upvote helpful content to contribute positively',
            'profile_improvements': 'Complete profile sections and verify accounts',
            'social_connections': 'Connect with verified, trusted community members',
            'time_based_recovery': 'Maintain good behavior over time for gradual recovery'
        };
        
        return descriptions[action] || 'Engage positively with the community';
    }

    estimateRecoveryTime(pointsNeeded) {
        // Assume user can earn ~8-12 points per week through recovery actions
        const weeklyRecovery = 10;
        const weeks = Math.ceil(pointsNeeded / weeklyRecovery);
        
        if (weeks <= 2) return '1-2 weeks';
        if (weeks <= 4) return '2-4 weeks';
        if (weeks <= 8) return '1-2 months';
        if (weeks <= 12) return '2-3 months';
        return '3+ months';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TrustScorePenaltySystem
    };
}

console.log(`
🚨 TRUST SCORE PENALTY & RESTRICTION SYSTEM READY!

PENALTIES FOR BAD BEHAVIOR:
❌ False/negative posts: -15 to -30 points
💬 Flagged comments: -8 to -35 points  
🚫 Hate speech: -50 points
🎭 Fake accounts: -60 points
🎮 System gaming: -75 points
🔄 Repeat offenses: 1.5x multiplier

PROGRESSIVE RESTRICTIONS:
📊 50+ points: Full access
⚠️  40-49: Event creation requires approval
🚧 30-39: No posting, no event creation
🚨 20-29: Only upvoting and event attendance
⛔ 10-19: Severe restrictions, minimal access
🔒 <10: Account under review, view-only

RECOVERY PATHS:
🎪 Attend events: +3 points each (max 5)
👍 Positive upvotes: +1 point each (max 10)  
👤 Profile improvements: +5 points each (max 2)
👥 New verified friends: +2 points each (max 3)
⏰ Weekly good behavior: +2 points per week

Bad actors face real consequences while having clear paths to redemption!
`);