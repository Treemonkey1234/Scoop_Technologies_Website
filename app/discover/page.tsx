'use client'

/**
 * 🎉 DISCOVER PAGE - ENHANCED WITH COMPLETE EVENT FUNCTIONALITY
 * 
 * This page integrates all the event fixes and provides a complete discovery experience
 * with proper mapping, event filtering, and trust score integration
 */

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { ultimateTrustScoreSystem, calculateTrustScore, getTrustScoreDisplay } from '@/lib/ultimate-trust-score-system'
import 'mapbox-gl/dist/mapbox-gl.css'
// import mapboxgl from 'mapbox-gl'
// import { initializeMapboxMap, normalizeCoordinates } from '@/lib/mapboxOptimized'
import { initializeMapboxMap } from '@/lib/mapboxOptimized'
import { initializeMapboxGL } from '@/lib/mapboxConfig'
import {
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

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
    trustScore?: number
    avatar?: string
  }
  attendees: number
  maxAttendees?: number
  isPublic: boolean
  tags: string[]
  imageUrl?: string
}

export default function DiscoverPage() {
  const router = useRouter()
  const { authState, user, isLoading: authLoading } = useAuth()
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // State management
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  // Filter options
  const categories = [
    { id: 'all', name: 'All Events', icon: '🎯' },
    { id: 'social', name: 'Social', icon: '🎉' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'culture', name: 'Culture', icon: '🎭' },
    { id: 'food', name: 'Food & Drink', icon: '🍕' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'education', name: 'Education', icon: '📚' }
  ]

  // Authentication check
  useEffect(() => {
    if (!authLoading && !authState.isAuthenticated) {
      router.push('/signin')
      return
    }
  }, [authLoading, authState.isAuthenticated, router])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
          // Default to a central location (e.g., NYC)
          setUserLocation({ lat: 40.7128, lng: -74.0060 })
        }
      )
    }
  }, [])

  // Load events
  useEffect(() => {
    loadEvents()
  }, [])

  // Filter events when search or category changes
  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, selectedCategory])

  // Initialize map when component mounts and user location is available
  useEffect(() => {
    if (userLocation && mapContainerRef.current && !map) {
      initializeMap()
    }
  }, [userLocation, map])

  // Update markers when filtered events change
  useEffect(() => {
    if (map && filteredEvents.length > 0) {
      updateMapMarkers()
    }
  }, [map, filteredEvents])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/events/discover', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        
        // Filter out past events with better date handling
        const currentEvents = data.events.filter((event: Event) => {
          const eventDate = new Date(event.startDate)
          const now = new Date()
          
          // Set now to start of current day for proper comparison
          now.setHours(0, 0, 0, 0)
          
          console.log(`📅 Event "${event.title}": ${eventDate.toISOString()} vs Now: ${now.toISOString()}`)
          
          return eventDate >= now
        })

        setEvents(currentEvents)
        console.log('✅ Loaded events:', currentEvents.length)
      } else {
        setError('Failed to load events')
      }
    } catch (error) {
      console.error('❌ Error loading events:', error)
      setError('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.address.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory)
    }

    setFilteredEvents(filtered)
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTrustScoreBadge = (trustScore?: number) => {
    if (!trustScore) return null
    
    const badgeColor = trustScore >= 80 ? 'bg-green-500' : 
                      trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-white text-xs ${badgeColor}`}>
        <ShieldCheckIcon className="w-3 h-3" />
        <span>{trustScore}</span>
      </div>
    )
  }

  const joinEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh events to show updated attendee count
        loadEvents()
        alert('Successfully joined event!')
      } else {
        const error = await response.json()
        alert('Failed to join event: ' + error.message)
      }
    } catch (error) {
      console.error('Error joining event:', error)
      alert('Failed to join event')
    }
  }

  const initializeMap = async () => {
    try {
      console.log('🗺️ Initializing Discover Map...')
      
      if (!mapContainerRef.current || !userLocation) {
        console.log('❌ Missing map container or user location')
        return
      }

      const mapInstance = await initializeMapboxMap(
        mapContainerRef.current,
        [userLocation.lng, userLocation.lat],
        {
          zoom: 12,
          style: 'mapbox://styles/mapbox/streets-v12'
        }
      )

      setMap(mapInstance)
      console.log('✅ Discover map initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing map:', error)
    }
  }

  const updateMapMarkers = () => {
    if (!map) return
    
    // Clear existing markers
    markers.forEach(marker => marker.remove())
    setMarkers([])

    const newMarkers: any[] = []

    filteredEvents.forEach((event: Event) => {
      if (!event.location?.latitude || !event.location?.longitude) {
        console.warn(`⚠️ Event "${event.title}" missing coordinates`)
        return
      }

      // Normalize coordinates to ensure proper format
      // const [lng, lat] = normalizeCoordinates(event.location.longitude, event.location.latitude)
      const lng = Number(event.location.longitude)
      const lat = Number(event.location.latitude)
      
      console.log(`📍 Adding marker for "${event.title}" at [${lng}, ${lat}]`)

      // Create marker with proper anchoring to fix floating issue
      // const marker = new mapboxgl.Marker({
      //   anchor: 'bottom',
      //   offset: [0, 0]
      // })
      const mbgl = initializeMapboxGL()
      const marker = new mbgl.Marker({
        anchor: 'bottom',
        offset: [0, 0]
      })
        .setLngLat([lng, lat])
        .addTo(map)

      // Add popup with event details
      const popup = new mapboxgl.Popup({
        offset: [0, -50],
        closeButton: true,
        closeOnClick: true
      })
        .setHTML(`
          <div class="p-4 min-w-[280px] max-w-sm">
            <h3 class="font-semibold text-slate-800 mb-2 leading-tight">${event.title}</h3>
            <p class="text-sm text-slate-600 mb-3 line-clamp-2">${event.description}</p>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="truncate">${event.location?.address || event.address || event.location?.name || 'Location not specified'}</span>
              </div>
              
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>${new Date(event.startDate).toLocaleDateString()} at ${event.startTime || 'Time TBD'}</span>
              </div>
              
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                <span class="px-2 py-1 bg-slate-100 rounded text-xs">${event.category}</span>
              </div>
              
              ${event.price && event.price > 0 ? `
                <div class="flex items-center text-xs text-slate-500">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                  <span>$${event.price}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-xs text-cyan-600 font-medium">${event.attendeeCount || 0} attending</span>
              <button onclick="window.location.href='/events/${event.id}'" class="px-3 py-1.5 bg-cyan-500 text-white text-xs rounded-md hover:bg-cyan-600 transition-colors">
                View Details
              </button>
            </div>
          </div>
        `)

      marker.setPopup(popup)
      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
    console.log(`✅ Added ${newMarkers.length} markers to discover map`)
  }

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Discover Events</h1>
                  <p className="mt-2 text-gray-600">Find amazing events happening near you</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    {viewMode === 'map' ? 'List View' : 'Map View'}
                  </button>
                  <button
                    onClick={() => router.push('/create-event')}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Create Event
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadEvents}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Events Display */}
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                      <span className="inline-block px-3 py-1 bg-primary text-white text-xs rounded-full shrink-0 ml-2">
                        {categories.find(c => c.id === event.category)?.icon} {event.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {event.location.address}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        {event.attendees} attending
                        {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={event.creator.avatar || '/default-avatar.png'}
                          alt={event.creator.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.creator.name}</p>
                          {getTrustScoreBadge(event.creator.trustScore)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => joinEvent(event.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Join Event
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Map Container */}
              <div ref={mapContainerRef} className="h-96 bg-gray-200 relative">
                {/* Mapbox will render here */}
              </div>
              
              {/* Selected Event Details */}
              {selectedEvent && (
                <div className="p-6 border-t">
                  <h3 className="text-xl font-semibold mb-2">{selectedEvent.title}</h3>
                  <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        {formatDate(selectedEvent.startDate)}
                      </span>
                      <span className="text-sm text-gray-500">
                        <UserGroupIcon className="w-4 h-4 inline mr-1" />
                        {selectedEvent.attendees} attending
                      </span>
                    </div>
                    <button
                      onClick={() => joinEvent(selectedEvent.id)}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Join Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {filteredEvents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to create an event in your area!'}
              </p>
              <button
                onClick={() => router.push('/create-event')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create Event
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}