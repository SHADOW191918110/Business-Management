// Application State
class AppState {
    constructor() {
        this.products = [
            {
                id: "RICE001",
                name: "Basmati Rice 25kg",
                category: "Grains",
                price: 2500,
                stock: 150,
                reorderLevel: 50,
                gstRate: 5,
                hsnCode: "1006",
                supplier: "ABC Food Distributors"
            },
            {
                id: "FLR002", 
                name: "Wheat Flour 10kg",
                category: "Grains",
                price: 850,
                stock: 15,
                reorderLevel: 50,
                gstRate: 5,
                hsnCode: "1101",
                supplier: "ABC Food Distributors"
            },
            {
                id: "OIL003",
                name: "Cooking Oil 5L",
                category: "Oils",
                price: 450,
                stock: 80,
                reorderLevel: 30,
                gstRate: 18,
                hsnCode: "1507",
                supplier: "Quality Spices Ltd"
            }
        ];

        this.customers = [
            {
                id: "CUST001",
                name: "Raj Traders Pvt Ltd",
                email: "raj@traders.com",
                phone: "+91 98765 43210",
                gstNumber: "27AABCU9603R1ZX",
                totalOrders: 47,
                totalValue: 1245678,
                lastOrder: "2025-09-28"
            },
            {
                id: "CUST002",
                name: "Modern Grocery Store",
                email: "info@moderngrocery.com", 
                phone: "+91 87654 32109",
                gstNumber: "29GZNPK7525M1ZF",
                totalOrders: 32,
                totalValue: 867543,
                lastOrder: "2025-09-25"
            }
        ];

        this.suppliers = [
            {
                id: "SUPP001",
                name: "ABC Food Distributors",
                contact: "Rahul Sharma",
                phone: "+91 99887 76655",
                products: ["Rice", "Wheat", "Pulses"],
                outstanding: 85000,
                rating: 5
            },
            {
                id: "SUPP002",
                name: "Quality Spices Ltd",
                contact: "Priya Patel", 
                phone: "+91 88776 65544",
                products: ["Spices", "Condiments"],
                outstanding: 42500,
                rating: 4
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
                items: 12
            },
            {
                id: "ORD-2025-0002", 
                customer: "Modern Grocery Store",
                customerId: "CUST002",
                amount: 23450,
                status: "Pending",
                date: "2025-09-28",
                items: 8
            }
        ];

        this.cart = [];
        this.selectedPaymentMethod = 'cash';
        this.currentView = 'dashboard';
        this.editingProduct = null;
        this.salesChart = null;
    }

    // Product methods
    addProduct(product) {
        this.products.push(product);
        this.renderInventory();
        this.renderPOSProducts();
    }

    updateProduct(id, updatedProduct) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedProduct };
            this.renderInventory();
            this.renderPOSProducts();
        }
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.renderInventory();
        this.renderPOSProducts();
    }

    // Cart methods
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock === 0) {
            alert('Product not available or out of stock');
            return;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity += 1;
            } else {
                alert('Insufficient stock available');
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
    }

    updateCartQuantity(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        const cartItem = this.cart.find(item => item.productId === productId);
        
        if (quantity <= 0) {
            this.cart = this.cart.filter(item => item.productId !== productId);
        } else if (quantity <= product.stock) {
            cartItem.quantity = quantity;
        } else {
            alert('Insufficient stock available');
            return;
        }
        this.renderCart();
    }

    clearCart() {
        this.cart = [];
        this.renderCart();
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    generateId(prefix) {
        return `${prefix}${Date.now()}`;
    }

    // Render methods
    renderInventory() {
        if (document.getElementById('inventory-tbody')) {
            renderInventory();
        }
    }

    renderPOSProducts() {
        if (document.getElementById('product-grid')) {
            renderPOSProducts();
        }
    }

    renderCart() {
        if (document.getElementById('cart-items')) {
            renderCart();
        }
    }
}

// Initialize app state
const app = new AppState();

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupThemeToggle();
    setupPOS();
    setupModals();
    setupInventory();
    
    // Initial renders
    renderDashboard();
    renderPOSProducts();
    renderCart();
    renderInventory();
    renderCustomers();
    renderSuppliers();
    renderOrders();
}

// Navigation
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    pageTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    
    app.currentView = viewName;
    
    // Render view-specific content
    if (viewName === 'dashboard') {
        renderDashboard();
    }
}

// Theme Toggle
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-color-scheme', newScheme);
        themeToggle.textContent = newScheme === 'dark' ? '☀️' : '🌙';
    });
}

