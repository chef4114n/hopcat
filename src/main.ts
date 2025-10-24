import './style.css';
import { LiveLeaderboard } from './live-leaderboard-clean';
import { LocationService, HopCatConfig, LeaderboardData } from './types';
import { audioManager } from './audio';
import { 
  formatNumber, 
  getMedal, 
  createClickEffect, 
  createConfetti, 
  showMilestoneMessage,
  MILESTONE_TARGETS,
  GEOLOCATION_SERVICES,
  getAllCountries,
  getCountryNameFromCode,
  getCountryFlag
} from './utils';

class HopCat {
  private hopCount = 0;
  private hopsPerSecond = 0;
  private hopTimes: number[] = [];
  private countriesData: LeaderboardData = {};
  private userCountry: string | null = null;
  private isLocationDetected = false;
  private liveLeaderboard: LiveLeaderboard;
  
  // DOM elements
  private catElement!: HTMLElement;
  private hopCountElement!: HTMLElement;
  private hopsPerSecondElement!: HTMLElement;
  private worldwideHopsElement!: HTMLElement;
  private countryLeaderboardElement!: HTMLElement;

  constructor() {
    this.liveLeaderboard = new LiveLeaderboard();
    this.initializeElements();
    this.bindEvents();
    this.loadData();
    this.detectUserLocation();
    this.setupLiveLeaderboard();
    this.startHPSCalculation();
  }

  private initializeElements(): void {
    this.catElement = document.getElementById('cat')!;
    this.hopCountElement = document.getElementById('hopCount')!;
    this.hopsPerSecondElement = document.getElementById('hopsPerSecond')!;
    this.worldwideHopsElement = document.getElementById('worldwideHops')!;
    this.countryLeaderboardElement = document.getElementById('countryLeaderboard')!;
  }

