import { LiveLeaderboardInterface, LeaderboardData } from './types';
import { getCountryFlag, debounce } from './utils';

class LiveLeaderboard implements LiveLeaderboardInterface {
  public isConnected = false;
  private onUpdateCallback: ((data: LeaderboardData) => void) | null = null;
  private debouncedAddHop: (country: string) => void;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.debouncedAddHop = debounce(this.addHopInternal.bind(this), 500);
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // For demo purposes, use local storage only
    this.isConnected = true;
    this.showConnectionStatus('� Local', 'Personal leaderboard (no simulation)');
    this.startLiveSimulation();
  }

  private startLiveSimulation(): void {
    // Disabled simulation - only show real user data
    this.pollInterval = setInterval(() => {
      if (this.onUpdateCallback) {
        const localData = this.getLocalData();
        // No simulated activity - only real user clicks
        this.onUpdateCallback(localData);
      }
    }, 10000);
  }

  showConnectionStatus(status: string, message: string): void {
    const existingStatus = document.getElementById('connectionStatus');
    if (existingStatus) existingStatus.remove();

    const statusDiv = document.createElement('div');
    statusDiv.id = 'connectionStatus';
    statusDiv.className = 'fixed top-16 right-5 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-white border-opacity-20 z-50 transition-all duration-300 animate-slide-in-right';
    statusDiv.innerHTML = `<strong>${status}</strong><br><small>${message}</small>`;
    document.body.appendChild(statusDiv);

    if (this.isConnected) {
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.style.opacity = '0';
          setTimeout(() => statusDiv.remove(), 300);
        }
      }, 3000);
    }
  }

  async addHop(country: string): Promise<boolean> {
    if (!country) return false;
    this.debouncedAddHop(country);
    return true;
  }

  private async addHopInternal(country: string): Promise<boolean> {
    if (!country) return false;

    try {
      const localData = this.getLocalData();
      if (!localData[country]) {
        localData[country] = { hops: 0, flag: getCountryFlag(country) };
      }
      localData[country].hops++;
      localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(localData));
      
      // Notify callback immediately
      if (this.onUpdateCallback) {
        this.onUpdateCallback(localData);
      }
      
      console.log(`✅ Added hop for ${country}`);
      return true;
    } catch (error) {
      console.warn('Failed to add hop:', error);
      return false;
    }
  }

  private getLocalData(): LeaderboardData {
    return JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
  }

  setupRealtimeListener(callback: (data: LeaderboardData) => void): void {
    this.onUpdateCallback = callback;
    
    // Initial load
    const localData = this.getLocalData();
    if (Object.keys(localData).length === 0) {
      // Initialize with some demo data
      const demoData: LeaderboardData = {
        'United States': { hops: 1523450, flag: '🇺🇸' },
        'Japan': { hops: 1234567, flag: '🇯🇵' },
        'Germany': { hops: 987654, flag: '🇩🇪' },
        'United Kingdom': { hops: 856423, flag: '🇬🇧' },
        'France': { hops: 745632, flag: '🇫🇷' },
        'Canada': { hops: 634521, flag: '🇨🇦' },
        'Australia': { hops: 523410, flag: '🇦🇺' },
        'South Korea': { hops: 456789, flag: '🇰🇷' },
        'Brazil': { hops: 345678, flag: '🇧🇷' },
        'Italy': { hops: 234567, flag: '🇮🇹' }
      };
      localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(demoData));
      callback(demoData);
    } else {
      callback(localData);
    }
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.isConnected = false;
  }
}

export { LiveLeaderboard };
