/**
 * @fileoverview Wholesale POS System - Main Application Logic
 * Professional point-of-sale system with IndexedDB database, TypeScript-style structure,
 * and comprehensive business management features.
 * 
 * @version 2.0.0
 * @author Wholesale POS Team
 */

// ==================== TYPE DEFINITIONS ====================

/**
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {string} category - Product category
 * @property {number} price - Product price in rupees
 * @property {number} stock - Current stock quantity
 * @property {number} reorderLevel - Minimum stock level for reordering
 * @property {number} gstRate - GST rate percentage
 * @property {string} hsnCode - HSN code for GST
 * @property {string} supplier - Supplier name
 * @property {string} createdAt - Creation timestamp
 * @property {string} [updatedAt] - Last update timestamp
 */

/**
 * @typedef {Object} Customer
 * @property {string} id - Unique customer identifier
 * @property {string} name - Customer name
 * @property {string} email - Customer email address
 * @property {string} phone - Customer phone number
 * @property {string} address - Customer address
 * @property {string} gstNumber - Customer GST number
 * @property {number} loyaltyPoints - Loyalty points balance
 * @property {number} totalOrders - Total number of orders
 * @property {number} totalValue - Total purchase value
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} Supplier
 * @property {string} id - Unique supplier identifier
 * @property {string} name - Supplier name
 * @property {string} contact - Contact person name
 * @property {string} phone - Supplier phone number
 * @property {string} email - Supplier email address
 * @property {string} address - Supplier address
 * @property {string} gstNumber - Supplier GST number
 * @property {string[]} products - List of product categories supplied
 * @property {number} outstanding - Outstanding payment amount
 * @property {number} rating - Supplier rating (1-5)
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} Sale
 * @property {string} id - Unique sale identifier
 * @property {string} invoiceNumber - Invoice number
 * @property {string} customerId - Customer ID (optional for walk-in)
 * @property {string} employeeId - Employee ID who made the sale
 * @property {SaleItem[]} items - Array of sold items
 * @property {number} totalAmount - Total sale amount
 * @property {number} cgstAmount - CGST amount
 * @property {number} sgstAmount - SGST amount
 * @property {number} igstAmount - IGST amount
 * @property {string} paymentMethod - Payment method (cash/card/upi)
 * @property {string} saleDate - Sale date
 * @property {string} status - Sale status
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} SaleItem
 * @property {string} productId - Product identifier
 * @property {string} productName - Product name
 * @property {number} quantity - Quantity sold
 * @property {number} price - Unit price
 * @property {number} gstRate - GST rate percentage
 * @property {number} totalAmount - Total amount for this item
 */

/**
 * @typedef {Object} CartItem
 * @property {string} productId - Product identifier
 * @property {string} name - Product name
 * @property {number} price - Unit price
 * @property {number} gstRate - GST rate percentage
 * @property {number} quantity - Quantity in cart
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Category identifier
 * @property {string} name - Category name
 * @property {string} description - Category description
 */

// ==================== DATABASE MANAGER ====================

/**
 * IndexedDB Database Manager
 * Handles all database operations with proper error handling and transactions
 */
class DatabaseManager {
    constructor() {
        /** @type {string} */
        this.dbName = 'WholesalePOSDB';
        /** @type {number} */
        this.dbVersion = 2;
        /** @type {IDBDatabase|null} */
        this.db = null;
        /** @type {boolean} */
        this.isConnected = false;
    }

    /**
     * Initialize the database connection
     * @returns {Promise<boolean>}
     */
    async init() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('Database failed to open:', request.error);
                    this.updateConnectionStatus(false);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                    console.log('Database opened successfully');
                    resolve(true);
                };

                request.onupgradeneeded = (e) => {
                    this.db = e.target.result;
                    this.createObjectStores();
                };
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            this.updateConnectionStatus(false);
            return false;
        }
    }

    /**
     * Create object stores for database schema
     */
    createObjectStores() {
        const stores = [
            { name: 'products', keyPath: 'id' },
            { name: 'customers', keyPath: 'id' },
            { name: 'suppliers', keyPath: 'id' },
            { name: 'sales', keyPath: 'id' },
            { name: 'categories', keyPath: 'id' },
            { name: 'employees', keyPath: 'id' },
            { name: 'settings', keyPath: 'key' }
        ];

        stores.forEach(store => {
            if (!this.db.objectStoreNames.contains(store.name)) {
                this.db.createObjectStore(store.name, { keyPath: store.keyPath });
            }
        });
    }

    /**
     * Update connection status indicator
     * @param {boolean} connected 
     */
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (indicator && text) {
            indicator.className = `status-indicator ${connected ? 'connected' : 'error'}`;
            text.textContent = connected ? 'Connected' : 'Disconnected';
        }
    }

    /**
     * Generic method to add data to a store
     * @template T
     * @param {string} storeName 
     * @param {T} data 
     * @returns {Promise<T>}
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.add(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to update data in a store
     * @template T
     * @param {string} storeName 
     * @param {T} data 
     * @returns {Promise<T>}
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to get data by ID
     * @template T
     * @param {string} storeName 
     * @param {string} id 
     * @returns {Promise<T|null>}
     */
    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to get all data from a store
     * @template T
     * @param {string} storeName 
     * @returns {Promise<T[]>}
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic method to delete data by ID
     * @param {string} storeName 
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get database size information
     * @returns {Promise<Object>}
     */
    async getDatabaseInfo() {
        try {
            const stores = ['products', 'customers', 'suppliers', 'sales', 'categories'];
            const info = {};
            let totalRecords = 0;
            
            for (const storeName of stores) {
                const data = await this.getAll(storeName);
                info[storeName] = data.length;
                totalRecords += data.length;
            }
            
            info.totalRecords = totalRecords;
            return info;
        } catch (error) {
            console.error('Error getting database info:', error);
            return { totalRecords: 0 };
        }
    }

    /**
     * Clear all data from database
     * @returns {Promise<boolean>}
     */
    async clearAllData() {
        try {
            const stores = ['products', 'customers', 'suppliers', 'sales', 'categories'];
            
            for (const storeName of stores) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing database:', error);
            return false;
        }
    }
}

// ==================== APPLICATION MANAGER ====================

/**
 * Main Application Class
 * Manages the entire wholesale POS system
 */
