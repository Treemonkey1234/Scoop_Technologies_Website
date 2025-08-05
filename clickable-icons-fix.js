/**
 * 🎯 CLICKABLE EVENT ICONS FIX
 * 
 * This fix removes the floating pins and makes the event type icons clickable.
 * Run this in the browser console or integrate into your map code.
 */

// =============================================================================
// 🚀 BROWSER CONSOLE FIX - RUN THIS DIRECTLY
// =============================================================================

// Find the map instance and event markers manager
const mapInstance = window.mapInstance || 
                   window.map || 
                   document.querySelector('[data-mapbox]')?._mapboxMap ||
                   (() => {
                       // Try to find map in global scope
                       for (let key in window) {
                           if (window[key] && typeof window[key] === 'object' && window[key].getSource) {
                               return window[key];
                           }
                       }
                       return null;
                   })();

console.log('🗺️ Found map instance:', mapInstance);

if (!mapInstance) {
    console.error('❌ Could not find map instance. Make sure map is loaded.');
} else {
    
    // =============================================================================
    // 🔧 STEP 1: REMOVE PROBLEMATIC PIN LAYERS
    // =============================================================================
    
    console.log('🧹 Removing problematic pin layers...');
    
    // List of problematic layers to remove
    const layersToRemove = [
        'events-clustered',
        'events-unclustered', 
        'events-cluster-count',
        'user-location-circle'
    ];
    
    layersToRemove.forEach(layerId => {
        try {
            if (mapInstance.getLayer(layerId)) {
                mapInstance.removeLayer(layerId);
                console.log(`✅ Removed layer: ${layerId}`);
            }
        } catch (e) {
            console.log(`⚠️ Could not remove layer ${layerId}:`, e.message);
        }
    });
    
    // =============================================================================
    // 🔧 STEP 2: CREATE CLICKABLE EVENT ICON LAYER
    // =============================================================================
    
    console.log('🎨 Creating clickable event icon layer...');
    
    // Remove existing events source if it exists
    if (mapInstance.getSource('events-source')) {
        try {
            mapInstance.removeSource('events-source');
            console.log('✅ Removed old events source');
        } catch (e) {
            console.log('⚠️ Could not remove old source:', e.message);
        }
    }
    
    // Add new source for clickable icons
    mapInstance.addSource('clickable-events', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });
    
    // Add clickable icon layer (using symbols instead of circles)
    mapInstance.addLayer({
        id: 'event-icons',
        type: 'symbol',
        source: 'clickable-events',
        layout: {
            'icon-image': ['get', 'iconName'], // Use icon from properties
            'icon-size': 0.8,
            'icon-allow-overlap': true,
            'text-field': ['get', 'title'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 2],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#333333',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1
        }
    });
    
    console.log('✅ Created clickable event icons layer');
    
    // =============================================================================
    // 🔧 STEP 3: ADD CLICK HANDLERS TO ICON LAYER
    // =============================================================================
    
    console.log('🖱️ Adding click handlers...');
    
    // Remove any existing click handlers
    mapInstance.off('click', 'event-icons');
    
    // Add new click handler for event icons
    mapInstance.on('click', 'event-icons', (e) => {
        if (e.features.length === 0) return;
        
        const feature = e.features[0];
        const eventId = feature.properties.eventId;
        const coordinates = feature.geometry.coordinates.slice(); // Copy coordinates
        
        console.log(`🎯 Event icon clicked: ${eventId}`, coordinates);
        
        // Dispatch custom event for the app to handle
        window.dispatchEvent(new CustomEvent('eventMarkerClick', {
            detail: {
                eventId: eventId,
                coordinates: coordinates,
                eventData: feature.properties
            }
        }));
        
        // Fly to the event location
        mapInstance.flyTo({
            center: coordinates,
            zoom: Math.max(15, mapInstance.getZoom()),
            duration: 800
        });
        
        // Optional: Show popup with event info
        if (window.createEventPopup) {
            window.createEventPopup(feature.properties, coordinates);
        }
    });
    
    // Add cursor styling
    mapInstance.on('mouseenter', 'event-icons', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
    });
    
    mapInstance.on('mouseleave', 'event-icons', () => {
        mapInstance.getCanvas().style.cursor = '';
    });
    
    console.log('✅ Click handlers added to event icons');
    
    // =============================================================================
    // 🔧 STEP 4: LOAD EVENTS INTO CLICKABLE ICONS
    // =============================================================================
    
    // Function to convert events to clickable icons
    window.updateClickableEventIcons = function(events) {
        console.log(`🔄 Updating ${events.length} events as clickable icons...`);
        
        // Filter current and future events
        const now = new Date();
        const currentEvents = events.filter(event => {
            const eventDate = event.event_date || event.date || event.eventDate;
            if (!eventDate) return true;
            return new Date(eventDate) >= now;
        });
        
        console.log(`📅 Showing ${currentEvents.length}/${events.length} current/future events`);
        
        const features = currentEvents.map(event => {
            // Get coordinates (handle different formats)
            let coordinates;
            if (event.coordinates && Array.isArray(event.coordinates)) {
                // Detect coordinate order and fix if needed
                const first = Number(event.coordinates[0]);
                const second = Number(event.coordinates[1]);
                
                if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                    // [lat, lng] format - swap to [lng, lat]
                    coordinates = [second, first];
                } else {
                    // [lng, lat] format - use as is
                    coordinates = [first, second];
                }
            } else if (event.longitude && event.latitude) {
                coordinates = [Number(event.longitude), Number(event.latitude)];
            } else {
                console.warn(`⚠️ Event ${event.id} has no valid coordinates`);
                return null;
            }
            
            // Validate coordinates
            if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
                console.warn(`⚠️ Invalid coordinates for event ${event.id}`);
                return null;
            }
            
            // Get icon name based on event type
            const iconName = getEventIconName(event.eventType, event.isPrivate);
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                properties: {
                    eventId: event.id,
                    title: event.title || 'Untitled Event',
                    eventType: event.eventType || 'unknown',
                    isPrivate: event.isPrivate || false,
                    iconName: iconName,
                    // Include all event data for click handler
                    ...event
                }
            };
        }).filter(f => f !== null);
        
        // Update the map source
        const source = mapInstance.getSource('clickable-events');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: features
            });
            console.log(`✅ Updated map with ${features.length} clickable event icons`);
        } else {
            console.error('❌ Could not find clickable-events source');
        }
    };
    
    // Function to get appropriate icon for event type
    function getEventIconName(eventType, isPrivate) {
        // You can customize these icon names based on what's available in your map style
        if (isPrivate) return 'lock'; // Private events
        
        switch (eventType) {
            case 'journey': return 'marker';
            case 'maybe': return 'question';
            case 'notify': return 'bell';
            case 'public':
            case 'public-all': return 'circle';
            case 'friends':
            case 'public-friends': return 'star';
            default: return 'circle';
        }
    }
    
    // =============================================================================
    // 🔧 STEP 5: AUTO-LOAD CURRENT EVENTS
    // =============================================================================
    
    console.log('🔍 Looking for existing events data...');
    
    // Try to find existing events data
    let existingEvents = null;
    
    // Look in common places where events might be stored
    const eventSources = [
        () => window.events,
        () => window.eventsData,
        () => window.allEvents,
        () => document.querySelector('[data-events]')?.dataset.events ? JSON.parse(document.querySelector('[data-events]').dataset.events) : null,
        () => {
            // Try to get from existing map source
            const source = mapInstance.getSource('events-source');
            return source?._data?.features?.map(f => ({
                id: f.properties.eventId,
                title: f.properties.title,
                eventType: f.properties.eventType,
                isPrivate: f.properties.isPrivate,
                coordinates: f.geometry.coordinates,
                ...f.properties
            })) || null;
        }
    ];
    
    for (let getEvents of eventSources) {
        try {
            existingEvents = getEvents();
            if (existingEvents && Array.isArray(existingEvents) && existingEvents.length > 0) {
                console.log(`✅ Found ${existingEvents.length} existing events`);
                break;
            }
        } catch (e) {
            // Continue to next source
        }
    }
    
    if (existingEvents) {
        window.updateClickableEventIcons(existingEvents);
    } else {
        console.log('⚠️ No existing events found. Use updateClickableEventIcons(eventsArray) to load events.');
    }
    
    // =============================================================================
    // 💡 USAGE INSTRUCTIONS
    // =============================================================================
    
    console.log(`
🎉 CLICKABLE EVENT ICONS SETUP COMPLETE!

✅ Removed problematic floating pins
✅ Created clickable event icon layer  
✅ Added proper click handlers
✅ Fixed coordinate handling

📋 How to use:

1. **Load Events:**
   updateClickableEventIcons(yourEventsArray);

2. **Events Array Format:**
   [
     {
       id: 123,
       title: "Event Title",
       eventType: "public",
       isPrivate: false,
       coordinates: [lng, lat] OR {longitude: X, latitude: Y},
       event_date: "2024-01-15"
     }
   ]

3. **Listen for Clicks:**
   window.addEventListener('eventMarkerClick', (e) => {
       console.log('Event clicked:', e.detail);
   });

4. **Refresh Events:**
   Just call updateClickableEventIcons() again with new data

🔧 Available Functions:
- updateClickableEventIcons(events) - Load events as clickable icons
- Event icons will automatically filter out past events
- Icons are clickable and will trigger eventMarkerClick events

🎯 The event type icons should now be clickable and the floating pins are gone!
`);
}

