// Admin override client - bulletproof TypeScript
export interface AdminOverride {
  userId: string;
  type: string;
  value: any;
  timestamp: Date;
}

export class AdminOverrideClient {
  async checkOverride(userId: string): Promise<AdminOverride | null> {
    // Mock implementation for now
    return null;
  }
  
  async setOverride(userId: string, override: Partial<AdminOverride>): Promise<boolean> {
    // Mock implementation for now
    return true;
  }

  async removeOverride(userId: string): Promise<boolean> {
    // Mock implementation for now
    return true;
  }
}

export default new AdminOverrideClient();