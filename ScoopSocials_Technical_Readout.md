# 🔧 ScoopSocials Platform - Technical Readout

## 📊 **SYSTEM ARCHITECTURE OVERVIEW**

### **Technology Stack**
```
Frontend: Next.js 15.3.4 + React 18 + TypeScript 5.9.2
Backend: Express.js 4.18.0 + Node.js
Database: PostgreSQL 13+ (DigitalOcean Managed)
Cache: Redis 4.6.13 (Valkey)
Authentication: Auth0
Maps: Mapbox GL 3.0.1
Styling: Tailwind CSS 3.3.0
Deployment: DigitalOcean App Platform + Droplets
```

### **Infrastructure Components**
- **Frontend**: DigitalOcean App Platform (auto-scaling)
- **Backend API**: DigitalOcean Droplet (142.93.52.19)
- **Database**: PostgreSQL on DigitalOcean (scoop_social_app)
- **Cache**: Redis/Valkey for session and trust score caching
- **CDN**: Cloudflare for static assets
- **Domain**: app.scoopsocials.com

---

## 🏗️ **FRONTEND ARCHITECTURE**

### **Next.js App Structure**
```
Scoop_Social_MVP/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── auth/              # Authentication pages
│   ├── events/            # Event management
│   ├── profile/           # User profiles
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── public/                # Static assets
```

### **Key Frontend Technologies**
- **Next.js 15.3.4**: App Router, Server Components, API Routes
- **React 18**: Concurrent features, Suspense, Error Boundaries
- **TypeScript 5.9.2**: Strict type checking, interfaces
- **Tailwind CSS 3.3.0**: Utility-first styling
- **Framer Motion 10.16.16**: Animations and transitions
- **Mapbox GL 3.0.1**: Interactive maps and location services

