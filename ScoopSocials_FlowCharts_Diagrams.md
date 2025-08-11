# 🏗️ ScoopSocials Platform - Flow Charts & Swim Lane Diagrams

## 📊 **SYSTEM ARCHITECTURE OVERVIEW**

```mermaid
graph TB
    subgraph "FRONTEND LAYER"
        A[Next.js App]
        B[React Components]
        C[Service Worker]
        D[Local Cache]
    end
    
    subgraph "API GATEWAY"
        E[Next.js API Routes]
        F[Authentication Middleware]
        G[Rate Limiting]
    end
    
    subgraph "BACKEND SERVICES"
        H[Express.js Server]
        I[Trust Score Worker]
        J[Background Jobs]
    end
    
    subgraph "DATA LAYER"
        K[PostgreSQL Database]
        L[Redis Cache (Valkey)]
        M[File Storage]
    end
    
    subgraph "EXTERNAL SERVICES"
        N[Auth0]
        O[Mapbox]
        P[Social Media APIs]
    end
    
    A --> E
    B --> E
    C --> E
    E --> H
    E --> N
    H --> K
    H --> L
    H --> I
    I --> L
    I --> K
    H --> O
    H --> P
    D --> A
```

---

## 🔄 **AUTHENTICATION SWIM LANE DIAGRAM**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth0
    participant B as Backend API
    participant D as Database
    participant C as Cache

    Note over U,C: User Login Flow
    U->>F: Click Login
    F->>A: Redirect to Auth0
    A->>U: Show Login Form
    U->>A: Enter Credentials
    A->>A: Validate Credentials
    A->>F: Return Auth Code
    F->>B: Exchange Code for Token
    B->>A: Validate Token
    A->>B: Return User Profile
    B->>D: Create/Update User Record
    D->>B: Return User Data
    B->>C: Cache User Session
    B->>F: Set Session Cookie
    F->>U: Redirect to Dashboard

    Note over U,C: API Request Flow
    U->>F: Make API Request
    F->>B: Include Session Cookie
    B->>C: Validate Session
    C->>B: Return User Context
    B->>D: Execute Query
    D->>B: Return Data
    B->>F: Return Response
    F->>U: Update UI
```

---

## 👥 **USER REGISTRATION FLOW CHART**

```mermaid
flowchart TD
    A[User Visits Signup] --> B{Email Valid?}
    B -->|No| C[Show Error]
    C --> A
    B -->|Yes| D[Check Email Availability]
    D --> E{Email Available?}
    E -->|No| F[Show Email Taken Error]
    F --> A
    E -->|Yes| G[Create Auth0 Account]
    G --> H{Auth0 Success?}
    H -->|No| I[Show Auth Error]
    I --> A
    H -->|Yes| J[Create Backend User]
    J --> K[Set Default Trust Score: 50]
    K --> L[Assign Basic Tier]
    L --> M[Send Welcome Email]
    M --> N[Redirect to Profile Setup]
    N --> O[Track Analytics]
    O --> P[User Onboarded]
```

---

## 🏆 **TRUST SCORE CALCULATION SWIM LANE**

```mermaid
sequenceDiagram
    participant U as User Action
    participant F as Frontend
    participant B as Backend API
    participant Q as Queue System
    participant W as Worker
    participant D as Database
    participant C as Redis Cache
    participant N as Notifications

    Note over U,N: User Performs Action
    U->>F: Create Event/Post/Friend
    F->>B: API Request
    B->>D: Store Data
    D->>B: Confirm Storage
    B->>Q: Queue Trust Score Update
    B->>F: Return Success
    F->>U: Update UI

    Note over U,N: Background Processing
    Q->>W: Process Queue Item
    W->>D: Fetch User Signals
    D->>W: Return User Data
    W->>D: Fetch Related Data
    D->>W: Return Related Data
    
    Note over U,N: Calculate Trust Score
    W->>W: Calculate 11 Components
    W->>W: Apply Weights & Bonuses
    W->>C: Store Trust Score
    C->>W: Confirm Storage
    W->>D: Update User Trust Score
    D->>W: Confirm Update
    W->>N: Send Score Update Notification
    N->>F: Real-time Update
    F->>U: Show Updated Score
