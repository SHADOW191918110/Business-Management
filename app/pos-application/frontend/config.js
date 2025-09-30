// API Configuration
const API_CONFIG = {
    // Auto-detect environment
    baseURL: (() => {
        // Tauri desktop app
        if (window.__TAURI__) {
            return 'http://localhost:8080/api/v1';
        }

        // Development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080/api/v1';
        }

        // Production
        return '/api/v1';
    })(),

    timeout: 30000,
    retries: 3,

    // Authentication
    tokenKey: 'pos_auth_token',

    // Offline storage
    cacheKey: 'pos_cache',

    // Hardware settings
    hardware: {
        printerEnabled: true,
        cashDrawerEnabled: true,
        barcodeScanner: true,
    }
};

window.API_CONFIG = API_CONFIG;