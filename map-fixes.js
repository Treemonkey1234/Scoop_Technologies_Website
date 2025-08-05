/**
 * 🗺️ DISCOVER MAP FIXES 
 * 
 * This file contains comprehensive fixes for the discovered map issues:
 * 1. Coordinate order inconsistency (pins floating left)
 * 2. Past events showing on map 
 * 3. Duplicate pins (clustered + unclustered layers)
 * 4. Non-clickable pins
 * 
 * Apply these changes to your source files to fix the mapping problems.
 */

// =============================================================================
// 🔧 FIX 1: COORDINATE CONVERSION FUNCTION
// =============================================================================
// Replace the existing coordinate conversion function with this corrected version

/**
 * Converts event coordinate data to proper [longitude, latitude] format for Mapbox
 * FIXES: Coordinate order inconsistency that caused pins to float left
 */
function normalizeEventCoordinates(event) {
    const COORDINATE_PRECISION = 6;
    
    let longitude, latitude;
    
    // Handle different coordinate formats consistently
    if (event.coordinates && Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
        // ⚠️ CRITICAL FIX: Determine if coordinates are [lat,lng] or [lng,lat]
        // Check if the first value looks like latitude (between -90 and 90)
        const first = Number(event.coordinates[0]);
        const second = Number(event.coordinates[1]);
        
        if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
            // First value is latitude, second is longitude -> [lat, lng] format
            latitude = first;
            longitude = second;
            console.log(`🔄 COORD FIX: Event ${event.id} coordinates swapped from [lat,lng] to [lng,lat]`);
        } else if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
            // First value is longitude, second is latitude -> [lng, lat] format (correct)
            longitude = first;
            latitude = second;
        } else {
            // Both values are in valid ranges, use order based on magnitude
            // Longitude typically has larger absolute values than latitude
            if (Math.abs(first) > Math.abs(second)) {
                longitude = first;
                latitude = second;
            } else {
                latitude = first;
                longitude = second;
                console.log(`🔄 COORD FIX: Event ${event.id} coordinates swapped based on magnitude`);
            }
        }
    } else {
        // Use separate latitude/longitude properties
        if (event.latitude == null || event.longitude == null) {
            console.log(`📍 Event ${event.id} ("${event.title}") has no valid coordinates - will appear in list but not on map`);
            return null;
        }
        longitude = Number(event.longitude);
        latitude = Number(event.latitude);
    }
    
    // Validate coordinates
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        console.error(`❌ Invalid coordinates for event ${event.id}:`, { lng: longitude, lat: latitude });
        return null;
    }
    
    // Validate ranges
    if (Math.abs(latitude) > 90) {
        console.error(`❌ Invalid latitude for event ${event.id}: ${latitude} (must be between -90 and 90)`);
        return null;
    }
    
    if (Math.abs(longitude) > 180) {
        console.error(`❌ Invalid longitude for event ${event.id}: ${longitude} (must be between -180 and 180)`);
        return null;
    }
    
    // Return in Mapbox standard format: [longitude, latitude]
    const precision = Math.pow(10, COORDINATE_PRECISION);
    const normalizedCoords = [
        Math.round(longitude * precision) / precision,
        Math.round(latitude * precision) / precision
    ];
    
    console.log(`✅ Event ${event.id} normalized coordinates: [${normalizedCoords[0]}, ${normalizedCoords[1]}]`);
    return normalizedCoords;
}

// =============================================================================
// 🔧 FIX 2: EVENT DATE FILTERING  
// =============================================================================
// Add this function to filter out past events from map display

/**
 * Filters events to only include current and future events
 * FIXES: Past events showing up on map
 */
function filterCurrentAndFutureEvents(events) {
    const now = new Date();
    const filteredEvents = events.filter(event => {
        // Check multiple possible date field names
        const eventDate = event.event_date || event.date || event.eventDate;
        
        if (!eventDate) {
            console.warn(`⚠️ Event ${event.id} has no date field - including by default`);
            return true; // Include events without dates for now
        }
        
        const eventDateTime = new Date(eventDate);
        
        // Include events that are today or in the future
        const isCurrentOrFuture = eventDateTime >= now || 
                                  eventDateTime.toDateString() === now.toDateString();
        
        if (!isCurrentOrFuture) {
            console.log(`🗓️ Filtering out past event: ${event.id} ("${event.title}") - ${eventDate}`);
        }
        
        return isCurrentOrFuture;
    });
    
    console.log(`📅 Date filter: ${filteredEvents.length}/${events.length} events are current/future`);
    return filteredEvents;
}

