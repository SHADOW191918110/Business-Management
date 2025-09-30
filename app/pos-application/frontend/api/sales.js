/**
 * Sales API methods for POS transactions
 */

class SalesAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    /**
     * Process a sale transaction
     */
    async processSale(saleData) {
        try {
            // Validate sale data
            this.validateSaleData(saleData);
            
            // Calculate totals
            const processedSale = this.calculateSaleTotals(saleData);
            
            // Send to backend
            const sale = await this.api.post('/sales', processedSale);
            
            this.api.showNotification('Sale processed successfully!', 'success');
            
            // Update local inventory
            await this.updateLocalInventory(saleData.items);
            
            // Store sale locally for offline access
            await this.storeSaleLocally(sale);
            
            return sale;
        } catch (error) {
            console.error('Failed to process sale:', error);
            
            // If offline, store in pending queue
            if (!this.api.isOnline) {
                const offlineSale = await this.storeOfflineSale(saleData);
                this.api.showNotification('Sale saved offline. Will sync when online.', 'warning');
                return offlineSale;
            }
            
            throw error;
        }
    }
    
    /**
     * Get sales history
     */
    async getSales(filters = {}) {
        try {
            const sales = await this.api.get('/sales', filters);
            return sales;
        } catch (error) {
            console.error('Failed to fetch sales:', error);
            // Fallback to local sales
            return await this.getLocalSales(filters);
        }
    }
    
    /**
     * Get daily sales report
     */
    async getDailyReport(date = new Date().toISOString().split('T')[0]) {
        try {
            const report = await this.api.get('/sales/reports/daily', { date });
            return report;
        } catch (error) {
            console.error('Failed to fetch daily report:', error);
            throw error;
        }
    }
    
    /**
     * Get monthly sales report
     */
    async getMonthlyReport(year, month) {
        try {
            const report = await this.api.get('/sales/reports/monthly', { year, month });
            return report;
        } catch (error) {
            console.error('Failed to fetch monthly report:', error);
            throw error;
        }
    }
    
    /**
     * Calculate sale totals including GST
     */
    calculateSaleTotals(saleData) {
        let subtotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        
        const processedItems = saleData.items.map(item => {
            const itemTotal = item.quantity * item.price;
            const gstAmount = (itemTotal * item.gst_rate) / 100;
            
            subtotal += itemTotal;
            
            // For Indian GST system
            if (saleData.customer_state === saleData.store_state) {
                // Same state - CGST + SGST
                const cgst = gstAmount / 2;
                const sgst = gstAmount / 2;
                totalCGST += cgst;
                totalSGST += sgst;
                
                return {
                    ...item,
                    total: itemTotal,
                    cgst: cgst,
                    sgst: sgst,
                    igst: 0
                };
            } else {
                // Different state - IGST
                totalIGST += gstAmount;
                
                return {
                    ...item,
                    total: itemTotal,
                    cgst: 0,
                    sgst: 0,
                    igst: gstAmount
                };
            }
        });
        
        return {
            ...saleData,
            items: processedItems,
            subtotal: subtotal,
            cgst_amount: totalCGST,
            sgst_amount: totalSGST,
            igst_amount: totalIGST,
            total_amount: subtotal + totalCGST + totalSGST + totalIGST,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Validate sale data
     */
    validateSaleData(saleData) {
        if (!saleData.items || saleData.items.length === 0) {
            throw new Error('Sale must contain at least one item');
        }
        
        if (!saleData.payment_method) {
            throw new Error('Payment method is required');
        }
        
        const validPaymentMethods = ['cash', 'card', 'upi', 'net_banking'];
        if (!validPaymentMethods.includes(saleData.payment_method)) {
            throw new Error('Invalid payment method');
        }
        
        // Validate each item
        for (const item of saleData.items) {
            if (!item.product_id || !item.quantity || !item.price) {
                throw new Error('Each item must have product_id, quantity, and price');
            }
            
            if (item.quantity <= 0) {
                throw new Error('Item quantity must be positive');
            }
            
            if (item.price < 0) {
                throw new Error('Item price cannot be negative');
            }
        }
        
        return true;
    }
    
    /**
     * Update local inventory after sale
     */
    async updateLocalInventory(saleItems) {
        try {
            const db = await this.getProductsDB();
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            for (const item of saleItems) {
                const product = await store.get(item.product_id);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    await store.put(product);
                }
            }
        } catch (error) {
            console.warn('Failed to update local inventory:', error);
        }
    }
    
    /**
     * Store sale locally
     */
    async storeSaleLocally(sale) {
        try {
            const db = await this.getSalesDB();
            const transaction = db.transaction(['sales'], 'readwrite');
            const store = transaction.objectStore('sales');
            await store.put(sale);
        } catch (error) {
            console.warn('Failed to store sale locally:', error);
        }
    }
    
    /**
     * Store offline sale
     */
    async storeOfflineSale(saleData) {
        try {
            const offlineSale = {
                ...this.calculateSaleTotals(saleData),
                id: `offline_${Date.now()}`,
                status: 'pending_sync',
                offline: true
            };
            
            const db = await this.getSalesDB();
            const transaction = db.transaction(['offline_sales'], 'readwrite');
            const store = transaction.objectStore('offline_sales');
            await store.put(offlineSale);
            
            return offlineSale;
        } catch (error) {
            console.error('Failed to store offline sale:', error);
            throw error;
        }
    }
    
    /**
     * Get local sales
     */
    async getLocalSales(filters = {}) {
        try {
            const db = await this.getSalesDB();
            const transaction = db.transaction(['sales'], 'readonly');
            const store = transaction.objectStore('sales');
            const sales = await store.getAll();
            
            // Apply basic filtering
            return this.filterSales(sales, filters);
        } catch (error) {
            console.warn('Failed to get local sales:', error);
            return [];
        }
    }
    
    /**
     * Filter sales based on criteria
     */
    filterSales(sales, filters) {
        let filtered = [...sales];
        
        if (filters.start_date) {
            const startDate = new Date(filters.start_date);
            filtered = filtered.filter(sale => new Date(sale.timestamp) >= startDate);
        }
        
        if (filters.end_date) {
            const endDate = new Date(filters.end_date);
            filtered = filtered.filter(sale => new Date(sale.timestamp) <= endDate);
        }
        
        if (filters.customer_id) {
            filtered = filtered.filter(sale => sale.customer_id === filters.customer_id);
        }
        
        if (filters.payment_method) {
            filtered = filtered.filter(sale => sale.payment_method === filters.payment_method);
        }
        
        // Sort by timestamp descending
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    /**
     * Database helpers
     */
    async getSalesDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('pos_sales', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
                    salesStore.createIndex('timestamp', 'timestamp');
                    salesStore.createIndex('customer_id', 'customer_id');
                }
                if (!db.objectStoreNames.contains('offline_sales')) {
                    db.createObjectStore('offline_sales', { keyPath: 'id' });
                }
            };
        });
    }
    
    async getProductsDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('pos_products', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// Initialize Sales API
window.salesAPI = new SalesAPI(window.apiClient);