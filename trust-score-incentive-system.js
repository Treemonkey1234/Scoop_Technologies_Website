/**
 * 🎯 TRUST SCORE INCENTIVE SYSTEM
 * 
 * Encourage positive behaviors: friend connections, event participation, account linking
 * Based on the 11-component trust score system analysis
 */

class TrustScoreIncentiveSystem {
    constructor() {
        this.incentives = {
            // High-impact actions for trust score growth
            connectSocialAccount: { points: 15, message: "🔗 +15 points for connecting a social account!" },
            verifyPhone: { points: 35, message: "📱 +35 points for phone verification!" },
            verifyEmail: { points: 35, message: "📧 +35 points for email verification!" },
            addFriend: { points: 2, message: "👥 +2 points for each new friend!" },
            attendEvent: { points: 8, message: "🎉 +8 points for attending an event!" },
            createEvent: { points: 10, message: "📅 +10 points for creating an event!" },
            writeReview: { points: 5, message: "⭐ +5 points for writing a review!" },
            completeProfile: { points: 15, message: "✅ +15 points for completing your profile!" },
            
            // Milestone bonuses
            milestones: {
                first5Friends: { points: 25, message: "🏆 +25 bonus points for reaching 5 friends!" },
                first10Events: { points: 30, message: "🎪 +30 bonus points for attending 10 events!" },
                allSocialConnected: { points: 50, message: "🌟 +50 bonus points for connecting all social accounts!" },
                profileComplete: { points: 20, message: "📋 +20 bonus points for 100% profile completion!" }
            }
        };
    }

    /**
     * Calculate trust score increase for specific actions
     */
    calculateIncentiveReward(action, currentUser) {
        const incentive = this.incentives[action];
        if (!incentive) return { points: 0, message: "" };

        // Check for milestone bonuses
        const milestoneBonus = this.checkMilestones(action, currentUser);
        
        return {
            points: incentive.points + milestoneBonus.points,
            message: incentive.message + (milestoneBonus.message ? " " + milestoneBonus.message : ""),
            breakdown: {
                base: incentive.points,
                milestone: milestoneBonus.points,
                total: incentive.points + milestoneBonus.points
            }
        };
    }

    /**
     * Check if user hit any milestones
     */
    checkMilestones(action, user) {
        const milestones = this.incentives.milestones;
        
        switch(action) {
            case 'addFriend':
                if ((user.friendsCount || 0) === 5) {
                    return milestones.first5Friends;
                }
                break;
                
            case 'attendEvent':
                if ((user.eventsAttended || 0) === 10) {
                    return milestones.first10Events;
                }
                break;
                
            case 'connectSocialAccount':
                const connectedCount = user.connectedAccounts?.length || 0;
                if (connectedCount >= 5) { // All major platforms connected
                    return milestones.allSocialConnected;
                }
                break;
                
            case 'completeProfile':
                const completion = this.calculateProfileCompletion(user);
                if (completion >= 100) {
                    return milestones.profileComplete;
                }
                break;
        }
        
        return { points: 0, message: "" };
    }

