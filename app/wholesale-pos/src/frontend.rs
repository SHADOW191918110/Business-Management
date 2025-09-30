pub fn get_main_page() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wholesale POS - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .nav {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .nav button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            margin-right: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .nav button:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .nav button.active {
            background: #764ba2;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #666;
            font-size: 1rem;
        }
        
        .section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .section-content {
            padding: 2rem;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0 1rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .nav button {
                margin-bottom: 10px;
                display: block;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏪 Wholesale POS System</h1>
    </div>
    
    <div class="nav">
        <button onclick="location.href='/'" class="active">📊 Dashboard</button>
        <button onclick="location.href='/pos'">💰 Point of Sale</button>
        <button onclick="location.href='/inventory'">📦 Inventory</button>
    </div>
    
    <div class="container">
        <div class="stats-grid" id="statsGrid">
            <div class="loading">Loading dashboard stats...</div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">Recent Sales</h2>
            </div>
            <div class="section-content" id="recentSales">
                <div class="loading">Loading recent sales...</div>
            </div>
        </div>
    </div>

    <script>
        // Load dashboard data
        async function loadDashboard() {
            try {
                // Load stats
                const statsResponse = await fetch('/api/dashboard/stats');
                const stats = await statsResponse.json();
                
                document.getElementById('statsGrid').innerHTML = `
                    <div class="stat-card">
                        <div class="stat-number">₹${stats.today_sales.toFixed(2)}</div>
                        <div class="stat-label">Today's Sales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.total_products}</div>
                        <div class="stat-label">Total Products</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.low_stock_products}</div>
                        <div class="stat-label">Low Stock Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.total_customers}</div>
                        <div class="stat-label">Total Customers</div>
                    </div>
                `;
                
                // Load recent sales
                const salesResponse = await fetch('/api/sales');
                const sales = await salesResponse.json();
                
                if (sales.length === 0) {
                    document.getElementById('recentSales').innerHTML = '<p>No sales yet.</p>';
                } else {
                    const salesHtml = sales.slice(0, 10).map(sale => `
                        <div style="border-bottom: 1px solid #eee; padding: 1rem 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>Sale #${sale.id.substring(0, 8)}</strong>
                                    <div style="color: #666; font-size: 0.9rem;">
                                        ${new Date(sale.created_at).toLocaleDateString()} - ${sale.payment_method}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: bold; color: #28a745;">₹${sale.total.toFixed(2)}</div>
                                    <div style="color: #666; font-size: 0.9rem;">GST: ₹${sale.gst_amount.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    
                    document.getElementById('recentSales').innerHTML = salesHtml;
                }
                
            } catch (error) {
                console.error('Error loading dashboard:', error);
                document.getElementById('statsGrid').innerHTML = '<div class="loading">Error loading stats</div>';
                document.getElementById('recentSales').innerHTML = '<div class="loading">Error loading sales</div>';
            }
        }
        
        // Load dashboard on page load
        loadDashboard();
        
        // Refresh dashboard every 30 seconds
        setInterval(loadDashboard, 30000);
    </script>
</body>
</html>"#
}

pub fn get_pos_page() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wholesale POS - Point of Sale</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .nav {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .nav button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            margin-right: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .nav button:hover {
            background: #5a6fd8;
        }
        
        .nav button.active {
            background: #764ba2;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .pos-layout {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 2rem;
            height: calc(100vh - 200px);
        }
        
        .products-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .cart-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .section-title {
            font-size: 1.3rem;
            color: #333;
        }
        
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: calc(100vh - 280px);
        }
        
        .product-card {
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .product-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
        }
        
        .product-name {
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .product-sku {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.5rem;
        }
        
        .product-price {
            font-size: 1.2rem;
            color: #28a745;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .product-stock {
            font-size: 0.85rem;
            color: #666;
        }
        
        .cart-content {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
        }
        
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .cart-item-info {
            flex: 1;
        }
        
        .cart-item-name {
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        
        .cart-item-price {
            color: #666;
            font-size: 0.9rem;
        }
        
        .cart-item-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .qty-btn {
            background: #667eea;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .qty-btn:hover {
            background: #5a6fd8;
        }
        
        .cart-total {
            border-top: 2px solid #e9ecef;
            padding: 1.5rem;
            background: #f8f9fa;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .total-line.grand {
            font-weight: bold;
            font-size: 1.2rem;
            color: #333;
            border-top: 1px solid #dee2e6;
            padding-top: 0.5rem;
        }
        
        .checkout-btn {
            width: 100%;
            background: #28a745;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 1rem;
            transition: background 0.3s;
        }
        
        .checkout-btn:hover {
            background: #218838;
        }
        
        .checkout-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .empty-cart {
            text-align: center;
            color: #666;
            padding: 2rem;
        }
        
        @media (max-width: 768px) {
            .pos-layout {
                grid-template-columns: 1fr;
                height: auto;
            }
            
            .cart-section {
                order: -1;
                max-height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Point of Sale</h1>
    </div>
    
    <div class="nav">
        <button onclick="location.href='/'">📊 Dashboard</button>
        <button onclick="location.href='/pos'" class="active">💰 Point of Sale</button>
        <button onclick="location.href='/inventory'">📦 Inventory</button>
    </div>
    
    <div class="container">
        <div class="pos-layout">
            <div class="products-section">
                <div class="section-header">
                    <h2 class="section-title">Products</h2>
                </div>
                <div class="products-grid" id="productsGrid">
                    <div style="text-align: center; padding: 2rem; color: #666;">Loading products...</div>
                </div>
            </div>
            
            <div class="cart-section">
                <div class="section-header">
                    <h2 class="section-title">Shopping Cart</h2>
                </div>
                <div class="cart-content" id="cartContent">
                    <div class="empty-cart">Cart is empty</div>
                </div>
                <div class="cart-total" id="cartTotal" style="display: none;">
                    <div class="total-line">
                        <span>Subtotal:</span>
                        <span id="subtotal">₹0.00</span>
                    </div>
                    <div class="total-line">
                        <span>GST:</span>
                        <span id="gstAmount">₹0.00</span>
                    </div>
                    <div class="total-line grand">
                        <span>Total:</span>
                        <span id="grandTotal">₹0.00</span>
                    </div>
                    <button class="checkout-btn" onclick="checkout()">Complete Sale</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let products = [];
        let cart = [];
        
        // Load products
        async function loadProducts() {
            try {
                const response = await fetch('/api/products');
                products = await response.json();
                renderProducts();
            } catch (error) {
                console.error('Error loading products:', error);
                document.getElementById('productsGrid').innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Error loading products</div>';
            }
        }
        
        function renderProducts() {
            const html = products.map(product => `
                <div class="product-card" onclick="addToCart('${product.id}')">
                    <div class="product-name">${product.name}</div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                </div>
            `).join('');
            
            document.getElementById('productsGrid').innerHTML = html;
        }
        
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            if (!product || product.stock <= 0) return;
            
            const existingItem = cart.find(item => item.product.id === productId);
            
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity++;
                }
            } else {
                cart.push({
                    product: product,
                    quantity: 1
                });
            }
            
            renderCart();
        }
        
        function removeFromCart(productId) {
            cart = cart.filter(item => item.product.id !== productId);
            renderCart();
        }
        
        function updateQuantity(productId, change) {
            const item = cart.find(item => item.product.id === productId);
            if (!item) return;
            
            item.quantity += change;
            
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else if (item.quantity > item.product.stock) {
                item.quantity = item.product.stock;
            }
            
            renderCart();
        }
        
        function renderCart() {
            if (cart.length === 0) {
                document.getElementById('cartContent').innerHTML = '<div class="empty-cart">Cart is empty</div>';
                document.getElementById('cartTotal').style.display = 'none';
                return;
            }
            
            const cartHtml = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-price">₹${item.product.price.toFixed(2)} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item.product.id}', -1)">−</button>
                        <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.product.id}', 1)">+</button>
                        <button class="qty-btn" onclick="removeFromCart('${item.product.id}')" style="background: #dc3545; margin-left: 10px;">×</button>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('cartContent').innerHTML = cartHtml;
            
            // Calculate totals
            let subtotal = 0;
            let gstAmount = 0;
            
            cart.forEach(item => {
                const itemTotal = item.product.price * item.quantity;
                const itemGst = itemTotal * (item.product.gst_rate / 100);
                subtotal += itemTotal;
                gstAmount += itemGst;
            });
            
            const grandTotal = subtotal + gstAmount;
            
            document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
            document.getElementById('gstAmount').textContent = `₹${gstAmount.toFixed(2)}`;
            document.getElementById('grandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
            document.getElementById('cartTotal').style.display = 'block';
        }
        
        async function checkout() {
            if (cart.length === 0) return;
            
            const saleData = {
                customer_id: null,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.product.price,
                    gst_rate: item.product.gst_rate
                })),
                payment_method: 'cash'
            };
            
            try {
                const response = await fetch('/api/sales', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(saleData)
                });
                
                if (response.ok) {
                    alert('Sale completed successfully!');
                    cart = [];
                    renderCart();
                    loadProducts(); // Refresh stock levels
                } else {
                    alert('Error completing sale');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error completing sale');
            }
        }
        
        // Load products on page load
        loadProducts();
    </script>
</body>
</html>"#
}

pub fn get_inventory_page() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wholesale POS - Inventory</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .nav {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .nav button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            margin-right: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .nav button:hover {
            background: #5a6fd8;
        }
        
        .nav button.active {
            background: #764ba2;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #333;
        }
        
        .add-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .add-btn:hover {
            background: #218838;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        
        tbody tr:hover {
            background: #f8f9fa;
        }
        
        .stock-low {
            color: #dc3545;
            font-weight: bold;
        }
        
        .stock-medium {
            color: #ffc107;
            font-weight: bold;
        }
        
        .stock-good {
            color: #28a745;
            font-weight: bold;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 2rem;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close:hover {
            color: black;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .submit-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        
        .submit-btn:hover {
            background: #5a6fd8;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Inventory Management</h1>
    </div>
    
    <div class="nav">
        <button onclick="location.href='/'">📊 Dashboard</button>
        <button onclick="location.href='/pos'">💰 Point of Sale</button>
        <button onclick="location.href='/inventory'" class="active">📦 Inventory</button>
    </div>
    
    <div class="container">
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">Products</h2>
                <button class="add-btn" onclick="showAddProductModal()">+ Add Product</button>
            </div>
            <div class="table-container">
                <div id="productsTable" class="loading">Loading products...</div>
            </div>
        </div>
    </div>
    
    <!-- Add Product Modal -->
    <div id="addProductModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New Product</h3>
                <span class="close" onclick="hideAddProductModal()">&times;</span>
            </div>
            <form id="addProductForm" onsubmit="addProduct(event)">
                <div class="form-group">
                    <label>Product Name</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label>SKU</label>
                    <input type="text" id="productSku" required>
                </div>
                <div class="form-group">
                    <label>Price (₹)</label>
                    <input type="number" id="productPrice" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Cost (₹)</label>
                    <input type="number" id="productCost" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" id="productStock" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="productCategory" required>
                        <option value="">Select Category</option>
                        <option value="Grocery">Grocery</option>
                        <option value="Beverage">Beverage</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>GST Rate (%)</label>
                    <select id="productGst" required>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">Add Product</button>
            </form>
        </div>
    </div>

    <script>
        let products = [];
        
        // Load products
        async function loadProducts() {
            try {
                const response = await fetch('/api/products');
                products = await response.json();
                renderProductsTable();
            } catch (error) {
                console.error('Error loading products:', error);
                document.getElementById('productsTable').innerHTML = '<div class="loading">Error loading products</div>';
            }
        }
        
        function renderProductsTable() {
            if (products.length === 0) {
                document.getElementById('productsTable').innerHTML = '<div class="loading">No products found</div>';
                return;
            }
            
            const tableHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Cost</th>
                            <th>Stock</th>
                            <th>GST Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => {
                            let stockClass = 'stock-good';
                            if (product.stock < 10) stockClass = 'stock-low';
                            else if (product.stock < 50) stockClass = 'stock-medium';
                            
                            return `
                                <tr>
                                    <td><strong>${product.name}</strong></td>
                                    <td>${product.sku}</td>
                                    <td>${product.category}</td>
                                    <td>₹${product.price.toFixed(2)}</td>
                                    <td>₹${product.cost.toFixed(2)}</td>
                                    <td class="${stockClass}">${product.stock}</td>
                                    <td>${product.gst_rate}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
            
            document.getElementById('productsTable').innerHTML = tableHtml;
        }
        
        function showAddProductModal() {
            document.getElementById('addProductModal').style.display = 'block';
        }
        
        function hideAddProductModal() {
            document.getElementById('addProductModal').style.display = 'none';
            document.getElementById('addProductForm').reset();
        }
        
        async function addProduct(event) {
            event.preventDefault();
            
            const productData = {
                name: document.getElementById('productName').value,
                sku: document.getElementById('productSku').value,
                price: parseFloat(document.getElementById('productPrice').value),
                cost: parseFloat(document.getElementById('productCost').value),
                stock: parseInt(document.getElementById('productStock').value),
                category: document.getElementById('productCategory').value,
                gst_rate: parseFloat(document.getElementById('productGst').value)
            };
            
            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData)
                });
                
                if (response.ok) {
                    hideAddProductModal();
                    loadProducts(); // Refresh the table
                    alert('Product added successfully!');
                } else {
                    alert('Error adding product');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding product');
            }
        }
        
        // Load products on page load
        loadProducts();
    </script>
</body>
</html>"#
}