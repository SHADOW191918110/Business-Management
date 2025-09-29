// IndexedDB Database Management
// Check if backend is available
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/health`);
        return response.ok;
    } catch (error) {
        console.warn('Backend not available, running in offline mode');
        return false;
    }
}

// Initialize application based on backend availability
document.addEventListener('DOMContentLoaded', async () => {
    const backendAvailable = await checkBackendConnection();
    
    if (backendAvailable) {
        console.log('✅ Connected to Rust backend');
        window.posApp = new POSApplicationWithBackend();
    } else {
        console.log('📦 Running in offline mode');
        window.posApp = new POSApplication();
    }
});

class POSApplicationWithBackend extends POSApplication {
    constructor() {
        super();
        this.apiClient = new APIClient();
    }
    
    // Override methods to use backend API instead of IndexedDB
    async loadProducts() {
        try {
            const products = await this.apiClient.get('/products');
            this.products = products;
            return products;
        } catch (error) {
            console.error('Failed to load products from backend:', error);
            // Fallback to IndexedDB
            return super.loadProducts();
        }
    }
    
    async createProduct(productData) {
        try {
            const product = await this.apiClient.post('/products', productData);
            this.products.push(product);
            this.renderProducts();
            return product;
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    }
    
    // ... implement other backend integration methods
}


class POSDatabase {
    constructor() {
        this.dbName = 'POSApplication';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Products store
                if (!db.objectStoreNames.contains('products')) {
                    const productsStore = db.createObjectStore('products', { keyPath: 'id' });
                    productsStore.createIndex('name', 'name', { unique: false });
                    productsStore.createIndex('category', 'category', { unique: false });
                    productsStore.createIndex('barcode', 'barcode', { unique: false });
                }
                
                // Customers store
                if (!db.objectStoreNames.contains('customers')) {
                    const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
                    customersStore.createIndex('name', 'name', { unique: false });
                    customersStore.createIndex('email', 'email', { unique: false });
                }
                
                // Suppliers store
                if (!db.objectStoreNames.contains('suppliers')) {
                    const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id' });
                    suppliersStore.createIndex('name', 'name', { unique: false });
                }
                
                // Sales store
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
                    salesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    salesStore.createIndex('customerId', 'customerId', { unique: false });
                }
                
                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }
                
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                // Transactions store
                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    transactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    transactionsStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// Application State Management
class POSApplication {
    constructor() {
        this.db = new POSDatabase();
        this.cart = [];
        this.selectedPaymentMethod = 'cash';
        this.currentView = 'dashboard';
        this.editingItem = null;
        this.salesChart = null;
        this.settings = {};
        
        // Initialize with provided data
        this.initialData = {
            storeSettings: {
                storeName: "Seoul Market",
                address: "123 Gangnam-gu, Seoul, South Korea",
                phone: "+82-2-1234-5678",
                email: "info@seoulmarket.kr",
                gstNumber: "KR123456789",
                cgstRate: 9,
                sgstRate: 9,
                igstRate: 18,
                currency: "KRW",
                receiptHeader: "Thank You for Shopping!",
                receiptFooter: "Visit Again Soon!"
            },
            products: [
                {
                    id: "P001",
                    name: "김치 (Kimchi) 500g",
                    description: "Traditional Korean fermented cabbage",
                    category: "Korean Food",
                    price: 8500,
                    stock: 50,
                    reorderLevel: 10,
                    gstRate: 5,
                    hsnCode: "2005",
                    barcode: "8801234567890",
                    supplier: "Seoul Food Co.",
                    createdAt: "2025-09-29T00:00:00Z",
                    updatedAt: "2025-09-29T00:00:00Z"
                },
                {
                    id: "P002", 
                    name: "라면 (Ramyeon) Pack",
                    description: "Instant Korean noodles - Spicy flavor",
                    category: "Noodles",
                    price: 1200,
                    stock: 100,
                    reorderLevel: 20,
                    gstRate: 5,
                    hsnCode: "1902",
                    barcode: "8801234567891",
                    supplier: "Nongshim Co.",
                    createdAt: "2025-09-29T00:00:00Z",
                    updatedAt: "2025-09-29T00:00:00Z"
                },
                {
                    id: "P003",
                    name: "참기름 (Sesame Oil) 320ml",
                    description: "Pure Korean sesame oil for cooking",
                    category: "Cooking Oil",
                    price: 12000,
                    stock: 30,
                    reorderLevel: 5,
                    gstRate: 18,
                    hsnCode: "1515",
                    barcode: "8801234567892",
                    supplier: "CJ Foods",
                    createdAt: "2025-09-29T00:00:00Z",
                    updatedAt: "2025-09-29T00:00:00Z"
                },
                {
                    id: "P004",
                    name: "고추장 (Gochujang) 500g",
                    description: "Korean chili paste - Spicy and sweet",
                    category: "Condiments",
                    price: 6500,
                    stock: 25,
                    reorderLevel: 8,
                    gstRate: 5,
                    hsnCode: "2103",
                    barcode: "8801234567893",
                    supplier: "Seoul Food Co.",
                    createdAt: "2025-09-29T00:00:00Z",
                    updatedAt: "2025-09-29T00:00:00Z"
                },
                {
                    id: "P005",
                    name: "쌀 (Rice) 10kg",
                    description: "Premium Korean white rice",
                    category: "Grains",
                    price: 25000,
                    stock: 40,
                    reorderLevel: 10,
                    gstRate: 5,
                    hsnCode: "1006",
                    barcode: "8801234567894",
                    supplier: "Korean Rice Co.",
                    createdAt: "2025-09-29T00:00:00Z",
                    updatedAt: "2025-09-29T00:00:00Z"
                }
            ],
            customers: [
                {
                    id: "C001",
                    name: "김민수 (Kim Min-su)",
                    email: "minsu.kim@email.kr",
                    phone: "+82-10-1234-5678",
                    address: "Gangnam-gu, Seoul",
                    gstNumber: "",
                    loyaltyPoints: 1500,
                    totalPurchases: 125000,
                    createdAt: "2025-09-01T00:00:00Z",
                    updatedAt: "2025-09-01T00:00:00Z"
                },
                {
                    id: "C002",
                    name: "박지은 (Park Ji-eun)",
                    email: "jieun.park@email.kr", 
                    phone: "+82-10-2345-6789",
                    address: "Hongdae, Seoul",
                    gstNumber: "",
                    loyaltyPoints: 890,
                    totalPurchases: 89000,
                    createdAt: "2025-09-05T00:00:00Z",
                    updatedAt: "2025-09-05T00:00:00Z"
                },
                {
                    id: "C003",
                    name: "이준호 (Lee Jun-ho)",
                    email: "junho.lee@email.kr",
                    phone: "+82-10-3456-7890", 
                    address: "Myeongdong, Seoul",
                    gstNumber: "",
                    loyaltyPoints: 2340,
                    totalPurchases: 234000,
                    createdAt: "2025-08-20T00:00:00Z",
                    updatedAt: "2025-08-20T00:00:00Z"
                }
            ],
            suppliers: [
                {
                    id: "S001",
                    name: "Seoul Food Co.",
                    contact: "이상민 (Lee Sang-min)",
                    phone: "+82-2-5678-9012",
                    email: "contact@seoulfood.kr",
                    address: "Food District, Seoul",
                    gstNumber: "KR789012345",
                    rating: 4.8,
                    outstanding: 0,
                    createdAt: "2025-01-01T00:00:00Z",
                    updatedAt: "2025-01-01T00:00:00Z"
                },
                {
                    id: "S002",
                    name: "Nongshim Co.",
                    contact: "박영호 (Park Young-ho)",
                    phone: "+82-2-6789-0123",
                    email: "sales@nongshim.kr",
                    address: "Industrial Area, Seoul",
                    gstNumber: "KR345678901",
                    rating: 4.9,
                    outstanding: 45000,
                    createdAt: "2025-01-01T00:00:00Z",
                    updatedAt: "2025-01-01T00:00:00Z"
                }
            ],
            categories: [
                {id: "CAT001", name: "Korean Food", description: "Traditional Korean food items"},
                {id: "CAT002", name: "Noodles", description: "Instant and fresh noodles"},
                {id: "CAT003", name: "Cooking Oil", description: "Various cooking oils and fats"},
                {id: "CAT004", name: "Condiments", description: "Sauces and flavor enhancers"},
                {id: "CAT005", name: "Grains", description: "Rice and other grain products"},
                {id: "CAT006", name: "Beverages", description: "Drinks and beverages"},
                {id: "CAT007", name: "Snacks", description: "Korean snacks and treats"}
            ]
        };
    }

    async init() {
        try {
            await this.db.init();
            await this.loadInitialData();
            await this.loadSettings();
            this.setupEventListeners();
            // Initialize with dashboard view
            await this.switchView('dashboard');
            this.showToast('POS Application initialized successfully', 'success');
        } catch (error) {
            console.error('Failed to initialize POS Application:', error);
            this.showToast('Failed to initialize application', 'error');
        }
    }

    async loadInitialData() {
        try {
            // Load settings
            const existingSettings = await this.db.getAll('settings');
            if (existingSettings.length === 0) {
                for (const [key, value] of Object.entries(this.initialData.storeSettings)) {
                    await this.db.add('settings', { key, value, updatedAt: new Date().toISOString() });
                }
            }

            // Load categories
            const existingCategories = await this.db.getAll('categories');
            if (existingCategories.length === 0) {
                for (const category of this.initialData.categories) {
                    await this.db.add('categories', category);
                }
            }

            // Load products
            const existingProducts = await this.db.getAll('products');
            if (existingProducts.length === 0) {
                for (const product of this.initialData.products) {
                    await this.db.add('products', product);
                }
            }

            // Load customers
            const existingCustomers = await this.db.getAll('customers');
            if (existingCustomers.length === 0) {
                for (const customer of this.initialData.customers) {
                    await this.db.add('customers', customer);
                }
            }

            // Load suppliers
            const existingSuppliers = await this.db.getAll('suppliers');
            if (existingSuppliers.length === 0) {
                for (const supplier of this.initialData.suppliers) {
                    await this.db.add('suppliers', supplier);
                }
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadSettings() {
        try {
            const settingsArray = await this.db.getAll('settings');
            this.settings = {};
            settingsArray.forEach(setting => {
                this.settings[setting.key] = setting.value;
            });
            
            // Update store name in header
            const userInfo = document.querySelector('.user-info');
            if (userInfo) {
                userInfo.textContent = this.settings.storeName || 'Seoul Market';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Navigation - Fixed to properly handle navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    await this.switchView(view);
                    
                    // Update active menu item
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSettingsModal();
            });
        }

        // POS functionality
        this.setupPOSListeners();
        
        // Modal listeners
        this.setupModalListeners();
        
        // Form listeners
        this.setupFormListeners();

        // Search listeners
        this.setupSearchListeners();
    }

    setupPOSListeners() {
        // Product search
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
            productSearch.addEventListener('input', (e) => this.filterProducts(e.target.value));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterProductsByCategory(e.target.value));
        }

        // Payment methods
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPaymentMethod = btn.dataset.method;
            });
        });

        // Cart actions
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearCart();
            });
        }

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.processCheckout();
            });
        }
    }

    setupModalListeners() {
        // Close modal buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal();
            });
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });

        // Add buttons
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProductModal();
            });
        }

        const addCustomerBtn = document.getElementById('add-customer-btn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCustomerModal();
            });
        }

        const addSupplierBtn = document.getElementById('add-supplier-btn');
        if (addSupplierBtn) {
            addSupplierBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSupplierModal();
            });
        }

        // Print receipt
        const printReceiptBtn = document.getElementById('print-receipt');
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.print();
            });
        }
    }

    setupFormListeners() {
        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.saveSettings(e));
        }
        
        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.saveProduct(e));
        }
        
        // Customer form
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => this.saveCustomer(e));
        }
        
        // Supplier form
        const supplierForm = document.getElementById('supplier-form');
        if (supplierForm) {
            supplierForm.addEventListener('submit', (e) => this.saveSupplier(e));
        }
    }

    setupSearchListeners() {
        // Inventory search
        const inventorySearch = document.getElementById('inventory-search');
        if (inventorySearch) {
            inventorySearch.addEventListener('input', (e) => this.filterInventory(e.target.value));
        }

        // Customer search
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => this.filterCustomers(e.target.value));
        }

        // Supplier search
        const supplierSearch = document.getElementById('supplier-search');
        if (supplierSearch) {
            supplierSearch.addEventListener('input', (e) => this.filterSuppliers(e.target.value));
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-color-scheme', newScheme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newScheme === 'dark' ? '☀️' : '🌙';
        }
    }

    async switchView(viewName) {
        try {
            console.log('Switching to view:', viewName);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            
            // Show selected view
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.classList.add('active');
            } else {
                console.error('View not found:', `${viewName}-view`);
                return;
            }
            
            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = this.getViewTitle(viewName);
            }
            
            this.currentView = viewName;
            
            // Render view-specific content
            await this.renderCurrentView();
            
            this.showToast(`Switched to ${this.getViewTitle(viewName)}`, 'info');
        } catch (error) {
            console.error('Error switching view:', error);
            this.showToast('Error switching view', 'error');
        }
    }

    getViewTitle(viewName) {
        const titles = {
            dashboard: 'Dashboard',
            pos: 'Point of Sale',
            inventory: 'Inventory Management',
            customers: 'Customer Management',
            suppliers: 'Supplier Management',
            sales: 'Sales & Reports',
            accounting: 'Accounting'
        };
        return titles[viewName] || viewName;
    }

    async renderCurrentView() {
        console.log('Rendering view:', this.currentView);
        
        try {
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
                case 'accounting':
                    await this.renderAccounting();
                    break;
                default:
                    console.warn('Unknown view:', this.currentView);
            }
        } catch (error) {
            console.error('Error rendering current view:', error);
            this.showToast('Error loading view content', 'error');
        }
    }

    async renderDashboard() {
        try {
            const sales = await this.db.getAll('sales');
            const customers = await this.db.getAll('customers');
            const products = await this.db.getAll('products');
            
            const today = new Date().toDateString();
            const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === today);
            const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
            
            const lowStockItems = products.filter(p => p.stock <= p.reorderLevel).length;
            
            // Update KPIs
            const todaySalesEl = document.getElementById('today-sales');
            const transactionsTodayEl = document.getElementById('transactions-today');
            const totalCustomersEl = document.getElementById('total-customers');
            const inventoryItemsEl = document.getElementById('inventory-items');
            const inventoryChangeEl = document.getElementById('inventory-change');
            
            if (todaySalesEl) todaySalesEl.textContent = this.formatCurrency(todayRevenue);
            if (transactionsTodayEl) transactionsTodayEl.textContent = todaySales.length.toString();
            if (totalCustomersEl) totalCustomersEl.textContent = customers.length.toString();
            if (inventoryItemsEl) inventoryItemsEl.textContent = products.length.toString();
            if (inventoryChangeEl) inventoryChangeEl.textContent = `${lowStockItems} low stock items`;
            
            // Render recent transactions
            this.renderRecentTransactions(todaySales.slice(0, 5));
            
            // Render sales chart
            this.renderSalesChart();
        } catch (error) {
            console.error('Error rendering dashboard:', error);
        }
    }

    renderRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions today</div>';
            return;
        }
        
        container.innerHTML = transactions.map(transaction => `
            <div class="order-item">
                <div class="order-info">
                    <div class="order-id">${transaction.id}</div>
                    <div class="order-customer">${transaction.customerName || 'Walk-in Customer'}</div>
                </div>
                <div class="order-details">
                    <div class="order-amount">${this.formatCurrency(transaction.total)}</div>
                    <span class="status status--success">Completed</span>
                </div>
            </div>
        `).join('');
    }

    renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        const chartData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [150000, 200000, 180000, 240000, 190000, 220000, 250000],
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₩' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    async renderPOS() {
        try {
            await this.renderPOSProducts();
            await this.renderCustomerSelect();
            await this.renderCategoryFilter();
            this.renderCart();
        } catch (error) {
            console.error('Error rendering POS:', error);
        }
    }

    async renderPOSProducts() {
        try {
            const products = await this.db.getAll('products');
            const productGrid = document.getElementById('product-grid');
            if (!productGrid) return;
            
            productGrid.innerHTML = products.map(product => `
                <div class="product-card" onclick="app.addToCart('${product.id}')">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">${this.formatCurrency(product.price)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering POS products:', error);
        }
    }

    async renderCustomerSelect() {
        try {
            const customers = await this.db.getAll('customers');
            const customerSelect = document.getElementById('customer-select');
            if (!customerSelect) return;
            
            customerSelect.innerHTML = '<option value="">Walk-in Customer</option>' +
                customers.map(customer => 
                    `<option value="${customer.id}">${customer.name}</option>`
                ).join('');
        } catch (error) {
            console.error('Error rendering customer select:', error);
        }
    }

    async renderCategoryFilter() {
        try {
            const categories = await this.db.getAll('categories');
            const categoryFilter = document.getElementById('category-filter');
            if (!categoryFilter) return;
            
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(category => 
                    `<option value="${category.name}">${category.name}</option>`
                ).join('');
        } catch (error) {
            console.error('Error rendering category filter:', error);
        }
    }

    async addToCart(productId) {
        try {
            const product = await this.db.get('products', productId);
            if (!product || product.stock === 0) {
                this.showToast('Product not available or out of stock', 'error');
                return;
            }

            const existingItem = this.cart.find(item => item.productId === productId);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity += 1;
                } else {
                    this.showToast('Insufficient stock available', 'error');
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
            this.showToast('Error adding product to cart', 'error');
        }
    }

    updateCartQuantity(productId, quantity) {
        const cartItem = this.cart.find(item => item.productId === productId);
        
        if (quantity <= 0) {
            this.cart = this.cart.filter(item => item.productId !== productId);
        } else {
            cartItem.quantity = quantity;
        }
        
        this.renderCart();
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Cart is empty</div>';
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

    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgstRate = this.settings.cgstRate || 9;
        const sgstRate = this.settings.sgstRate || 9;
        const cgst = subtotal * cgstRate / 100;
        const sgst = subtotal * sgstRate / 100;
        const total = subtotal + cgst + sgst;
        
        const subtotalEl = document.getElementById('subtotal');
        const cgstEl = document.getElementById('cgst');
        const sgstEl = document.getElementById('sgst');
        const totalEl = document.getElementById('total');
        const cgstRateEl = document.getElementById('cgst-rate');
        const sgstRateEl = document.getElementById('sgst-rate');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (subtotalEl) subtotalEl.textContent = this.formatCurrency(subtotal);
        if (cgstEl) cgstEl.textContent = this.formatCurrency(cgst);
        if (sgstEl) sgstEl.textContent = this.formatCurrency(sgst);
        if (totalEl) totalEl.textContent = this.formatCurrency(total);
        if (cgstRateEl) cgstRateEl.textContent = cgstRate;
        if (sgstRateEl) sgstRateEl.textContent = sgstRate;
        if (checkoutBtn) checkoutBtn.disabled = this.cart.length === 0;
    }

    clearCart() {
        this.cart = [];
        this.renderCart();
        this.showToast('Cart cleared', 'info');
    }

    async processCheckout() {
        if (this.cart.length === 0) return;
        
        try {
            const customerSelect = document.getElementById('customer-select');
            const customerId = customerSelect ? customerSelect.value : '';
            const customer = customerId ? await this.db.get('customers', customerId) : null;
            
            const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const cgstRate = this.settings.cgstRate || 9;
            const sgstRate = this.settings.sgstRate || 9;
            const cgst = subtotal * cgstRate / 100;
            const sgst = subtotal * sgstRate / 100;
            const total = subtotal + cgst + sgst;
            
            // Create sale record
            const sale = {
                id: this.generateId('TXN'),
                customerId: customerId || null,
                customerName: customer ? customer.name : 'Walk-in Customer',
                items: [...this.cart],
                subtotal: subtotal,
                cgst: cgst,
                sgst: sgst,
                total: total,
                paymentMethod: this.selectedPaymentMethod,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };
            
            await this.db.add('sales', sale);
            
            // Update product stock
            for (const item of this.cart) {
                const product = await this.db.get('products', item.productId);
                if (product) {
                    product.stock -= item.quantity;
                    product.updatedAt = new Date().toISOString();
                    await this.db.put('products', product);
                }
            }
            
            // Update customer loyalty points if customer selected
            if (customer) {
                customer.loyaltyPoints += Math.floor(total / 100);
                customer.totalPurchases += total;
                customer.updatedAt = new Date().toISOString();
                await this.db.put('customers', customer);
            }
            
            // Show receipt
            this.showReceipt(sale);
            
            // Clear cart
            this.clearCart();
            
            this.showToast('Sale completed successfully', 'success');
        } catch (error) {
            console.error('Error processing checkout:', error);
            this.showToast('Error processing sale', 'error');
        }
    }

    showReceipt(sale) {
        const modal = document.getElementById('receipt-modal');
        const content = document.getElementById('receipt-content');
        if (!modal || !content) return;
        
        content.innerHTML = `
            <div class="receipt-header">
                <h3>POS Application</h3>
                <div class="receipt-store-info">
                    <p><strong>${this.settings.storeName || 'Seoul Market'}</strong></p>
                    <p>${this.settings.address || 'Seoul, South Korea'}</p>
                    <p>Phone: ${this.settings.phone || '+82-2-1234-5678'}</p>
                    <p>GST: ${this.settings.gstNumber || 'KR123456789'}</p>
                </div>
                <p><strong>Receipt #${sale.id}</strong></p>
                <p>Date: ${new Date(sale.timestamp).toLocaleString()}</p>
                <p>Customer: ${sale.customerName}</p>
                <p>Payment: ${sale.paymentMethod.toUpperCase()}</p>
            </div>
            <div class="receipt-items">
                ${sale.items.map(item => `
                    <div class="receipt-item">
                        <div class="receipt-item-details">
                            <div>${item.name}</div>
                            <div>${item.quantity} × ${this.formatCurrency(item.price)}</div>
                        </div>
                        <div>${this.formatCurrency(item.price * item.quantity)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>${this.formatCurrency(sale.subtotal)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>CGST (${this.settings.cgstRate || 9}%):</span>
                    <span>${this.formatCurrency(sale.cgst)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>SGST (${this.settings.sgstRate || 9}%):</span>
                    <span>${this.formatCurrency(sale.sgst)}</span>
                </div>
                <div class="receipt-total-row final">
                    <span>Total:</span>
                    <span>${this.formatCurrency(sale.total)}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>${this.settings.receiptHeader || 'Thank You for Shopping!'}</p>
                <p>${this.settings.receiptFooter || 'Visit Again Soon!'}</p>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    async renderInventory() {
        try {
            const products = await this.db.getAll('products');
            const categories = await this.db.getAll('categories');
            const tbody = document.getElementById('inventory-tbody');
            const categoryFilter = document.getElementById('inventory-category-filter');
            
            // Populate category filter
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                    categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
            
            if (tbody) {
                tbody.innerHTML = products.map(product => {
                    const stockStatus = this.getStockStatus(product);
                    return `
                        <tr>
                            <td>${product.id}</td>
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td>${product.stock}</td>
                            <td>${product.reorderLevel}</td>
                            <td>
                                <div class="stock-status">
                                    <span class="stock-indicator ${stockStatus.class}"></span>
                                    ${stockStatus.text}
                                </div>
                            </td>
                            <td>${this.formatCurrency(product.price)}</td>
                            <td class="table-actions">
                                <button class="btn btn--sm btn--secondary" onclick="app.editProduct('${product.id}')">Edit</button>
                                <button class="btn btn--sm btn--outline" onclick="app.deleteProduct('${product.id}')">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error rendering inventory:', error);
        }
    }

    getStockStatus(product) {
        if (product.stock <= product.reorderLevel) {
            return { class: 'low', text: 'Low Stock' };
        } else if (product.stock <= product.reorderLevel * 2) {
            return { class: 'medium', text: 'Medium' };
        } else {
            return { class: 'high', text: 'In Stock' };
        }
    }

    async renderCustomers() {
        try {
            const customers = await this.db.getAll('customers');
            const customersGrid = document.getElementById('customers-grid');
            if (!customersGrid) return;
            
            customersGrid.innerHTML = customers.map(customer => `
                <div class="customer-card">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <div class="customer-details">
                            <p>📧 ${customer.email || 'N/A'}</p>
                            <p>📞 ${customer.phone}</p>
                            <p>📍 ${customer.address || 'N/A'}</p>
                            ${customer.gstNumber ? `<p>🏢 ${customer.gstNumber}</p>` : ''}
                        </div>
                    </div>
                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-value">${customer.loyaltyPoints || 0}</div>
                            <div class="stat-label">Points</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.formatCurrency(customer.totalPurchases || 0)}</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn--sm btn--secondary" onclick="app.editCustomer('${customer.id}')">Edit</button>
                        <button class="btn btn--sm btn--outline" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering customers:', error);
        }
    }

    async renderSuppliers() {
        try {
            const suppliers = await this.db.getAll('suppliers');
            const suppliersGrid = document.getElementById('suppliers-grid');
            if (!suppliersGrid) return;
            
            suppliersGrid.innerHTML = suppliers.map(supplier => `
                <div class="supplier-card">
                    <div class="supplier-info">
                        <h3>${supplier.name}</h3>
                        <div class="supplier-details">
                            <p>👤 ${supplier.contact}</p>
                            <p>📞 ${supplier.phone}</p>
                            <p>📧 ${supplier.email || 'N/A'}</p>
                            <p>📍 ${supplier.address || 'N/A'}</p>
                            <p>⭐ Rating: ${supplier.rating || 'N/A'}/5</p>
                        </div>
                    </div>
                    <div class="supplier-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.formatCurrency(supplier.outstanding || 0)}</div>
                            <div class="stat-label">Outstanding</div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn--sm btn--secondary" onclick="app.editSupplier('${supplier.id}')">Edit</button>
                        <button class="btn btn--sm btn--outline" onclick="app.deleteSupplier('${supplier.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering suppliers:', error);
        }
    }

    async renderSales() {
        try {
            const sales = await this.db.getAll('sales');
            const tbody = document.getElementById('sales-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = sales.reverse().map(sale => `
                <tr>
                    <td>${sale.id}</td>
                    <td>${new Date(sale.timestamp).toLocaleString()}</td>
                    <td>${sale.customerName}</td>
                    <td>${sale.items.length}</td>
                    <td>${this.formatCurrency(sale.subtotal)}</td>
                    <td>${this.formatCurrency(sale.cgst + sale.sgst)}</td>
                    <td>${this.formatCurrency(sale.total)}</td>
                    <td>${sale.paymentMethod.toUpperCase()}</td>
                    <td class="table-actions">
                        <button class="btn btn--sm btn--secondary" onclick="app.viewSale('${sale.id}')">View</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error rendering sales:', error);
        }
    }

    async renderAccounting() {
        try {
            const sales = await this.db.getAll('sales');
            const today = new Date().toDateString();
            const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === today);
            
            const cashSales = todaySales.filter(s => s.paymentMethod === 'cash');
            const cardSales = todaySales.filter(s => s.paymentMethod === 'card');
            const upiSales = todaySales.filter(s => s.paymentMethod === 'upi');
            
            const cashTotal = cashSales.reduce((sum, s) => sum + s.total, 0);
            const cardTotal = cardSales.reduce((sum, s) => sum + s.total, 0);
            const upiTotal = upiSales.reduce((sum, s) => sum + s.total, 0);
            const totalRevenue = cashTotal + cardTotal + upiTotal;
            
            const elements = {
                'cash-balance': cashTotal,
                'card-balance': cardTotal,
                'upi-balance': upiTotal,
                'total-revenue': totalRevenue,
                'cash-change': `${this.formatCurrency(cashTotal)} today`,
                'card-change': `${this.formatCurrency(cardTotal)} today`,
                'upi-change': `${this.formatCurrency(upiTotal)} today`,
                'revenue-change': `${this.formatCurrency(totalRevenue)} today`
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = typeof value === 'number' ? this.formatCurrency(value) : value;
                }
            });
        } catch (error) {
            console.error('Error rendering accounting:', error);
        }
    }

    // Modal Functions
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const form = document.getElementById('settings-form');
        if (!modal || !form) return;
        
        // Populate form with current settings
        Object.keys(this.settings).forEach(key => {
            const field = form.elements[key];
            if (field) field.value = this.settings[key];
        });
        
        modal.classList.remove('hidden');
    }

    async showProductModal(productId = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');
        if (!modal || !title || !form) return;
        
        const categorySelect = form.elements.category;
        
        // Populate categories
        try {
            const categories = await this.db.getAll('categories');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>' +
                    categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
        
        if (productId) {
            try {
                const product = await this.db.get('products', productId);
                title.textContent = 'Edit Product';
                this.editingItem = product;
                
                // Populate form
                Object.keys(product).forEach(key => {
                    const field = form.elements[key];
                    if (field) field.value = product[key];
                });
            } catch (error) {
                console.error('Error loading product:', error);
                return;
            }
        } else {
            title.textContent = 'Add Product';
            form.reset();
            this.editingItem = null;
        }
        
        modal.classList.remove('hidden');
    }

    async showCustomerModal(customerId = null) {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        const form = document.getElementById('customer-form');
        if (!modal || !title || !form) return;
        
        if (customerId) {
            try {
                const customer = await this.db.get('customers', customerId);
                title.textContent = 'Edit Customer';
                this.editingItem = customer;
                
                Object.keys(customer).forEach(key => {
                    const field = form.elements[key];
                    if (field) field.value = customer[key];
                });
            } catch (error) {
                console.error('Error loading customer:', error);
                return;
            }
        } else {
            title.textContent = 'Add Customer';
            form.reset();
            this.editingItem = null;
        }
        
        modal.classList.remove('hidden');
    }

    async showSupplierModal(supplierId = null) {
        const modal = document.getElementById('supplier-modal');
        const title = document.getElementById('supplier-modal-title');
        const form = document.getElementById('supplier-form');
        if (!modal || !title || !form) return;
        
        if (supplierId) {
            try {
                const supplier = await this.db.get('suppliers', supplierId);
                title.textContent = 'Edit Supplier';
                this.editingItem = supplier;
                
                Object.keys(supplier).forEach(key => {
                    const field = form.elements[key];
                    if (field) field.value = supplier[key];
                });
            } catch (error) {
                console.error('Error loading supplier:', error);
                return;
            }
        } else {
            title.textContent = 'Add Supplier';
            form.reset();
            this.editingItem = null;
        }
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.editingItem = null;
    }

    // Form Handlers
    async saveSettings(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            
            // Save each setting
            for (const [key, value] of formData.entries()) {
                await this.db.put('settings', { 
                    key, 
                    value: isNaN(value) ? value : parseFloat(value), 
                    updatedAt: new Date().toISOString() 
                });
            }
            
            await this.loadSettings();
            this.closeModal();
            this.showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', 'error');
        }
    }

    async saveProduct(e) {
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
                reorderLevel: parseInt(formData.get('reorderLevel')),
                gstRate: parseInt(formData.get('gstRate')),
                hsnCode: formData.get('hsnCode') || '',
                barcode: formData.get('barcode') || '',
                supplier: formData.get('supplier') || '',
                updatedAt: new Date().toISOString()
            };
            
            if (this.editingItem) {
                product.createdAt = this.editingItem.createdAt;
                await this.db.put('products', product);
                this.showToast('Product updated successfully', 'success');
            } else {
                // Check if ID exists
                const existing = await this.db.get('products', product.id);
                if (existing) {
                    this.showToast('Product ID already exists', 'error');
                    return;
                }
                product.createdAt = new Date().toISOString();
                await this.db.add('products', product);
                this.showToast('Product added successfully', 'success');
            }
            
            this.closeModal();
            await this.renderCurrentView();
        } catch (error) {
            console.error('Error saving product:', error);
            this.showToast('Error saving product', 'error');
        }
    }

    async saveCustomer(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const customer = {
                name: formData.get('name'),
                email: formData.get('email') || '',
                phone: formData.get('phone'),
                address: formData.get('address') || '',
                gstNumber: formData.get('gstNumber') || '',
                loyaltyPoints: 0,
                totalPurchases: 0,
                updatedAt: new Date().toISOString()
            };
            
            if (this.editingItem) {
                customer.id = this.editingItem.id;
                customer.createdAt = this.editingItem.createdAt;
                customer.loyaltyPoints = this.editingItem.loyaltyPoints;
                customer.totalPurchases = this.editingItem.totalPurchases;
                await this.db.put('customers', customer);
                this.showToast('Customer updated successfully', 'success');
            } else {
                customer.id = this.generateId('C');
                customer.createdAt = new Date().toISOString();
                await this.db.add('customers', customer);
                this.showToast('Customer added successfully', 'success');
            }
            
            this.closeModal();
            await this.renderCurrentView();
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showToast('Error saving customer', 'error');
        }
    }

    async saveSupplier(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const supplier = {
                name: formData.get('name'),
                contact: formData.get('contact'),
                phone: formData.get('phone'),
                email: formData.get('email') || '',
                address: formData.get('address') || '',
                gstNumber: formData.get('gstNumber') || '',
                rating: 5,
                outstanding: 0,
                updatedAt: new Date().toISOString()
            };
            
            if (this.editingItem) {
                supplier.id = this.editingItem.id;
                supplier.createdAt = this.editingItem.createdAt;
                supplier.rating = this.editingItem.rating;
                supplier.outstanding = this.editingItem.outstanding;
                await this.db.put('suppliers', supplier);
                this.showToast('Supplier updated successfully', 'success');
            } else {
                supplier.id = this.generateId('S');
                supplier.createdAt = new Date().toISOString();
                await this.db.add('suppliers', supplier);
                this.showToast('Supplier added successfully', 'success');
            }
            
            this.closeModal();
            await this.renderCurrentView();
        } catch (error) {
            console.error('Error saving supplier:', error);
            this.showToast('Error saving supplier', 'error');
        }
    }

    // CRUD Operations
    async editProduct(id) {
        await this.showProductModal(id);
    }

    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await this.db.delete('products', id);
                await this.renderCurrentView();
                this.showToast('Product deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showToast('Error deleting product', 'error');
            }
        }
    }

    async editCustomer(id) {
        await this.showCustomerModal(id);
    }

    async deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                await this.db.delete('customers', id);
                await this.renderCurrentView();
                this.showToast('Customer deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting customer:', error);
                this.showToast('Error deleting customer', 'error');
            }
        }
    }

    async editSupplier(id) {
        await this.showSupplierModal(id);
    }

    async deleteSupplier(id) {
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                await this.db.delete('suppliers', id);
                await this.renderCurrentView();
                this.showToast('Supplier deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting supplier:', error);
                this.showToast('Error deleting supplier', 'error');
            }
        }
    }

    async viewSale(id) {
        try {
            const sale = await this.db.get('sales', id);
            this.showReceipt(sale);
        } catch (error) {
            console.error('Error viewing sale:', error);
            this.showToast('Error loading sale details', 'error');
        }
    }

    // Filter Functions
    async filterProducts(searchTerm) {
        try {
            const products = await this.db.getAll('products');
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.barcode.includes(searchTerm)
            );
            
            const productGrid = document.getElementById('product-grid');
            if (productGrid) {
                productGrid.innerHTML = filtered.map(product => `
                    <div class="product-card" onclick="app.addToCart('${product.id}')">
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                        <div class="product-price">${this.formatCurrency(product.price)}</div>
                        <div class="product-stock">Stock: ${product.stock}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error filtering products:', error);
        }
    }

    async filterProductsByCategory(category) {
        try {
            const products = await this.db.getAll('products');
            const filtered = category ? products.filter(p => p.category === category) : products;
            
            const productGrid = document.getElementById('product-grid');
            if (productGrid) {
                productGrid.innerHTML = filtered.map(product => `
                    <div class="product-card" onclick="app.addToCart('${product.id}')">
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                        <div class="product-price">${this.formatCurrency(product.price)}</div>
                        <div class="product-stock">Stock: ${product.stock}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error filtering products by category:', error);
        }
    }

    async filterInventory(searchTerm) {
        // Implement inventory filtering
        console.log('Filtering inventory by:', searchTerm);
        await this.renderInventory();
    }

    async filterCustomers(searchTerm) {
        // Implement customer filtering
        console.log('Filtering customers by:', searchTerm);
        await this.renderCustomers();
    }

    async filterSuppliers(searchTerm) {
        // Implement supplier filtering
        console.log('Filtering suppliers by:', searchTerm);
        await this.renderSuppliers();
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(amount);
    }

    generateId(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}${timestamp}${random}`;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the application
const app = new POSApplication();

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Global functions for onclick handlers
window.app = app;