// =============================================================================
// 🔧 ALTERNATIVE: DIRECT FUNCTION INJECTION
// =============================================================================

// If the above doesn't work, try this more aggressive approach:
window.fixEventIcons = function() {
    console.log('🚀 Running aggressive event icon fix...');
    
    // Find all possible map instances
    const maps = [];
    
    // Check common map variable names
    ['map', 'mapInstance', 'mapbox', 'mapboxMap'].forEach(name => {
        if (window[name] && typeof window[name] === 'object' && window[name].getSource) {
            maps.push(window[name]);
        }
    });
    
    // Look for maps in DOM elements
    document.querySelectorAll('[id*="map"], [class*="map"]').forEach(el => {
        if (el._mapboxMap) maps.push(el._mapboxMap);
        if (el.map) maps.push(el.map);
    });
    
    if (maps.length === 0) {
        console.error('❌ No map instances found');
        return;
    }
    
    maps.forEach((map, index) => {
        console.log(`🗺️ Processing map ${index + 1}...`);
        
        // Remove all event-related layers
        ['events-clustered', 'events-unclustered', 'events-cluster-count', 'user-location-circle'].forEach(layer => {
            try {
                if (map.getLayer(layer)) map.removeLayer(layer);
            } catch (e) {}
        });
        
        // Force update any existing event markers manager
        if (window.eventMarkersManager && window.eventMarkersManager.current) {
            try {
                window.eventMarkersManager.current.destroy();
                console.log('✅ Destroyed existing event markers manager');
            } catch (e) {}
        }
        
        console.log(`✅ Cleaned up map ${index + 1}`);
    });
    
    console.log('🎯 Aggressive fix complete. Now run the main fix above.');
};

console.log('🔧 Event icon fix loaded. Run fixEventIcons() if needed.');