// Dashboard
function renderDashboard() {
    // Update KPIs
    document.getElementById('total-revenue').textContent = app.formatCurrency(2467890);
    document.getElementById('orders-today').textContent = '147';
    document.getElementById('active-customers').textContent = '2,847';
    document.getElementById('inventory-value').textContent = app.formatCurrency(1823450);
    
    // Render sales chart
    renderSalesChart();
}

function renderSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (app.salesChart) {
        app.salesChart.destroy();
    }
    
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Sales',
            data: [65000, 85000, 72000, 96000, 78000, 88000, 92000],
            backgroundColor: '#1FB8CD',
            borderColor: '#1FB8CD',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };
    
    app.salesChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
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
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// POS System
function setupPOS() {
    // Product search
    const productSearch = document.querySelector('.product-search');
    productSearch.addEventListener('input', (e) => {
        filterProducts(e.target.value);
    });
    
    // Category filter
    const categoryFilter = document.querySelector('.category-filter');
    categoryFilter.addEventListener('change', (e) => {
        filterProductsByCategory(e.target.value);
    });
    
    // Payment method selection
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            app.selectedPaymentMethod = btn.dataset.method;
            updateCheckoutButton();
        });
    });
    
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', processCheckout);
    
    // Populate customer select
    renderCustomerSelect();
}

function renderPOSProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = app.products.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-price">${app.formatCurrency(product.price)}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
        </div>
    `).join('');
}

function filterProducts(searchTerm) {
    const filteredProducts = app.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-price">${app.formatCurrency(product.price)}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
        </div>
    `).join('');
}

function filterProductsByCategory(category) {
    const filteredProducts = category ? 
        app.products.filter(product => product.category === category) : 
        app.products;
    
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-price">${app.formatCurrency(product.price)}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
        </div>
    `).join('');
}

function renderCustomerSelect() {
    const customerSelect = document.getElementById('customer-select');
    if (!customerSelect) return;
    
    customerSelect.innerHTML = '<option value="">Select Customer</option>' +
        app.customers.map(customer => 
            `<option value="${customer.id}">${customer.name}</option>`
        ).join('');
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    if (app.cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Cart is empty</div>';
    } else {
        cartItems.innerHTML = app.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">${app.formatCurrency(item.price)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-price">${app.formatCurrency(item.price * item.quantity)}</div>
            </div>
        `).join('');
    }
    
    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = app.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cgst = app.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
    const sgst = cgst; // Same as CGST
    const total = subtotal + cgst + sgst;
    
    const subtotalEl = document.getElementById('subtotal');
    const cgstEl = document.getElementById('cgst');
    const sgstEl = document.getElementById('sgst');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = app.formatCurrency(subtotal);
    if (cgstEl) cgstEl.textContent = app.formatCurrency(cgst);
    if (sgstEl) sgstEl.textContent = app.formatCurrency(sgst);
    if (totalEl) totalEl.textContent = app.formatCurrency(total);
    
    updateCheckoutButton();
}

function updateCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = app.cart.length === 0;
    }
}

