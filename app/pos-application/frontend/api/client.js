/**
 * POS Application API Client
 * Handles all communication with Rust backend
 */

class APIClient {
    constructor() {
        this.baseURL = this.getAPIBaseURL();
        this.token = localStorage.getItem('pos_auth_token');
        this.isOnline = navigator.onLine;

        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    getAPIBaseURL() {
        // Check if running in Tauri desktop app
        if (window.__TAURI__) {
            return 'http://localhost:8080/api/v1';
        }

        // Development vs Production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080/api/v1';
        }

        return '/api/v1'; // Production - served through reverse proxy
    }

    /**
     * Make HTTP request with error handling and offline fallback
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        const requestOptions = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options,
        };

        try {
            // If offline, try to serve from cache/IndexedDB
            if (!this.isOnline && options.method !== 'POST' && options.method !== 'PUT') {
                return await this.getFromCache(endpoint);
            }

            const response = await fetch(url, requestOptions);

            // Handle authentication errors
            if (response.status === 401) {
                this.handleAuthError();
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(
                    errorData.message || `HTTP ${response.status}`,
                    response.status,
                    errorData
                );
            }

            const data = await response.json();

            // Cache GET requests for offline use
            if (options.method === 'GET' || !options.method) {
                await this.cacheResponse(endpoint, data);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);

            // If online request fails, try cache
            if (this.isOnline && (options.method === 'GET' || !options.method)) {
                const cached = await this.getFromCache(endpoint);
                if (cached) {
                    this.showNotification('Using cached data (offline mode)', 'warning');
                    return cached;
                }
            }

            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(fullEndpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication methods
    setToken(token) {
        this.token = token;
        localStorage.setItem('pos_auth_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('pos_auth_token');
    }

    handleAuthError() {
        this.clearToken();
        // Redirect to login or show login modal
        window.dispatchEvent(new CustomEvent('auth-required'));
    }

    // Cache management for offline support
    async cacheResponse(endpoint, data) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['api_cache'], 'readwrite');
            const store = transaction.objectStore('api_cache');

            await store.put({
                endpoint: endpoint,
                data: data,
                timestamp: Date.now(),
                expires: Date.now() + (30 * 60 * 1000) // 30 minutes
            });
        } catch (error) {
            console.warn('Failed to cache response:', error);
        }
    }

    async getFromCache(endpoint) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['api_cache'], 'readonly');
            const store = transaction.objectStore('api_cache');
            const cached = await store.get(endpoint);

            if (cached && cached.expires > Date.now()) {
                return cached.data;
            }

            return null;
        } catch (error) {
            console.warn('Failed to get from cache:', error);
            return null;
        }
    }

    async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('pos_api_cache', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('api_cache')) {
                    db.createObjectStore('api_cache', { keyPath: 'endpoint' });
                }
            };
        });
    }

    showNotification(message, type = 'info') {
        // Use your existing notification system
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }

    // Sync offline data when coming back online
    async syncOfflineData() {
        try {
            // Implement sync logic for offline transactions
            console.log('Syncing offline data...');
            // This would sync any cached POST/PUT requests made while offline
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status = 500, details = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// Create global API client instance
window.apiClient = new APIClient();