```

---

## 📅 **EVENT CREATION FLOW CHART**

```mermaid
flowchart TD
    A[User Clicks Create Event] --> B[Load Event Form]
    B --> C[User Fills Form]
    C --> D{Form Valid?}
    D -->|No| E[Show Validation Errors]
    E --> C
    D -->|Yes| F[Submit to Backend]
    F --> G{User Authenticated?}
    G -->|No| H[Redirect to Login]
    H --> A
    G -->|Yes| I[Validate Event Data]
    I --> J{Data Valid?}
    J -->|No| K[Return Validation Errors]
    K --> C
    J -->|Yes| L[Store in Database]
    L --> M[Update User Stats]
    M --> N[Queue Trust Score Update]
    N --> O[Send Notifications]
    O --> P[Return Success Response]
    P --> Q[Redirect to Event Page]
    Q --> R[Update Event Feed]
```

---

## 👥 **FRIEND REQUEST SWIM LANE DIAGRAM**

```mermaid
sequenceDiagram
    participant U1 as User A
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    participant N as Notifications
    participant U2 as User B

    Note over U1,U2: Send Friend Request
    U1->>F: Click Add Friend
    F->>B: POST /api/friends/request
    B->>D: Check Existing Request
    D->>B: No Existing Request
    B->>D: Store Friend Request
    D->>B: Request Stored
    B->>N: Create Notification
    N->>U2: Send Real-time Notification
    B->>F: Return Success
    F->>U1: Show "Request Sent"

    Note over U1,U2: Accept Friend Request
    U2->>F: Click Accept Request
    F->>B: PUT /api/friends/accept
    B->>D: Create Friendship
    D->>B: Friendship Created
    B->>D: Delete Friend Request
    D->>B: Request Deleted
    B->>N: Create Acceptance Notification
    N->>U1: Send Real-time Notification
    B->>F: Return Success
    F->>U2: Show "Friendship Created"
```

---

## 📝 **CONTENT MODERATION FLOW CHART**

```mermaid
flowchart TD
    A[User Flags Content] --> B[Load Flag Modal]
    B --> C[Select Flag Reason]
    C --> D[Add Description]
    D --> E[Submit Flag]
    E --> F{Flag Valid?}
    F -->|No| G[Show Validation Error]
    G --> D
    F -->|Yes| H[Store Flag in Database]
    H --> I[Update User Flagging Stats]
    I --> J[Check Flag Threshold]
    J --> K{Threshold Reached?}
    K -->|No| L[Add to Review Queue]
    K -->|Yes| M[Auto-Review Content]
    M --> N{Content Violates Rules?}
    N -->|Yes| O[Remove Content]
    N -->|No| P[Keep Content]
    L --> Q[Moderator Reviews]
    Q --> R{Moderator Decision}
    R -->|Remove| O
    R -->|Warn| S[Send Warning to User]
    R -->|Approve| T[Keep Content]
    O --> U[Update Trust Score]
    S --> U
    T --> V[Update Flagging Accuracy]
    U --> W[Send Notification]
    V --> W
```

---

## 🔔 **NOTIFICATION SYSTEM SWIM LANE**

```mermaid
sequenceDiagram
    participant S as System Event
    participant B as Backend
    participant D as Database
    participant N as Notification Service
    participant C as Cache
    participant F as Frontend
    participant U as User

    Note over U,S: Event Triggers Notification
    S->>B: User Action (Friend Request, Event, etc.)
    B->>D: Store Event Data
    D->>B: Confirm Storage
    B->>N: Create Notification
    N->>D: Store Notification
    D->>N: Confirm Storage
    N->>C: Cache Notification
    C->>N: Confirm Cache
    N->>F: Real-time Push
    F->>U: Show Notification Badge
    U->>F: Click Notification
    F->>B: Mark as Read
    B->>D: Update Read Status
    D->>B: Confirm Update
    B->>F: Return Updated Count
    F->>U: Update UI
```

---

## 🔗 **SOCIAL MEDIA INTEGRATION FLOW CHART**

```mermaid
flowchart TD
    A[User Clicks Connect Social] --> B[Select Platform]
    B --> C[Redirect to OAuth]
    C --> D[Platform Authorization]
    D --> E{Authorization Success?}
    E -->|No| F[Show Error Message]
    F --> A
    E -->|Yes| G[Fetch Profile Data]
    G --> H[Validate Account Ownership]
    H --> I{Account Valid?}
    I -->|No| J[Show Verification Error]
    J --> A
    I -->|Yes| K[Store Connection]
    K --> L[Update Trust Score]
    L --> M[Send Verification Notification]
    M --> N[Update Connected Accounts UI]
    N --> O[Periodic Data Sync]
    O --> P[Fetch Latest Data]
    P --> Q[Update Local Cache]
    Q --> R[Trigger Trust Score Recalculation]
