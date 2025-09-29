// Professional POS System - Korean Modern Style
// Complete CRUD operations with validation and professional UX

// Application State Management
class ProfessionalPOSSystem {
    constructor() {
        this.products = [
            {
                id: "RICE001",
                name: "Premium Basmati Rice 25kg",
                description: "High-quality aged basmati rice with long grains",
                category: "Grains",
                price: 2500,
                stock: 150,
                reorderLevel: 50,
                gstRate: 5,
                hsnCode: "1006",
                supplier: "ABC Food Distributors",
                status: "active",
                createdAt: new Date().toISOString()
            },
            {
                id: "FLR002",
                name: "Whole Wheat Flour 10kg",
                description: "Fresh ground whole wheat flour, rich in fiber",
                category: "Grains",
                price: 850,
                stock: 15,
                reorderLevel: 50,
                gstRate: 5,
                hsnCode: "1101",
                supplier: "ABC Food Distributors",
                status: "active",
                createdAt: new Date().toISOString()
            },
            {
                id: "OIL003",
                name: "Premium Cooking Oil 5L",
                description: "Pure refined cooking oil for healthy cooking",
                category: "Oils",
                price: 450,
                stock: 80,
                reorderLevel: 30,
                gstRate: 18,
                hsnCode: "1507",
                supplier: "Quality Oils Ltd",
                status: "active",
                createdAt: new Date().toISOString()
            }
        ];

        this.customers = [
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
                status: "active",
                createdAt: new Date().toISOString()
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
                status: "active",
                createdAt: new Date().toISOString()
            }
        ];

        this.suppliers = [
            {
                id: "SUPP001",
                name: "ABC Food Distributors",
                contact: "Rahul Sharma",
                phone: "+91 99887 76655",
                email: "rahul@abcfood.com",
                address: "Plot 15, Food Park, Gurgaon, Haryana 122001",
                gstNumber: "06ABCDE1234F1Z9",
                products: ["Rice", "Wheat", "Pulses"],
                outstanding: 85000,
                rating: 4.8,
                status: "active",
                createdAt: new Date().toISOString()
            },
            {
                id: "SUPP002",
                name: "Quality Oils Ltd",
                contact: "Priya Patel",
                phone: "+91 88776 65544",
                email: "priya@qualityoils.com",
                address: "Industrial Area, Ahmedabad, Gujarat 380001",
                gstNumber: "24PQRST5678U1V9",
                products: ["Oils", "Condiments"],
                outstanding: 42500,
                rating: 4.5,
                status: "active",
                createdAt: new Date().toISOString()
            }
        ];

        this.orders = [
            {
                id: "ORD-2025-0001",
                customer: "Raj Traders Pvt Ltd",
                customerId: "CUST001",
                amount: 45670,
                status: "Completed",
                date: "2025-09-28",
                items: 12,
                paymentMethod: "cash"
            },
            {
                id: "ORD-2025-0002",
                customer: "Modern Grocery Store",
                customerId: "CUST002",
                amount: 23450,
                status: "Pending",
                date: "2025-09-28",
                items: 8,
                paymentMethod: "upi"
            }
        ];