### **Performance Optimizations**
```typescript
// Code splitting and lazy loading
const TrustBadge = dynamic(() => import('@/components/TrustBadge'), {
  loading: () => <TrustScoreSkeleton />
})

// Image optimization
<Image 
  src={user.avatar} 
  alt={user.name}
  width={150}
  height={150}
  priority={true}
  placeholder="blur"
/>

// Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

---

## 🔧 **BACKEND ARCHITECTURE**

### **Express.js Server Structure**
```javascript
// server.js - Main backend server
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Database connection pool
const pool = new Pool({
  host: '142.93.52.19',
  port: 5432,
  database: 'scoop_social_app',
  user: 'scoop_user',
  password: 'ScoopSocial2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

### **API Endpoints Structure**
```
/api/v1/
├── auth/
│   ├── signup
│   ├── login
│   ├── verify-code
│   └── check-email
├── events/
│   ├── GET (list events)
│   ├── POST (create event)
│   └── [id]/rsvp
├── trust-score/
│   ├── GET (get score)
│   └── revalidate
├── friends/
│   ├── request
│   └── accept
└── posts/
    ├── GET (list posts)
    └── POST (create post)
```

### **Database Schema (PostgreSQL)**
```sql
-- Core tables with relationships
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  auth_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(255),
  birth_date DATE,
  gender VARCHAR(50),
  occupation VARCHAR(255),
  company VARCHAR(255),
  interests JSONB DEFAULT '[]',
  trust_score INTEGER DEFAULT 50,
  account_tier VARCHAR(50) DEFAULT 'basic',
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social relationships
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id_1 INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_id_2 INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

-- Events system
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location_name VARCHAR(255),
  coordinates POINT,
  max_attendees INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content and posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  review_for_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  coordinates POINT,
  location_name VARCHAR(255),
  photos JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏆 **TRUST SCORE SYSTEM - TECHNICAL IMPLEMENTATION**

### **Core Algorithm**
```javascript
// 11-component weighted trust score calculation
function calculateTrustScore(signals) {
  const weights = {
    accountAge: 0.12,
    profileCompletion: 0.12,
    eventsParticipation: 0.18,
    communityActivity: 0.10,
    socialEngagement: 0.08,
    connectedAccounts: 0.08,
    positiveInteractions: 0.08,
    reviewsRatings: 0.07,
    contentQuality: 0.06,
    platformContribution: 0.05,
    flaggingAccuracy: 0.06,
  }

  // Normalize each component to 0-1 range
  const norm = {
    accountAge: clamp(safe(signals.accountAgeInDays) / 365, 0, 1),
    profileCompletion: clamp(
      (signals.profilePicture ? 0.25 : 0) + 
      (signals.bio ? 0.25 : 0) + 
      (signals.location ? 0.25 : 0) + 
      (signals.emailVerified ? 0.125 : 0) + 
      (signals.phoneVerified ? 0.125 : 0), 0, 1
    ),
    eventsParticipation: clamp((safe(signals.eventsHosted) * 0.2 + safe(signals.eventsAttended) * 0.1) / 10, 0, 1),
    // ... other components
  }

  // Calculate weighted sum
  const weighted = Object.entries(weights)
    .reduce((sum, [key, weight]) => sum + (norm[key] * weight), 0)

  return Math.round(clamp(weighted, 0, 1) * 100)
}
```

### **Background Processing**
```javascript
// Trust score worker queue
const trustScoreWorker = {
  async processUser(userId) {
    const vk = await getValkey()
    const lockKey = `trust:lock:${userId}`
    
    // Prevent concurrent processing
    const ok = await vk.set(lockKey, '1', { NX: true, EX: 30 })
    if (!ok) return

    try {
      const signals = await fetchUserSignals(userId)
      const result = calculateTrustScore(signals)
      
      // Store in Redis with TTL
      await vk.set(`trust:score:${userId}`, JSON.stringify({
        score: result.displayScore,
        details: result,
        computed_at: new Date().toISOString(),
        version: '1.0'
      }), { EX: 300 }) // 5 minute TTL

      // Update PostgreSQL
      await pool.query(
        'UPDATE users SET trust_score = $1, updated_at = NOW() WHERE id = $2',
        [result.displayScore, userId]
      )

      // Publish real-time update
      await vk.publish(`trust:updates:${userId}`, JSON.stringify(result))
    } finally {
      await vk.del(lockKey)
    }
  }
}
```

---

## 🗄️ **CACHING STRATEGY**

### **Multi-Layer Caching**
```javascript
// Frontend cache (in-memory)
const trustScoreCache = new Map()

// Redis cache configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
}

// Cache TTL strategy
const CACHE_TTL = {
  user_profile: 3600,        // 1 hour
  user_stats: 1800,          // 30 minutes
  trust_score: 300,          // 5 minutes
  event_list: 600,           // 10 minutes
  friend_list: 1800,         // 30 minutes
  search_results: 900        // 15 minutes
}
```

### **Cache Implementation**
```javascript
// API route with caching
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  
  // Check frontend cache first
  const cached = trustScoreCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' }
    })
  }

  // Check Redis cache
  const redisData = await redis.get(`trust:score:${userId}`)
  if (redisData) {
    const data = JSON.parse(redisData)
    trustScoreCache.set(userId, {
      data,
      expiresAt: Date.now() + 300000 // 5 minutes
    })
    return NextResponse.json(data, {
      headers: { 'X-Cache': 'REDIS' }
    })
  }

  // Fetch from database
  const score = await calculateTrustScore(userId)
  await redis.setex(`trust:score:${userId}`, 300, JSON.stringify(score))
  
  return NextResponse.json(score, {
    headers: { 'X-Cache': 'MISS' }
  })
}
```

---

## 🔐 **AUTHENTICATION & SECURITY**

### **Auth0 Integration**
```typescript
// Auth0 configuration
const auth0Config = {
  domain: 'dev-av6q4m54qqcs5n00.us.auth0.com',
  clientId: '5uKzDSRavv2WqTOvDnDqsh2pGvHQ759C',
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: 'https://dev-av6q4m54qqcs5n00.us.auth0.com',
  baseURL: 'https://app.scoopsocials.com',
  secret: process.env.AUTH0_SECRET
}