```

---

## 🗄️ **CACHING STRATEGY SWIM LANE**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant FC as Frontend Cache
    participant B as Backend API
    participant RC as Redis Cache
    participant D as Database

    Note over U,D: API Request Flow
    U->>F: Request Data
    F->>FC: Check Frontend Cache
    FC->>F: Cache Miss
    F->>B: API Request
    B->>RC: Check Redis Cache
    RC->>B: Cache Miss
    B->>D: Database Query
    D->>B: Return Data
    B->>RC: Store in Redis (TTL: 5min)
    RC->>B: Confirm Storage
    B->>F: Return Data
    F->>FC: Store in Frontend Cache
    FC->>F: Confirm Storage
    F->>U: Display Data

    Note over U,D: Subsequent Request
    U->>F: Request Same Data
    F->>FC: Check Frontend Cache
    FC->>F: Cache Hit
    F->>U: Display Cached Data
```

---

## 📊 **TRUST SCORE COMPONENT CALCULATION FLOW**

```mermaid
flowchart TD
    A[Start Trust Score Calculation] --> B[Fetch User Signals]
    B --> C[Calculate Account Age]
    C --> D[Calculate Profile Completion]
    D --> E[Calculate Events Participation]
    E --> F[Calculate Community Activity]
    F --> G[Calculate Social Engagement]
    G --> H[Calculate Reviews Ratings]
    H --> I[Calculate Content Quality]
    I --> J[Calculate Platform Contribution]
    J --> K[Calculate Connected Accounts]
    K --> L[Calculate Positive Interactions]
    L --> M[Calculate Flagging Accuracy]
    
    M --> N[Apply Component Weights]
    N --> O[Calculate Weighted Sum]
    O --> P[Apply Bonuses & Penalties]
    P --> Q[Calculate Final Score]
    Q --> R{Score > 100?}
    R -->|Yes| S[Cap at 100 for Display]
    R -->|No| T[Use Calculated Score]
    S --> U[Store Score & Components]
    T --> U
    U --> V[Update Cache & Database]
    V --> W[Send Notifications]
    W --> X[End Calculation]
```

---

## 🔄 **DATA PERSISTENCE & BACKUP FLOW**

```mermaid
flowchart TD
    A[Data Change Occurs] --> B[Primary Database Update]
    B --> C[Redis Cache Update]
    C --> D[Queue Backup Job]
    D --> E{Backup Type?}
    E -->|Real-time| F[Redis Persistence]
    E -->|Hourly| G[Database Snapshot]
    E -->|Daily| H[Full System Backup]
    E -->|Weekly| I[Cloud Storage Backup]
    
    F --> J[Validate Data Integrity]
    G --> J
    H --> J
    I --> J
    
    J --> K{Backup Success?}
    K -->|No| L[Retry Backup]
    L --> J
    K -->|Yes| M[Update Backup Log]
    M --> N[Send Success Notification]
    
    O[Recovery Request] --> P[Load Latest Backup]
    P --> Q[Validate Backup Data]
    Q --> R{Data Valid?}
    R -->|No| S[Load Previous Backup]
    S --> Q
    R -->|Yes| T[Restore Database]
    T --> U[Rebuild Cache]
    U --> V[Verify System Health]
    V --> W[System Recovery Complete]
```

---

## 📈 **PERFORMANCE MONITORING FLOW**

```mermaid
flowchart TD
    A[User Action] --> B[Track Event]
    B --> C[Record Timestamp]
    C --> D[Measure Response Time]
    D --> E[Log Performance Data]
    E --> F[Store in Analytics DB]
    F --> G[Calculate Metrics]
    G --> H{Threshold Exceeded?}
    H -->|Yes| I[Generate Alert]
    H -->|No| J[Update Dashboard]
    I --> K[Send Alert to Admin]
    K --> L[Log Alert]
    J --> M[Update Real-time Metrics]
    M --> N[Store Historical Data]
    N --> O[Generate Reports]
    O --> P[Display in Admin Dashboard]
```

---

## 🚀 **DEPLOYMENT PIPELINE FLOW**

