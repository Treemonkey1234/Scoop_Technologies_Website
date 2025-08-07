// Basic scoop profile utilities - bulletproof TypeScript
export interface ScoopProfile {
  id: string;
  name: string;
  email: string;
}

export function createProfile(data: any): ScoopProfile {
  return {
    id: data.id || '1',
    name: data.name || 'Default User',
    email: data.email || 'user@example.com'
  };
}

export function validateProfile(profile: ScoopProfile): boolean {
  return !!(profile.id && profile.name && profile.email);
}

export default {
  createProfile,
  validateProfile
};