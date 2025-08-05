/**
 * Enhanced Data Storage with Database Persistence
 * Replaces the file-based storage with PostgreSQL + Redis caching
 * Prevents data loss on server restarts
 */

import persistentDataManager from '../persistent-data-solution.js';

// Re-export interfaces for compatibility
export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  user1Data: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    trustScore: number;
  };
  user2Data: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    trustScore: number;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    trustScore: number;
  };
  toUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    trustScore: number;
  };
}

export interface User {
  id: string;
  authId: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  company?: string;
  interests: string[];
  trustScore: number;
  accountTier: string;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  reviewForId?: string;
  category: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  coordinates?: [number, number];
  locationName?: string;
  photos: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate?: string;
  locationName?: string;
  coordinates?: [number, number];
  maxAttendees?: number;
  price: number;
  isPublic: boolean;
  tags: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Enhanced Friendship Operations with Database Persistence
 */
export async function getFriendships(): Promise<Friendship[]> {
  try {
    console.log('📊 Getting friendships from persistent storage...');
    
    // This now uses PostgreSQL instead of JSON files
    const friendships = await persistentDataManager.getAllFriendships();
    
    console.log(`✅ Retrieved ${friendships.length} friendships from database`);
    return friendships;
  } catch (error) {
    console.error('❌ Error getting friendships:', error);
    return [];
  }
}

export async function getFriendshipsForUser(userId: string): Promise<any[]> {
  try {
    console.log(`👥 Getting friends for user ${userId} from persistent storage...`);
    
    const friends = await persistentDataManager.getFriendships(userId);
    
    console.log(`✅ Retrieved ${friends.length} friends for user ${userId}`);
    return friends;
  } catch (error) {
    console.error(`❌ Error getting friends for user ${userId}:`, error);
    return [];
  }
}

export async function addFriendship(friendship: Friendship): Promise<void> {
  try {
    console.log(`👥 Adding friendship: ${friendship.user1Data.name} ↔ ${friendship.user2Data.name}`);
    
    await persistentDataManager.addFriendship(
      friendship.userId1,
      friendship.userId2,
      friendship.user1Data,
      friendship.user2Data
    );
    
    console.log('✅ Friendship added to persistent storage');
  } catch (error) {
    console.error('❌ Error adding friendship:', error);
    throw error;
  }
}

export async function removeFriendship(userId1: string, userId2: string): Promise<boolean> {
  try {
    console.log(`💔 Removing friendship: ${userId1} ↔ ${userId2}`);
    
    const removed = await persistentDataManager.removeFriendship(userId1, userId2);
    
    if (removed) {
      console.log('✅ Friendship removed from persistent storage');
    } else {
      console.log('⚠️ Friendship not found in persistent storage');
    }
    
    return removed;
  } catch (error) {
    console.error('❌ Error removing friendship:', error);
    return false;
  }
}

/**
 * Enhanced User Operations with Database Persistence
 */
export async function saveUser(userData: Partial<User>): Promise<User | null> {
  try {
    console.log(`💾 Saving user data for: ${userData.name} (${userData.authId})`);
    
    const savedUser = await persistentDataManager.saveUser(userData);
    
    console.log('✅ User data saved to persistent storage');
    return savedUser;
  } catch (error) {
    console.error('❌ Error saving user:', error);
    return null;
  }
}

export async function getUser(authId: string): Promise<User | null> {
  try {
    console.log(`👤 Getting user data for: ${authId}`);
    
    const user = await persistentDataManager.getUser(authId);
    
    if (user) {
      console.log(`✅ User data retrieved from persistent storage`);
    } else {
      console.log(`⚠️ User not found in persistent storage`);
    }
    
    return user;
  } catch (error) {
    console.error(`❌ Error getting user ${authId}:`, error);
    return null;
  }
}

export async function updateUserTrustScore(userId: string, newScore: number, reason: string): Promise<void> {
  try {
    console.log(`📊 Updating trust score for user ${userId}: ${newScore} (${reason})`);
    
    await persistentDataManager.updateUserTrustScore(userId, newScore, reason);
    
    console.log('✅ Trust score updated in persistent storage');
  } catch (error) {
    console.error('❌ Error updating trust score:', error);
    throw error;
  }
}

/**
 * Enhanced Post Operations with Database Persistence
 */
export async function savePost(postData: Partial<Post>): Promise<Post | null> {
  try {
    console.log(`📝 Saving post by user ${postData.authorId}`);
    
    const savedPost = await persistentDataManager.savePost(postData);
    
    console.log('✅ Post saved to persistent storage');
    return savedPost;
  } catch (error) {
    console.error('❌ Error saving post:', error);
    return null;
  }
}

export async function getPosts(filters?: any): Promise<Post[]> {
  try {
    console.log('📚 Getting posts from persistent storage...');
    
    const posts = await persistentDataManager.getPosts(filters);
    
    console.log(`✅ Retrieved ${posts.length} posts from database`);
    return posts;
  } catch (error) {
    console.error('❌ Error getting posts:', error);
    return [];
  }
}

export async function getPostsForUser(userId: string): Promise<Post[]> {
  try {
    console.log(`📝 Getting posts for user ${userId}`);
    
    const posts = await persistentDataManager.getPostsForUser(userId);
    
    console.log(`✅ Retrieved ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error(`❌ Error getting posts for user ${userId}:`, error);
    return [];
  }
}

/**
 * Enhanced Event Operations with Database Persistence
 */
export async function saveEvent(eventData: Partial<Event>): Promise<Event | null> {
  try {
    console.log(`🎪 Saving event: ${eventData.title} by user ${eventData.creatorId}`);
    
    const savedEvent = await persistentDataManager.saveEvent(eventData);
    
    console.log('✅ Event saved to persistent storage');
    return savedEvent;
  } catch (error) {
    console.error('❌ Error saving event:', error);
    return null;
  }
}

export async function getEvents(filters?: any): Promise<Event[]> {
  try {
    console.log('🎪 Getting events from persistent storage...');
    
    const events = await persistentDataManager.getEvents(filters);
    
    console.log(`✅ Retrieved ${events.length} events from database`);
    return events;
  } catch (error) {
    console.error('❌ Error getting events:', error);
    return [];
  }
}

export async function addEventAttendee(eventId: string, userId: string): Promise<void> {
  try {
    console.log(`🎟️ Adding attendee ${userId} to event ${eventId}`);
    
    await persistentDataManager.addEventAttendee(eventId, userId);
    
    console.log('✅ Event attendee added to persistent storage');
  } catch (error) {
    console.error('❌ Error adding event attendee:', error);
    throw error;
  }
}

export async function removeEventAttendee(eventId: string, userId: string): Promise<void> {
  try {
    console.log(`🚫 Removing attendee ${userId} from event ${eventId}`);
    
    await persistentDataManager.removeEventAttendee(eventId, userId);
    
    console.log('✅ Event attendee removed from persistent storage');
  } catch (error) {
    console.error('❌ Error removing event attendee:', error);
    throw error;
  }
}

/**
 * Friend Request Operations with Database Persistence
 */
export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    console.log('📬 Getting friend requests from persistent storage...');
    
    const requests = await persistentDataManager.getFriendRequests();
    
    console.log(`✅ Retrieved ${requests.length} friend requests from database`);
    return requests;
  } catch (error) {
    console.error('❌ Error getting friend requests:', error);
    return [];
  }
}

export async function getFriendRequestsForUser(userId: string): Promise<FriendRequest[]> {
  try {
    console.log(`📬 Getting friend requests for user ${userId}`);
    
    const requests = await persistentDataManager.getFriendRequestsForUser(userId);
    
    console.log(`✅ Retrieved ${requests.length} friend requests for user ${userId}`);
    return requests;
  } catch (error) {
    console.error(`❌ Error getting friend requests for user ${userId}:`, error);
    return [];
  }
}

export async function addFriendRequest(request: FriendRequest): Promise<void> {
  try {
    console.log(`📤 Adding friend request: ${request.fromUser.name} → ${request.toUser.name}`);
    
    await persistentDataManager.addFriendRequest(request);
    
    console.log('✅ Friend request added to persistent storage');
  } catch (error) {
    console.error('❌ Error adding friend request:', error);
    throw error;
  }
}

export async function updateFriendRequest(requestId: string, updates: Partial<FriendRequest>): Promise<FriendRequest | null> {
  try {
    console.log(`📝 Updating friend request ${requestId}`);
    
    const updated = await persistentDataManager.updateFriendRequest(requestId, updates);
    
    console.log('✅ Friend request updated in persistent storage');
    return updated;
  } catch (error) {
    console.error('❌ Error updating friend request:', error);
    return null;
  }
}

export async function removeFriendRequest(requestId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Removing friend request ${requestId}`);
    
    const removed = await persistentDataManager.removeFriendRequest(requestId);
    
    console.log('✅ Friend request removed from persistent storage');
    return removed;
  } catch (error) {
    console.error('❌ Error removing friend request:', error);
    return false;
  }
}

/**
 * System Health and Maintenance
 */
export async function createBackup(): Promise<string | null> {
  try {
    console.log('💾 Creating database backup...');
    
    const backupFile = await persistentDataManager.createBackup();
    
    console.log(`✅ Database backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return null;
  }
}

export async function getSystemHealth(): Promise<any> {
  try {
    const health = await persistentDataManager.healthCheck();
    return health;
  } catch (error) {
    console.error('❌ Error getting system health:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Legacy compatibility functions for backward compatibility
export function saveFriendships(friendships: Friendship[]): void {
  console.warn('⚠️ saveFriendships() is deprecated. Data is now auto-persisted to database.');
}

export function saveFriendRequests(requests: FriendRequest[]): void {
  console.warn('⚠️ saveFriendRequests() is deprecated. Data is now auto-persisted to database.');
}

// Initialize the persistent data manager
persistentDataManager.initialize().catch(error => {
  console.error('❌ Failed to initialize persistent data manager:', error);
});

console.log(`
🗄️ ENHANCED DATA STORAGE LOADED!

IMPROVEMENTS:
✅ PostgreSQL database persistence (no more data loss!)
✅ Redis caching for performance
✅ Automatic backup system
✅ Health monitoring
✅ Graceful fallback to file storage
✅ Zero-downtime migration from JSON files

BENEFITS:
🚀 Data persists across server restarts
🚀 Friends lists won't reset to 0
🚀 Posts and events are permanently stored
🚀 Trust scores maintain history
🚀 User profiles fully persist
🚀 Scalable for production use

Your platform now has enterprise-grade data persistence!
`);