```mermaid
flowchart TD
    A[Code Commit] --> B[Trigger CI/CD]
    B --> C[Run Tests]
    C --> D{Tests Pass?}
    D -->|No| E[Send Failure Notification]
    E --> F[Fix Issues]
    F --> A
    D -->|Yes| G[Build Application]
    G --> H[Run Security Scan]
    H --> I{Security Pass?}
    I -->|No| J[Block Deployment]
    J --> K[Security Review]
    K --> A
    I -->|Yes| L[Deploy to Staging]
    L --> M[Run Integration Tests]
    M --> N{Staging Tests Pass?}
    N -->|No| O[Rollback & Fix]
    O --> A
    N -->|Yes| P[Deploy to Production]
    P --> Q[Health Check]
    Q --> R{Health OK?}
    R -->|No| S[Rollback Production]
    S --> T[Investigate Issues]
    T --> A
    R -->|Yes| U[Send Success Notification]
    U --> V[Monitor Performance]
```

---

## 🔒 **SECURITY FLOW CHART**

```mermaid
flowchart TD
    A[Incoming Request] --> B[Validate HTTPS]
    B --> C{HTTPS Valid?}
    C -->|No| D[Block Request]
    C -->|Yes| E[Check Rate Limit]
    E --> F{Rate Limit OK?}
    F -->|No| G[Return 429 Error]
    F -->|Yes| H[Validate Session]
    H --> I{Session Valid?}
    I -->|No| J[Redirect to Login]
    I -->|Yes| K[Check Permissions]
    K --> L{Permission OK?}
    L -->|No| M[Return 403 Error]
    L -->|Yes| N[Sanitize Input]
    N --> O[Execute Request]
    O --> P[Log Activity]
    P --> Q[Return Response]
    Q --> R[Add Security Headers]
    R --> S[Send Response]
```

---

## 📱 **MOBILE RESPONSIVE FLOW**

```mermaid
flowchart TD
    A[User Accesses Site] --> B[Detect Device Type]
    B --> C{Device Type?}
    C -->|Desktop| D[Load Full Layout]
    C -->|Tablet| E[Load Tablet Layout]
    C -->|Mobile| F[Load Mobile Layout]
    
    D --> G[Show Full Navigation]
    E --> H[Show Collapsible Navigation]
    F --> I[Show Hamburger Menu]
    
    G --> J[Display Full Content]
    H --> K[Optimize Content for Tablet]
    I --> L[Optimize Content for Mobile]
    
    J --> M[Enable Hover Effects]
    K --> N[Enable Touch Gestures]
    L --> O[Enable Touch Gestures]
    
    M --> P[Full Feature Set]
    N --> Q[Tablet-Optimized Features]
    O --> R[Mobile-Optimized Features]
```

---

## 🔄 **REAL-TIME UPDATES FLOW**

```mermaid
sequenceDiagram
    participant U1 as User A
    participant F1 as Frontend A
    participant B as Backend
    participant WS as WebSocket Server
    participant F2 as Frontend B
    participant U2 as User B

    Note over U1,U2: Real-time Update Flow
    U1->>F1: Perform Action
    F1->>B: API Request
    B->>B: Process Action
    B->>WS: Broadcast Update
    WS->>F2: Send Real-time Update
    F2->>U2: Update UI
    
    Note over U1,U2: WebSocket Connection
    U2->>F2: Connect to WebSocket
    F2->>WS: Establish Connection
    WS->>F2: Connection Confirmed
    F2->>U2: Show Online Status
    
    Note over U1,U2: Notification Flow
    B->>WS: Send Notification
    WS->>F2: Push Notification
    F2->>U2: Show Notification Badge
```

---

## 📊 **ANALYTICS DATA FLOW**

```mermaid
flowchart TD
    A[User Interaction] --> B[Track Event]
    B --> C[Collect User Data]
    C --> D[Anonymize Data]
    D --> E[Store in Analytics DB]
    E --> F[Process Metrics]
    F --> G[Generate Insights]
    G --> H[Update Dashboards]
    H --> I[Send Reports]
    I --> J[Alert on Anomalies]
    J --> K[Optimize Performance]
    K --> L[Update Recommendations]
    L --> M[Improve User Experience]
```

---

These flow charts and swim lane diagrams provide a comprehensive visual representation of how data flows through every aspect of the ScoopSocials platform, from user interactions to backend processing to data storage and real-time updates.
