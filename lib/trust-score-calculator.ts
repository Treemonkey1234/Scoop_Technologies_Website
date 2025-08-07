// COMPLETELY NEW FILE: No dynamic indexing, no complex patterns
// Different filename to avoid any cached issues

export class TrustScoreCalculator {
    private config = {
        weights: {
            eventOrganizing: 0.3,
            socialProof: 0.2,
            longevity: 0.15,
            engagement: 0.2,
            reliability: 0.15
        },
        displayCap: 100
    };

    calculateBaseComponents(user: any) {
        return {
            eventOrganizing: user.eventsOrganized || 0,
            socialProof: user.friendsCount || 0,
            longevity: user.accountAge || 0,
            engagement: user.interactions || 0,
            reliability: user.reliability || 0
        };
    }

    calculateComponentsWithDepreciation(user: any): any {
        const baseComponents = this.calculateBaseComponents(user);
        
        // EXPLICIT OBJECT CREATION - NO DYNAMIC INDEXING
        const result = {
            eventOrganizing: {
                current: Math.round(baseComponents.eventOrganizing * 0.9),
                original: baseComponents.eventOrganizing,
                depreciation: Math.round(baseComponents.eventOrganizing * 0.1)
            },
            socialProof: {
                current: Math.round(baseComponents.socialProof * 0.9),
                original: baseComponents.socialProof,
                depreciation: Math.round(baseComponents.socialProof * 0.1)
            },
            longevity: {
                current: Math.round(baseComponents.longevity * 0.9),
                original: baseComponents.longevity,
                depreciation: Math.round(baseComponents.longevity * 0.1)
            },
            engagement: {
                current: Math.round(baseComponents.engagement * 0.9),
                original: baseComponents.engagement,
                depreciation: Math.round(baseComponents.engagement * 0.1)
            },
            reliability: {
                current: Math.round(baseComponents.reliability * 0.9),
                original: baseComponents.reliability,
                depreciation: Math.round(baseComponents.reliability * 0.1)
            }
        };
        
        return result;
    }

    calculateAdvancedScore(user: any, activityHistory: any = {}) {
        const components = this.calculateComponentsWithDepreciation(user);
        
        let totalScore = 0;
        totalScore += components.eventOrganizing.current * this.config.weights.eventOrganizing;
        totalScore += components.socialProof.current * this.config.weights.socialProof;
        totalScore += components.longevity.current * this.config.weights.longevity;
        totalScore += components.engagement.current * this.config.weights.engagement;
        totalScore += components.reliability.current * this.config.weights.reliability;

        const internalScore = Math.round(totalScore);
        const displayScore = Math.min(this.config.displayCap, internalScore);

        return {
            displayScore,
            internalScore,
            components,
            overflow: Math.max(0, internalScore - this.config.displayCap)
        };
    }
}