class WholesalePOSApp {
    constructor() {
        /** @type {DatabaseManager} */
        this.db = new DatabaseManager();
        
        /** @type {CartItem[]} */
        this.cart = [];
        
        /** @type {string} */
        this.selectedPaymentMethod = 'cash';
        
        /** @type {string} */
        this.currentView = 'dashboard';
        
        /** @type {Product|null} */
        this.editingProduct = null;
        
        /** @type {Customer|null} */
        this.editingCustomer = null;
        
        /** @type {Chart|null} */
        this.salesChart = null;
        
        /** @type {boolean} */
        this.autoSave = true;
        
        /** @type {Object} */
        this.filters = {
            products: { search: '', category: '', status: '' },
            customers: { search: '', sort: 'name' },
            suppliers: { search: '', sort: 'name' },
            sales: { dateFrom: '', dateTo: '', status: '' }
        };

        this.sampleData = {
            customers: [
                {
                    id: "CUST001",
                    name: "Raj Traders Pvt Ltd",
                    email: "raj@traders.com",
                    phone: "+91 98765 43210",
                    address: "123 Business District, Mumbai, Maharashtra 400001",
                    gstNumber: "27AABCU9603R1ZX",
                    loyaltyPoints: 2500,
                    totalOrders: 47,
                    totalValue: 1245678,
                    createdAt: "2025-01-15T10:30:00Z"
                },
                {
                    id: "CUST002",
                    name: "Modern Grocery Store",
                    email: "info@moderngrocery.com",
                    phone: "+91 87654 32109",
                    address: "456 Market Street, Delhi, Delhi 110001",
                    gstNumber: "07GZNPK7525M1ZF",
                    loyaltyPoints: 1800,
                    totalOrders: 32,
                    totalValue: 867543,
                    createdAt: "2025-02-20T14:15:00Z"
                },
                {
                    id: "CUST003",
                    name: "Super Mart Chain",
                    email: "procurement@supermart.in",
                    phone: "+91 76543 21098",
                    address: "789 Commercial Complex, Bangalore, Karnataka 560001",
                    gstNumber: "29ABCDE1234F1Z5",
                    loyaltyPoints: 3200,
                    totalOrders: 65,
                    totalValue: 2134567,
                    createdAt: "2024-11-10T09:45:00Z"
                }
            ],
            products: [
                {
                    id: "RICE001",
                    name: "Premium Basmati Rice 25kg",
                    description: "High-quality aged basmati rice with long grains and aromatic fragrance",
                    category: "Grains & Cereals",
                    price: 2500,
                    stock: 150,
                    reorderLevel: 50,
                    gstRate: 5,
                    hsnCode: "1006",
                    supplier: "ABC Food Distributors",
                    createdAt: "2025-01-01T00:00:00Z"
                },
                {
                    id: "FLR002",
                    name: "Whole Wheat Flour 10kg",
                    description: "Fresh ground whole wheat flour, rich in fiber and nutrients",
                    category: "Grains & Cereals", 
                    price: 850,
                    stock: 15,
                    reorderLevel: 50,
                    gstRate: 5,
                    hsnCode: "1101",
                    supplier: "ABC Food Distributors",
                    createdAt: "2025-01-01T00:00:00Z"
                },
                {
                    id: "OIL003",
                    name: "Refined Cooking Oil 5L",
                    description: "Pure refined sunflower oil for healthy cooking",
                    category: "Oils & Fats",
                    price: 450,
                    stock: 80,
                    reorderLevel: 30,
                    gstRate: 18,
                    hsnCode: "1512",
                    supplier: "Quality Oils Ltd",
                    createdAt: "2025-01-01T00:00:00Z"
                },
                {
                    id: "PLS004",
                    name: "Mixed Dal 1kg",
                    description: "Premium quality mixed lentils for daily nutrition",
                    category: "Pulses & Legumes",
                    price: 120,
                    stock: 200,
                    reorderLevel: 75,
                    gstRate: 5,
                    hsnCode: "0713",
                    supplier: "Pulse Traders Co",
                    createdAt: "2025-01-01T00:00:00Z"
                },
                {
                    id: "SPC005",
                    name: "Turmeric Powder 500g",
                    description: "Pure ground turmeric powder with natural color",
                    category: "Spices & Condiments",
                    price: 180,
                    stock: 45,
                    reorderLevel: 25,
                    gstRate: 18,
                    hsnCode: "0910",
                    supplier: "Spice World",
                    createdAt: "2025-01-01T00:00:00Z"
                }
            ],
            suppliers: [
                {
                    id: "SUPP001",
                    name: "ABC Food Distributors",
                    contact: "Rahul Sharma",
                    phone: "+91 99887 76655",
                    email: "rahul@abcfood.com",
                    address: "Plot 15, Food Park, Gurgaon, Haryana 122001",
                    gstNumber: "06ABCDE1234F1Z9",
                    products: ["Rice", "Wheat", "Pulses", "Cereals"],
                    outstanding: 85000,
                    rating: 4.8,
                    createdAt: "2024-12-01T00:00:00Z"
                },
                {
                    id: "SUPP002",
                    name: "Quality Oils Ltd",
                    contact: "Priya Patel",
                    phone: "+91 88776 65544",
                    email: "priya@qualityoils.com",
                    address: "Industrial Area Phase 2, Chandigarh, Punjab 160001",
                    gstNumber: "03GHIJK5678L1M2",
                    products: ["Cooking Oil", "Ghee", "Margarine"],
                    outstanding: 42500,
                    rating: 4.5,
                    createdAt: "2024-12-01T00:00:00Z"
                },
                {
                    id: "SUPP003", 
                    name: "Pulse Traders Co",
                    contact: "Amit Kumar",
                    phone: "+91 77665 54433",
                    email: "amit@pulsetraders.in",
                    address: "Mandi Complex, Jaipur, Rajasthan 302001",
                    gstNumber: "08NOPQR9012S3T4",
                    products: ["Dal", "Chickpeas", "Lentils", "Kidney Beans"],
                    outstanding: 28900,
                    rating: 4.7,
                    createdAt: "2024-12-01T00:00:00Z"
                },
                {
                    id: "SUPP004",
                    name: "Spice World",
                    contact: "Kavita Singh",
                    phone: "+91 66554 43322",
                    email: "kavita@spiceworld.co.in",
                    address: "Spice Market, Kochi, Kerala 682001",
                    gstNumber: "32UVWXY6789Z1A2",
                    products: ["Turmeric", "Red Chili", "Coriander", "Cumin"],
                    outstanding: 15600,
                    rating: 4.9,
                    createdAt: "2024-12-01T00:00:00Z"
                }
            ],
            categories: [
                { id: "CAT001", name: "Grains & Cereals", description: "Rice, wheat, and other cereal products" },
                { id: "CAT002", name: "Oils & Fats", description: "Cooking oils, ghee, and other fat products" },
                { id: "CAT003", name: "Pulses & Legumes", description: "Dal, chickpeas, and other pulse products" },
                { id: "CAT004", name: "Spices & Condiments", description: "All types of spices and flavor enhancers" },
                { id: "CAT005", name: "Beverages", description: "Tea, coffee, and other drink products" }
            ]
        };
    }

    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize database
            await this.db.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Show success toast
            this.showToast('System initialized successfully!', 'success');
            
            // Initial render
            await this.renderCurrentView();
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.hideLoadingScreen();
            this.showToast('Failed to initialize system. Please refresh and try again.', 'error');
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // POS system
        this.setupPOS();
        
        // Modals
        this.setupModals();
        
        // Inventory management
        this.setupInventory();
        
        // Customer management
        this.setupCustomerManagement();
        
        // Settings
        this.setupSettings();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Data management
        this.setupDataManagement();
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                const title = item.dataset.title;
                this.switchView(view, title);
                
