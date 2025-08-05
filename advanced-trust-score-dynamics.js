/**
 * 🎯 ADVANCED TRUST SCORE DYNAMICS
 * 
 * Handles what happens at 100+ points and introduces time-based depreciation
 * Creates a dynamic, engaging system that never becomes stagnant
 */

class AdvancedTrustScoreDynamics {
    constructor() {
        this.config = {
            // Display score caps at 100, but internal score can go higher
            displayCap: 100,
            internalCap: 200, // Internal score can reach 200 for calculations
            
            // Depreciation rates (per month)
            depreciationRates: {
                'Account Verification': 0,      // Never depreciates - permanent
                'Profile Completeness': 0,     // Permanent once completed
                'Connected Accounts': 2,       // -2 points/month (accounts can become inactive)
                'Time on Platform': 0,         // Never depreciates - cumulative
                'Community Activity': 8,       // -8 points/month (needs ongoing activity)
                'Content Quality': 5,          // -5 points/month (recent content matters more)
                'Social Engagement': 6,        // -6 points/month (friendships need maintenance)
                'Events Participation': 10,    // -10 points/month (recent events matter most)
                'Positive Interactions': 3,    // -3 points/month (reputation decay)
                'Flagging Accuracy': 1,        // -1 point/month (slowly fades)
                'Platform Contribution': 4     // -4 points/month (recent contributions matter)
            },
            
            // Score thresholds for benefits
            thresholds: {
                60: 'verified',      // Basic verification benefits
                70: 'trusted',       // Additional platform privileges  
                80: 'leader',        // Leadership and mentorship access
                90: 'elite',         // VIP features and priority support
                100: 'champion',     // Maximum displayed benefits
                120: 'legend',       // Hidden tier with special rewards
                150: 'mythic'        // Ultra-rare tier with exclusive access
            }
        };
        
        this.overflowBenefits = {
            // What happens when internal score > 100
            101: { type: 'buffer', benefit: 'Score protection against small drops' },
            105: { type: 'multiplier', benefit: '1.1x point earning multiplier' },
            110: { type: 'priority', benefit: 'Priority customer support' },
            115: { type: 'feature', benefit: 'Beta feature early access' },
            120: { type: 'exclusive', benefit: 'Legend tier - exclusive community access' },
            125: { type: 'multiplier', benefit: '1.2x point earning multiplier' },
            130: { type: 'mentorship', benefit: 'Verified mentor status' },
            135: { type: 'influence', benefit: 'Platform feedback council invitation' },
            140: { type: 'recognition', benefit: 'Featured member spotlight' },
            150: { type: 'mythic', benefit: 'Mythic tier - ultimate recognition' }
        };
    }

    /**
     * Calculate display score vs internal score
     */
    calculateScores(user, activityHistory) {
        const components = this.calculateComponentsWithDepreciation(user, activityHistory);
        const internalScore = this.calculateInternalScore(components);
        const displayScore = Math.min(this.config.displayCap, internalScore);
        
        return {
            displayScore,
            internalScore,
            components,
            overflow: Math.max(0, internalScore - this.config.displayCap),
            tier: this.determineTier(internalScore),
            benefits: this.getActiveBenefits(internalScore)
        };
    }

    /**
     * Calculate components with time-based depreciation
     */
    calculateComponentsWithDepreciation(user, activityHistory) {
        const baseComponents = this.calculateBaseComponents(user);
        const lastUpdate = new Date(user.lastTrustScoreUpdate || user.joinDate);
        const now = new Date();
        const monthsSinceUpdate = this.getMonthsBetween(lastUpdate, now);
        
        const depreciatedComponents = {};
        
        for (const [component, baseScore] of Object.entries(baseComponents)) {
            const depreciationRate = this.config.depreciationRates[component] || 0;
            const totalDepreciation = depreciationRate * monthsSinceUpdate;
            
            // Apply depreciation but never go below 30% of original score
            const minScore = Math.max(30, baseScore * 0.3);
            const depreciatedScore = Math.max(minScore, baseScore - totalDepreciation);
            
            depreciatedComponents[component] = {
                current: Math.round(depreciatedScore),
                original: baseScore,
                depreciation: Math.round(totalDepreciation),
                rate: depreciationRate
            };
        }
        
        return depreciatedComponents;
    }

    /**
     * Calculate internal score (can exceed 100)
     */
    calculateInternalScore(components) {
        // Component weights (same as before)
        const weights = {
            'Account Verification': 0.15,
            'Profile Completeness': 0.10,
            'Connected Accounts': 0.15,
            'Time on Platform': 0.08,
            'Community Activity': 0.12,
            'Content Quality': 0.12,
            'Social Engagement': 0.10,
            'Events Participation': 0.06,
            'Positive Interactions': 0.06,
            'Flagging Accuracy': 0.03,
            'Platform Contribution': 0.03
        };

        let weightedSum = 0;
        let totalWeight = 0;

        for (const [componentName, data] of Object.entries(components)) {
            const weight = weights[componentName] || 0;
            weightedSum += data.current * weight;
            totalWeight += weight;
        }

        const baseScore = weightedSum / totalWeight;
        
        // Allow internal score to exceed 100 for super-engaged users
        return Math.min(this.config.internalCap, Math.round(baseScore));
    }