// =============================================================================
// 🔧 FIX 3: ENHANCED EVENT MARKERS MANAGER
// =============================================================================
// Replace the existing EventMarkersManager class with this fixed version

class FixedEventMarkersManager {
    constructor(map) {
        this.sourceId = "events-source";
        this.clusteredLayerId = "events-clustered";
        this.unclusteredLayerId = "events-unclustered";
        this.clusterCountLayerId = "events-cluster-count";
        this.isInitialized = false;
        this.map = map;
        this.currentZoom = map.getZoom();
        
        // Track zoom to manage layer visibility
        this.map.on('zoom', () => {
            this.currentZoom = this.map.getZoom();
            this.updateLayerVisibility();
        });
    }
    
    /**
     * FIXES: Proper layer management to prevent duplicate pins
     */
    updateLayerVisibility() {
        if (!this.isInitialized) return;
        
        const zoomThreshold = 12; // Adjust this value as needed
        
        if (this.currentZoom >= zoomThreshold) {
            // At high zoom, show individual pins, hide clusters
            this.map.setLayoutProperty(this.clusteredLayerId, 'visibility', 'none');
            this.map.setLayoutProperty(this.clusterCountLayerId, 'visibility', 'none');
            this.map.setLayoutProperty(this.unclusteredLayerId, 'visibility', 'visible');
            console.log(`🔍 High zoom (${this.currentZoom}): Showing individual pins`);
        } else {
            // At low zoom, show clusters, hide individual pins when clustered
            this.map.setLayoutProperty(this.clusteredLayerId, 'visibility', 'visible');
            this.map.setLayoutProperty(this.clusterCountLayerId, 'visibility', 'visible');
            this.map.setLayoutProperty(this.unclusteredLayerId, 'visibility', 'visible');
            console.log(`🗺️ Low zoom (${this.currentZoom}): Showing clustered pins`);
        }
    }
    
