// This file is deprecated - use live-leaderboard-clean.ts instead
// Keeping minimal exports to prevent build errors

export interface LiveLeaderboardInterface {
  isConnected: boolean;
  addHop(country: string): Promise<boolean>;
  setupRealtimeListener(callback: (data: any) => void): void;
  showConnectionStatus(status: string, message: string): void;
}

export class LiveLeaderboard implements LiveLeaderboardInterface {
  public isConnected = false;

  async addHop(_country: string): Promise<boolean> {
    return false;
  }

  setupRealtimeListener(callback: (data: any) => void): void {
    callback({});
  }

  showConnectionStatus(status: string, message: string): void {
    console.log(`${status}: ${message}`);
  }
}
