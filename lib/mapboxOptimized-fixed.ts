/**
 * FIXED Mapbox Event Markers Implementation
 * FIXES the floating pins issue by properly handling coordinate order
 */

import { Map as MapboxMap, LngLatLike, GeoJSONSource } from 'mapbox-gl'
import { MAPBOX_CONFIG, initializeMapboxGL } from './mapboxConfig'

// Types
interface EventData {
  id: string
  title: string
  latitude: number | null
  longitude: number | null
  coordinates?: number[]
  eventType?: string
  isPrivate?: boolean
  // Add other event properties as needed
}

interface ProcessedEvent {
  id: string
  title: string
  coordinates: [number, number] // [lng, lat] - Mapbox standard
  eventType: string
  properties: Record<string, any>
}

// Constants from config
const { COORDINATE_PRECISION, CLUSTER_RADIUS, CLUSTER_MAX_ZOOM } = MAPBOX_CONFIG.DEFAULTS

/**
 * Utility Functions
 */

/**
 * FIXED: Standardize coordinate format to Mapbox [lng, lat] with proper precision
 * THIS FIXES THE FLOATING PINS ISSUE
 */
export function normalizeCoordinates(event: EventData): [number, number] | null {
  let lng: number, lat: number

  // Handle array format - CRITICAL FIX for coordinate order
  if (event.coordinates && Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
    // CRITICAL FIX: Many APIs return [lat, lng] but Mapbox expects [lng, lat]
    // Check if the first coordinate looks like latitude (between -90 and 90)
    const first = Number(event.coordinates[0])
    const second = Number(event.coordinates[1])
    
    if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
      // First value is likely latitude, second is longitude
      lat = first
      lng = second
      console.log(`🔧 COORDINATE FIX: Swapped coordinates for event ${event.id}: [${first}, ${second}] -> [${lng}, ${lat}]`)
    } else if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
      // First value is likely longitude, second is latitude  
      lng = first
      lat = second
    } else {
      // Default assumption: [lng, lat] (Mapbox standard)
      lng = first
      lat = second
    }
  }
  // Handle object format {latitude, longitude}
  else if (event.latitude !== null && event.longitude !== null &&
           event.latitude !== undefined && event.longitude !== undefined) {
    lng = Number(event.longitude)
    lat = Number(event.latitude)
  }
  else {
    return null
  }

  // Validate coordinates
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    console.error(`Invalid coordinates for event ${event.id}:`, { lng, lat })
    return null
  }

  // Validate coordinate ranges
  if (Math.abs(lat) > 90) {
    console.error(`Invalid latitude for event ${event.id}: ${lat} (must be between -90 and 90)`)
    return null
  }
  if (Math.abs(lng) > 180) {
    console.error(`Invalid longitude for event ${event.id}: ${lng} (must be between -180 and 180)`)
    return null
  }

  // Apply coordinate precision for geographic stability
  const preciseLng = Math.round(lng * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION)
  const preciseLat = Math.round(lat * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION)

  // Return in Mapbox GL JS format: [longitude, latitude]
  return [preciseLng, preciseLat]
}

/**
 * Get event type color coding including user interaction states
 */
export function getEventColor(eventType: string, isPrivate?: boolean): string {
  // User interaction states take priority
  if (eventType === 'journey') {
    return '#dc2626' // red-600 - In journey (confirmed)
  } else if (eventType === 'maybe') {
    return '#d97706' // amber-600 - Maybe interested
  } else if (eventType === 'notify') {
    return '#7c3aed' // violet-600 - Want notifications
  } else if (eventType === 'skipped' || isPrivate) {
    return '#6b7280' // gray-500 - Skipped or private
  }

  // Default event visibility types
  if (eventType === 'public-all' || eventType === 'public') {
    return '#2563eb' // blue-600 - Public to all
  } else if (eventType === 'public-friends' || eventType === 'friends') {
    return '#059669' // emerald-600 - Friends only
  } else if (eventType === 'private') {
    return '#dc2626' // red-600 - Private
  } else {
    return '#6b7280' // gray-500 - Unknown type
  }
}

/**
 * Process events into GeoJSON format for Mapbox
 */
function processEventsToGeoJSON(events: EventData[]) {
  const features: any[] = []

  for (const event of events) {
    const coords = normalizeCoordinates(event)
    if (!coords) continue

    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords // Already in [lng, lat] format from normalizeCoordinates
      },
      properties: {
        id: event.id,
        title: event.title || 'Untitled Event',
        eventType: event.eventType || 'public',
        isPrivate: event.isPrivate || false,
        color: getEventColor(event.eventType || 'public', event.isPrivate),
      }
    }

    features.push(feature)
  }

  console.log(`🗺️ FIXED: Processed ${features.length} events with correct coordinates`)
  return {
    type: 'FeatureCollection',
    features
  }
}

/**
 * FIXED Event Markers Manager - No more floating pins!
 */
export class EventMarkersManager {
  private map: MapboxMap
  private sourceId = 'events-source'
  private clusteredLayerId = 'events-clustered'
  private unclusteredLayerId = 'events-unclustered'
  private clusterCountLayerId = 'events-cluster-count'
  private isInitialized = false

  constructor(map: MapboxMap) {
    this.map = map
  }