  private bindEvents(): void {
    this.catElement.addEventListener('click', (e) => this.hopCat(e));
    this.catElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.hopCat(e);
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.hopCat(e);
      }
    });

    // Save data periodically
    setInterval(() => this.saveData(), 5000);
  }

  private hopCat(event: Event): void {
    this.hopCount++;
    this.updateHopCount();
    this.addToUserCountry();
    this.playHopAnimation();
    this.createClickEffect(event);
    this.updateHPSData();
    this.checkMilestones();
    this.saveData();
    
    // Play hop sound
    audioManager.playHopSound();
  }

  private updateHopCount(): void {
    this.hopCountElement.textContent = formatNumber(this.hopCount);
    this.hopCountElement.classList.add('animate-bounce-counter');
    setTimeout(() => {
      this.hopCountElement.classList.remove('animate-bounce-counter');
    }, 300);
  }

  private addToUserCountry(): void {
    if (this.userCountry && this.isLocationDetected) {
      // Add to live leaderboard
      this.liveLeaderboard.addHop(this.userCountry);
    }
  }

  private playHopAnimation(): void {
    this.catElement.classList.remove('animate-hop');
    // Force reflow
    this.catElement.offsetHeight;
    this.catElement.classList.add('animate-hop');
    
    setTimeout(() => {
      this.catElement.classList.remove('animate-hop');
    }, 600);
  }

  private createClickEffect(event: Event): void {
    if (event instanceof MouseEvent || event instanceof TouchEvent) {
      const rect = this.catElement.getBoundingClientRect();
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      createClickEffect(this.catElement, x, y);
    }
  }

  private updateHPSData(): void {
    const now = Date.now();
    this.hopTimes.push(now);
    
    // Keep only hops from the last second
    this.hopTimes = this.hopTimes.filter(time => now - time <= 1000);
  }

  private startHPSCalculation(): void {
    setInterval(() => {
      this.hopsPerSecond = this.hopTimes.length;
      this.hopsPerSecondElement.textContent = this.hopsPerSecond.toString();
      
      // Add visual effects for high HPS
      if (this.hopsPerSecond >= 10) {
        this.hopsPerSecondElement.classList.add('animate-pulse-hps');
      } else {
        this.hopsPerSecondElement.classList.remove('animate-pulse-hps');
      }
    }, 100);
  }

  private async detectUserLocation(): Promise<void> {
    try {
      // First try to get country from saved data
      const savedData = localStorage.getItem('hopcatData');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.userCountry && data.isLocationDetected) {
          this.userCountry = data.userCountry;
          this.isLocationDetected = true;
          this.updateLocationDisplay();
          return;
        }
      }

      // Try multiple IP geolocation services
      for (const service of GEOLOCATION_SERVICES) {
        try {
          const response = await fetch(service);
          const data: LocationService = await response.json();
          
          let country = null;
          // Different services return country in different fields
          if (data.country_name) country = data.country_name;
          else if (data.country) country = data.country;
          else if (data.countryCode) country = getCountryNameFromCode(data.countryCode);
          
          if (country) {
            this.userCountry = country;
            this.isLocationDetected = true;
            this.updateLocationDisplay();
            this.saveData();
            break;
          }
        } catch (error) {
          console.warn(`Failed to get location from ${service}:`, error);
          continue;
        }
      }

      // If all services fail, fallback to browser geolocation
      if (!this.isLocationDetected) {
        this.tryBrowserGeolocation();
      }

    } catch (error) {
      console.warn('Location detection failed:', error);
      this.fallbackToManualSelection();
    }
  }

  private tryBrowserGeolocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Use reverse geocoding to get country
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const data = await response.json();
            
            if (data.countryName) {
              this.userCountry = data.countryName;
              this.isLocationDetected = true;
              this.updateLocationDisplay();
              this.saveData();
            } else {
              this.fallbackToManualSelection();
            }
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            this.fallbackToManualSelection();
          }
        },
        (error) => {
          console.warn('Browser geolocation failed:', error);
          this.fallbackToManualSelection();
        }
      );
    } else {
      this.fallbackToManualSelection();
    }
  }

  private fallbackToManualSelection(): void {
    this.showCountrySelector();
  }

  private showCountrySelector(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50';

    const content = document.createElement('div');
    content.className = 'gradient-primary p-8 rounded-3xl max-w-md w-11/12 max-h-96 overflow-y-auto text-center text-white custom-scrollbar';

    const countries = getAllCountries();
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-5">Select Your Country</h2>
      <p class="mb-5 opacity-90">Choose your country to join the leaderboard:</p>
      <div class="grid gap-2 max-h-72 overflow-y-auto custom-scrollbar">
        ${countries.map(country => `
          <button onclick="window.hopCatGame.selectCountry('${country.name}')" 
                  class="p-3 glass rounded-xl text-white cursor-pointer transition-all duration-300 hover:bg-white hover:bg-opacity-20 hover:scale-105">
            ${country.flag} ${country.name}
          </button>
        `).join('')}
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  public selectCountry(countryName: string): void {
    this.userCountry = countryName;
    this.isLocationDetected = true;
    this.updateLocationDisplay();
    this.saveData();
    
    // Remove modal
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) modal.remove();
  }

  private updateLocationDisplay(): void {
    // Add a location indicator to the UI
    const existingIndicator = document.getElementById('locationIndicator');
    if (existingIndicator) existingIndicator.remove();

    if (this.userCountry) {
      const indicator = document.createElement('div');
      indicator.id = 'locationIndicator';
      indicator.className = 'fixed top-5 right-5 glass text-white px-4 py-2 rounded-xl text-sm z-40 animate-slide-in-right';
      
      const flag = getCountryFlag(this.userCountry);
      indicator.textContent = `${flag} ${this.userCountry}`;
      document.body.appendChild(indicator);
    }
  }

  private setupLiveLeaderboard(): void {
    // Setup real-time listener for leaderboard updates
    this.liveLeaderboard.setupRealtimeListener((data) => {
      this.countriesData = data;
      this.updateLeaderboard();
      this.showLiveUpdateNotification();
    });
  }

  private showLiveUpdateNotification(): void {
    // Show a subtle notification that the leaderboard updated
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500 bg-opacity-80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm z-50 pointer-events-none animate-fade-in-up';
    notification.textContent = '🌍 Live leaderboard updated!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  private updateLeaderboard(): void {
    // Calculate worldwide total
    const worldwideTotal = Object.values(this.countriesData).reduce((sum, country) => sum + (country.hops || 0), 0);
    this.worldwideHopsElement.textContent = formatNumber(worldwideTotal);

    // Sort countries by hops
    const sortedCountries = Object.entries(this.countriesData)
      .filter(([,data]) => data.hops > 0) // Only show countries with hops
      .sort(([,a], [,b]) => (b.hops || 0) - (a.hops || 0))
      .slice(0, 50); // Top 50 countries

    // Update leaderboard HTML
    this.countryLeaderboardElement.innerHTML = sortedCountries
      .map(([country, data], index) => {
        const rank = index + 1;
        const medal = getMedal(rank);
        const isUserCountry = country === this.userCountry;
        const animationDelay = `animation-delay: ${index * 0.05}s;`;
        
        return `
          <div class="flex items-center p-4 mb-2 glass rounded-xl transition-all duration-300 hover:bg-white hover:bg-opacity-10 hover:translate-x-1 animate-slide-in-left ${isUserCountry ? 'user-country' : ''}" 
               style="${animationDelay}">
            <span class="font-semibold min-w-10 text-center text-lg">${medal || rank}</span>
            <span class="flex-1 font-medium pl-4">${data.flag || '🏳️'} ${country}</span>
            <span class="font-semibold text-gold text-lg">${formatNumber(data.hops || 0)}</span>
          </div>
        `;
      })
      .join('');

    // Add live indicator to leaderboard title
    const title = document.querySelector('.leaderboard-title');
    if (title && this.liveLeaderboard.isConnected) {
      title.innerHTML = '🏆 Live Global Leaderboard <span class="text-green-400 text-sm live-pulse">●</span>';
    }
  }

  private checkMilestones(): void {
    if (MILESTONE_TARGETS.includes(this.hopCount)) {
      createConfetti();
      showMilestoneMessage(this.hopCount);
      audioManager.playMilestoneSound();
    }
  }

  private saveData(): void {
    const data: HopCatConfig = {
      hopCount: this.hopCount,
      userCountry: this.userCountry,
      isLocationDetected: this.isLocationDetected,
      lastSave: Date.now()
    };
    localStorage.setItem('hopcatData', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('hopcatData');
    if (saved) {
      try {
        const data: HopCatConfig = JSON.parse(saved);
        this.hopCount = data.hopCount || 0;
        this.userCountry = data.userCountry || null;
        this.isLocationDetected = data.isLocationDetected || false;
        this.updateHopCount();
        
        if (this.userCountry && this.isLocationDetected) {
          this.updateLocationDisplay();
        }
      } catch (e) {
        console.warn('Failed to load saved data:', e);
      }
    }
  }

  // Reset all data to 0
  resetAllData(): void {
    // Clear localStorage
    localStorage.removeItem('hopcatData');
    localStorage.removeItem('hopcatPersonalHops');
    localStorage.removeItem('hopcatGlobalLeaderboard');
    localStorage.removeItem('hopcatUserCountry');
    
    // Reset in-memory counters
    this.hopCount = 0;
    this.hopsPerSecond = 0;
    this.hopTimes = [];
    this.userCountry = null;
    this.isLocationDetected = false;
    this.countriesData = {};
    
    // Update UI
    this.updateHopCount();
    this.updateHPSData();
    
    // Clear leaderboard display
    const leaderboardContainer = document.getElementById('countryLeaderboard');
    const worldwideHops = document.getElementById('worldwideHops');
    if (leaderboardContainer) leaderboardContainer.innerHTML = '';
    if (worldwideHops) worldwideHops.textContent = '0';
    
    // Clear location display
    this.updateLocationDisplay();
    
    console.log('✅ All leaderboard data reset to 0');
    showMilestoneMessage(0);
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Make the game instance globally available for country selection
  (window as any).hopCatGame = new HopCat();
  
  // Add some particle effects on load
  setTimeout(() => {
    createWelcomeEffect();
  }, 500);
  
  // Add keyboard hint
  showKeyboardHint();
});

function createWelcomeEffect(): void {
  const container = document.querySelector('.cat-container');
  if (!container) return;
  
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.className = 'fixed w-3 h-3 bg-gold rounded-full pointer-events-none animate-float-up';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = '0%';
      particle.style.zIndex = '1000';
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 2000);
    }, i * 100);
  }
}

function showKeyboardHint(): void {
  const hint = document.createElement('div');
  hint.className = 'fixed bottom-5 right-5 glass text-white px-4 py-2 rounded-xl text-sm backdrop-blur-sm animate-fade-in-up z-30';
  hint.textContent = 'Tip: Press SPACE to hop!';
  document.body.appendChild(hint);
  
  // Remove hint after 5 seconds
  setTimeout(() => {
    hint.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint);
      }
    }, 500);
  }, 5000);
}