// Session management
const sessionConfig = {
  cookieName: 'appSession',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24 hours
  }
}
```

### **Security Headers**
```javascript
// Next.js security configuration
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.auth0.com https://cdnjs.cloudflare.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.auth0.com https://api.scoopsocials.com;
      font-src 'self' https://fonts.gstatic.com;
    `
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

---

## 📊 **PERFORMANCE OPTIMIZATIONS**

### **Database Optimizations**
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_auth_id ON users(auth_id);
CREATE INDEX CONCURRENTLY idx_events_creator ON events(creator_id);
CREATE INDEX CONCURRENTLY idx_events_date ON events(start_date);
CREATE INDEX CONCURRENTLY idx_posts_author ON posts(author_id);
CREATE INDEX CONCURRENTLY idx_friendships_users ON friendships(user_id_1, user_id_2);

-- Spatial indexes for location queries
CREATE INDEX CONCURRENTLY idx_events_location_gist ON events USING GIST(coordinates);
CREATE INDEX CONCURRENTLY idx_posts_location_gist ON posts USING GIST(coordinates);
```

### **Connection Pooling**
```javascript
// PostgreSQL connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection fails
  acquireTimeoutMillis: 60000,   // Return error after 60s if connection cannot be acquired
  statement_timeout: 30000,      // Cancel queries after 30s
  query_timeout: 30000,          // Timeout individual queries
  keepAlive: true,               // Keep TCP connection alive
  keepAliveInitialDelayMillis: 10000
})
```

### **Frontend Performance**
```typescript
// Code splitting and lazy loading
const EventMap = dynamic(() => import('@/components/EventMap'), {
  loading: () => <MapSkeleton />,
  ssr: false
})

// Image optimization
<Image
  src={event.photo}
  alt={event.title}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
/>

// Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}
```

---

## 🔄 **REAL-TIME FEATURES**

### **WebSocket Implementation**
```javascript
// Socket.IO server setup
const io = require('socket.io')(server, {
  cors: {
    origin: ["https://app.scoopsocials.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
})

// Real-time notifications
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`)
  })

  socket.on('disconnect', () => {
    // Clean up user sessions
  })
})

// Broadcasting updates
function broadcastTrustScoreUpdate(userId, score) {
  io.to(`user:${userId}`).emit('trustScoreUpdate', {
    userId,
    score,
    timestamp: Date.now()
  })
}
```

### **Server-Sent Events**
```javascript
// SSE for real-time updates
app.get('/api/trust-score/stream/:userId', (req, res) => {
  const userId = req.params.userId
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Subscribe to Redis pub/sub
  const subscriber = redis.duplicate()
  subscriber.subscribe(`trust:updates:${userId}`)
  
  subscriber.on('message', (channel, message) => {
    sendUpdate(JSON.parse(message))
  })

  req.on('close', () => {
    subscriber.unsubscribe()
    subscriber.quit()
  })
})
```

---

## 📱 **MOBILE & RESPONSIVE DESIGN**

### **Responsive Breakpoints**
```css
/* Tailwind CSS responsive design */
.container {
  @apply mx-auto px-4;
}

/* Mobile-first approach */
.event-card {
  @apply w-full p-4 mb-4 bg-white rounded-lg shadow-md;
}