function processCheckout() {
    if (app.cart.length === 0) return;
    
    const customerSelect = document.getElementById('customer-select');
    const customerId = customerSelect ? customerSelect.value : '';
    const customer = app.customers.find(c => c.id === customerId);
    
    const subtotal = app.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cgst = app.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate / 200), 0);
    const sgst = cgst;
    const total = subtotal + cgst + sgst;
    
    // Update product stock
    app.cart.forEach(item => {
        const product = app.products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Generate order
    const order = {
        id: app.generateId('ORD-2025-'),
        customer: customer ? customer.name : 'Walk-in Customer',
        customerId: customerId || null,
        amount: total,
        status: 'Completed',
        date: new Date().toISOString().split('T')[0],
        items: app.cart.length,
        paymentMethod: app.selectedPaymentMethod,
        cartItems: [...app.cart]
    };
    
    app.orders.unshift(order);
    
    // Show receipt
    showReceipt(order, subtotal, cgst, sgst, total);
    
    // Clear cart
    app.clearCart();
    
    // Update displays
    renderInventory();
    renderOrders();
}

function showReceipt(order, subtotal, cgst, sgst, total) {
    const modal = document.getElementById('receipt-modal');
    const content = document.getElementById('receipt-content');
    
    content.innerHTML = `
        <div class="receipt-header">
            <h3>WHOLESALE POS</h3>
            <p>Receipt #${order.id}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
        </div>
        <div class="receipt-items">
            ${order.cartItems.map(item => `
                <div class="receipt-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>${app.formatCurrency(item.price * item.quantity)}</span>
                </div>
            `).join('')}
        </div>
        <div class="receipt-totals">
            <div class="receipt-total-row">
                <span>Subtotal:</span>
                <span>${app.formatCurrency(subtotal)}</span>
            </div>
            <div class="receipt-total-row">
                <span>CGST:</span>
                <span>${app.formatCurrency(cgst)}</span>
            </div>
            <div class="receipt-total-row">
                <span>SGST:</span>
                <span>${app.formatCurrency(sgst)}</span>
            </div>
            <div class="receipt-total-row">
                <strong>Total: ${app.formatCurrency(total)}</strong>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <p>Thank you for your business!</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Inventory Management
function setupInventory() {
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            showProductModal();
        });
    }
}

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = app.products.map(product => {
        const stockStatus = getStockStatus(product);
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
                <td>${app.formatCurrency(product.price)}</td>
                <td>
                    <button class="btn btn--sm btn--secondary" onclick="editProduct('${product.id}')">Edit</button>
                    <button class="btn btn--sm btn--outline" onclick="deleteProduct('${product.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStockStatus(product) {
    if (product.stock <= product.reorderLevel) {
        return { class: 'low', text: 'Low Stock' };
    } else if (product.stock <= product.reorderLevel * 2) {
        return { class: 'medium', text: 'Medium' };
    } else {
        return { class: 'high', text: 'In Stock' };
    }
}

function editProduct(id) {
    const product = app.products.find(p => p.id === id);
    if (product) {
        app.editingProduct = product;
        showProductModal(product);
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        app.deleteProduct(id);
    }
}

// Customer Management
function renderCustomers() {
    const customersGrid = document.getElementById('customers-grid');
    if (!customersGrid) return;
    
    customersGrid.innerHTML = app.customers.map(customer => `
        <div class="customer-card">
            <div class="customer-info">
                <h3>${customer.name}</h3>
                <div class="customer-details">
                    <p>📧 ${customer.email}</p>
                    <p>📞 ${customer.phone}</p>
                    <p>🏢 ${customer.gstNumber}</p>
                </div>
            </div>
            <div class="customer-stats">
                <div class="stat-item">
                    <div class="stat-value">${customer.totalOrders}</div>
                    <div class="stat-label">Orders</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${app.formatCurrency(customer.totalValue)}</div>
                    <div class="stat-label">Total Value</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Supplier Management
function renderSuppliers() {
    const suppliersGrid = document.getElementById('suppliers-grid');
    if (!suppliersGrid) return;
    
    suppliersGrid.innerHTML = app.suppliers.map(supplier => `
        <div class="supplier-card">
            <div class="supplier-info">
                <h3>${supplier.name}</h3>
                <div class="supplier-details">
                    <p>👤 ${supplier.contact}</p>
                    <p>📞 ${supplier.phone}</p>
                    <p>📦 ${supplier.products.join(', ')}</p>
                    <p>⭐ Rating: ${supplier.rating}/5</p>
                </div>
            </div>
            <div class="supplier-stats">
                <div class="stat-item">
                    <div class="stat-value">${app.formatCurrency(supplier.outstanding)}</div>
                    <div class="stat-label">Outstanding</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Order Management
function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = app.orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.date}</td>
            <td>${order.items}</td>
            <td>${app.formatCurrency(order.amount)}</td>
            <td>
                <span class="status status--${order.status.toLowerCase() === 'completed' ? 'success' : order.status.toLowerCase() === 'pending' ? 'warning' : 'error'}">
                    ${order.status}
                </span>
            </td>
            <td>
                <button class="btn btn--sm btn--secondary">View</button>
                ${order.status === 'Pending' ? '<button class="btn btn--sm btn--primary">Process</button>' : ''}
            </td>
        </tr>
    `).join('');
}

// Modal Management
function setupModals() {
    // Close modal buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // Product form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

function showProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
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
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    app.editingProduct = null;
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const product = {
        id: formData.get('id'),
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        reorderLevel: parseInt(formData.get('reorderLevel')),
        gstRate: parseInt(formData.get('gstRate')),
        hsnCode: formData.get('hsnCode') || '',
        supplier: formData.get('supplier') || ''
    };
    
    if (app.editingProduct) {
        app.updateProduct(app.editingProduct.id, product);
    } else {
        // Check if product ID already exists
        if (app.products.find(p => p.id === product.id)) {
            alert('Product ID already exists!');
            return;
        }
        app.addProduct(product);
    }
    
    closeModal();
}

// Global functions for HTML onclick handlers
function addToCart(productId) {
    app.addToCart(productId);
}

function updateCartQuantity(productId, quantity) {
    app.updateCartQuantity(productId, quantity);
}

function editProduct(id) {
    const product = app.products.find(p => p.id === id);
    if (product) {
        app.editingProduct = product;
        showProductModal(product);
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        app.deleteProduct(id);
    }
}