                // Update active menu item
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    /**
     * Switch between views with proper error handling
     * @param {string} viewName 
     * @param {string} title 
     */
    async switchView(viewName, title) {
        try {
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            
            // Show selected view
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.classList.add('active');
            }
            
            // Update page title and breadcrumb
            this.updatePageTitle(title || viewName);
            
            this.currentView = viewName;
            
            // Render view-specific content
            await this.renderCurrentView();
            
        } catch (error) {
            console.error(`Error switching to view ${viewName}:`, error);
            this.showToast(`Failed to load ${viewName} view`, 'error');
        }
    }

    /**
     * Update page title and breadcrumb
     * @param {string} title 
     */
    updatePageTitle(title) {
        const pageTitle = document.getElementById('page-title');
        const breadcrumb = document.getElementById('breadcrumb');
        
        if (pageTitle) {
            pageTitle.textContent = title;
        }
        
        if (breadcrumb) {
            breadcrumb.innerHTML = `<span class="breadcrumb-item active">${title}</span>`;
        }
    }

    /**
     * Render current view content
     */
    async renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                await this.renderDashboard();
                break;
            case 'pos':
                await this.renderPOS();
                break;
            case 'inventory':
                await this.renderInventory();
                break;
            case 'customers':
                await this.renderCustomers();
                break;
            case 'suppliers':
                await this.renderSuppliers();
                break;
            case 'sales':
                await this.renderSales();
                break;
            case 'reports':
                await this.renderReports();
                break;
            case 'settings':
                await this.renderSettings();
                break;
        }
    }

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setTheme(savedTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        
        this.setTheme(newScheme);
    }

    /**
     * Set theme
     * @param {string} theme 
     */
    setTheme(theme) {
        const html = document.documentElement;
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (theme === 'auto') {
            html.removeAttribute('data-color-scheme');
        } else {
            html.setAttribute('data-color-scheme', theme);
        }
        
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        localStorage.setItem('theme', theme);
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Search focus shortcut (/)
            if (e.key === '/' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                const searchInput = document.getElementById('product-search');
                if (searchInput && this.currentView === 'pos') {
                    searchInput.focus();
                }
            }
            
            // Quick navigation shortcuts (Ctrl + number)
            if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
                e.preventDefault();
                const views = ['dashboard', 'pos', 'inventory', 'customers', 'suppliers', 'sales', 'reports', 'settings'];
                const viewIndex = parseInt(e.key) - 1;
                if (views[viewIndex]) {
                    this.switchView(views[viewIndex]);
                }
            }
        });
    }

    /**
     * Load initial data and ensure sample data exists
     */
    async loadInitialData() {
        try {
            // Check if we have any data
            const products = await this.db.getAll('products');
            const customers = await this.db.getAll('customers');
            
            // If no data exists, load sample data
            if (products.length === 0 && customers.length === 0) {
                await this.loadSampleData();
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Load sample data into database
     */
    async loadSampleData() {
        try {
            // Load categories first
            for (const category of this.sampleData.categories) {
                await this.db.add('categories', category);
            }
            
            // Load suppliers
            for (const supplier of this.sampleData.suppliers) {
                await this.db.add('suppliers', supplier);
            }
            
            // Load products
            for (const product of this.sampleData.products) {
                await this.db.add('products', product);
            }
            
            // Load customers
            for (const customer of this.sampleData.customers) {
                await this.db.add('customers', customer);
            }
            
            console.log('Sample data loaded successfully');
            
        } catch (error) {
            console.error('Error loading sample data:', error);
        }
    }

    // ==================== DASHBOARD ====================

    /**
     * Render dashboard with real-time data
     */
    async renderDashboard() {
        try {
            const products = await this.db.getAll('products');
            const customers = await this.db.getAll('customers');
            const sales = await this.db.getAll('sales');
            
            // Update KPIs
            this.updateDashboardKPIs(products, customers, sales);
            
            // Render sales chart
            await this.renderSalesChart(sales);
            
            // Render recent sales
            await this.renderRecentSales(sales);
            
        } catch (error) {
            console.error('Error rendering dashboard:', error);
        }
    }

    /**
     * Update dashboard KPI cards
     * @param {Product[]} products 
     * @param {Customer[]} customers 
     * @param {Sale[]} sales 
     */
    updateDashboardKPIs(products, customers, sales) {
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const lowStockItems = products.filter(p => p.stock <= p.reorderLevel).length;
        
        // Update revenue
        const revenueEl = document.getElementById('total-revenue');
        if (revenueEl) {
            revenueEl.textContent = this.formatCurrency(totalRevenue);
        }
        
        // Update products count
        const productsEl = document.getElementById('total-products');
        if (productsEl) {
            productsEl.textContent = products.length.toString();
        }
        
        // Update customers count
        const customersEl = document.getElementById('total-customers');
        if (customersEl) {
            customersEl.textContent = customers.length.toString();
        }
        
        // Update low stock count
        const lowStockEl = document.getElementById('low-stock-count');
        if (lowStockEl) {
            lowStockEl.textContent = lowStockItems.toString();
        }
        
        // Update change indicators (mock data for now)
        const changes = [
            { id: 'revenue-change', text: '+12.5% from last month', type: 'positive' },
            { id: 'products-change', text: `${lowStockItems} need reordering`, type: lowStockItems > 0 ? 'negative' : 'positive' },
            { id: 'customers-change', text: '+3 new this week', type: 'positive' },
            { id: 'stock-change', text: lowStockItems > 0 ? 'Action needed' : 'All good', type: lowStockItems > 0 ? 'negative' : 'positive' }
        ];
        
        changes.forEach(change => {
            const el = document.getElementById(change.id);
            if (el) {
                el.textContent = change.text;
                el.className = `kpi-change ${change.type}`;
            }
        });
    }

    /**
     * Render sales performance chart
     * @param {Sale[]} sales 
     */
    async renderSalesChart(sales) {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        // Generate last 7 days data
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date);
        }
        
        const chartData = last7Days.map(date => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            return sales
                .filter(sale => {
                    const saleDate = new Date(sale.saleDate);
                    return saleDate >= dayStart && saleDate <= dayEnd;
                })
                .reduce((sum, sale) => sum + sale.totalAmount, 0);
        });
        
        const labels = last7Days.map(date => 
            date.toLocaleDateString('en-US', { weekday: 'short' })
        );
        
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Sales',
                    data: chartData,
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderColor: '#1FB8CD',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1FB8CD',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Render recent sales list
     * @param {Sale[]} sales 
     */
    async renderRecentSales(sales) {
        const container = document.getElementById('recent-sales');
        if (!container) return;
        
        const recentSales = sales
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        if (recentSales.length === 0) {
            container.innerHTML = '<div class="loading">No recent sales</div>';
            return;
        }
        
        const customers = await this.db.getAll('customers');
        
        container.innerHTML = recentSales.map(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const statusClass = sale.status.toLowerCase() === 'completed' ? 'success' : 
                              sale.status.toLowerCase() === 'pending' ? 'warning' : 'error';
            
            return `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <div class="recent-item-id">${sale.invoiceNumber}</div>
                        <div class="recent-item-detail">${customer ? customer.name : 'Walk-in Customer'}</div>
                    </div>
                    <div class="recent-item-meta">
                        <div class="recent-item-amount">${this.formatCurrency(sale.totalAmount)}</div>
                        <span class="status status--${statusClass}">${sale.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== POS SYSTEM ====================

    /**
     * Setup POS system event listeners
     */
    setupPOS() {
        // Product search
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
            productSearch.addEventListener('input', this.debounce((e) => {
                this.filters.products.search = e.target.value;
                this.renderPOSProducts();
            }, 300));
        }
        
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.products.category = e.target.value;
                this.renderPOSProducts();
            });
        }
        
        // Payment method selection
        const paymentBtns = document.querySelectorAll('.payment-btn');
        paymentBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                paymentBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPaymentMethod = btn.dataset.method;
                this.updateCheckoutButton();
            });
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.processCheckout());
        }
        
        // Quick add customer
        const quickAddBtn = document.getElementById('add-customer-quick');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.showCustomerModal());
        }
    }

    /**
     * Render POS system
     */
    async renderPOS() {
        await this.renderPOSProducts();
        await this.renderCustomerSelect();
        this.renderCart();
    }

    /**
     * Render POS products grid
     */
    async renderPOSProducts() {
        try {
            const productGrid = document.getElementById('product-grid');
            if (!productGrid) return;
            
            const products = await this.db.getAll('products');
            const categories = await this.db.getAll('categories');
            
            // Update category filter
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter && categoryFilter.options.length <= 1) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                    categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
            
            // Filter products
            let filteredProducts = products;
            
            if (this.filters.products.search) {
                const searchTerm = this.filters.products.search.toLowerCase();
                filteredProducts = filteredProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm) ||
                    product.id.toLowerCase().includes(searchTerm)
                );
            }
            
            if (this.filters.products.category) {
                filteredProducts = filteredProducts.filter(product =>
                    product.category === this.filters.products.category
                );
            }
            
            if (filteredProducts.length === 0) {
                productGrid.innerHTML = '<div class="loading">No products found</div>';
                return;
            }
            
            productGrid.innerHTML = filteredProducts.map(product => {
                const stockClass = product.stock === 0 ? 'out' : product.stock <= product.reorderLevel ? 'low' : '';
                const cardClass = product.stock === 0 ? 'product-card out-of-stock' : 'product-card';
                
                return `
                    <div class="${cardClass}" onclick="app.addToCart('${product.id}')" ${product.stock === 0 ? 'title="Out of Stock"' : ''}>
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                        <div class="product-price">${this.formatCurrency(product.price)}</div>
                        <div class="product-stock ${stockClass}">
                            Stock: ${product.stock} ${stockClass ? `(${stockClass === 'out' ? 'Out' : 'Low'})` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering POS products:', error);
            const productGrid = document.getElementById('product-grid');
            if (productGrid) {
                productGrid.innerHTML = '<div class="loading">Error loading products</div>';
            }
        }
    }

    /**
     * Render customer selection dropdown
     */
    async renderCustomerSelect() {
        try {
            const customerSelect = document.getElementById('customer-select');
            if (!customerSelect) return;
            
            const customers = await this.db.getAll('customers');
            
            customerSelect.innerHTML = '<option value="">Walk-in Customer</option>' +
                customers
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(customer => 
                        `<option value="${customer.id}">${customer.name}</option>`
                    ).join('');
            
        } catch (error) {
            console.error('Error rendering customer select:', error);
        }
    }

    /**
     * Add product to cart
     * @param {string} productId 
     */
    async addToCart(productId) {
        try {
            const product = await this.db.getById('products', productId);
            if (!product) {
                this.showToast('Product not found', 'error');
                return;
            }
            
            if (product.stock === 0) {
                this.showToast('Product is out of stock', 'error');
                return;
            }
            
            const existingItem = this.cart.find(item => item.productId === productId);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity += 1;
                } else {
                    this.showToast('Insufficient stock available', 'warning');
                    return;
                }
            } else {
                this.cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    gstRate: product.gstRate,
                    quantity: 1
                });
            }
            
            this.renderCart();
            this.showToast(`${product.name} added to cart`, 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showToast('Failed to add product to cart', 'error');
        }
    }

    /**
     * Update cart item quantity
     * @param {string} productId 
     * @param {number} quantity 
     */
    async updateCartQuantity(productId, quantity) {
        try {
            const product = await this.db.getById('products', productId);
            const cartItem = this.cart.find(item => item.productId === productId);
            
            if (!cartItem) return;
            
            if (quantity <= 0) {
                this.cart = this.cart.filter(item => item.productId !== productId);
            } else if (quantity <= product.stock) {
                cartItem.quantity = quantity;
            } else {
                this.showToast('Insufficient stock available', 'warning');
                return;
            }
            
            this.renderCart();
            
        } catch (error) {
            console.error('Error updating cart quantity:', error);
        }
    }

    /**
     * Render cart items and totals
     */
    renderCart() {
        const cartItems = document.getElementById('cart-items');
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-icon">🛒</div>
                    <p>Cart is empty</p>
                    <p class="empty-subtitle">Add products to get started</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-details">${this.formatCurrency(item.price)} × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-price">${this.formatCurrency(item.price * item.quantity)}</div>
                </div>
            `).join('');
        }
        
        this.updateCartTotals();
    }

    /**
     * Update cart totals and taxes
     */
    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgst = this.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
        const sgst = cgst; // Same as CGST for intrastate
        const total = subtotal + cgst + sgst;
        
        // Update display elements
        const elements = {
            'subtotal': subtotal,
            'cgst': cgst,
            'sgst': sgst,
            'total': total
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = this.formatCurrency(value);
            }
        });
        
        this.updateCheckoutButton();
    }

    /**
     * Update checkout button state
     */
    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    }

    /**
     * Process checkout and create sale
     */
    async processCheckout() {
        if (this.cart.length === 0) return;
        
        try {
            const customerSelect = document.getElementById('customer-select');
            const customerId = customerSelect ? customerSelect.value : '';
            
            const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const cgst = this.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
            const sgst = cgst;
            const total = subtotal + cgst + sgst;
            
            // Create sale record
            const sale = {
                id: this.generateId('SALE'),
                invoiceNumber: this.generateInvoiceNumber(),
                customerId: customerId || null,
                employeeId: 'EMP001', // Default employee
                items: this.cart.map(item => ({
                    productId: item.productId,
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    gstRate: item.gstRate,
                    totalAmount: item.price * item.quantity
                })),
                totalAmount: total,
                cgstAmount: cgst,
                sgstAmount: sgst,
                igstAmount: 0, // For interstate
                paymentMethod: this.selectedPaymentMethod,
                saleDate: new Date().toISOString(),
                status: 'completed',
                createdAt: new Date().toISOString()
            };
            
            // Save sale to database
            await this.db.add('sales', sale);
            
            // Update product stock
            for (const item of this.cart) {
                const product = await this.db.getById('products', item.productId);
                if (product) {
                    product.stock -= item.quantity;
                    await this.db.update('products', product);
                }
            }
            
            // Update customer if selected
            if (customerId) {
                const customer = await this.db.getById('customers', customerId);
                if (customer) {
                    customer.totalOrders += 1;
                    customer.totalValue += total;
                    customer.loyaltyPoints += Math.floor(total / 100); // 1 point per 100 rupees
                    await this.db.update('customers', customer);
                }
            }
            
            // Show receipt
            await this.showReceipt(sale);
            
            // Clear cart
            this.clearCart();
            
            // Refresh products (to update stock display)
            await this.renderPOSProducts();
            
            this.showToast('Sale completed successfully!', 'success');
            
        } catch (error) {
            console.error('Error processing checkout:', error);
            this.showToast('Failed to complete sale. Please try again.', 'error');
        }
    }

    /**
     * Clear shopping cart
     */
    clearCart() {
        this.cart = [];
        this.renderCart();
    }

    /**
     * Show receipt modal
     * @param {Sale} sale 
     */
    async showReceipt(sale) {
        try {
            const modal = document.getElementById('receipt-modal');
            const content = document.getElementById('receipt-content');
            
            if (!modal || !content) return;
            
            const customer = sale.customerId ? await this.db.getById('customers', sale.customerId) : null;
            const currentDate = new Date();
            
            content.innerHTML = `
                <div class="receipt-header">
                    <div class="receipt-company">WHOLESALE POS SYSTEM</div>
                    <div>GST No: 06COMPANY123F1Z8</div>
                    <div>Ph: +91-9876543210</div>
                </div>
                
                <div class="receipt-info">
                    <div class="receipt-info-row">
                        <span>Invoice:</span>
                        <span>${sale.invoiceNumber}</span>
                    </div>
                    <div class="receipt-info-row">
                        <span>Date:</span>
                        <span>${currentDate.toLocaleString()}</span>
                    </div>
                    <div class="receipt-info-row">
                        <span>Customer:</span>
                        <span>${customer ? customer.name : 'Walk-in Customer'}</span>
                    </div>
                    <div class="receipt-info-row">
                        <span>Payment:</span>
                        <span>${sale.paymentMethod.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="receipt-items">
                    <div class="receipt-items-header">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Item</span>
                            <span>Qty × Rate = Total</span>
                        </div>
                    </div>
                    ${sale.items.map(item => `
                        <div class="receipt-item">
                            <div style="flex: 1;">${item.productName}</div>
                            <div>${item.quantity} × ${this.formatCurrency(item.price)} = ${this.formatCurrency(item.totalAmount)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="receipt-totals">
                    <div class="receipt-total-row">
                        <span>Subtotal:</span>
                        <span>${this.formatCurrency(sale.totalAmount - sale.cgstAmount - sale.sgstAmount)}</span>
                    </div>
                    <div class="receipt-total-row">
                        <span>CGST:</span>
                        <span>${this.formatCurrency(sale.cgstAmount)}</span>
                    </div>
                    <div class="receipt-total-row">
                        <span>SGST:</span>
                        <span>${this.formatCurrency(sale.sgstAmount)}</span>
                    </div>
                    <div class="receipt-total-row" style="font-weight: bold; border-top: 1px solid; padding-top: 8px;">
                        <span>Total:</span>
                        <span>${this.formatCurrency(sale.totalAmount)}</span>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p>Goods once sold cannot be returned</p>
                </div>
            `;
            
            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error showing receipt:', error);
        }
    }

    // ==================== INVENTORY MANAGEMENT ====================

    /**
     * Setup inventory management
     */
    setupInventory() {
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showProductModal());
        }
        
        // Search and filters
        const inventorySearch = document.getElementById('inventory-search');
        if (inventorySearch) {
            inventorySearch.addEventListener('input', this.debounce((e) => {
                this.filters.products.search = e.target.value;
                this.renderInventory();
            }, 300));
        }
        
        const categoryFilter = document.getElementById('inventory-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.products.category = e.target.value;
                this.renderInventory();
            });
        }
        
        const statusFilter = document.getElementById('inventory-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.products.status = e.target.value;
                this.renderInventory();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-inventory-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportInventory());
        }
    }

    /**
     * Render inventory table
     */
    async renderInventory() {
        try {
            const tbody = document.getElementById('inventory-tbody');
            if (!tbody) return;
            
            const products = await this.db.getAll('products');
            const categories = await this.db.getAll('categories');
            
            // Update category filter if needed
            const categoryFilter = document.getElementById('inventory-category-filter');
            if (categoryFilter && categoryFilter.options.length <= 1) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                    categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
            
            // Filter products
            let filteredProducts = this.filterProducts(products);
            
            // Update stats
            this.updateInventoryStats(products, filteredProducts);
            
            if (filteredProducts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="loading">No products found</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredProducts.map(product => {
                const stockStatus = this.getStockStatus(product);
                return `
                    <tr>
                        <td><input type="checkbox" class="product-checkbox" value="${product.id}"></td>
                        <td><code>${product.id}</code></td>
                        <td>${product.name}</td>
                        <td><span class="status status--info">${product.category}</span></td>
                        <td><strong>${product.stock}</strong></td>
                        <td>${product.reorderLevel}</td>
                        <td>
                            <div class="stock-status">
                                <span class="stock-indicator ${stockStatus.class}"></span>
                                ${stockStatus.text}
                            </div>
                        </td>
                        <td><strong>${this.formatCurrency(product.price)}</strong></td>
                        <td><span class="status status--secondary">${product.gstRate}%</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn--sm btn--secondary" onclick="app.editProduct('${product.id}')" title="Edit Product">✏️</button>
                                <button class="btn btn--sm btn--outline" onclick="app.deleteProduct('${product.id}')" title="Delete Product">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering inventory:', error);
            const tbody = document.getElementById('inventory-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" class="loading">Error loading inventory</td></tr>';
            }
        }
    }

    /**
     * Filter products based on current filters
     * @param {Product[]} products 
     * @returns {Product[]}
     */
    filterProducts(products) {
        let filtered = products;
        
        if (this.filters.products.search) {
            const searchTerm = this.filters.products.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.id.toLowerCase().includes(searchTerm) ||
                product.supplier.toLowerCase().includes(searchTerm)
            );
        }
        
        if (this.filters.products.category) {
            filtered = filtered.filter(product => 
                product.category === this.filters.products.category
            );
        }
        
        if (this.filters.products.status) {
            filtered = filtered.filter(product => {
                const status = this.getStockStatus(product);
                return status.class === this.filters.products.status ||
                       (this.filters.products.status === 'normal' && status.class === 'high');
            });
        }
        
        return filtered;
    }

    /**
     * Update inventory statistics
     * @param {Product[]} allProducts 
     * @param {Product[]} filteredProducts 
     */
    updateInventoryStats(allProducts, filteredProducts) {
        const totalProducts = allProducts.length;
        const lowStock = allProducts.filter(p => p.stock <= p.reorderLevel && p.stock > 0).length;
        const outOfStock = allProducts.filter(p => p.stock === 0).length;
        const totalValue = allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        
        const stats = [
            { id: 'inv-total-products', value: totalProducts.toString() },
            { id: 'inv-low-stock', value: lowStock.toString() },
            { id: 'inv-out-stock', value: outOfStock.toString() },
            { id: 'inv-total-value', value: this.formatCurrency(totalValue) }
        ];
        
        stats.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (el) {
                el.textContent = stat.value;
            }
        });
    }

    /**
     * Get product stock status
     * @param {Product} product 
     * @returns {{class: string, text: string}}
     */
    getStockStatus(product) {
        if (product.stock === 0) {
            return { class: 'low', text: 'Out of Stock' };
        } else if (product.stock <= product.reorderLevel) {
            return { class: 'low', text: 'Low Stock' };
        } else if (product.stock <= product.reorderLevel * 2) {
            return { class: 'medium', text: 'Medium Stock' };
        } else {
            return { class: 'high', text: 'In Stock' };
        }
    }

    /**
     * Edit product
     * @param {string} productId 
     */
    async editProduct(productId) {
        try {
            const product = await this.db.getById('products', productId);
            if (product) {
                this.editingProduct = product;
                this.showProductModal(product);
            }
        } catch (error) {
            console.error('Error editing product:', error);
            this.showToast('Failed to load product for editing', 'error');
        }
    }

    /**
     * Delete product with confirmation
     * @param {string} productId 
     */
    async deleteProduct(productId) {
        const confirmed = await this.showConfirmDialog(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.'
        );
        
        if (confirmed) {
            try {
                await this.db.delete('products', productId);
                await this.renderInventory();
                this.showToast('Product deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showToast('Failed to delete product', 'error');
            }
        }
    }

    /**
     * Export inventory to CSV
     */
    async exportInventory() {
        try {
            const products = await this.db.getAll('products');
            const csvData = this.convertToCSV(products, [
                'id', 'name', 'category', 'price', 'stock', 'reorderLevel', 'gstRate', 'supplier'
            ]);
            
            this.downloadCSV(csvData, 'inventory.csv');
            this.showToast('Inventory exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting inventory:', error);
            this.showToast('Failed to export inventory', 'error');
        }
    }

    // ==================== CUSTOMER MANAGEMENT ====================

    /**
     * Setup customer management
     */
    setupCustomerManagement() {
        const addCustomerBtn = document.getElementById('add-customer-btn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => this.showCustomerModal());
        }
        
        // Search and sort
        const customersSearch = document.getElementById('customers-search');
        if (customersSearch) {
            customersSearch.addEventListener('input', this.debounce((e) => {
                this.filters.customers.search = e.target.value;
                this.renderCustomers();
            }, 300));
        }
        
        const customersSort = document.getElementById('customers-sort');
        if (customersSort) {
            customersSort.addEventListener('change', (e) => {
                this.filters.customers.sort = e.target.value;
                this.renderCustomers();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-customers-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCustomers());
        }
    }

    /**
     * Render customers grid
     */
    async renderCustomers() {
        try {
            const customersGrid = document.getElementById('customers-grid');
            if (!customersGrid) return;
            
            let customers = await this.db.getAll('customers');
            
            // Apply search filter
            if (this.filters.customers.search) {
                const searchTerm = this.filters.customers.search.toLowerCase();
                customers = customers.filter(customer =>
                    customer.name.toLowerCase().includes(searchTerm) ||
                    customer.email.toLowerCase().includes(searchTerm) ||
                    customer.phone.includes(searchTerm)
                );
            }
            
            // Apply sorting
            customers.sort((a, b) => {
                switch (this.filters.customers.sort) {
                    case 'totalValue':
                        return b.totalValue - a.totalValue;
                    case 'totalOrders':
                        return b.totalOrders - a.totalOrders;
                    case 'createdAt':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    default:
                        return a.name.localeCompare(b.name);
                }
            });
            
            if (customers.length === 0) {
                customersGrid.innerHTML = '<div class="loading">No customers found</div>';
                return;
            }
            
            customersGrid.innerHTML = customers.map(customer => `
                <div class="customer-card fade-in">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <div class="customer-details">
                            <p>📧 ${customer.email || 'No email'}</p>
                            <p>📞 ${customer.phone}</p>
                            ${customer.gstNumber ? `<p>🏢 ${customer.gstNumber}</p>` : ''}
                            <p>🎯 ${customer.loyaltyPoints} loyalty points</p>
                        </div>
                    </div>
                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-value">${customer.totalOrders}</div>
                            <div class="stat-label">Orders</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.formatCurrency(customer.totalValue)}</div>
                            <div class="stat-label">Total Value</div>
                        </div>
                        <div class="stat-item">
                            <button class="btn btn--sm btn--secondary" onclick="app.editCustomer('${customer.id}')">Edit</button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error rendering customers:', error);
            const customersGrid = document.getElementById('customers-grid');
            if (customersGrid) {
                customersGrid.innerHTML = '<div class="loading">Error loading customers</div>';
            }
        }
    }

    /**
     * Edit customer
     * @param {string} customerId 
     */
    async editCustomer(customerId) {
        try {
            const customer = await this.db.getById('customers', customerId);
            if (customer) {
                this.editingCustomer = customer;
                this.showCustomerModal(customer);
            }
        } catch (error) {
            console.error('Error editing customer:', error);
            this.showToast('Failed to load customer for editing', 'error');
        }
    }

    /**
     * Export customers to CSV
     */
    async exportCustomers() {
        try {
            const customers = await this.db.getAll('customers');
            const csvData = this.convertToCSV(customers, [
                'id', 'name', 'email', 'phone', 'gstNumber', 'totalOrders', 'totalValue', 'loyaltyPoints'
            ]);
            
            this.downloadCSV(csvData, 'customers.csv');
            this.showToast('Customers exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting customers:', error);
            this.showToast('Failed to export customers', 'error');
        }
    }

    // ==================== SUPPLIER MANAGEMENT ====================

    /**
     * Render suppliers grid
     */
    async renderSuppliers() {
        try {
            const suppliersGrid = document.getElementById('suppliers-grid');
            if (!suppliersGrid) return;
            
            let suppliers = await this.db.getAll('suppliers');
            
            // Apply search filter
            const searchInput = document.getElementById('suppliers-search');
            if (searchInput) {
                const searchTerm = searchInput.value.toLowerCase();
                if (searchTerm) {
                    suppliers = suppliers.filter(supplier =>
                        supplier.name.toLowerCase().includes(searchTerm) ||
                        supplier.contact.toLowerCase().includes(searchTerm) ||
                        supplier.phone.includes(searchTerm)
                    );
                }
            }
            
            // Apply sorting
            const sortSelect = document.getElementById('suppliers-sort');
            if (sortSelect) {
                suppliers.sort((a, b) => {
                    switch (sortSelect.value) {
                        case 'rating':
                            return b.rating - a.rating;
                        case 'outstanding':
                            return b.outstanding - a.outstanding;
                        default:
                            return a.name.localeCompare(b.name);
                    }
                });
            }
            
            if (suppliers.length === 0) {
                suppliersGrid.innerHTML = '<div class="loading">No suppliers found</div>';
                return;
            }
            
            suppliersGrid.innerHTML = suppliers.map(supplier => {
                const ratingStars = '⭐'.repeat(Math.floor(supplier.rating));
                return `
                    <div class="supplier-card fade-in">
                        <div class="supplier-info">
                            <h3>${supplier.name}</h3>
                            <div class="supplier-details">
                                <p>👤 ${supplier.contact}</p>
                                <p>📞 ${supplier.phone}</p>
                                <p>📧 ${supplier.email}</p>
                                <p>📦 ${supplier.products.join(', ')}</p>
                                <p>${ratingStars} ${supplier.rating}/5</p>
                            </div>
                        </div>
                        <div class="supplier-stats">
                            <div class="stat-item">
                                <div class="stat-value ${supplier.outstanding > 0 ? 'text-warning' : 'text-success'}">
                                    ${this.formatCurrency(supplier.outstanding)}
                                </div>
                                <div class="stat-label">Outstanding</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering suppliers:', error);
            const suppliersGrid = document.getElementById('suppliers-grid');
            if (suppliersGrid) {
                suppliersGrid.innerHTML = '<div class="loading">Error loading suppliers</div>';
            }
        }
    }

    // ==================== SALES MANAGEMENT ====================

    /**
     * Render sales table
     */
    async renderSales() {
        try {
            const tbody = document.getElementById('sales-tbody');
            if (!tbody) return;
            
            const sales = await this.db.getAll('sales');
            const customers = await this.db.getAll('customers');
            
            // Update sales stats
            this.updateSalesStats(sales);
            
            if (sales.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="loading">No sales found</td></tr>';
                return;
            }
            
            // Sort by date (newest first)
            const sortedSales = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            tbody.innerHTML = sortedSales.map(sale => {
                const customer = customers.find(c => c.id === sale.customerId);
                const statusClass = sale.status.toLowerCase() === 'completed' ? 'success' : 
                                  sale.status.toLowerCase() === 'pending' ? 'warning' : 'error';
                
                return `
                    <tr>
                        <td><code>${sale.invoiceNumber}</code></td>
                        <td>${customer ? customer.name : 'Walk-in Customer'}</td>
                        <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td><span class="status status--info">${sale.items.length} items</span></td>
                        <td><strong>${this.formatCurrency(sale.totalAmount)}</strong></td>
                        <td><span class="status status--secondary">${sale.paymentMethod.toUpperCase()}</span></td>
                        <td><span class="status status--${statusClass}">${sale.status}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn--sm btn--secondary" onclick="app.viewSale('${sale.id}')" title="View Receipt">👁️</button>
                                <button class="btn btn--sm btn--outline" onclick="app.printSale('${sale.id}')" title="Print Receipt">🖨️</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering sales:', error);
            const tbody = document.getElementById('sales-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="loading">Error loading sales</td></tr>';
            }
        }
    }

    /**
     * Update sales statistics
     * @param {Sale[]} sales 
     */
    updateSalesStats(sales) {
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const averageValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const stats = [
            { id: 'sales-total-count', value: totalSales.toString() },
            { id: 'sales-total-revenue', value: this.formatCurrency(totalRevenue) },
            { id: 'sales-avg-value', value: this.formatCurrency(averageValue) }
        ];
        
        stats.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (el) {
                el.textContent = stat.value;
            }
        });
    }

    /**
     * View sale receipt
     * @param {string} saleId 
     */
    async viewSale(saleId) {
        try {
            const sale = await this.db.getById('sales', saleId);
            if (sale) {
                await this.showReceipt(sale);
            }
        } catch (error) {
            console.error('Error viewing sale:', error);
            this.showToast('Failed to load sale details', 'error');
        }
    }

    /**
     * Print sale receipt
     * @param {string} saleId 
     */
    async printSale(saleId) {
        try {
            const sale = await this.db.getById('sales', saleId);
            if (sale) {
                await this.showReceipt(sale);
                setTimeout(() => window.print(), 500);
            }
        } catch (error) {
            console.error('Error printing sale:', error);
            this.showToast('Failed to print receipt', 'error');
        }
    }

    // ==================== REPORTS ====================

    /**
     * Render reports view
     */
    async renderReports() {
        const reportCards = document.querySelectorAll('.report-card');
        reportCards.forEach(card => {
            const reportType = card.dataset.report;
            const button = card.querySelector('.generate-report-btn');
            
            if (button) {
                button.onclick = () => this.generateReport(reportType);
            }
        });
    }

    /**
     * Generate report based on type
     * @param {string} reportType 
     */
    async generateReport(reportType) {
        this.showToast(`Generating ${reportType} report...`, 'info');
        
        try {
            switch (reportType) {
                case 'sales':
                    await this.generateSalesReport();
                    break;
                case 'gst':
                    await this.generateGSTReport();
                    break;
                case 'inventory':
                    await this.generateInventoryReport();
                    break;
                case 'customer':
                    await this.generateCustomerReport();
                    break;
                case 'supplier':
                    await this.generateSupplierReport();
                    break;
                case 'profit':
                    await this.generateProfitReport();
                    break;
                default:
                    this.showToast('Report type not implemented yet', 'warning');
            }
        } catch (error) {
            console.error(`Error generating ${reportType} report:`, error);
            this.showToast(`Failed to generate ${reportType} report`, 'error');
        }
    }

    /**
     * Generate sales report
     */
    async generateSalesReport() {
        const sales = await this.db.getAll('sales');
        const data = sales.map(sale => ({
            'Invoice Number': sale.invoiceNumber,
            'Date': new Date(sale.saleDate).toLocaleDateString(),
            'Customer': sale.customerId || 'Walk-in',
            'Items': sale.items.length,
            'Total Amount': sale.totalAmount,
            'Payment Method': sale.paymentMethod,
            'Status': sale.status
        }));
        
        const csvData = this.convertToCSV(data);
        this.downloadCSV(csvData, 'sales-report.csv');
        this.showToast('Sales report downloaded successfully', 'success');
    }

    /**
     * Generate GST report
     */
    async generateGSTReport() {
        const sales = await this.db.getAll('sales');
        const data = sales.map(sale => ({
            'Invoice Number': sale.invoiceNumber,
            'Date': new Date(sale.saleDate).toLocaleDateString(),
            'Taxable Value': sale.totalAmount - sale.cgstAmount - sale.sgstAmount - sale.igstAmount,
            'CGST': sale.cgstAmount,
            'SGST': sale.sgstAmount,
            'IGST': sale.igstAmount,
            'Total Tax': sale.cgstAmount + sale.sgstAmount + sale.igstAmount,
            'Total Amount': sale.totalAmount
        }));
        
        const csvData = this.convertToCSV(data);
        this.downloadCSV(csvData, 'gst-report.csv');
        this.showToast('GST report downloaded successfully', 'success');
    }

    /**
     * Generate inventory report
     */
    async generateInventoryReport() {
        const products = await this.db.getAll('products');
        const data = products.map(product => ({
            'Product ID': product.id,
            'Product Name': product.name,
            'Category': product.category,
            'Current Stock': product.stock,
            'Reorder Level': product.reorderLevel,
            'Unit Price': product.price,
            'Stock Value': product.price * product.stock,
            'Stock Status': this.getStockStatus(product).text,
            'Supplier': product.supplier
        }));
        
        const csvData = this.convertToCSV(data);
        this.downloadCSV(csvData, 'inventory-report.csv');
        this.showToast('Inventory report downloaded successfully', 'success');
    }

    /**
     * Generate customer report
     */
    async generateCustomerReport() {
        const customers = await this.db.getAll('customers');
        const csvData = this.convertToCSV(customers, [
            'id', 'name', 'email', 'phone', 'gstNumber', 'totalOrders', 'totalValue', 'loyaltyPoints'
        ]);
        
        this.downloadCSV(csvData, 'customer-report.csv');
        this.showToast('Customer report downloaded successfully', 'success');
    }

    /**
     * Generate supplier report
     */
    async generateSupplierReport() {
        const suppliers = await this.db.getAll('suppliers');
        const data = suppliers.map(supplier => ({
            'Supplier ID': supplier.id,
            'Supplier Name': supplier.name,
            'Contact Person': supplier.contact,
            'Phone': supplier.phone,
            'Email': supplier.email,
            'Products': supplier.products.join('; '),
            'Outstanding Amount': supplier.outstanding,
            'Rating': supplier.rating
        }));
        
        const csvData = this.convertToCSV(data);
        this.downloadCSV(csvData, 'supplier-report.csv');
        this.showToast('Supplier report downloaded successfully', 'success');
    }

    /**
     * Generate profit & loss report
     */
    async generateProfitReport() {
        const sales = await this.db.getAll('sales');
        const products = await this.db.getAll('products');
        
        let totalRevenue = 0;
        let totalCost = 0;
        
        sales.forEach(sale => {
            totalRevenue += sale.totalAmount;
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    // Assuming cost is 70% of selling price (mock calculation)
                    totalCost += item.quantity * (product.price * 0.7);
                }
            });
        });
        
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(2) : 0;
        
        const data = [{
            'Total Revenue': totalRevenue,
            'Total Cost': totalCost,
            'Gross Profit': grossProfit,
            'Profit Margin (%)': profitMargin,
            'Total Sales': sales.length
        }];
        
        const csvData = this.convertToCSV(data);
        this.downloadCSV(csvData, 'profit-loss-report.csv');
        this.showToast('Profit & Loss report downloaded successfully', 'success');
    }

    // ==================== SETTINGS ====================

    /**
     * Setup settings management
     */
    setupSettings() {
        // Data management buttons
        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        const seedDataBtn = document.getElementById('seed-data-btn');
        if (seedDataBtn) {
            seedDataBtn.addEventListener('click', () => this.loadSampleData());
        }
        
        // Theme selection
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
            themeSelect.value = localStorage.getItem('theme') || 'auto';
        }
        
        // Settings save
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    /**
     * Setup data management buttons
     */
    setupDataManagement() {
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.exportAllData());
        }
        
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.importData());
        }
    }

    /**
     * Render settings view
     */
    async renderSettings() {
        // Update database size info
        const info = await this.db.getDatabaseInfo();
        const dbSizeInfo = document.getElementById('db-size-info');
        if (dbSizeInfo) {
            dbSizeInfo.textContent = `${info.totalRecords} total records`;
        }
        
        // Load current settings
        const businessName = document.getElementById('business-name');
        const businessGst = document.getElementById('business-gst');
        const businessAddress = document.getElementById('business-address');
        
        const savedSettings = localStorage.getItem('businessSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (businessName) businessName.value = settings.name || 'Wholesale POS System';
            if (businessGst) businessGst.value = settings.gst || '';
            if (businessAddress) businessAddress.value = settings.address || '';
        }
    }

    /**
     * Clear all data with confirmation
     */
    async clearAllData() {
        const confirmed = await this.showConfirmDialog(
            'Clear All Data',
            'This will permanently delete all products, customers, suppliers, and sales data. Are you sure?'
        );
        
        if (confirmed) {
            try {
                await this.db.clearAllData();
                this.showToast('All data cleared successfully', 'success');
                await this.renderCurrentView();
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showToast('Failed to clear data', 'error');
            }
        }
    }

    /**
     * Save business settings
     */
    saveSettings() {
        const businessName = document.getElementById('business-name').value;
        const businessGst = document.getElementById('business-gst').value;
        const businessAddress = document.getElementById('business-address').value;
        
        const settings = {
            name: businessName,
            gst: businessGst,
            address: businessAddress
        };
        
        localStorage.setItem('businessSettings', JSON.stringify(settings));
        this.showToast('Settings saved successfully', 'success');
    }

    /**
     * Export all data as JSON
     */
    async exportAllData() {
        try {
            const allData = {
                products: await this.db.getAll('products'),
                customers: await this.db.getAll('customers'),
                suppliers: await this.db.getAll('suppliers'),
                sales: await this.db.getAll('sales'),
                categories: await this.db.getAll('categories'),
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };
            
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `wholesale-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('Data exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    /**
     * Import data from JSON file
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.products) {
                    for (const product of data.products) {
                        await this.db.add('products', product);
                    }
                }
                
                if (data.customers) {
                    for (const customer of data.customers) {
                        await this.db.add('customers', customer);
                    }
                }
                
                if (data.suppliers) {
                    for (const supplier of data.suppliers) {
                        await this.db.add('suppliers', supplier);
                    }
                }
                
                if (data.sales) {
                    for (const sale of data.sales) {
                        await this.db.add('sales', sale);
                    }
                }
                
                if (data.categories) {
                    for (const category of data.categories) {
                        await this.db.add('categories', category);
                    }
                }
                
                this.showToast('Data imported successfully', 'success');
                await this.renderCurrentView();
                
            } catch (error) {
                console.error('Error importing data:', error);
                this.showToast('Failed to import data. Please check the file format.', 'error');
            }
        };
        
        input.click();
    }

    // ==================== MODAL MANAGEMENT ====================

    /**
     * Setup modal event listeners
     */
    setupModals() {
        // Close modal buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal();
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
        
        // Form submissions
        this.setupFormHandlers();
        
        // Print receipt button
        const printBtn = document.getElementById('print-receipt-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
    }

    /**
     * Setup form handlers
     */
    setupFormHandlers() {
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        }
        
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        }
    }

    /**
     * Show product modal
     * @param {Product|null} product 
     */
    async showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');
        
        if (!modal || !title || !form) return;
        
        // Populate categories and suppliers
        await this.populateProductFormSelects();
        
        if (product) {
            title.textContent = 'Edit Product';
            // Populate form fields
            Object.keys(product).forEach(key => {
                const field = form.elements[key];
                if (field) field.value = product[key];
            });
        } else {
            title.textContent = 'Add Product';
            form.reset();
            // Generate new product ID
            form.elements.id.value = this.generateId('PROD');
        }
        
        modal.classList.remove('hidden');
    }

    /**
     * Populate product form selects with categories and suppliers
     */
    async populateProductFormSelects() {
        try {
            const categories = await this.db.getAll('categories');
            const suppliers = await this.db.getAll('suppliers');
            
            const categorySelect = document.querySelector('#product-form select[name="category"]');
            const supplierSelect = document.querySelector('#product-form select[name="supplier"]');
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>' +
                    categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
            
            if (supplierSelect) {
                supplierSelect.innerHTML = '<option value="">Select Supplier</option>' +
                    suppliers.map(sup => `<option value="${sup.name}">${sup.name}</option>`).join('');
            }
            
        } catch (error) {
            console.error('Error populating form selects:', error);
        }
    }

    /**
     * Show customer modal
     * @param {Customer|null} customer 
     */
    showCustomerModal(customer = null) {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        const form = document.getElementById('customer-form');
        
        if (!modal || !title || !form) return;
        
        if (customer) {
            title.textContent = 'Edit Customer';
            // Populate form fields
            Object.keys(customer).forEach(key => {
                const field = form.elements[key];
                if (field) field.value = customer[key];
            });
        } else {
            title.textContent = 'Add Customer';
            form.reset();
        }
        
        modal.classList.remove('hidden');
    }

    /**
     * Close all modals
     */
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.editingProduct = null;
        this.editingCustomer = null;
    }

    /**
     * Show confirmation dialog
     * @param {string} title 
     * @param {string} message 
     * @returns {Promise<boolean>}
     */
    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const confirmBtn = document.getElementById('confirm-action-btn');
            
            if (!modal || !titleEl || !messageEl || !confirmBtn) {
                resolve(false);
                return;
            }
            
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            const handleConfirm = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                resolve(true);
            };
            
            const handleCancel = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                resolve(false);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            
            // Also handle cancel button and escape key
            const cancelBtn = modal.querySelector('.modal-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel, { once: true });
            }
            
            modal.classList.remove('hidden');
        });
    }

    /**
     * Handle product form submission
     * @param {Event} e 
     */
    async handleProductSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const product = {
                id: formData.get('id'),
                name: formData.get('name'),
                description: formData.get('description') || '',
                category: formData.get('category'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')),
                reorderLevel: parseInt(formData.get('reorderLevel')) || 0,
                gstRate: parseInt(formData.get('gstRate')),
                hsnCode: formData.get('hsnCode') || '',
                supplier: formData.get('supplier') || '',
                createdAt: this.editingProduct ? this.editingProduct.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (this.editingProduct) {
                await this.db.update('products', product);
                this.showToast('Product updated successfully', 'success');
            } else {
                // Check if product ID already exists
                const existingProduct = await this.db.getById('products', product.id);
                if (existingProduct) {
                    this.showToast('Product ID already exists!', 'error');
                    return;
                }
                await this.db.add('products', product);
                this.showToast('Product added successfully', 'success');
            }
            
            this.closeModal();
            
            // Refresh current view if it shows products
            if (['inventory', 'pos'].includes(this.currentView)) {
                await this.renderCurrentView();
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showToast('Failed to save product', 'error');
        }
    }

    /**
     * Handle customer form submission
     * @param {Event} e 
     */
    async handleCustomerSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const customer = {
                id: this.editingCustomer ? this.editingCustomer.id : this.generateId('CUST'),
                name: formData.get('name'),
                email: formData.get('email') || '',
                phone: formData.get('phone'),
                address: formData.get('address') || '',
                gstNumber: formData.get('gstNumber') || '',
                loyaltyPoints: this.editingCustomer ? this.editingCustomer.loyaltyPoints : 0,
                totalOrders: this.editingCustomer ? this.editingCustomer.totalOrders : 0,
                totalValue: this.editingCustomer ? this.editingCustomer.totalValue : 0,
                createdAt: this.editingCustomer ? this.editingCustomer.createdAt : new Date().toISOString()
            };
            
            if (this.editingCustomer) {
                await this.db.update('customers', customer);
                this.showToast('Customer updated successfully', 'success');
            } else {
                await this.db.add('customers', customer);
                this.showToast('Customer added successfully', 'success');
            }
            
            this.closeModal();
            
            // Refresh current view and customer selects
            if (this.currentView === 'customers') {
                await this.renderCustomers();
            }
            
            if (this.currentView === 'pos') {
                await this.renderCustomerSelect();
            }
            
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showToast('Failed to save customer', 'error');
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Show toast notification
     * @param {string} message 
     * @param {string} type 
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 16px;">&times;</button>
            </div>
        `;
        
        const closeBtn = toast.querySelector('button');
        closeBtn.onclick = () => toast.remove();
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * Format currency value
     * @param {number} amount 
     * @returns {string}
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Generate unique ID with prefix
     * @param {string} prefix 
     * @returns {string}
     */
    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    /**
     * Generate invoice number
     * @returns {string}
     */
    generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear().toString().substr(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const timestamp = now.getTime().toString().substr(-6);
        return `INV-${year}${month}-${timestamp}`;
    }

    /**
     * Debounce function calls
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Convert array of objects to CSV format
     * @param {Object[]} data 
     * @param {string[]} [fields] 
     * @returns {string}
     */
    convertToCSV(data, fields = null) {
        if (!data || data.length === 0) return '';
        
        const headers = fields || Object.keys(data[0]);
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes in values
                return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    /**
     * Download CSV file
     * @param {string} csvContent 
     * @param {string} filename 
     */
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// ==================== GLOBAL FUNCTIONS ====================

// Global app instance
let app;

// Global functions for HTML onclick handlers
window.showView = (viewName) => {
    if (app) {
        app.switchView(viewName);
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new WholesalePOSApp();
        await app.init();
        
        // Make app globally available for debugging
        window.app = app;
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error message to user
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: var(--color-error);">
                    <h2>Application Failed to Start</h2>
                    <p>Please refresh the page and try again.</p>
                    <button class="btn btn--primary" onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
    }
});

// Handle application errors
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    if (app) {
        app.showToast('An unexpected error occurred. Please try again.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (app) {
        app.showToast('A system error occurred. Please check your actions and try again.', 'error');
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WholesalePOSApp, DatabaseManager };
}