    /**
     * Generate motivational prompts based on current trust score
     */
    generateMotivationalPrompts(user) {
        const currentScore = user.trustScore || 50;
        const prompts = [];

        // Account verification prompts
        if (!user.phoneVerified) {
            prompts.push({
                type: 'verification',
                priority: 'high',
                action: 'verifyPhone',
                title: '📱 Verify Your Phone Number',
                description: 'Boost your trust score by 35 points and increase your credibility!',
                reward: '+35 Trust Points',
                cta: 'Verify Phone Now'
            });
        }

        if (!user.emailVerified) {
            prompts.push({
                type: 'verification',
                priority: 'high',
                action: 'verifyEmail',
                title: '📧 Verify Your Email',
                description: 'Quick verification for instant trust score boost!',
                reward: '+35 Trust Points',
                cta: 'Verify Email'
            });
        }

        // Social connections
        const connectedCount = user.connectedAccounts?.length || 0;
        if (connectedCount < 3) {
            prompts.push({
                type: 'social',
                priority: 'high',
                action: 'connectSocialAccount',
                title: '🔗 Connect Social Accounts',
                description: `Connect ${3 - connectedCount} more accounts to boost your trust score!`,
                reward: `+${15 * (3 - connectedCount)} Trust Points`,
                cta: 'Connect Accounts'
            });
        }

        // Friends and community
        const friendsCount = user.friendsCount || 0;
        if (friendsCount < 5) {
            prompts.push({
                type: 'social',
                priority: 'medium',
                action: 'addFriend',
                title: '👥 Make New Friends',
                description: `Add ${5 - friendsCount} more friends to unlock a milestone bonus!`,
                reward: `+${2 * (5 - friendsCount)} + 25 bonus points`,
                cta: 'Find Friends'
            });
        }

        // Events participation
        const eventsAttended = user.eventsAttended || 0;
        if (eventsAttended < 3) {
            prompts.push({
                type: 'engagement',
                priority: 'medium',
                action: 'attendEvent',
                title: '🎉 Join Community Events',
                description: 'Attend events to boost your trust score and meet new people!',
                reward: '+8 points per event',
                cta: 'Browse Events'
            });
        }

        // Profile completion
        const profileCompletion = this.calculateProfileCompletion(user);
        if (profileCompletion < 80) {
            prompts.push({
                type: 'profile',
                priority: 'medium',
                action: 'completeProfile',
                title: '✅ Complete Your Profile',
                description: `Your profile is ${profileCompletion}% complete. Finish it for bonus points!`,
                reward: '+15 points',
                cta: 'Complete Profile'
            });
        }

        // Sort by priority and trust score impact
        return prompts.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }).slice(0, 3); // Return top 3 most important prompts
    }

    /**
     * Calculate profile completion percentage
     */
    calculateProfileCompletion(user) {
        let score = 0;
        const fields = [
            { field: 'name', points: 15 },
            { field: 'bio', points: 15 },
            { field: 'location', points: 10 },
            { field: 'avatar', points: 15, condition: (u) => u.avatar && u.avatar !== 'default-avatar.jpg' },
            { field: 'birthDate', points: 10 },
            { field: 'occupation', points: 10 },
            { field: 'interests', points: 15, condition: (u) => u.interests && u.interests.length > 0 },
            { field: 'website', points: 10 }
        ];

        fields.forEach(({ field, points, condition }) => {
            if (condition ? condition(user) : user[field]) {
                score += points;
            }
        });

        return Math.min(100, score);
    }

    /**
     * Generate trust score progress visualization
     */
    generateProgressVisualization(user) {
        const currentScore = user.trustScore || 50;
        const nextMilestone = this.getNextMilestone(currentScore);
        const prompts = this.generateMotivationalPrompts(user);
        
        return {
            currentScore,
            nextMilestone: nextMilestone.score,
            pointsToNext: nextMilestone.score - currentScore,
            milestoneReward: nextMilestone.reward,
            quickActions: prompts.slice(0, 2), // Top 2 quick wins
            progressPercentage: (currentScore / 100) * 100
        };
    }

    /**
     * Get next trust score milestone
     */
    getNextMilestone(currentScore) {
        const milestones = [
            { score: 60, reward: "Verified Member Badge", benefits: ["Higher visibility in search"] },
            { score: 70, reward: "Trusted Member Status", benefits: ["Priority event listings", "Review highlighting"] },
            { score: 80, reward: "Community Leader Badge", benefits: ["Event creation privileges", "Mentor status"] },
            { score: 90, reward: "Elite Member Recognition", benefits: ["VIP event access", "Platform features beta"] },
            { score: 100, reward: "Trust Champion Status", benefits: ["Exclusive community access", "Special recognition"] }
        ];

        return milestones.find(milestone => milestone.score > currentScore) || milestones[milestones.length - 1];
    }
}

// =============================================================================
// 🗺️ MAPBOX COORDINATE FIXES (Based on Mapbox GL JS API)
// =============================================================================

/**
 * Proper Mapbox GL JS implementation for coordinate handling
 * Based on: https://docs.mapbox.com/mapbox-gl-js/api/
 */