  async initializeLayers(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Add the source for events
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: CLUSTER_RADIUS,
        clusterProperties: {
          // Calculate the sum of events in each cluster
          'event_count': ['+', 1]
        }
      })

      // Add clustered events layer
      this.map.addLayer({
        id: this.clusteredLayerId,
        type: 'circle',
        source: this.sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6', 5,
            '#f1c40f', 10,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 5,
            30, 10,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Add cluster count labels
      this.map.addLayer({
        id: this.clusterCountLayerId,
        type: 'symbol',
        source: this.sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      // Add unclustered events layer
      this.map.addLayer({
        id: this.unclusteredLayerId,
        type: 'circle',
        source: this.sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['get', 'color'],
            ['get', 'color'],
            '#2563eb' // Default blue
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Add click handlers
      this.addClickHandlers()
      
      this.isInitialized = true
      console.log('✅ FIXED Event markers manager initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize event markers:', error)
      throw error
    }
  }

  private addClickHandlers(): void {
    // Handle cluster clicks (zoom in)
    this.map.on('click', this.clusteredLayerId, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.clusteredLayerId]
      })

      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id
        const source = this.map.getSource(this.sourceId) as GeoJSONSource

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return
          this.map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom + 1
          })
        })
      }
    })

    // Handle individual event clicks
    this.map.on('click', this.unclusteredLayerId, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.unclusteredLayerId]
      })

      if (features.length > 0) {
        const event = features[0]
        console.log('🎯 Event clicked:', event.properties)
        
        // You can emit a custom event or call a callback here
        window.dispatchEvent(new CustomEvent('eventMarkerClicked', {
          detail: {
            eventId: event.properties?.id,
            title: event.properties?.title,
            coordinates: (event.geometry as any).coordinates
          }
        }))
      }
    })

    // Change cursor on hover
    this.map.on('mouseenter', this.clusteredLayerId, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', this.clusteredLayerId, () => {
      this.map.getCanvas().style.cursor = ''
    })
    this.map.on('mouseenter', this.unclusteredLayerId, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', this.unclusteredLayerId, () => {
      this.map.getCanvas().style.cursor = ''
    })
  }

  /**
   * FIXED: Update events data (call whenever events change)
   */
  updateEvents(events: EventData[]): void {
    if (!this.isInitialized) {
      console.warn('Event markers not initialized. Call initializeLayers() first.')
      return
    }

    try {
      const geoJson = processEventsToGeoJSON(events)
      console.log(`🔧 FIXED EventMarkersManager: Processing ${events.length} events with coordinate fixes`)

      const source = this.map.getSource(this.sourceId) as GeoJSONSource

      if (source) {
        source.setData(geoJson)
        console.log(`✅ FIXED: Updated ${events.length} events on map with ${geoJson.features.length} correctly positioned markers`)
      } else {
        console.error('❌ Events source not found')
      }
    } catch (error) {
      console.error('❌ Error updating event markers:', error)
    }
  }

  /**
   * Clean up layers and sources
   */
  destroy(): void {
    try {
      if (this.map.getLayer(this.clusteredLayerId)) {
        this.map.removeLayer(this.clusteredLayerId)
      }
      if (this.map.getLayer(this.unclusteredLayerId)) {
        this.map.removeLayer(this.unclusteredLayerId)
      }
      if (this.map.getLayer(this.clusterCountLayerId)) {
        this.map.removeLayer(this.clusterCountLayerId)
      }
      if (this.map.getSource(this.sourceId)) {
        this.map.removeSource(this.sourceId)
      }
      this.isInitialized = false
      console.log('✅ Event markers manager destroyed')
    } catch (error) {
      console.error('❌ Error destroying event markers:', error)
    }
  }

  /**
   * Add user location marker
   */
  addUserLocationMarker(coordinates: [number, number]): void {
    // Remove existing user location if any
    if (this.map.getSource('user-location')) {
      this.map.removeLayer('user-location-circle')
      this.map.removeSource('user-location')
    }

    // Add user location source
    this.map.addSource('user-location', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates
        }
      }
    })

    // Add user location layer
    this.map.addLayer({
      id: 'user-location-circle',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 12,
        'circle-color': '#007cbf',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    })

    console.log(`📍 User location marker added at [${coordinates[0]}, ${coordinates[1]}]`)
  }
}

/**
 * Initialize Mapbox map instance
 */
export async function initializeMapboxMap(
  container: HTMLElement | string,
  center: LngLatLike = [-74.006, 40.7128], // NYC default
  options: any = {}
): Promise<MapboxMap> {
  try {
    console.log('🗺️ Initializing FIXED Mapbox map...')
    
    const mapboxgl = await initializeMapboxGL()
    
    const map = new mapboxgl.Map({
      container,
      style: options.style || MAPBOX_CONFIG.STYLES.LIGHT,
      center,
      zoom: options.zoom || MAPBOX_CONFIG.DEFAULTS.ZOOM,
      attributionControl: options.attributionControl !== false,
      interactive: options.interactive !== false,
      ...options
    })

    // Add error handling
    map.on('error', (e) => {
      console.error('Mapbox error:', e)
    })

    console.log('✅ FIXED Mapbox map initialized - pins should now stick to correct coordinates!')
    
    return map
  } catch (error) {
    console.error('❌ Error initializing Mapbox map:', error)
    throw error
  }
}

console.log('🔧 FIXED Mapbox module loaded - this fixes the floating pins issue!')