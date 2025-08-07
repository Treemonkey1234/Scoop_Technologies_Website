// Cross-platform identity utilities - bulletproof TypeScript
export interface PlatformProfile {
  platform: string;
  profileId: string;
  username: string;
  verified: boolean;
}

export interface CrossPlatformIdentity {
  userId: string;
  platforms: PlatformProfile[];
  primaryPlatform?: string;
}

export function createPlatformProfile(
  platform: string,
  profileId: string,
  username: string,
  verified: boolean = false
): PlatformProfile {
  return {
    platform,
    profileId,
    username,
    verified
  };
}

export function createCrossPlatformIdentity(userId: string): CrossPlatformIdentity {
  return {
    userId,
    platforms: [],
    primaryPlatform: undefined
  };
}

export function addPlatformToIdentity(
  identity: CrossPlatformIdentity,
  platform: PlatformProfile
): CrossPlatformIdentity {
  return {
    ...identity,
    platforms: [...identity.platforms, platform]
  };
}

export default {
  createPlatformProfile,
  createCrossPlatformIdentity,
  addPlatformToIdentity
};