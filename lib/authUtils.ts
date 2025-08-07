// Auth utilities - bulletproof TypeScript
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding?: boolean;
}

export function validateToken(token: string): boolean {
  // Basic token validation
  return token && token.length > 10;
}

export function getUserFromToken(token: string): AuthUser | null {
  // Mock implementation for now
  if (!validateToken(token)) return null;
  
  return {
    id: '1',
    email: 'user@example.com',
    name: 'Default User'
  };
}

export function createAuthState(user: AuthUser | null): AuthState {
  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    needsOnboarding: false
  };
}

export default {
  validateToken,
  getUserFromToken,
  createAuthState
};