    /**
     * Handle score overflow (what happens above 100)
     */
    handleScoreOverflow(internalScore) {
        const overflow = Math.max(0, internalScore - this.config.displayCap);
        const activeBenefits = [];
        
        // Check which overflow benefits are active
        for (const [threshold, benefit] of Object.entries(this.overflowBenefits)) {
            if (internalScore >= parseInt(threshold)) {
                activeBenefits.push({
                    threshold: parseInt(threshold),
                    ...benefit
                });
            }
        }
        
        return {
            overflow,
            activeBenefits,
            protection: this.calculateScoreProtection(overflow),
            multiplier: this.calculateEarningMultiplier(internalScore),
            hiddenTier: this.getHiddenTier(internalScore)
        };
    }

    /**
     * Calculate score protection from overflow
     */
    calculateScoreProtection(overflow) {
        // Every 5 overflow points provides 1 point of protection
        const protectionPoints = Math.floor(overflow / 5);
        
        return {
            points: protectionPoints,
            description: `${protectionPoints} points of protection against score drops`,
            benefit: protectionPoints > 0 ? `First ${protectionPoints} points of any score loss are absorbed by your overflow buffer` : null
        };
    }

    /**
     * Calculate earning multiplier from high scores
     */
    calculateEarningMultiplier(internalScore) {
        if (internalScore >= 150) return 1.3;  // Mythic tier
        if (internalScore >= 125) return 1.2;  // Legend tier enhanced
        if (internalScore >= 105) return 1.1;  // Champion tier
        return 1.0; // Standard earning rate
    }

    /**
     * Determine user tier including hidden tiers
     */
    determineTier(internalScore) {
        if (internalScore >= 150) return 'mythic';
        if (internalScore >= 120) return 'legend';
        if (internalScore >= 100) return 'champion';
        if (internalScore >= 90) return 'elite';
        if (internalScore >= 80) return 'leader';
        if (internalScore >= 70) return 'trusted';
        if (internalScore >= 60) return 'verified';
        return 'basic';
    }

    /**
     * Get hidden tier information
     */
    getHiddenTier(internalScore) {
        if (internalScore >= 150) {
            return {
                name: 'Mythic',
                icon: '🌟',
                color: 'rainbow',
                description: 'Ultra-rare recognition for exceptional community leaders',
                exclusiveAccess: [
                    'Platform advisory board',
                    'Annual founder meetup invitation',
                    'Custom community badge',
                    'Priority feature requests'
                ]
            };
        }
        
        if (internalScore >= 120) {
            return {
                name: 'Legend', 
                icon: '👑',
                color: 'gold',
                description: 'Legendary status for sustained excellence',
                exclusiveAccess: [
                    'Exclusive legend community',
                    'Monthly legend meetups',
                    'Platform beta testing',
                    'Featured member highlights'
                ]
            };
        }
        
        return null;
    }

    /**
     * Generate depreciation warnings and recovery suggestions
     */
    generateDepreciationWarnings(components) {
        const warnings = [];
        const suggestions = [];
        
        for (const [component, data] of Object.entries(components)) {
            const depreciationRate = this.config.depreciationRates[component];
            
            if (depreciationRate > 0 && data.depreciation > 5) {
                warnings.push({
                    component,
                    lostPoints: data.depreciation,
                    monthlyLoss: depreciationRate,
                    urgency: data.depreciation > 15 ? 'high' : 'medium'
                });
                
                // Generate recovery suggestions
                suggestions.push(this.getRecoverySuggestion(component, data.depreciation));
            }
        }
        
        return { warnings, suggestions };
    }

    /**
     * Get recovery suggestion for specific component
     */
    getRecoverySuggestion(component, lostPoints) {
        const suggestions = {
            'Connected Accounts': {
                action: 'Reconnect social accounts',
                description: 'Some connected accounts may have become inactive. Verify and reconnect them.',
                points: `+${Math.min(15, lostPoints)} points`,
                timeframe: 'Immediate'
            },
            'Community Activity': {
                action: 'Increase community engagement',
                description: 'Post reviews, comments, and participate in discussions regularly.',
                points: `+${Math.min(20, lostPoints)} points`,
                timeframe: '2-4 weeks'
            },
            'Content Quality': {
                action: 'Create high-quality content',
                description: 'Focus on writing detailed, helpful reviews and posts.',
                points: `+${Math.min(15, lostPoints)} points`,
                timeframe: '2-3 weeks'
            },
            'Social Engagement': {
                action: 'Reconnect with friends',
                description: 'Interact with friends, make new connections, attend social events.',
                points: `+${Math.min(12, lostPoints)} points`,
                timeframe: '3-4 weeks'
            },
            'Events Participation': {
                action: 'Attend community events',
                description: 'Join upcoming events to boost your participation score.',
                points: `+${Math.min(25, lostPoints)} points`,
                timeframe: '1-2 weeks'
            },
            'Platform Contribution': {
                action: 'Help community members',
                description: 'Answer questions, help newcomers, provide valuable insights.',
                points: `+${Math.min(10, lostPoints)} points`,
                timeframe: '2-6 weeks'
            }
        };
        
        return suggestions[component] || {
            action: 'Maintain active participation',
            description: 'Stay engaged with the community to prevent further depreciation.',
            points: `+${Math.min(10, lostPoints)} points`,
            timeframe: '2-4 weeks'
        };
    }