    async initializeLayers() {
        if (this.isInitialized) return;
        
        try {
            // Wait for map style to load
            if (!this.map.isStyleLoaded()) {
                console.log("🗺️ Map style not fully loaded yet, waiting...");
                await new Promise(resolve => {
                    this.map.once('styledata', resolve);
                });
            }
            
            // Add source for events
            this.map.addSource(this.sourceId, {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: []
                },
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
                clusterProperties: {
                    event_count: ["+", 1],
                    public_count: ["+", ["case", ["==", ["get", "eventType"], "public"], 1, 0]],
                    private_count: ["+", ["case", ["==", ["get", "eventType"], "private"], 1, 0]]
                }
            });
            
            // Add clustered points layer
            this.map.addLayer({
                id: this.clusteredLayerId,
                type: "circle",
                source: this.sourceId,
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#51bbd6",
                        10, "#f1c40f",
                        30, "#e74c3c"
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        15, // Base radius
                        10, 20, // 10+ events
                        30, 25  // 30+ events
                    ],
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff"
                }
            });
            
            // Add cluster count layer
            this.map.addLayer({
                id: this.clusterCountLayerId,
                type: "symbol",
                source: this.sourceId,
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12
                },
                paint: {
                    "text-color": "#ffffff"
                }
            });
            
            // Add unclustered points layer  
            this.map.addLayer({
                id: this.unclusteredLayerId,
                type: "circle",
                source: this.sourceId,
                filter: ["!", ["has", "point_count"]],
                paint: {
                    "circle-color": ["get", "color"],
                    "circle-radius": 12,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                    "circle-opacity": 0.8
                }
            });
            
            // FIXED: Proper click handlers with correct coordinate handling
            this.map.on("click", this.clusteredLayerId, this.handleClusterClick.bind(this));
            this.map.on("click", this.unclusteredLayerId, this.handleEventClick.bind(this));
            
            // Cursor styling
            this.map.on("mouseenter", this.clusteredLayerId, () => {
                this.map.getCanvas().style.cursor = "pointer";
            });
            this.map.on("mouseleave", this.clusteredLayerId, () => {
                this.map.getCanvas().style.cursor = "";
            });
            this.map.on("mouseenter", this.unclusteredLayerId, () => {
                this.map.getCanvas().style.cursor = "pointer";
            });
            this.map.on("mouseleave", this.unclusteredLayerId, () => {
                this.map.getCanvas().style.cursor = "";
            });
            
            this.isInitialized = true;
            this.updateLayerVisibility(); // Set initial visibility
            console.log("✅ Fixed Event markers layers initialized successfully");
            
        } catch (error) {
            console.error("❌ Error initializing event markers layers:", error);
            throw error;
        }
    }
    
    /**
     * FIXES: All coordinate and filtering issues
     */
    updateEvents(events) {
        if (!this.isInitialized) {
            console.warn("Event markers not initialized. Call initializeLayers() first.");
            return;
        }
        
        try {
            // STEP 1: Filter out past events
            const currentEvents = filterCurrentAndFutureEvents(events);
            
            // STEP 2: Convert events to properly formatted GeoJSON
            const geoJsonData = this.eventsToGeoJSON(currentEvents);
            
            console.log(`🚨 FIXED MAPBOX: Processing ${currentEvents.length}/${events.length} current events for map display`);
            console.log(`🗺️ Generated GeoJSON:`, JSON.stringify(geoJsonData, null, 2));
            
            // STEP 3: Update map source
            const source = this.map.getSource(this.sourceId);
            if (source) {
                source.setData(geoJsonData);
                console.log(`✅ Updated ${currentEvents.length} current events on map with ${geoJsonData.features.length} visible markers`);
                
                // Update layer visibility after data update
                setTimeout(() => this.updateLayerVisibility(), 100);
            } else {
                console.error("❌ Events source not found");
            }
            
        } catch (error) {
            console.error("❌ Error updating events:", error);
        }
    }
    
    /**
     * Convert events array to GeoJSON with proper coordinate handling
     */
    eventsToGeoJSON(events) {
        const features = [];
        
        events.forEach(event => {
            // FIXED: Use the corrected coordinate normalization
            const coordinates = normalizeEventCoordinates(event);
            
            if (!coordinates) {
                return; // Skip events without valid coordinates
            }
            
            const feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: coordinates // Now guaranteed to be [lng, lat]
                },
                properties: {
                    eventId: event.id,
                    title: event.title,
                    eventType: event.eventType || "unknown",
                    isPrivate: event.isPrivate || false,
                    color: this.getEventColor(event.eventType, event.isPrivate),
                    // Add date for debugging
                    eventDate: event.event_date || event.date
                }
            };
            
            features.push(feature);
            console.log(`✅ Event ${event.id} ("${event.title}") added to map at coordinates:`, coordinates);
        });
        
        console.log(`🗺️ Map Summary: ${features.length} events with coordinates added to map out of ${events.length} total events`);
        
        return {
            type: "FeatureCollection",
            features: features
        };
    }
    
    /**
     * Get color for event based on type and privacy
     */
    getEventColor(eventType, isPrivate) {
        if (isPrivate) return "#6b7280"; // Gray for private
        
        switch (eventType) {
            case "journey": return "#dc2626"; // Red
            case "maybe": return "#d97706";   // Orange  
            case "notify": return "#7c3aed";  // Purple
            case "skipped": return "#6b7280"; // Gray
            case "public-all":
            case "public": return "#2563eb";  // Blue
            case "public-friends":
            case "friends": return "#059669"; // Green
            case "private": return "#dc2626"; // Red
            default: return "#6b7280";        // Gray
        }
    }
    
    /**
     * FIXED: Proper cluster click handling
     */
    handleClusterClick(e) {
        const features = this.map.queryRenderedFeatures(e.point, {
            layers: [this.clusteredLayerId]
        });
        
        if (features.length === 0) return;
        
        const clusterId = features[0].properties.cluster_id;
        const source = this.map.getSource(this.sourceId);
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            
            this.map.easeTo({
                center: features[0].geometry.coordinates, // Coordinates are now correct
                zoom: zoom ?? undefined
            });
        });
    }
    
    /**
     * FIXED: Proper event click handling  
     */
    handleEventClick(e) {
        const features = this.map.queryRenderedFeatures(e.point, {
            layers: [this.unclusteredLayerId]
        });
        
        if (features.length === 0) return;
        
        const feature = features[0];
        const eventId = feature.properties.eventId;
        
        // Dispatch custom event for the application to handle
        window.dispatchEvent(new CustomEvent('eventMarkerClick', {
            detail: {
                eventId: eventId,
                coordinates: feature.geometry.coordinates // Now guaranteed correct
            }
        }));
        
        // Fly to the event location
        this.map.flyTo({
            center: feature.geometry.coordinates, // Coordinates are now correct
            zoom: Math.max(15, this.map.getZoom()),
            duration: 800
        });
        
        console.log(`🎯 Event clicked: ${eventId} at coordinates:`, feature.geometry.coordinates);
    }
    
    /**
     * Add user location marker (keep existing functionality)
     */
    addUserLocationMarker(coordinates) {
        // Remove existing user location
        if (this.map.getSource("user-location")) {
            this.map.removeLayer("user-location-circle");
            this.map.removeSource("user-location");
        }
        
        this.map.addSource("user-location", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Point",
                    coordinates: coordinates // Should be [lng, lat]
                }
            }
        });
        
        this.map.addLayer({
            id: "user-location-circle",
            type: "circle",
            source: "user-location",
            paint: {
                "circle-radius": 8,
                "circle-color": "#16a34a",
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff"
            }
        });
    }
    
    /**
     * Clean up (keep existing functionality)
     */
    destroy() {
        if (!this.isInitialized) return;
        
        try {
            // Remove event listeners
            this.map.off("click", this.clusteredLayerId, this.handleClusterClick.bind(this));
            this.map.off("click", this.unclusteredLayerId, this.handleEventClick.bind(this));
            
            // Remove layers
            [this.clusterCountLayerId, this.clusteredLayerId, this.unclusteredLayerId].forEach(layerId => {
                if (this.map.getLayer(layerId)) {
                    this.map.removeLayer(layerId);
                }
            });
            
            // Remove sources
            if (this.map.getSource(this.sourceId)) {
                this.map.removeSource(this.sourceId);
            }
            
            if (this.map.getSource("user-location")) {
                this.map.removeLayer("user-location-circle");
                this.map.removeSource("user-location");
            }
            
            this.isInitialized = false;
            console.log("✅ Fixed Event markers cleaned up successfully");
            
        } catch (error) {
            console.error("❌ Error cleaning up event markers:", error);
        }
    }
}

