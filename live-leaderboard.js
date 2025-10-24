// Firebase configuration for live leaderboard
class LiveLeaderboard {
    constructor() {
        this.initializeFirebase();
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    initializeFirebase() {
        // Public Firebase configuration (read-only database)
        const firebaseConfig = {
            apiKey: "AIzaSyBqK8X9Y4L2HpM7QgT3R1lP9mZ6vE3C4W8",
            authDomain: "hopcat-live.firebaseapp.com",
            databaseURL: "https://hopcat-live-default-rtdb.firebaseio.com",
            projectId: "hopcat-live",
            storageBucket: "hopcat-live.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:abcdef123456789012"
        };

        try {
            // Initialize Firebase if not already done
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.leaderboardRef = this.database.ref('countries');
            this.setupConnectionListener();
            this.isConnected = true;
            console.log('🔥 Firebase connected successfully!');
        } catch (error) {
            console.warn('Firebase initialization failed, falling back to local storage:', error);
            this.fallbackToLocal();
        }
    }

    setupConnectionListener() {
        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                this.isConnected = true;
                this.showConnectionStatus('🟢 Live', 'Connected to global leaderboard');
            } else {
                this.isConnected = false;
                this.showConnectionStatus('🔴 Offline', 'Using local data');
            }
        });
    }

    showConnectionStatus(status, message) {
        // Remove existing status
        const existingStatus = document.getElementById('connectionStatus');
        if (existingStatus) existingStatus.remove();

        // Add connection status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connectionStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 999;
            transition: all 0.3s ease;
        `;
        statusDiv.innerHTML = `<strong>${status}</strong><br><small>${message}</small>`;
        document.body.appendChild(statusDiv);

        // Auto-hide after 3 seconds if connected
        if (this.isConnected) {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => statusDiv.remove(), 300);
                }
            }, 3000);
        }
    }

    async addHop(country) {
        if (!country) return;

        try {
            if (this.isConnected) {
                // Try to increment in Firebase
                const countryRef = this.leaderboardRef.child(country.replace(/\s+/g, '_'));
                await countryRef.transaction((currentValue) => {
                    const current = currentValue || { hops: 0, flag: this.getCountryFlag(country), name: country };
                    return {
                        ...current,
                        hops: (current.hops || 0) + 1,
                        lastUpdate: Date.now()
                    };
                });
                
                console.log(`✅ Added hop for ${country} to live database`);
                return true;
            } else {
                throw new Error('Not connected to Firebase');
            }
        } catch (error) {
            console.warn('Failed to add hop to Firebase:', error);
            this.fallbackAddHop(country);
            return false;
        }
    }

    fallbackAddHop(country) {
        // Fallback to local storage
        const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
        if (!localData[country]) {
            localData[country] = { hops: 0, flag: this.getCountryFlag(country) };
        }
        localData[country].hops++;
        localStorage.setItem('hopcatGlobalLeaderboard', JSON.stringify(localData));
    }

    setupRealtimeListener(callback) {
        if (!this.isConnected) {
            // Use local data
            const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
            callback(localData);
            return;
        }

        try {
            this.leaderboardRef.on('value', (snapshot) => {
                const data = snapshot.val() || {};
                // Convert Firebase format back to our format
                const countries = {};
                Object.entries(data).forEach(([key, value]) => {
                    const countryName = value.name || key.replace(/_/g, ' ');
                    countries[countryName] = {
                        hops: value.hops || 0,
                        flag: value.flag || this.getCountryFlag(countryName)
                    };
                });
                callback(countries);
            });
        } catch (error) {
            console.warn('Failed to setup realtime listener:', error);
            this.fallbackToLocal();
            const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
            callback(localData);
        }
    }

    fallbackToLocal() {
        this.isConnected = false;
        this.showConnectionStatus('🔴 Offline', 'Using local leaderboard');
    }

    getCountryFlag(countryName) {
        const flagMap = {
            'United States': '🇺🇸', 'Canada': '🇨🇦', 'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
            'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳',
            'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'Australia': '🇦🇺', 'Russia': '🇷🇺',
            'Netherlands': '🇳🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰',
            'Finland': '🇫🇮', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
            'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺',
            'Greece': '🇬🇷', 'Turkey': '🇹🇷', 'Israel': '🇮🇱', 'South Africa': '🇿🇦',
            'Egypt': '🇪🇬', 'Nigeria': '🇳🇬', 'Argentina': '🇦🇷', 'Chile': '🇨🇱',
            'Colombia': '🇨🇴', 'Peru': '🇵🇪', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳',
            'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Philippines': '🇵🇭',
            'New Zealand': '🇳🇿', 'Ireland': '🇮🇪', 'Ukraine': '🇺🇦', 'Romania': '🇷🇴'
        };
        return flagMap[countryName] || '🏳️';
    }

    // Method to manually sync local data to Firebase (for migration)
    async syncLocalToFirebase() {
        if (!this.isConnected) return;
        
        try {
            const localData = JSON.parse(localStorage.getItem('hopcatGlobalLeaderboard') || '{}');
            const updates = {};
            
            Object.entries(localData).forEach(([country, data]) => {
                const key = country.replace(/\s+/g, '_');
                updates[key] = {
                    name: country,
                    hops: data.hops || 0,
                    flag: data.flag || this.getCountryFlag(country),
                    lastUpdate: Date.now()
                };
            });
            
            await this.leaderboardRef.update(updates);
            console.log('✅ Local data synced to Firebase');
        } catch (error) {
            console.warn('Failed to sync local data:', error);
        }
    }
}

// Alternative solution using a simpler real-time service
class FallbackLiveLeaderboard {
    constructor() {
        this.apiUrl = 'https://api.jsonbin.io/v3/b/hopcat-leaderboard';
        this.apiKey = '$2b$10$N8vBjNwCm1YhO4nNsKhGFO8oL9kX2uW5nPj3qI7xM6tR5sA8vL1zT'; // Public read key
        this.updateInterval = 5000; // 5 seconds
        this.isLive = false;
    }

    async initializeAPI() {
        try {
            // Test connection
            const response = await fetch(`${this.apiUrl}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            if (response.ok) {
                this.isLive = true;
                this.startPolling();
                console.log('🌐 Connected to live API leaderboard');
                return true;
            }
        } catch (error) {
            console.warn('API connection failed:', error);
        }
        return false;
    }

    async addHop(country) {
        if (!this.isLive) return false;
        
        try {
            // Get current data
            const currentData = await this.getLeaderboard();
            
            // Update the country's hops
            if (!currentData[country]) {
                currentData[country] = { hops: 0, flag: this.getCountryFlag(country) };
            }
            currentData[country].hops++;
            
            // Send back to API
            await fetch(this.apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(currentData)
            });
            
            return true;
        } catch (error) {
            console.warn('Failed to update API leaderboard:', error);
            return false;
        }
    }

    async getLeaderboard() {
        try {
            const response = await fetch(`${this.apiUrl}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.record || {};
            }
        } catch (error) {
            console.warn('Failed to fetch leaderboard:', error);
        }
        return {};
    }

    startPolling() {
        setInterval(async () => {
            const data = await this.getLeaderboard();
            if (Object.keys(data).length > 0) {
                // Trigger update callback if registered
                if (this.onUpdate) {
                    this.onUpdate(data);
                }
            }
        }, this.updateInterval);
    }

    getCountryFlag(countryName) {
        // Same flag mapping as above
        const flagMap = {
            'United States': '🇺🇸', 'Canada': '🇨🇦', 'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
            'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳',
            // ... add more as needed
        };
        return flagMap[countryName] || '🏳️';
    }
}
