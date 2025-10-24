// Types for the HOPCAT application

export interface CountryData {
  hops: number;
  flag: string;
  name?: string;
  lastUpdate?: number;
}

export interface LeaderboardData {
  [countryName: string]: CountryData;
}

export interface HopCatConfig {
  hopCount: number;
  userCountry: string | null;
  isLocationDetected: boolean;
  lastSave: number;
}

export interface LocationService {
  country_name?: string;
  country?: string;
  countryCode?: string;
  countryName?: string;
}

export interface ClickEffectOptions {
  x: number;
  y: number;
  text?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  type: 'websocket' | 'http' | 'firebase' | 'offline';
  message: string;
}

export interface LiveLeaderboardInterface {
  isConnected: boolean;
  addHop(country: string): Promise<boolean>;
  setupRealtimeListener(callback: (data: LeaderboardData) => void): void;
  showConnectionStatus(status: string, message: string): void;
}

export interface MilestoneEvent {
  count: number;
  isSpecial: boolean;
}

export interface HopEvent {
  country: string;
  timestamp: number;
  type: 'hop';
}

export interface WebSocketMessage {
  type: 'add_hop' | 'leaderboard_update' | 'connection' | 'error';
  country?: string;
  countries?: LeaderboardData;
  timestamp: number;
  data?: any;
}

export type CountryCode = 
  | 'US' | 'CA' | 'GB' | 'DE' | 'FR' | 'IT' | 'ES' | 'JP' | 'KR' | 'CN' 
  | 'IN' | 'BR' | 'MX' | 'AU' | 'RU' | 'NL' | 'SE' | 'NO' | 'DK' | 'FI' 
  | 'CH' | 'AT' | 'BE' | 'PT' | 'PL' | 'CZ' | 'HU' | 'GR' | 'TR' | 'IL';

export interface Country {
  name: string;
  flag: string;
  code?: CountryCode;
}
