// Production Live Leaderboard using Real API
class ProductionLiveLeaderboard {
    constructor() {
        // Using a real service for demonstration - replace with your own API
        this.apiUrl = 'https://api.restdb.io/rest/hopcat-leaderboard';
        this.apiKey = '60f5e3b3e6a5f50011e6b123'; // Demo key - replace with your own
        this.wsUrl = 'wss://hopcat-live.herokuapp.com'; // WebSocket for real-time
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
        
        this.initializeConnection();
    }

    async initializeConnection() {
        try {
            // Try WebSocket first for real-time updates
            await this.connectWebSocket();
        } catch (error) {
            console.warn('WebSocket failed, trying HTTP polling:', error);
            this.initializeHTTPPolling();
        }
    }

    async connectWebSocket() {
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
                    const data = JSON.parse(event.data);
                    if (data.type === 'leaderboard_update' && this.onUpdate) {
                        this.onUpdate(data.countries);
                    }
                };
                
                this.ws.onclose = () => {
                    this.isConnected = false;
                    console.warn('WebSocket disconnected, attempting to reconnect...');
                    this.attemptReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.ws.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 5000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    attemptReconnect() {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
            
            setTimeout(() => {
                console.log(`Reconnection attempt ${this.retryAttempts}/${this.maxRetries}`);
                this.connectWebSocket().catch(() => {
                    if (this.retryAttempts >= this.maxRetries) {
                        console.warn('Max reconnection attempts reached, falling back to HTTP polling');
                        this.initializeHTTPPolling();
                    }
                });
            }, delay);
        }
    }

    async initializeHTTPPolling() {
        try {
            // Test API connection
            const response = await fetch(this.apiUrl, {
                headers: {
                    'x-apikey': this.apiKey,
                    'content-type': 'application/json'
                }
            });

            if (response.ok) {
                this.isConnected = true;
                this.showConnectionStatus('🟡 Live', 'HTTP polling active (5s updates)');
                this.startPolling();
                console.log('📡 Connected to HTTP API for live updates');
            } else {
                throw new Error('API connection failed');
            }
        } catch (error) {
            console.warn('All live services failed, using local storage:', error);
            this.showConnectionStatus('🔴 Offline', 'Local storage only');
            this.isConnected = false;
        }
    }

    startPolling() {
        this.pollInterval = setInterval(async () => {
            try {
                const data = await this.fetchLeaderboard();
                if (this.onUpdate && data) {
                    this.onUpdate(data);
                }
            } catch (error) {
                console.warn('Polling failed:', error);
                // Could implement exponential backoff here
            }
        }, 5000); // Poll every 5 seconds
    }

    async addHop(country) {
        if (!country || !this.isConnected) return false;

        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Send via WebSocket for instant update
                this.ws.send(JSON.stringify({
                    type: 'add_hop',
                    country: country,
                    timestamp: Date.now()
                }));
                return true;
            } else {
                // Fallback to HTTP API
                return await this.addHopHTTP(country);
            }
        } catch (error) {
            console.warn('Failed to add hop:', error);
            return false;
        }
    }

    async addHopHTTP(country) {
        try {
            // First, get current leaderboard
            const currentData = await this.fetchLeaderboard();
            
            // Update the country's hops
            if (!currentData[country]) {
                currentData[country] = { 
                    hops: 0, 
                    flag: this.getCountryFlag(country),
                    lastUpdate: Date.now()
                };
            }
            currentData[country].hops++;
            currentData[country].lastUpdate = Date.now();

            // Send update
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'x-apikey': this.apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    countries: currentData,
                    lastGlobalUpdate: Date.now()
                })
            });

            return response.ok;
        } catch (error) {
            console.warn('HTTP hop add failed:', error);
            return false;
        }
    }

    async fetchLeaderboard() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: {
                    'x-apikey': this.apiKey,
                    'content-type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Assuming the API returns the latest record
                const latest = data[0] || {};
                return latest.countries || {};
            }
        } catch (error) {
            console.warn('Failed to fetch leaderboard:', error);
        }
        return {};
    }

    setupRealtimeListener(callback) {
        this.onUpdate = callback;
        
        // Get initial data
        this.fetchLeaderboard().then(data => {
            if (Object.keys(data).length > 0) {
                callback(data);
            }
        });
    }

    showConnectionStatus(status, message) {
        const existingStatus = document.getElementById('connectionStatus');
        if (existingStatus) existingStatus.remove();

        const statusDiv = document.createElement('div');
        statusDiv.id = 'connectionStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
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

        // Auto-hide if connected
        if (this.isConnected && status.includes('🟢')) {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => statusDiv.remove(), 300);
                }
            }, 3000);
        }
    }

    getCountryFlag(countryName) {
        const flagMap = {
            'United States': '🇺🇸', 'Canada': '🇨🇦', 'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
            'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳',
            'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'Australia': '🇦🇺', 'Russia': '🇷🇺',
            'Netherlands': '🇳🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰',
            'Finland': '🇫🇮', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
            'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺'
        };
        return flagMap[countryName] || '🏳️';
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        this.isConnected = false;
    }
}

// Use the production version instead of the demo Firebase version
window.LiveLeaderboard = ProductionLiveLeaderboard;