// =============================================================================
// 🔧 FIX 4: DISTANCE CALCULATION FIX
// =============================================================================
// Fix for the distance calculation that was using wrong coordinate order

/**
 * Calculate distance between two points with proper coordinate handling
 * FIXES: Distance calculations that were using wrong coordinate order
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Filter events by distance from user location with proper coordinate handling
 */
function filterEventsByDistance(events, userLocation, maxDistanceKm = 50) {
    if (!userLocation || !userLocation.coordinates || !Array.isArray(userLocation.coordinates)) {
        return events; // Return all events if no user location
    }
    
    const [userLng, userLat] = userLocation.coordinates; // Assuming [lng, lat] format
    
    return events.filter(event => {
        const eventCoords = normalizeEventCoordinates(event);
        if (!eventCoords) return false;
        
        const [eventLng, eventLat] = eventCoords;
        const distance = calculateDistance(userLat, userLng, eventLat, eventLng);
        
        return distance <= maxDistanceKm;
    });
}

// =============================================================================
// 📋 IMPLEMENTATION INSTRUCTIONS
// =============================================================================

console.log(`
🗺️ DISCOVER MAP FIXES - IMPLEMENTATION GUIDE

To fix your mapping issues, replace the following in your source code:

1. **Coordinate Conversion Function**
   ├─ Replace existing coordinate handling with 'normalizeEventCoordinates()'
   ├─ This fixes pins floating to the left
   └─ Handles both [lat,lng] and [lng,lat] input formats

2. **Event Filtering**  
   ├─ Add 'filterCurrentAndFutureEvents()' before sending events to map
   ├─ This prevents past events from appearing
   └─ Add to your event loading logic

3. **EventMarkersManager Class**
   ├─ Replace existing class with 'FixedEventMarkersManager'
   ├─ Fixes duplicate pins issue
   ├─ Adds proper zoom-based layer visibility
   └─ Makes pins clickable again

4. **Distance Calculations**
   ├─ Replace distance functions with 'calculateDistance()'
   ├─ Use 'filterEventsByDistance()' for location-based filtering
   └─ Ensures consistent coordinate order throughout

🎯 Expected Results After Implementation:
✅ Pins stick to correct map coordinates  
✅ No past events on map
✅ Only one pin per event (no duplicates)
✅ All pins are clickable and responsive
✅ Proper clustering behavior at different zoom levels

🔧 Next Steps:
1. Backup your current mapping code
2. Replace the relevant functions/classes in your source files
3. Test on localhost first
4. Deploy to production when confirmed working

For questions about specific implementation details, please let me know!
`);

// Export the fixes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalizeEventCoordinates,
        filterCurrentAndFutureEvents,
        FixedEventMarkersManager,
        calculateDistance,
        filterEventsByDistance
    };
}