class MapboxCoordinateFixer {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.eventMarkers = new Map(); // Track markers by event ID
    }

    /**
     * Add event markers with proper coordinate handling
     * Mapbox GL JS expects coordinates as [longitude, latitude]
     */
    addEventMarkers(events) {
        // Clear existing markers
        this.clearAllMarkers();

        events.forEach(event => {
            // Ensure coordinates are in proper [lng, lat] format
            const coordinates = this.normalizeCoordinates(event);
            
            if (!coordinates) {
                console.warn(`Invalid coordinates for event ${event.id}:`, event);
                return;
            }

            // Create marker using Mapbox GL JS API
            const marker = this.createEventMarker(event, coordinates);
            
            // Add marker to map
            marker.addTo(this.map);
            
            // Store marker reference
            this.eventMarkers.set(event.id, marker);
        });
    }

    /**
     * Normalize coordinates to [longitude, latitude] format
     * Handles various input formats consistently
     */
    normalizeCoordinates(event) {
        let lng, lat;

        // Check different possible coordinate formats
        if (event.coordinates && Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
            // If coordinates array exists, determine the format
            // Mapbox expects [lng, lat] but data might be [lat, lng]
            
            // Heuristic: longitude is typically larger in absolute value than latitude
            // Latitude range: -90 to 90, Longitude range: -180 to 180
            const coord1 = Number(event.coordinates[0]);
            const coord2 = Number(event.coordinates[1]);
            
            // If first coordinate is in latitude range (-90 to 90) and second is outside, it's [lat, lng]
            if (Math.abs(coord1) <= 90 && Math.abs(coord2) > 90) {
                lat = coord1;
                lng = coord2;
            } 
            // If second coordinate is in latitude range and first is outside, it's [lng, lat]
            else if (Math.abs(coord2) <= 90 && Math.abs(coord1) > 90) {
                lng = coord1;
                lat = coord2;
            }
            // Both in latitude range - use longitude magnitude heuristic
            else if (Math.abs(coord1) <= 90 && Math.abs(coord2) <= 90) {
                // For most locations, longitude magnitude > latitude magnitude
                if (Math.abs(coord2) > Math.abs(coord1)) {
                    lat = coord1;
                    lng = coord2;
                } else {
                    lng = coord1;
                    lat = coord2;
                }
            }
            // Default assumption: [lng, lat] (Mapbox standard)
            else {
                lng = coord1;
                lat = coord2;
            }
        } 
        // Fallback to separate lat/lng properties
        else if (event.latitude !== null && event.longitude !== null && 
                 event.latitude !== undefined && event.longitude !== undefined) {
            lng = Number(event.longitude);
            lat = Number(event.latitude);
        }
        // Check for lat/lng properties
        else if (event.lat !== null && event.lng !== null && 
                 event.lat !== undefined && event.lng !== undefined) {
            lng = Number(event.lng);
            lat = Number(event.lat);
        }
        else {
            return null;
        }

        // Validate coordinates are finite numbers
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            console.error(`Invalid coordinates for event ${event.id}:`, { lng, lat });
            return null;
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90) {
            console.error(`Invalid latitude for event ${event.id}:`, lat);
            return null;
        }
        
        if (lng < -180 || lng > 180) {
            console.error(`Invalid longitude for event ${event.id}:`, lng);
            return null;
        }

        // Return in Mapbox GL JS format: [longitude, latitude]
        return [
            Math.round(lng * Math.pow(10, 6)) / Math.pow(10, 6), // Round to 6 decimal places
            Math.round(lat * Math.pow(10, 6)) / Math.pow(10, 6)
        ];
    }

    /**
     * Create a clickable event marker using Mapbox GL JS API
     */
    createEventMarker(event, coordinates) {
        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'event-marker';
        markerElement.innerHTML = this.getEventIcon(event.category);
        
        // Style the marker
        markerElement.style.cssText = `
            width: 40px;
            height: 40px;
            background: ${this.getEventColor(event.category)};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-size: 18px;
            transition: transform 0.2s ease;
        `;

        // Create Mapbox GL JS marker
        const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        }).setLngLat(coordinates);

        // Add click event for event details
        markerElement.addEventListener('click', () => {
            this.showEventPopup(event, coordinates);
        });

        // Add hover effects
        markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.1)';
        });

        markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1.0)';
        });

        return marker;
    }

    /**
     * Show event popup with details
     */
    showEventPopup(event, coordinates) {
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: 'bottom'
        })
        .setLngLat(coordinates)
        .setHTML(`
            <div class="event-popup">
                <h3>${event.title}</h3>
                <p><strong>📅</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>📍</strong> ${event.location}</p>
                <p><strong>🏷️</strong> ${event.category}</p>
                <button onclick="viewEventDetails('${event.id}')" class="btn-primary">
                    View Details
                </button>
            </div>
        `)
        .addTo(this.map);
    }

    /**
     * Get event icon by category
     */
    getEventIcon(category) {
        const icons = {
            'Food & Dining': '🍽️',
            'Entertainment': '🎭',
            'Sports': '⚽',
            'Music': '🎵',
            'Art': '🎨',
            'Business': '💼',
            'Education': '📚',
            'Community': '🏘️',
            'Health': '💪',
            'Technology': '💻'
        };
        return icons[category] || '📍';
    }

    /**
     * Get event color by category
     */
    getEventColor(category) {
        const colors = {
            'Food & Dining': '#ff6b35',
            'Entertainment': '#7209b7',
            'Sports': '#2d8659',
            'Music': '#e63946',
            'Art': '#f77f00',
            'Business': '#003566',
            'Education': '#0077b6',
            'Community': '#8338ec',
            'Health': '#06ffa5',
            'Technology': '#fb8500'
        };
        return colors[category] || '#6366f1';
    }

    /**
     * Clear all event markers from map
     */
    clearAllMarkers() {
        this.eventMarkers.forEach(marker => {
            marker.remove();
        });
        this.eventMarkers.clear();
    }

    /**
     * Filter events by date to exclude past events
     */
    filterCurrentEvents(events) {
        const now = new Date();
        return events.filter(event => {
            const eventDate = new Date(event.date || event.event_date);
            return eventDate >= now;
        });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TrustScoreIncentiveSystem,
        MapboxCoordinateFixer
    };
}

console.log(`
🎯 TRUST SCORE INCENTIVE SYSTEM & MAPBOX FIXES READY!

TRUST SCORE INCENTIVES:
✅ Action-based point rewards
✅ Milestone bonuses 
✅ Motivational prompts
✅ Progress visualization
✅ Behavioral encouragement

MAPBOX COORDINATE FIXES:
✅ Proper [longitude, latitude] format handling
✅ Smart coordinate detection and normalization
✅ Clickable event markers with proper positioning
✅ Past event filtering
✅ Event category icons and colors

Based on Mapbox GL JS API: https://docs.mapbox.com/mapbox-gl-js/api/
`);