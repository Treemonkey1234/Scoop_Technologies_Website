// Sample data for development - bulletproof TypeScript with hostId and trustScore fix
export interface SampleUser {
  id: number;
  name: string;
  email: string;
  trustScore?: number;
  avatar?: string;
  username?: string;
  location?: string;
  friendsCount?: number;
  reviewsCount?: number;
}

export interface SampleEvent {
  id: number;
  title: string;
  date: string;
  hostId: number;
  description?: string;
  location?: string;
  attendees?: number[];
}

export interface Review {
  id: number;
  userId: number;
  reviewerId?: number;
  rating: number;
  comment: string;
}

export interface UserActivity {
  id: number;
  userId: number;
  type: string;
  timestamp: string;
}

export const sampleUsers: SampleUser[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com',
    trustScore: 85,
    avatar: '/avatar1.jpg',
    username: 'johndoe',
    location: 'New York, NY',
    friendsCount: 42,
    reviewsCount: 12
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com',
    trustScore: 92,
    avatar: '/avatar2.jpg', 
    username: 'janesmith',
    location: 'Los Angeles, CA',
    friendsCount: 28,
    reviewsCount: 8
  }
];

export const sampleEvents: SampleEvent[] = [
  { 
    id: 1, 
    title: 'Sample Event', 
    date: '2025-08-06', 
    hostId: 1,
    description: 'A sample event for testing',
    location: 'Sample Location',
    attendees: [1, 2]
  }
];

export function getCurrentUser(): SampleUser {
  return sampleUsers[0];
}

export function getAllReviews(): Review[] {
  return [
    { id: 1, userId: 1, rating: 5, comment: 'Great event!' }
  ];
}

export function getAllEvents(): SampleEvent[] {
  return sampleEvents;
}

export function getUserActivities(): UserActivity[] {
  return [
    { id: 1, userId: 1, type: 'event_joined', timestamp: '2025-08-06T10:00:00Z' }
  ];
}

export default {
  users: sampleUsers,
  events: sampleEvents,
  getCurrentUser,
  getAllReviews,
  getAllEvents,
  getUserActivities
};