/* Tablet and up */
@media (min-width: 768px) {
  .event-card {
    @apply w-1/2 p-6;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .event-card {
    @apply w-1/3 p-8;
  }
}
```

### **Touch Optimizations**
```css
/* Mobile touch targets */
button, [role="button"], a[href] {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
  touch-action: manipulation;
}

/* Touch-friendly navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200;
  @apply flex justify-around items-center py-2;
  @apply safe-area-inset-bottom;
}
```

---

## 🚀 **DEPLOYMENT & CI/CD**

### **DigitalOcean App Platform Configuration**
```yaml
# app.yaml
name: scoop-social-frontend
region: nyc1

services:
  - name: frontend
    source_dir: /
    instance_count: 1
    instance_size_slug: basic-xxs
    
    github:
      repo: Treemonkey1234/Scoop_Social_MVP
      branch: main
      deploy_on_push: true
    
    build_command: npm ci && npm run build
    run_command: npm start
    
    http_port: 3000
    
    health_check:
      http_path: /
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    
    envs:
      - key: NODE_ENV
        value: production
      - key: AUTH0_DOMAIN
        value: dev-av6q4m54qqcs5n00.us.auth0.com
      - key: NEXT_PUBLIC_BACKEND_URL
        value: https://coral-app-tjel2.ondigitalocean.app
```

### **Environment Variables**
```bash
# Production environment variables
NODE_ENV=production
PORT=3000
AUTH0_DOMAIN=dev-av6q4m54qqcs5n00.us.auth0.com
AUTH0_CLIENT_ID=5uKzDSRavv2WqTOvDnDqsh2pGvHQ759C
AUTH0_CLIENT_SECRET=9JsSTKvK_hPS8bNPKWQQRQUU-Ll9e8xXAeOpy0pO0bQdrkryT95Ge5WAGQTxPt0X
AUTH0_ISSUER_BASE_URL=https://dev-av6q4m54qqcs5n00.us.auth0.com
AUTH0_SECRET=f8d2e5a94b1c3f6e9d7c2a8f4e1b6d9c5a7f3e8b2d6c9f1a4e7d2c8b5f9a3e6d1c4f7a2e5d8b3c6f9a1e4d7c2f5e8b9d3c6a1f4e7d2c5f8b3e6d9c2a5f1e4
AUTH0_AUDIENCE=https://dev-av6q4m54qqcs5n00.us.auth0.com/api/v2/
AUTH0_BASE_URL=https://app.scoopsocials.com
NEXT_PUBLIC_BACKEND_URL=https://coral-app-tjel2.ondigitalocean.app
APP_BASE_URL=https://app.scoopsocials.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoidHJlZW1vbmtleTQ1NiIsImEiOiJjbWMwc3FodnIwNjJ6MmxwdWtpamFkbjVyIn0._yMY5crJh7ujrwoxkm3EVw
```

---

## 📊 **MONITORING & ANALYTICS**

### **Performance Monitoring**
```javascript
// Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  console.log('Web Vital:', metric.name, metric.value)
  
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    })
  }
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### **Error Tracking**
```javascript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

---

## 🔧 **DEVELOPMENT TOOLS & WORKFLOW**

### **Package Dependencies**
```json
{
  "dependencies": {
    "@auth0/nextjs-auth0": "^4.7.0",
    "@heroicons/react": "^2.0.18",
    "@stripe/stripe-js": "^7.8.0",
    "express": "^4.18.0",
    "framer-motion": "^10.16.16",
    "jsonwebtoken": "^9.0.2",
    "mapbox-gl": "^3.0.1",
    "next": "^15.3.4",
    "pg": "^8.16.3",
    "react": "^18",
    "react-dom": "^18",
    "redis": "^4.6.13",
    "socket.io": "^4.7.5",
    "socket.io-client": "^4.7.5",
    "stripe": "^18.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "5.9.2",
    "zod": "^3.22.4"
  }
}
```

### **Development Scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "start:backend": "node server.js",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "pre-push": "npm run lint && npm run type-check && npm run build"
  }
}
```

---

## 🔒 **SECURITY IMPLEMENTATIONS**

### **Input Validation**
```typescript
// Zod schema validation
import { z } from 'zod'

const EventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.enum(['social', 'business', 'education', 'entertainment']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  locationName: z.string().max(255).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  maxAttendees: z.number().min(1).max(1000).optional(),
  price: z.number().min(0).max(10000).optional(),
  isPublic: z.boolean().default(true)
})

// API route validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = EventSchema.parse(body)
    // Process validated data
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
```

### **Rate Limiting**
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', apiLimiter)
```

---

## 📈 **SCALABILITY CONSIDERATIONS**

### **Database Scaling**
```sql
-- Read replicas for analytics
CREATE PUBLICATION analytics_pub FOR TABLE users, events, posts;

-- Partitioning for large tables
CREATE TABLE posts_partitioned (
  LIKE posts INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE posts_2024 PARTITION OF posts_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### **Horizontal Scaling**
```javascript
// Load balancing configuration
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork() // Replace dead worker
  })
} else {
  // Worker process
  require('./server.js')
}
```

---

This technical readout provides a comprehensive overview of the ScoopSocials platform's architecture, implementation details, and technical considerations. The platform is built with modern technologies and follows best practices for performance, security, and scalability.
