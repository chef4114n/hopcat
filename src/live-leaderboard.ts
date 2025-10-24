import { LiveLeaderboardInterface, LeaderboardData, WebSocketMessage } from './types';
import { getCountryFlag, debounce } from './utils';

class LiveLeaderboard implements LiveLeaderboardInterface {
  public isConnected = false;
  private onUpdateCallback: ((data: LeaderboardData) => void) | null = null;
  private debouncedAddHop: (country: string) => void;
  private pollInterval: number | null = null;

  constructor() {
    this.debouncedAddHop = debounce(this.addHopInternal.bind(this), 500);
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // For demo purposes, use local storage with periodic sync simulation
    this.isConnected = true;
    this.showConnectionStatus('🟡 Demo', 'Using local storage with live simulation');
    this.startLiveSimulation();
  }

  private startLiveSimulation(): void {
    // Simulate live updates every 10 seconds
    this.pollInterval = setInterval(() => {
      if (this.onUpdateCallback) {
        const localData = this.getLocalData();
        // Add some random activity to simulate other users
        this.simulateGlobalActivity(localData);
        this.onUpdateCallback(localData);
      }
    }, 10000);
  }

  private simulateGlobalActivity(data: LeaderboardData): void {
    const countries = Object.keys(data);
    if (countries.length > 0) {
      // Randomly add hops to some countries
      for (let i = 0; i < Math.random() * 3; i++) {
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        data[randomCountry].hops += Math.floor(Math.random() * 5) + 1;
      }
      localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(data));
    }
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

  // WebSocket-based alternative for production
class WebSocketLeaderboard implements LiveLeaderboardInterface {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  isConnected = false;
  private retryAttempts = 0;
  private maxRetries = 5;
  private onUpdateCallback: ((data: LeaderboardData) => void) | null = null;

  constructor(wsUrl = 'wss://hopcat-live.herokuapp.com') {
    this.wsUrl = wsUrl;
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.connectWebSocket();
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
      this.showConnectionStatus('🔴 Offline', 'WebSocket unavailable');
      // Fallback to local storage
      this.setupLocalFallback();
    }
  }

  private setupLocalFallback(): void {
    this.isConnected = false;
    this.showConnectionStatus('🔴 Offline', 'Using local storage');
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('🚀 Connected to live WebSocket server!');
          this.isConnected = true;
          this.retryAttempts = 0;
          this.showConnectionStatus('🟢 Live', 'Real-time global updates active');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === 'leaderboard_update' && this.onUpdateCallback && data.countries) {
            this.onUpdateCallback(data.countries);
          }
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          console.warn('WebSocket disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.retryAttempts}/${this.maxRetries}`);
        this.connectWebSocket().catch(() => {
          if (this.retryAttempts >= this.maxRetries) {
            console.warn('Max reconnection attempts reached');
            this.showConnectionStatus('🔴 Offline', 'Connection failed');
            this.setupLocalFallback();
          }
        });
      }, delay);
    }
  }

  async addHop(country: string): Promise<boolean> {
    if (!country) return false;

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'add_hop',
          country: country,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        console.warn('Failed to send hop via WebSocket:', error);
      }
    }
    
    // Fallback to local storage
    const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
    if (!localData[country]) {
      localData[country] = { hops: 0, flag: getCountryFlag(country) };
    }
    localData[country].hops++;
    localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(localData));
    return true;
  }

  setupRealtimeListener(callback: (data: LeaderboardData) => void): void {
    this.onUpdateCallback = callback;
    
    // Load initial data from local storage
    const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
    callback(localData);
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }
}

export { LiveLeaderboard, WebSocketLeaderboard };

// WebSocket-based alternative for production
class WebSocketLeaderboard implements LiveLeaderboardInterface {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  isConnected = false;
  private retryAttempts = 0;
  private maxRetries = 5;
  private onUpdateCallback: ((data: LeaderboardData) => void) | null = null;

  constructor(wsUrl = 'wss://hopcat-live.herokuapp.com') {
    this.wsUrl = wsUrl;
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.connectWebSocket();
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
      this.showConnectionStatus('🔴 Offline', 'WebSocket unavailable');
      // Fallback to local storage
      this.setupLocalFallback();
    }
  }

  private setupLocalFallback(): void {
    this.isConnected = false;
    this.showConnectionStatus('🔴 Offline', 'Using local storage');
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('🚀 Connected to live WebSocket server!');
          this.isConnected = true;
          this.retryAttempts = 0;
          this.showConnectionStatus('🟢 Live', 'Real-time global updates active');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === 'leaderboard_update' && this.onUpdateCallback && data.countries) {
            this.onUpdateCallback(data.countries);
          }
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          console.warn('WebSocket disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.retryAttempts}/${this.maxRetries}`);
        this.connectWebSocket().catch(() => {
          if (this.retryAttempts >= this.maxRetries) {
            console.warn('Max reconnection attempts reached');
            this.showConnectionStatus('🔴 Offline', 'Connection failed');
            this.setupLocalFallback();
          }
        });
      }, delay);
    }
  }

  async addHop(country: string): Promise<boolean> {
    if (!country) return false;

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'add_hop',
          country: country,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        console.warn('Failed to send hop via WebSocket:', error);
      }
    }
    
    // Fallback to local storage
    const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
    if (!localData[country]) {
      localData[country] = { hops: 0, flag: getCountryFlag(country) };
    }
    localData[country].hops++;
    localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(localData));
    return true;
  }

  setupRealtimeListener(callback: (data: LeaderboardData) => void): void {
    this.onUpdateCallback = callback;
    
    // Load initial data from local storage
    const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
    callback(localData);
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }
}

export { LiveLeaderboard, WebSocketLeaderboard };

// WebSocket-based alternative for production
class WebSocketLeaderboard implements LiveLeaderboardInterface {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  isConnected = false;
  private retryAttempts = 0;
  private maxRetries = 5;
  private onUpdateCallback: ((data: LeaderboardData) => void) | null = null;

  constructor(wsUrl = 'wss://hopcat-live.herokuapp.com') {
    this.wsUrl = wsUrl;
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.connectWebSocket();
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
      this.showConnectionStatus('🔴 Offline', 'WebSocket unavailable');
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('🚀 Connected to live WebSocket server!');
          this.isConnected = true;
          this.retryAttempts = 0;
          this.showConnectionStatus('🟢 Live', 'Real-time global updates active');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (data.type === 'leaderboard_update' && this.onUpdateCallback && data.countries) {
            this.onUpdateCallback(data.countries);
          }
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          console.warn('WebSocket disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.retryAttempts}/${this.maxRetries}`);
        this.connectWebSocket().catch(() => {
          if (this.retryAttempts >= this.maxRetries) {
            console.warn('Max reconnection attempts reached');
            this.showConnectionStatus('🔴 Offline', 'Connection failed');
          }
        });
      }, delay);
    }
  }

  async addHop(country: string): Promise<boolean> {
    if (!country || !this.isConnected || !this.ws) return false;

    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'add_hop',
          country: country,
          timestamp: Date.now()
        }));
        return true;
      }
    } catch (error) {
      console.warn('Failed to send hop via WebSocket:', error);
    }
    return false;
  }

  setupRealtimeListener(callback: (data: LeaderboardData) => void): void {
    this.onUpdateCallback = callback;
  }

  showConnectionStatus(status: string, message: string): void {
    // Same implementation as LiveLeaderboard
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }
}

export { LiveLeaderboard, WebSocketLeaderboard };
