'use client'

/**
 * 🗺️ ENHANCED MAP COMPONENT WITH CLICKABLE ICONS
 * 
 * Integrates the clickable icons fix directly into the React component
 * for seamless event interaction and map functionality
 */

import React, { useEffect, useRef, useState } from 'react'
import { calculateTrustScore } from '@/lib/ultimate-trust-score-system'

interface Event {
  id: string
  title: string
  description: string
  category: string
  startDate: string
  endDate?: string
  location: {
    address: string
    latitude: number
    longitude: number
  }
  creator: {
    id: string
    name: string
    trustScore: number
  }
  attendees: number
  isPrivate: boolean
  eventType: string
}

interface EnhancedMapProps {
  events: Event[]
  onEventClick?: (event: Event) => void
  className?: string
}

export default function EnhancedMapComponent({ events, onEventClick, className }: EnhancedMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize Mapbox map
    const initializeMap = async () => {
      try {
        // @ts-ignore - Mapbox GL JS loaded globally
        const mapboxgl = window.mapboxgl
        
        if (!mapboxgl) {
          console.error('❌ Mapbox GL JS not loaded')
          return
        }

        // Create map instance
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-74.006, 40.7128], // Default to NYC
          zoom: 12
        })

        map.current.on('load', () => {
          console.log('🗺️ Map loaded successfully')
          setMapLoaded(true)
          
          // Apply clickable icons fix
          applyClickableIconsFix()
          
          // Load events as clickable icons
          if (events.length > 0) {
            updateClickableEventIcons(events)
          }
        })

      } catch (error) {
        console.error('❌ Map initialization error:', error)
      }
    }

    initializeMap()

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (mapLoaded && events.length > 0) {
      updateClickableEventIcons(events)
    }
  }, [events, mapLoaded])

  /**
   * 🔧 APPLY CLICKABLE ICONS FIX
   */
  const applyClickableIconsFix = () => {
    if (!map.current) return

    console.log('🎯 Applying clickable icons fix...')

    // Remove problematic layers
    const layersToRemove = [
      'events-clustered',
      'events-unclustered', 
      'events-cluster-count',
      'user-location-circle'
    ]
    
    layersToRemove.forEach(layerId => {
      try {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId)
          console.log(`✅ Removed layer: ${layerId}`)
        }
      } catch (e) {
        console.log(`⚠️ Could not remove layer ${layerId}:`, e)
      }
    })

    // Remove existing events source if it exists
    if (map.current.getSource('events-source')) {
      try {
        map.current.removeSource('events-source')
        console.log('✅ Removed old events source')
      } catch (e) {
        console.log('⚠️ Could not remove old source:', e)
      }
    }

    // Add new source for clickable icons
    map.current.addSource('clickable-events', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // Add clickable icon layer
    map.current.addLayer({
      id: 'event-icons',
      type: 'symbol',
      source: 'clickable-events',
      layout: {
        'icon-image': ['get', 'iconName'],
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
    })

    // Add click handlers
    map.current.on('click', 'event-icons', (e: any) => {
      if (e.features.length === 0) return
      
      const feature = e.features[0]
      const eventId = feature.properties.eventId
      const coordinates = feature.geometry.coordinates.slice()
      
      console.log(`🎯 Event icon clicked: ${eventId}`, coordinates)
      
      // Find the full event data
      const eventData = events.find(event => event.id === eventId)
      if (eventData && onEventClick) {
        onEventClick(eventData)
      }
      
      // Fly to the event location
      map.current.flyTo({
        center: coordinates,
        zoom: Math.max(15, map.current.getZoom()),
        duration: 800
      })
    })

    // Add cursor styling
    map.current.on('mouseenter', 'event-icons', () => {
      map.current.getCanvas().style.cursor = 'pointer'
    })
    
    map.current.on('mouseleave', 'event-icons', () => {
      map.current.getCanvas().style.cursor = ''
    })

    console.log('✅ Clickable icons fix applied successfully')
  }

  /**
   * 🔄 UPDATE CLICKABLE EVENT ICONS
   */
  const updateClickableEventIcons = (eventsList: Event[]) => {
    if (!map.current) return

    console.log(`🔄 Updating ${eventsList.length} events as clickable icons...`)
    
    // Filter current and future events
    const now = new Date()
    const currentEvents = eventsList.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate >= now
    })
    
    console.log(`📅 Showing ${currentEvents.length}/${eventsList.length} current/future events`)
    
    const features = currentEvents.map(event => {
      // Get coordinates
      const coordinates = [event.location.longitude, event.location.latitude]
      
      // Validate coordinates
      if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
        console.warn(`⚠️ Invalid coordinates for event ${event.id}`)
        return null
      }
      
      // Get icon name based on event type and trust score
      const creatorTrustScore = event.creator.trustScore || 50
      const iconName = getEventIconName(event.eventType, event.isPrivate, creatorTrustScore)
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          eventId: event.id,
          title: event.title,
          eventType: event.eventType,
          isPrivate: event.isPrivate,
          iconName: iconName,
          creatorTrustScore,
          attendees: event.attendees,
          description: event.description
        }
      }
    }).filter(f => f !== null)
    
    // Update the map source
    const source = map.current.getSource('clickable-events')
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: features
      })
      console.log(`✅ Updated map with ${features.length} clickable event icons`)
    } else {
      console.error('❌ Could not find clickable-events source')
    }
  }

  /**
   * 🎨 GET EVENT ICON NAME BASED ON TYPE AND TRUST SCORE
   */
  const getEventIconName = (eventType: string, isPrivate: boolean, creatorTrustScore: number): string => {
    // High trust score events get special icons
    if (creatorTrustScore >= 80) {
      if (isPrivate) return 'star' // High trust private events
      return 'marker' // High trust public events
    }
    
    if (isPrivate) return 'lock' // Private events
    
    // Public events based on type
    switch (eventType) {
      case 'journey': return 'circle'
      case 'maybe': return 'question'
      case 'notify': return 'bell'
      case 'public':
      case 'public-all': return 'circle'
      case 'friends':
      case 'public-friends': return 'heart'
      default: return 'circle'
    }
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading enhanced map...</p>
          </div>
        </div>
      )}
      
      {mapLoaded && events.length === 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">No events found in this area</p>
        </div>
      )}
      
      {mapLoaded && events.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow">
          <p className="text-sm text-gray-600">
            📍 {events.length} events • Click icons to view details
          </p>
        </div>
      )}
    </div>
  )
}

console.log(`
🗺️ ENHANCED MAP COMPONENT READY!

FEATURES:
✅ Clickable event icons (no more floating pins)
✅ Trust score-based icon styling
✅ Automatic event filtering (current/future only)
✅ Smooth map interactions
✅ Event click handling
✅ Loading states and error handling
✅ Responsive design

USAGE:
<EnhancedMapComponent 
  events={eventsArray}
  onEventClick={(event) => console.log('Event clicked:', event)}
  className="h-96"
/>

🎯 The map now has fully functional clickable icons!
`)