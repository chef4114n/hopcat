class HopCat {
    constructor() {
        this.hopCount = 0;
        this.hopsPerSecond = 0;
        this.lastHopTime = Date.now();
        this.hopTimes = [];
        this.countriesData = {};
        this.userCountry = null;
        this.isLocationDetected = false;
        this.liveLeaderboard = new LiveLeaderboard();
        
        this.initializeElements();
        this.bindEvents();
        this.loadData();
        this.detectUserLocation();
        this.setupLiveLeaderboard();
        this.startHPSCalculation();
    }

    initializeElements() {
        this.catElement = document.getElementById('cat');
        this.catImage = document.getElementById('catImage');
        this.hopCountElement = document.getElementById('hopCount');
        this.hopsPerSecondElement = document.getElementById('hopsPerSecond');
        this.worldwideHopsElement = document.getElementById('worldwideHops');
        this.countryLeaderboardElement = document.getElementById('countryLeaderboard');
        this.hopSound = document.getElementById('hopSound');
    }

    bindEvents() {
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

    hopCat(event) {
        this.hopCount++;
        this.updateHopCount();
        this.addToUserCountry();
        this.playHopAnimation();
        this.createClickEffect(event);
        this.playHopSound();
        this.updateHPSData();
        this.checkMilestones();
        this.saveData();
    }

    updateHopCount() {
        this.hopCountElement.textContent = this.formatNumber(this.hopCount);
        this.hopCountElement.classList.add('bounce');
        setTimeout(() => {
            this.hopCountElement.classList.remove('bounce');
        }, 300);
    }

    addToUserCountry() {
        if (this.userCountry && this.isLocationDetected) {
            // Add to live leaderboard
            this.liveLeaderboard.addHop(this.userCountry);
            
            // Also update local data as fallback
            if (!this.countriesData[this.userCountry]) {
                this.countriesData[this.userCountry] = { 
                    hops: 0, 
                    flag: this.getCountryFlag(this.userCountry) 
                };
            }
            this.countriesData[this.userCountry].hops++;
        }
    }

    setupLiveLeaderboard() {
        // Setup real-time listener for leaderboard updates
        this.liveLeaderboard.setupRealtimeListener((data) => {
            this.countriesData = data;
            this.updateLeaderboard();
            this.showLiveUpdateNotification();
        });
        
        // Initialize with any local data
        const localData = this.loadGlobalLeaderboard();
        if (Object.keys(localData).length > 0) {
            this.countriesData = localData;
            this.updateLeaderboard();
        }
    }

    showLiveUpdateNotification() {
        // Show a subtle notification that the leaderboard updated
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            backdrop-filter: blur(10px);
            z-index: 1000;
            animation: slideUpFade 3s ease-out forwards;
            pointer-events: none;
        `;
        notification.textContent = '🌍 Live leaderboard updated!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    playHopAnimation() {
        this.catElement.classList.remove('hopping');
        // Force reflow
        this.catElement.offsetHeight;
        this.catElement.classList.add('hopping');
        
        setTimeout(() => {
            this.catElement.classList.remove('hopping');
        }, 600);
    }

    createClickEffect(event) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = '+1';
        
        // Position the effect at the click location
        const rect = this.catElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.pointerEvents = 'none';
        
        this.catElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }

    playHopSound() {
        if (this.hopSound) {
            this.hopSound.currentTime = 0;
            this.hopSound.play().catch(() => {
                // Sound play failed, ignore silently
            });
        }
    }

    updateHPSData() {
        const now = Date.now();
        this.hopTimes.push(now);
        
        // Keep only hops from the last second
        this.hopTimes = this.hopTimes.filter(time => now - time <= 1000);
    }

    startHPSCalculation() {
        setInterval(() => {
            this.hopsPerSecond = this.hopTimes.length;
            this.hopsPerSecondElement.textContent = this.hopsPerSecond;
            
            // Add visual effects for high HPS
            if (this.hopsPerSecond >= 10) {
                this.hopsPerSecondElement.classList.add('high-hps');
            } else {
                this.hopsPerSecondElement.classList.remove('high-hps');
            }
        }, 100);
    }

    getUserCountry() {
        // In a real implementation, you would use an IP geolocation service
        // For demo purposes, we'll use a random country or let user select
        const countries = Object.keys(this.countriesData);
        return countries[Math.floor(Math.random() * countries.length)];
    }

    async detectUserLocation() {
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
            const services = [
                'https://ipapi.co/json/',
                'https://ipinfo.io/json',
                'https://ip-api.com/json/',
                'https://freegeoip.app/json/'
            ];

            for (const service of services) {
                try {
                    const response = await fetch(service);
                    const data = await response.json();
                    
                    let country = null;
                    // Different services return country in different fields
                    if (data.country_name) country = data.country_name;
                    else if (data.country) country = data.country;
                    else if (data.countryCode) country = this.getCountryNameFromCode(data.countryCode);
                    
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

    tryBrowserGeolocation() {
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

    fallbackToManualSelection() {
        // Show a country selector modal
        this.showCountrySelector();
    }

    showCountrySelector() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            max-height: 500px;
            overflow-y: auto;
            text-align: center;
            color: white;
        `;

        const countries = this.getAllCountries();
        content.innerHTML = `
            <h2 style="margin-bottom: 20px;">Select Your Country</h2>
            <p style="margin-bottom: 20px; opacity: 0.9;">Choose your country to join the leaderboard:</p>
            <div style="display: grid; gap: 10px; max-height: 300px; overflow-y: auto;">
                ${countries.map(country => `
                    <button onclick="window.hopCatGame.selectCountry('${country.name}')" 
                            style="padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s;">
                        ${country.flag} ${country.name}
                    </button>
                `).join('')}
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    selectCountry(countryName) {
        this.userCountry = countryName;
        this.isLocationDetected = true;
        this.updateLocationDisplay();
        this.saveData();
        
        // Remove modal
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (modal) modal.remove();
    }

    updateLocationDisplay() {
        // Add a location indicator to the UI
        const existingIndicator = document.getElementById('locationIndicator');
        if (existingIndicator) existingIndicator.remove();

        if (this.userCountry) {
            const indicator = document.createElement('div');
            indicator.id = 'locationIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                padding: 10px 15px;
                border-radius: 10px;
                font-size: 0.9rem;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                z-index: 1000;
            `;
            
            const flag = this.getCountryFlag(this.userCountry);
            indicator.textContent = `${flag} ${this.userCountry}`;
            document.body.appendChild(indicator);
        }
    }

    getCountryNameFromCode(code) {
        const countryMap = {
            'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom',
            'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain',
            'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China', 'IN': 'India',
            'BR': 'Brazil', 'MX': 'Mexico', 'AU': 'Australia', 'RU': 'Russia',
            'NL': 'Netherlands', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
            'FI': 'Finland', 'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium',
            'PT': 'Portugal', 'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary'
        };
        return countryMap[code] || code;
    }

    getAllCountries() {
        return [
            { name: 'United States', flag: '🇺🇸' },
            { name: 'Canada', flag: '🇨🇦' },
            { name: 'United Kingdom', flag: '🇬🇧' },
            { name: 'Germany', flag: '🇩🇪' },
            { name: 'France', flag: '🇫🇷' },
            { name: 'Italy', flag: '🇮🇹' },
            { name: 'Spain', flag: '🇪🇸' },
            { name: 'Japan', flag: '🇯🇵' },
            { name: 'South Korea', flag: '🇰🇷' },
            { name: 'China', flag: '🇨🇳' },
            { name: 'India', flag: '🇮🇳' },
            { name: 'Brazil', flag: '🇧🇷' },
            { name: 'Mexico', flag: '🇲🇽' },
            { name: 'Australia', flag: '🇦🇺' },
            { name: 'Russia', flag: '🇷🇺' },
            { name: 'Netherlands', flag: '🇳🇱' },
            { name: 'Sweden', flag: '🇸🇪' },
            { name: 'Norway', flag: '🇳🇴' },
            { name: 'Denmark', flag: '🇩🇰' },
            { name: 'Finland', flag: '🇫🇮' },
            { name: 'Switzerland', flag: '🇨🇭' },
            { name: 'Austria', flag: '🇦🇹' },
            { name: 'Belgium', flag: '🇧🇪' },
            { name: 'Portugal', flag: '🇵🇹' },
            { name: 'Poland', flag: '🇵🇱' },
            { name: 'Czech Republic', flag: '🇨🇿' },
            { name: 'Hungary', flag: '🇭🇺' },
            { name: 'Greece', flag: '🇬🇷' },
            { name: 'Turkey', flag: '🇹🇷' },
            { name: 'Israel', flag: '🇮🇱' },
            { name: 'South Africa', flag: '🇿🇦' },
            { name: 'Egypt', flag: '🇪🇬' },
            { name: 'Nigeria', flag: '🇳🇬' },
            { name: 'Argentina', flag: '🇦🇷' },
            { name: 'Chile', flag: '🇨🇱' },
            { name: 'Colombia', flag: '🇨🇴' },
            { name: 'Peru', flag: '🇵🇪' },
            { name: 'Thailand', flag: '🇹🇭' },
            { name: 'Vietnam', flag: '🇻🇳' },
            { name: 'Indonesia', flag: '🇮🇩' },
            { name: 'Malaysia', flag: '🇲🇾' },
            { name: 'Singapore', flag: '🇸🇬' },
            { name: 'Philippines', flag: '🇵🇭' },
            { name: 'New Zealand', flag: '🇳🇿' },
            { name: 'Ireland', flag: '🇮🇪' },
            { name: 'Ukraine', flag: '🇺🇦' },
            { name: 'Romania', flag: '🇷🇴' },
            { name: 'Bulgaria', flag: '🇧🇬' },
            { name: 'Croatia', flag: '🇭🇷' },
            { name: 'Serbia', flag: '🇷🇸' },
            { name: 'Slovenia', flag: '🇸🇮' },
            { name: 'Slovakia', flag: '🇸🇰' },
            { name: 'Lithuania', flag: '🇱🇹' },
            { name: 'Latvia', flag: '🇱🇻' },
            { name: 'Estonia', flag: '🇪🇪' }
        ];
    }

    getCountryFlag(countryName) {
        const country = this.getAllCountries().find(c => c.name === countryName);
        return country ? country.flag : '🏳️';
    }

    initializeCountries() {
        // Sample countries data - in a real app this would come from a server
        return {
            'United States': { hops: 1523450123, flag: '🇺🇸' },
            'Japan': { hops: 1234567890, flag: '🇯🇵' },
            'Germany': { hops: 987654321, flag: '🇩🇪' },
            'United Kingdom': { hops: 856423190, flag: '🇬🇧' },
            'France': { hops: 745632189, flag: '🇫🇷' },
            'Canada': { hops: 634521087, flag: '🇨🇦' },
            'Australia': { hops: 523410987, flag: '🇦🇺' },
            'South Korea': { hops: 456789123, flag: '🇰🇷' },
            'Brazil': { hops: 345678912, flag: '🇧🇷' },
            'Italy': { hops: 234567891, flag: '🇮🇹' },
            'Spain': { hops: 198765432, flag: '🇪🇸' },
            'Netherlands': { hops: 187654321, flag: '🇳🇱' },
            'Sweden': { hops: 176543210, flag: '🇸🇪' },
            'Norway': { hops: 165432109, flag: '🇳🇴' },
            'Denmark': { hops: 154321098, flag: '🇩🇰' },
            'Finland': { hops: 143210987, flag: '🇫🇮' },
            'Switzerland': { hops: 132109876, flag: '🇨🇭' },
            'Austria': { hops: 121098765, flag: '🇦🇹' },
            'Belgium': { hops: 110987654, flag: '🇧🇪' },
            'Portugal': { hops: 109876543, flag: '🇵🇹' }
        };
    }

    loadGlobalLeaderboard() {
        const saved = localStorage.getItem('hopcatGlobalLeaderboard');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to load global leaderboard:', e);
            }
        }
        return this.initializeCountries();
    }

    saveGlobalLeaderboard() {
        localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(this.countriesData));
    }

    updateLeaderboard() {
        // Calculate worldwide total
        const worldwideTotal = Object.values(this.countriesData).reduce((sum, country) => sum + (country.hops || 0), 0);
        this.worldwideHopsElement.textContent = this.formatNumber(worldwideTotal);

        // Sort countries by hops
        const sortedCountries = Object.entries(this.countriesData)
            .filter(([,data]) => data.hops > 0) // Only show countries with hops
            .sort(([,a], [,b]) => (b.hops || 0) - (a.hops || 0))
            .slice(0, 50); // Top 50 countries

        // Update leaderboard HTML
        this.countryLeaderboardElement.innerHTML = sortedCountries
            .map(([country, data], index) => {
                const rank = index + 1;
                const medal = this.getMedal(rank);
                const isUserCountry = country === this.userCountry;
                return `
                    <div class="leaderboard-item ${isUserCountry ? 'user-country' : ''}" 
                         style="animation: slideInLeft 0.3s ease-out ${index * 0.05}s both;">
                        <span class="rank">${medal || rank}</span>
                        <span class="country">${data.flag || '🏳️'} ${country}</span>
                        <span class="hops">${this.formatNumber(data.hops || 0)}</span>
                    </div>
                `;
            })
            .join('');

        // Add live indicator to leaderboard title
        const title = document.querySelector('.leaderboard-title');
        if (title && this.liveLeaderboard.isConnected) {
            title.innerHTML = '🏆 Live Global Leaderboard <span style="color: #00ff00; font-size: 0.8em;">●</span>';
        }
    }

    getMedal(rank) {
        const medals = {
            1: '🥇',
            2: '🥈', 
            3: '🥉'
        };
        return medals[rank];
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    saveData() {
        const data = {
            hopCount: this.hopCount,
            userCountry: this.userCountry,
            isLocationDetected: this.isLocationDetected,
            lastSave: Date.now()
        };
        localStorage.setItem('hopcatData', JSON.stringify(data));
        
        // Also save global leaderboard
        this.saveGlobalLeaderboard();
    }

    loadData() {
        const saved = localStorage.getItem('hopcatData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
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

    checkMilestones() {
        const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
        if (milestones.includes(this.hopCount)) {
            this.createConfetti();
            this.showMilestoneMessage(this.hopCount);
        }
    }

    createConfetti() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
                confetti.style.animationDelay = Math.random() * 2 + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 20);
        }
    }

    showMilestoneMessage(count) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: bounceIn 0.5s ease-out;
        `;
        message.textContent = `🎉 ${this.formatNumber(count)} HOPS! 🎉`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 500);
        }, 2000);
    }
}

// Add some visual enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    window.hopCatGame = new HopCat();
    
    // Add some particle effects on load
    setTimeout(() => {
        createWelcomeEffect();
    }, 500);
});

function createWelcomeEffect() {
    const container = document.querySelector('.cat-container');
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.background = '#ffd700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '100%';
            particle.style.animation = `floatUp 2s ease-out forwards`;
            
            container.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }, i * 100);
    }
}

// Add keyboard hint
document.addEventListener('DOMContentLoaded', () => {
    const hint = document.createElement('div');
    hint.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        padding: 10px 15px;
        border-radius: 10px;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: fadeInUp 1s ease-out 2s both;
    `;
    hint.textContent = 'Tip: Press SPACE to hop!';
    document.body.appendChild(hint);
    
    // Remove hint after 5 seconds
    setTimeout(() => {
        hint.style.animation = 'fadeInDown 0.5s ease-out reverse forwards';
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        }, 500);
    }, 5000);
});