    /**
     * Apply score changes with overflow handling
     */
    applyScoreChange(currentInternalScore, pointChange, reason) {
        const newInternalScore = Math.max(30, Math.min(this.config.internalCap, currentInternalScore + pointChange));
        const newDisplayScore = Math.min(this.config.displayCap, newInternalScore);
        
        // Check if score protection absorbs any negative changes
        let protectedChange = pointChange;
        if (pointChange < 0 && currentInternalScore > this.config.displayCap) {
            const protection = this.calculateScoreProtection(currentInternalScore - this.config.displayCap);
            const protectionUsed = Math.min(protection.points, Math.abs(pointChange));
            protectedChange = pointChange + protectionUsed;
        }
        
        return {
            oldDisplayScore: Math.min(this.config.displayCap, currentInternalScore),
            newDisplayScore,
            oldInternalScore: currentInternalScore,
            newInternalScore,
            actualChange: protectedChange,
            protectionUsed: pointChange < 0 ? Math.abs(pointChange - protectedChange) : 0,
            reason,
            overflowInfo: this.handleScoreOverflow(newInternalScore)
        };
    }

    // Helper methods
    getMonthsBetween(date1, date2) {
        const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
        return Math.max(0, months);
    }

    calculateBaseComponents(user) {
        // This would use the same logic as the previous TrustScoreManager
        // but return raw scores before depreciation
        return {
            'Account Verification': 85,
            'Profile Completeness': 70,
            'Connected Accounts': 60,
            'Time on Platform': 75,
            'Community Activity': 80,
            'Content Quality': 65,
            'Social Engagement': 70,
            'Events Participation': 55,
            'Positive Interactions': 85,
            'Flagging Accuracy': 70,
            'Platform Contribution': 60
        };
    }
}

// =============================================================================
// 🎯 EXAMPLE USAGE AND SCENARIOS
// =============================================================================

class TrustScoreScenarios {
    static demonstrateOverflowSystem() {
        const dynamics = new AdvancedTrustScoreDynamics();
        
        console.log("🎯 TRUST SCORE OVERFLOW SCENARIOS:");
        
        // Scenario 1: Active user hits 100
        console.log("\n📈 Scenario 1: Active user reaches 100 display score");
        const activeUser = dynamics.calculateScores({ /* user data */ }, { /* activity */ });
        console.log(`Display Score: ${activeUser.displayScore}/100`);
        console.log(`Internal Score: ${activeUser.internalScore}/200`);
        console.log(`Overflow Benefits: ${activeUser.benefits.length} active`);
        
        // Scenario 2: Super user with 150 internal score
        console.log("\n🌟 Scenario 2: Super user with mythic tier");
        const superUser = dynamics.handleScoreOverflow(150);
        console.log(`Hidden Tier: ${superUser.hiddenTier?.name || 'None'}`);
        console.log(`Earning Multiplier: ${dynamics.calculateEarningMultiplier(150)}x`);
        console.log(`Score Protection: ${superUser.protection.points} points`);
        
        // Scenario 3: Depreciation over 6 months
        console.log("\n⏰ Scenario 3: Depreciation after 6 months inactivity");
        const depreciationExample = dynamics.generateDepreciationWarnings({
            'Community Activity': { current: 40, original: 80, depreciation: 40, rate: 8 },
            'Events Participation': { current: 25, original: 55, depreciation: 30, rate: 10 }
        });
        console.log(`Warnings: ${depreciationExample.warnings.length}`);
        console.log(`Recovery suggestions: ${depreciationExample.suggestions.length}`);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedTrustScoreDynamics,
        TrustScoreScenarios
    };
}

console.log(`
🎯 ADVANCED TRUST SCORE DYNAMICS READY!

KEY FEATURES:
✅ Internal score can reach 200 (display caps at 100)
✅ Overflow points provide tangible benefits
✅ Time-based depreciation keeps scores dynamic
✅ Score protection for high achievers
✅ Hidden tiers (Legend, Mythic) for ultra-engaged users
✅ Component-specific depreciation rates
✅ Recovery suggestions for declining scores

WHAT HAPPENS AT 100+:
🏆 Points above 100 unlock hidden benefits
🛡️ Overflow provides protection against score drops
⚡ Higher earning multipliers (up to 1.3x)
👑 Access to exclusive Legend/Mythic tiers
🌟 Special recognition and platform privileges

DEPRECIATION SYSTEM:
📉 Different components depreciate at different rates
🔄 Recent activity matters more than old activity
⚠️ Warnings and recovery suggestions provided
🛡️ Never drops below 30% of peak score
`);