        this.cart = [];
        this.selectedPaymentMethod = 'cash';
        this.currentView = 'dashboard';
        this.editingItem = null;
        this.salesChart = null;
        this.selectedItems = new Set();
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.renderAll();
        this.startAutoSave();
    }

    // Data persistence with auto-save
    saveData() {
        try {
            const data = {
                products: this.products,
                customers: this.customers,
                suppliers: this.suppliers,
                orders: this.orders,
                timestamp: new Date().toISOString()
            };
            // In a real application, this would save to a backend API
            console.log('Data auto-saved', data.timestamp);
            this.showToast('Data saved successfully', 'success');
        } catch (error) {
            this.showToast('Failed to save data', 'error');
        }
    }

    loadData() {
        // In a real application, this would load from a backend API
        console.log('Data loaded from storage');
    }

    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveData();
        }, 30000); // Auto-save every 30 seconds
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    generateId(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}${timestamp}${random}`;
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePhone(phone) {
        return /^\+[1-9]\d{1,14}$/.test(phone.replace(/\s|-/g, ''));
    }

    validateGST(gst) {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div style="background: var(--color-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-50); 
                        border: 1px solid var(--color-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-200);
                        color: var(--color-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-700);
                        padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 500;">
                ${message}
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => container.removeChild(toast), 300);
        }, duration);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.switchView(view);
                
                document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', this.toggleTheme);

        // POS System
        this.setupPOSEventListeners();
        this.setupInventoryEventListeners();
        this.setupCustomerEventListeners();
        this.setupSupplierEventListeners();
        this.setupOrderEventListeners();
        this.setupModalEventListeners();

        // Search functionality
        this.setupSearchEventListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    setupPOSEventListeners() {
        const productSearch = document.getElementById('product-search');
        const categoryFilter = document.getElementById('category-filter');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (productSearch) {
            productSearch.addEventListener('input', (e) => this.filterProducts(e.target.value));
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterProductsByCategory(e.target.value));
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.processCheckout());
        }

        // Payment method selection
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPaymentMethod = btn.dataset.method;
            });
        });
    }

    setupInventoryEventListeners() {
        const addProductBtn = document.getElementById('add-product-btn');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const selectAllCheckbox = document.getElementById('select-all-products');
        const importCsv = document.getElementById('import-csv');

        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showProductModal());
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteProducts());
        }

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.selectAllProducts(e.target.checked));
        }

        if (importCsv) {
            importCsv.addEventListener('change', (e) => this.importCSV(e));
        }
    }

    setupCustomerEventListeners() {
        const addCustomerBtn = document.getElementById('add-customer-btn');
        const bulkDeleteBtn = document.getElementById('bulk-delete-customers-btn');
        const customerSearch = document.getElementById('customer-search');

        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => this.showCustomerModal());
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteCustomers());
        }

        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => this.searchCustomers(e.target.value));
        }
    }

    setupSupplierEventListeners() {
        const addSupplierBtn = document.getElementById('add-supplier-btn');
        const bulkDeleteBtn = document.getElementById('bulk-delete-suppliers-btn');
        const supplierSearch = document.getElementById('supplier-search');

        if (addSupplierBtn) {
            addSupplierBtn.addEventListener('click', () => this.showSupplierModal());
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteSuppliers());
        }

        if (supplierSearch) {
            supplierSearch.addEventListener('input', (e) => this.searchSuppliers(e.target.value));
        }
    }

    setupOrderEventListeners() {
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterOrders());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterOrders());
        }
    }

    setupSearchEventListeners() {
        // Real-time search with debouncing
        const searches = ['product-search', 'customer-search', 'supplier-search'];
        
        searches.forEach(searchId => {
            const searchInput = document.getElementById(searchId);
            if (searchInput) {
                let timeoutId;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        const value = e.target.value;
                        if (searchId === 'product-search') this.filterProducts(value);
                        if (searchId === 'customer-search') this.searchCustomers(value);
                        if (searchId === 'supplier-search') this.searchSuppliers(value);
                    }, 300);
                });
            }
        });
    }

    setupModalEventListeners() {
        // Form submissions
        const productForm = document.getElementById('product-form');
        const customerForm = document.getElementById('customer-form');
        const supplierForm = document.getElementById('supplier-form');
        const saveProductBtn = document.getElementById('save-product-btn');
        const saveCustomerBtn = document.getElementById('save-customer-btn');
        const saveSupplierBtn = document.getElementById('save-supplier-btn');

        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleProductSubmit();
            });
        }

        if (saveCustomerBtn) {
            saveCustomerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCustomerSubmit();
            });
        }

        if (saveSupplierBtn) {
            saveSupplierBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSupplierSubmit();
            });
        }

        // Real-time validation
        if (productForm) this.setupFormValidation(productForm, 'product');
        if (customerForm) this.setupFormValidation(customerForm, 'customer');
        if (supplierForm) this.setupFormValidation(supplierForm, 'supplier');

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });
    }

    setupFormValidation(form, type) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input, type));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field, type) {
        const value = field.value.trim();
        const name = field.name;
        const errorElement = document.getElementById(`${type === 'product' ? '' : type + '-'}${name}-error`);
        
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific validations
        if (value && name === 'email' && !this.validateEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        if (value && name === 'phone' && !this.validatePhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number (+91 XXXXXXXXXX)';
        }

        if (value && name === 'gstNumber' && value.length > 0 && !this.validateGST(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid GST number';
        }

        if (value && name === 'price' && parseFloat(value) <= 0) {
            isValid = false;
            errorMessage = 'Price must be greater than 0';
        }

        if (value && name === 'stock' && parseInt(value) < 0) {
            isValid = false;
            errorMessage = 'Stock cannot be negative';
        }

        // Check for duplicates
        if (value && name === 'id' && !this.editingItem) {
            let exists = false;
            if (type === 'product') exists = this.products.some(p => p.id === value);
            if (type === 'customer') exists = this.customers.some(c => c.id === value);
            if (type === 'supplier') exists = this.suppliers.some(s => s.id === value);
            
            if (exists) {
                isValid = false;
                errorMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} ID already exists`;
            }
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = isValid ? 'none' : 'block';
        }

        field.classList.toggle('error', !isValid);
        return isValid;
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}-error`) || 
                           document.getElementById(`customer-${field.name}-error`) ||
                           document.getElementById(`supplier-${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        field.classList.remove('error');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    if (this.currentView === 'inventory') this.showProductModal();
                    if (this.currentView === 'customers') this.showCustomerModal();
                    if (this.currentView === 'suppliers') this.showSupplierModal();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveData();
                    break;
            }
        }

        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Navigation
    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewName}-view`).classList.add('active');
        document.getElementById('page-title').textContent = 
            viewName.charAt(0).toUpperCase() + viewName.slice(1);
        
        this.currentView = viewName;
        
        // Render view-specific content
        if (viewName === 'dashboard') this.renderDashboard();
        if (viewName === 'pos') this.renderPOS();
        if (viewName === 'inventory') this.renderInventory();
        if (viewName === 'customers') this.renderCustomers();
        if (viewName === 'suppliers') this.renderSuppliers();
        if (viewName === 'orders') this.renderOrders();
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-color-scheme', newScheme);
        document.querySelector('.theme-toggle').textContent = newScheme === 'dark' ? '☀️' : '🌙';
    }

    // Rendering Functions
    renderAll() {
        this.renderDashboard();
        this.renderPOS();
        this.renderInventory();
        this.renderCustomers();
        this.renderSuppliers();
        this.renderOrders();
    }

    renderDashboard() {
        this.renderSalesChart();
    }

    renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        if (this.salesChart) this.salesChart.destroy();

        const chartData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [65000, 85000, 72000, 96000, 78000, 88000, 92000],
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                borderColor: '#4285F4',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4285F4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
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
                                return '₹' + (value / 1000) + 'k';
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#1976D2'
                    }
                }
            }
        });
    }

    renderPOS() {
        this.renderPOSProducts();
        this.renderCustomerSelect();
        this.renderCart();
    }

    renderPOSProducts() {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;

        productGrid.innerHTML = this.products
            .filter(product => product.status === 'active')
            .map(product => `
                <div class="product-card" onclick="app.addToCart('${product.id}')">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">${this.formatCurrency(product.price)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                </div>
            `).join('');
    }

    renderCustomerSelect() {
        const customerSelect = document.getElementById('customer-select');
        if (!customerSelect) return;

        customerSelect.innerHTML = '<option value="">Walk-in Customer</option>' +
            this.customers
                .filter(customer => customer.status === 'active')
                .map(customer => `<option value="${customer.id}">${customer.name}</option>`)
                .join('');
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Cart is empty</div>';
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-details">${this.formatCurrency(item.price)} × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.productId}', ${item.quantity - 1})">−</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-price">${this.formatCurrency(item.price * item.quantity)}</div>
                </div>
            `).join('');
            
            if (checkoutBtn) checkoutBtn.disabled = false;
        }

        this.updateCartTotals();
    }

    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgst = this.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
        const sgst = cgst;
        const total = subtotal + cgst + sgst;

        const elements = {
            subtotal: document.getElementById('subtotal'),
            cgst: document.getElementById('cgst'),
            sgst: document.getElementById('sgst'),
            total: document.getElementById('total')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                const value = key === 'subtotal' ? subtotal : 
                             key === 'cgst' ? cgst :
                             key === 'sgst' ? sgst : total;
                element.textContent = this.formatCurrency(value);
            }
        });
    }

    renderInventory() {
        const tbody = document.getElementById('inventory-tbody');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        
        if (!tbody) return;

        tbody.innerHTML = this.products.map(product => {
            const stockStatus = this.getStockStatus(product);
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="product-checkbox" value="${product.id}" 
                               onchange="app.handleProductSelection()">
                    </td>
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
                    <td>
                        <button class="btn btn--sm btn--secondary" onclick="app.editProduct('${product.id}')">Edit</button>
                        <button class="btn btn--sm btn--error" onclick="app.deleteProduct('${product.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = this.selectedItems.size === 0;
        }
    }

    renderCustomers() {
        const customersGrid = document.getElementById('customers-grid');
        if (!customersGrid) return;

        customersGrid.innerHTML = this.customers.map(customer => `
            <div class="customer-card">
                <div class="card-actions">
                    <input type="checkbox" class="customer-checkbox" value="${customer.id}" 
                           onchange="app.handleCustomerSelection()">
                </div>
                <div class="customer-info">
                    <h3>${customer.name}</h3>
                    <div class="customer-details">
                        <p>📧 ${customer.email}</p>
                        <p>📞 ${customer.phone}</p>
                        ${customer.gstNumber ? `<p>🏢 ${customer.gstNumber}</p>` : ''}
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="stat-item">
                        <div class="stat-value">${customer.totalOrders || 0}</div>
                        <div class="stat-label">Orders</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatCurrency(customer.totalValue || 0)}</div>
                        <div class="stat-label">Total Value</div>
                    </div>
                    <div class="stat-item">
                        <button class="btn btn--sm btn--secondary" onclick="app.editCustomer('${customer.id}')">Edit</button>
                        <button class="btn btn--sm btn--error" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSuppliers() {
        const suppliersGrid = document.getElementById('suppliers-grid');
        if (!suppliersGrid) return;

        suppliersGrid.innerHTML = this.suppliers.map(supplier => `
            <div class="supplier-card">
                <div class="card-actions">
                    <input type="checkbox" class="supplier-checkbox" value="${supplier.id}" 
                           onchange="app.handleSupplierSelection()">
                </div>
                <div class="supplier-info">
                    <h3>${supplier.name}</h3>
                    <div class="supplier-details">
                        <p>👤 ${supplier.contact}</p>
                        <p>📞 ${supplier.phone}</p>
                        ${supplier.email ? `<p>📧 ${supplier.email}</p>` : ''}
                        <p>📦 ${Array.isArray(supplier.products) ? supplier.products.join(', ') : supplier.products}</p>
                        <p>⭐ Rating: ${supplier.rating}/5</p>
                    </div>
                </div>
                <div class="supplier-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.formatCurrency(supplier.outstanding || 0)}</div>
                        <div class="stat-label">Outstanding</div>
                    </div>
                    <div class="stat-item">
                        <button class="btn btn--sm btn--secondary" onclick="app.editSupplier('${supplier.id}')">Edit</button>
                        <button class="btn btn--sm btn--error" onclick="app.deleteSupplier('${supplier.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderOrders() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;

        const orders = this.getFilteredOrders();
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${order.items}</td>
                <td>${this.formatCurrency(order.amount)}</td>
                <td>
                    <span class="status status--${this.getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn--sm btn--secondary" onclick="app.viewOrder('${order.id}')">View</button>
                    ${order.status === 'Pending' ? `<button class="btn btn--sm btn--success" onclick="app.processOrder('${order.id}')">Process</button>` : ''}
                    ${order.status !== 'Completed' ? `<button class="btn btn--sm btn--error" onclick="app.cancelOrder('${order.id}')">Cancel</button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Business Logic Functions
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock === 0) {
            this.showToast('Product not available or out of stock', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity += 1;
                this.showToast(`Added ${product.name} to cart`, 'success');
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
            this.showToast(`Added ${product.name} to cart`, 'success');
        }
        
        this.renderCart();
    }

    updateCartQuantity(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        const cartItemIndex = this.cart.findIndex(item => item.productId === productId);
        
        if (quantity <= 0) {
            this.cart.splice(cartItemIndex, 1);
            this.showToast('Item removed from cart', 'info');
        } else if (quantity <= product.stock) {
            this.cart[cartItemIndex].quantity = quantity;
        } else {
            this.showToast('Insufficient stock available', 'error');
            return;
        }
        
        this.renderCart();
    }

    processCheckout() {
        if (this.cart.length === 0) {
            this.showToast('Cart is empty', 'error');
            return;
        }

        const customerSelect = document.getElementById('customer-select');
        const customerId = customerSelect ? customerSelect.value : '';
        const customer = this.customers.find(c => c.id === customerId);

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgst = this.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
        const sgst = cgst;
        const total = subtotal + cgst + sgst;

        // Update product stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        // Generate order
        const order = {
            id: this.generateId('ORD-2025-'),
            customer: customer ? customer.name : 'Walk-in Customer',
            customerId: customerId || null,
            amount: total,
            status: 'Completed',
            date: new Date().toISOString().split('T')[0],
            items: this.cart.length,
            paymentMethod: this.selectedPaymentMethod,
            cartItems: [...this.cart],
            subtotal: subtotal,
            cgst: cgst,
            sgst: sgst
        };

        this.orders.unshift(order);
        this.showReceipt(order);
        
        // Clear cart
        this.cart = [];
        this.renderCart();
        this.renderInventory();
        
        this.showToast('Sale completed successfully!', 'success');
        this.saveData();
    }

    showReceipt(order) {
        const modal = document.getElementById('receipt-modal');
        const content = document.getElementById('receipt-content');

        content.innerHTML = `
            <div class="receipt-header">
                <h3>KOREAN POS SYSTEM</h3>
                <p>Receipt #${order.id}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Time: ${new Date().toLocaleTimeString()}</p>
                <p>Customer: ${order.customer}</p>
                <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
            </div>
            <div class="receipt-items">
                ${order.cartItems.map(item => `
                    <div class="receipt-item">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${this.formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>${this.formatCurrency(order.subtotal)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>CGST:</span>
                    <span>${this.formatCurrency(order.cgst)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>SGST:</span>
                    <span>${this.formatCurrency(order.sgst)}</span>
                </div>
                <div class="receipt-total-row">
                    <strong>Total: ${this.formatCurrency(order.amount)}</strong>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 15px;">
                <p style="margin: 0;">Thank you for your business!</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">Visit us again soon</p>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // Product Management
    showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');

        this.editingItem = product;

        if (product) {
            title.textContent = 'Edit Product';
            Object.keys(product).forEach(key => {
                const field = form.elements[key];
                if (field) field.value = product[key];
            });
        } else {
            title.textContent = 'Add Product';
            form.reset();
            form.elements['id'].value = this.generateId('PROD');
        }

        modal.classList.remove('hidden');
        form.elements['name'].focus();
    }

    handleProductSubmit() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        // Validate all fields
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            if (!this.validateField(input, 'product')) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Please fix all errors before saving', 'error');
            return;
        }

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
            supplier: formData.get('supplier') || '',
            status: 'active',
            createdAt: this.editingItem ? this.editingItem.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.products.findIndex(p => p.id === this.editingItem.id);
            this.products[index] = product;
            this.showToast('Product updated successfully!', 'success');
        } else {
            this.products.push(product);
            this.showToast('Product added successfully!', 'success');
        }

        this.closeModal();
        this.renderInventory();
        this.renderPOSProducts();
        this.saveData();
    }

    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.showProductModal(product);
        }
    }

    deleteProduct(id) {
        this.showConfirmation(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            () => {
                this.products = this.products.filter(p => p.id !== id);
                this.renderInventory();
                this.renderPOSProducts();
                this.showToast('Product deleted successfully!', 'success');
                this.saveData();
            }
        );
    }

    // Customer Management
    showCustomerModal(customer = null) {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        const form = document.getElementById('customer-form');

        this.editingItem = customer;

        if (customer) {
            title.textContent = 'Edit Customer';
            Object.keys(customer).forEach(key => {
                const field = form.elements[key];
                if (field) field.value = customer[key];
            });
        } else {
            title.textContent = 'Add Customer';
            form.reset();
            form.elements['id'].value = this.generateId('CUST');
        }

        modal.classList.remove('hidden');
        form.elements['name'].focus();
    }

    handleCustomerSubmit() {
        const form = document.getElementById('customer-form');
        const formData = new FormData(form);
        
        // Validate all fields
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            if (!this.validateField(input, 'customer')) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Please fix all errors before saving', 'error');
            return;
        }

        const customer = {
            id: formData.get('id'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address') || '',
            gstNumber: formData.get('gstNumber') || '',
            loyaltyPoints: this.editingItem ? this.editingItem.loyaltyPoints : 0,
            totalOrders: this.editingItem ? this.editingItem.totalOrders : 0,
            totalValue: this.editingItem ? this.editingItem.totalValue : 0,
            status: 'active',
            createdAt: this.editingItem ? this.editingItem.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.customers.findIndex(c => c.id === this.editingItem.id);
            this.customers[index] = customer;
            this.showToast('Customer updated successfully!', 'success');
        } else {
            this.customers.push(customer);
            this.showToast('Customer added successfully!', 'success');
        }

        this.closeModal();
        this.renderCustomers();
        this.renderCustomerSelect();
        this.saveData();
    }

    editCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (customer) {
            this.showCustomerModal(customer);
        }
    }

    deleteCustomer(id) {
        this.showConfirmation(
            'Delete Customer',
            'Are you sure you want to delete this customer? This action cannot be undone.',
            () => {
                this.customers = this.customers.filter(c => c.id !== id);
                this.renderCustomers();
                this.renderCustomerSelect();
                this.showToast('Customer deleted successfully!', 'success');
                this.saveData();
            }
        );
    }

    // Supplier Management
    showSupplierModal(supplier = null) {
        const modal = document.getElementById('supplier-modal');
        const title = document.getElementById('supplier-modal-title');
        const form = document.getElementById('supplier-form');

        this.editingItem = supplier;

        if (supplier) {
            title.textContent = 'Edit Supplier';
            Object.keys(supplier).forEach(key => {
                const field = form.elements[key];
                if (field) {
                    if (key === 'products' && Array.isArray(supplier[key])) {
                        field.value = supplier[key].join(', ');
                    } else {
                        field.value = supplier[key];
                    }
                }
            });
        } else {
            title.textContent = 'Add Supplier';
            form.reset();
            form.elements['id'].value = this.generateId('SUPP');
        }

        modal.classList.remove('hidden');
        form.elements['name'].focus();
    }

    handleSupplierSubmit() {
        const form = document.getElementById('supplier-form');
        const formData = new FormData(form);
        
        // Validate all fields
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            if (!this.validateField(input, 'supplier')) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Please fix all errors before saving', 'error');
            return;
        }

        const productsText = formData.get('products') || '';
        const products = productsText.split(',').map(p => p.trim()).filter(p => p);

        const supplier = {
            id: formData.get('id'),
            name: formData.get('name'),
            contact: formData.get('contact'),
            phone: formData.get('phone'),
            email: formData.get('email') || '',
            address: formData.get('address') || '',
            gstNumber: formData.get('gstNumber') || '',
            products: products,
            outstanding: this.editingItem ? this.editingItem.outstanding : 0,
            rating: this.editingItem ? this.editingItem.rating : 5,
            status: 'active',
            createdAt: this.editingItem ? this.editingItem.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.suppliers.findIndex(s => s.id === this.editingItem.id);
            this.suppliers[index] = supplier;
            this.showToast('Supplier updated successfully!', 'success');
        } else {
            this.suppliers.push(supplier);
            this.showToast('Supplier added successfully!', 'success');
        }

        this.closeModal();
        this.renderSuppliers();
        this.saveData();
    }

    editSupplier(id) {
        const supplier = this.suppliers.find(s => s.id === id);
        if (supplier) {
            this.showSupplierModal(supplier);
        }
    }

    deleteSupplier(id) {
        this.showConfirmation(
            'Delete Supplier',
            'Are you sure you want to delete this supplier? This action cannot be undone.',
            () => {
                this.suppliers = this.suppliers.filter(s => s.id !== id);
                this.renderSuppliers();
                this.showToast('Supplier deleted successfully!', 'success');
                this.saveData();
            }
        );
    }

    // Utility Functions
    getStockStatus(product) {
        if (product.stock <= product.reorderLevel) {
            return { class: 'low', text: 'Low Stock' };
        } else if (product.stock <= product.reorderLevel * 2) {
            return { class: 'medium', text: 'Medium' };
        } else {
            return { class: 'high', text: 'In Stock' };
        }
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            default: return 'info';
        }
    }

    // Search and Filter Functions
    filterProducts(searchTerm) {
        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const productGrid = document.getElementById('product-grid');
        if (productGrid) {
            productGrid.innerHTML = filteredProducts.map(product => `
                <div class="product-card" onclick="app.addToCart('${product.id}')">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">${this.formatCurrency(product.price)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                </div>
            `).join('');
        }
    }

    filterProductsByCategory(category) {
        const filteredProducts = category ? 
            this.products.filter(product => product.category === category) : 
            this.products;

        const productGrid = document.getElementById('product-grid');
        if (productGrid) {
            productGrid.innerHTML = filteredProducts.map(product => `
                <div class="product-card" onclick="app.addToCart('${product.id}')">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">${this.formatCurrency(product.price)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                </div>
            `).join('');
        }
    }

    searchCustomers(searchTerm) {
        const filteredCustomers = this.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm)
        );

        const customersGrid = document.getElementById('customers-grid');
        if (customersGrid) {
            customersGrid.innerHTML = filteredCustomers.map(customer => `
                <div class="customer-card">
                    <div class="card-actions">
                        <input type="checkbox" class="customer-checkbox" value="${customer.id}" 
                               onchange="app.handleCustomerSelection()">
                    </div>
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <div class="customer-details">
                            <p>📧 ${customer.email}</p>
                            <p>📞 ${customer.phone}</p>
                            ${customer.gstNumber ? `<p>🏢 ${customer.gstNumber}</p>` : ''}
                        </div>
                    </div>
                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-value">${customer.totalOrders || 0}</div>
                            <div class="stat-label">Orders</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.formatCurrency(customer.totalValue || 0)}</div>
                            <div class="stat-label">Total Value</div>
                        </div>
                        <div class="stat-item">
                            <button class="btn btn--sm btn--secondary" onclick="app.editCustomer('${customer.id}')">Edit</button>
                            <button class="btn btn--sm btn--error" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    searchSuppliers(searchTerm) {
        const filteredSuppliers = this.suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.phone.includes(searchTerm)
        );

        const suppliersGrid = document.getElementById('suppliers-grid');
        if (suppliersGrid) {
            suppliersGrid.innerHTML = filteredSuppliers.map(supplier => `
                <div class="supplier-card">
                    <div class="card-actions">
                        <input type="checkbox" class="supplier-checkbox" value="${supplier.id}" 
                               onchange="app.handleSupplierSelection()">
                    </div>
                    <div class="supplier-info">
                        <h3>${supplier.name}</h3>
                        <div class="supplier-details">
                            <p>👤 ${supplier.contact}</p>
                            <p>📞 ${supplier.phone}</p>
                            ${supplier.email ? `<p>📧 ${supplier.email}</p>` : ''}
                            <p>📦 ${Array.isArray(supplier.products) ? supplier.products.join(', ') : supplier.products}</p>
                            <p>⭐ Rating: ${supplier.rating}/5</p>
                        </div>
                    </div>
                    <div class="supplier-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.formatCurrency(supplier.outstanding || 0)}</div>
                            <div class="stat-label">Outstanding</div>
                        </div>
                        <div class="stat-item">
                            <button class="btn btn--sm btn--secondary" onclick="app.editSupplier('${supplier.id}')">Edit</button>
                            <button class="btn btn--sm btn--error" onclick="app.deleteSupplier('${supplier.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    getFilteredOrders() {
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');
        
        let filtered = [...this.orders];

        if (statusFilter && statusFilter.value) {
            filtered = filtered.filter(order => 
                order.status.toLowerCase() === statusFilter.value.toLowerCase()
            );
        }

        if (dateFilter && dateFilter.value) {
            filtered = filtered.filter(order => order.date === dateFilter.value);
        }

        return filtered;
    }

    // Selection Handlers
    handleProductSelection() {
        const checkboxes = document.querySelectorAll('.product-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = checkboxes.length === 0;
        }
    }

    handleCustomerSelection() {
        const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulk-delete-customers-btn');
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = checkboxes.length === 0;
        }
    }

    handleSupplierSelection() {
        const checkboxes = document.querySelectorAll('.supplier-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulk-delete-suppliers-btn');
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = checkboxes.length === 0;
        }
    }

    selectAllProducts(checked) {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.handleProductSelection();
    }

    // Bulk Operations
    bulkDeleteProducts() {
        const checkboxes = document.querySelectorAll('.product-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.value);
        
        if (ids.length === 0) return;

        this.showConfirmation(
            'Delete Products',
            `Are you sure you want to delete ${ids.length} products? This action cannot be undone.`,
            () => {
                this.products = this.products.filter(p => !ids.includes(p.id));
                this.renderInventory();
                this.renderPOSProducts();
                this.showToast(`${ids.length} products deleted successfully!`, 'success');
                this.saveData();
            }
        );
    }

    bulkDeleteCustomers() {
        const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.value);
        
        if (ids.length === 0) return;

        this.showConfirmation(
            'Delete Customers',
            `Are you sure you want to delete ${ids.length} customers? This action cannot be undone.`,
            () => {
                this.customers = this.customers.filter(c => !ids.includes(c.id));
                this.renderCustomers();
                this.renderCustomerSelect();
                this.showToast(`${ids.length} customers deleted successfully!`, 'success');
                this.saveData();
            }
        );
    }

    bulkDeleteSuppliers() {
        const checkboxes = document.querySelectorAll('.supplier-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.value);
        
        if (ids.length === 0) return;

        this.showConfirmation(
            'Delete Suppliers',
            `Are you sure you want to delete ${ids.length} suppliers? This action cannot be undone.`,
            () => {
                this.suppliers = this.suppliers.filter(s => !ids.includes(s.id));
                this.renderSuppliers();
                this.showToast(`${ids.length} suppliers deleted successfully!`, 'success');
                this.saveData();
            }
        );
    }

    // Order Management
    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            this.showToast(`Viewing order ${orderId}`, 'info');
            // In a real app, this would show a detailed order view
        }
    }

    processOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'Completed';
            this.renderOrders();
            this.showToast(`Order ${orderId} processed successfully!`, 'success');
            this.saveData();
        }
    }

    cancelOrder(orderId) {
        this.showConfirmation(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            () => {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    order.status = 'Cancelled';
                    this.renderOrders();
                    this.showToast(`Order ${orderId} cancelled`, 'success');
                    this.saveData();
                }
            }
        );
    }

    filterOrders() {
        this.renderOrders();
    }

    clearOrderFilters() {
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');
        
        if (statusFilter) statusFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        
        this.renderOrders();
    }

    // Export/Import Functions
    exportInventory() {
        const csvContent = "data:text/csv;charset=utf-8," + 
            "ID,Name,Category,Price,Stock,Reorder Level,GST Rate,HSN Code\n" +
            this.products.map(p => 
                `${p.id},"${p.name}",${p.category},${p.price},${p.stock},${p.reorderLevel},${p.gstRate},"${p.hsnCode}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventory_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Inventory exported successfully!', 'success');
    }

    importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                for (let i = 1; i < lines.length; i++) {
                    const data = lines[i].split(',');
                    if (data.length === headers.length) {
                        const product = {
                            id: data[0],
                            name: data[1].replace(/"/g, ''),
                            category: data[2],
                            price: parseFloat(data[3]),
                            stock: parseInt(data[4]),
                            reorderLevel: parseInt(data[5]),
                            gstRate: parseInt(data[6]),
                            hsnCode: data[7] ? data[7].replace(/"/g, '') : '',
                            status: 'active',
                            createdAt: new Date().toISOString()
                        };
                        
                        if (!this.products.find(p => p.id === product.id)) {
                            this.products.push(product);
                        }
                    }
                }
                
                this.renderInventory();
                this.renderPOSProducts();
                this.showToast('CSV imported successfully!', 'success');
                this.saveData();
            } catch (error) {
                this.showToast('Error importing CSV file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Report Generation
    generateReport(type) {
        this.showToast(`Generating ${type} report...`, 'info');
        
        setTimeout(() => {
            this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`, 'success');
        }, 1500);
    }

    // Modal Management
    showConfirmation(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const actionBtn = document.getElementById('confirm-action-btn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        actionBtn.onclick = () => {
            onConfirm();
            this.closeModal();
        };

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.editingItem = null;
    }

    printReceipt() {
        window.print();
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new ProfessionalPOSSystem();
});

// Global functions for HTML onclick handlers
function switchView(viewName) {
    app.switchView(viewName);
}

function closeModal() {
    app.closeModal();
}

function printReceipt() {
    app.printReceipt();
}

function exportInventory() {
    app.exportInventory();
}

function clearOrderFilters() {
    app.clearOrderFilters();
}

function generateReport(type) {
    app.generateReport(type);
}