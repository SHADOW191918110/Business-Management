/**
 * Product API methods
 */

class ProductsAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    /**
     * Get all products with optional filtering
     */
    async getProducts(filters = {}) {
        try {
            const products = await this.api.get('/products', filters);
            return products;
        } catch (error) {
            console.error('Failed to fetch products:', error);
            throw error;
        }
    }
    
    /**
     * Get single product by ID
     */
    async getProduct(id) {
        try {
            const product = await this.api.get(`/products/${id}`);
            return product;
        } catch (error) {
            console.error('Failed to fetch product:', error);
            throw error;
        }
    }
    
    /**
     * Create new product
     */
    async createProduct(productData) {
        try {
            // Validate required fields
            this.validateProductData(productData);
            
            const product = await this.api.post('/products', productData);
            
            // Show success notification
            this.api.showNotification('Product created successfully!', 'success');
            
            // Update local IndexedDB cache
            await this.updateLocalProduct(product);
            
            return product;
        } catch (error) {
            console.error('Failed to create product:', error);
            
            // If offline, save to pending queue
            if (!this.api.isOnline) {
                await this.saveOfflineAction('create', productData);
                this.api.showNotification('Product saved offline. Will sync when online.', 'warning');
                return { ...productData, id: `offline_${Date.now()}`, offline: true };
            }
            
            throw error;
        }
    }
    
    /**
     * Update existing product
     */
    async updateProduct(id, productData) {
        try {
            this.validateProductData(productData, false); // Allow partial updates
            
            const product = await this.api.put(`/products/${id}`, productData);
            
            this.api.showNotification('Product updated successfully!', 'success');
            
            await this.updateLocalProduct(product);
            
            return product;
        } catch (error) {
            console.error('Failed to update product:', error);
            
            if (!this.api.isOnline) {
                await this.saveOfflineAction('update', { id, ...productData });
                this.api.showNotification('Update saved offline. Will sync when online.', 'warning');
                return { id, ...productData, offline: true };
            }
            
            throw error;
        }
    }
    
    /**
     * Delete product
     */
    async deleteProduct(id) {
        try {
            await this.api.delete(`/products/${id}`);
            
            this.api.showNotification('Product deleted successfully!', 'success');
            
            // Remove from local cache
            await this.removeLocalProduct(id);
            
            return true;
        } catch (error) {
            console.error('Failed to delete product:', error);
            
            if (!this.api.isOnline) {
                await this.saveOfflineAction('delete', { id });
                this.api.showNotification('Delete saved offline. Will sync when online.', 'warning');
                return true;
            }
            
            throw error;
        }
    }
    
    /**
     * Search products
     */
    async searchProducts(query) {
        try {
            const products = await this.api.get('/products/search', { search: query });
            return products;
        } catch (error) {
            console.error('Failed to search products:', error);
            // Fall back to local search if available
            return await this.searchLocalProducts(query);
        }
    }
    
    /**
     * Get product by barcode
     */
    async getProductByBarcode(barcode) {
        try {
            const product = await this.api.get(`/products/barcode/${barcode}`);
            return product;
        } catch (error) {
            console.error('Failed to fetch product by barcode:', error);
            throw error;
        }
    }
    
    /**
     * Validate product data
     */
    validateProductData(data, requireAll = true) {
        const required = ['name', 'category', 'price', 'stock', 'gst_rate', 'hsn_code'];
        const missing = [];
        
        if (requireAll) {
            for (const field of required) {
                if (!data[field] && data[field] !== 0) {
                    missing.push(field);
                }
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        // Validate data types and ranges
        if (data.price && (isNaN(data.price) || data.price < 0)) {
            throw new Error('Price must be a positive number');
        }
        
        if (data.stock && (isNaN(data.stock) || data.stock < 0)) {
            throw new Error('Stock must be a non-negative number');
        }
        
        if (data.gst_rate && (isNaN(data.gst_rate) || data.gst_rate < 0 || data.gst_rate > 100)) {
            throw new Error('GST rate must be between 0 and 100');
        }
        
        return true;
    }
    
    /**
     * Local IndexedDB operations for offline support
     */
    async updateLocalProduct(product) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            await store.put(product);
        } catch (error) {
            console.warn('Failed to update local product:', error);
        }
    }
    
    async removeLocalProduct(id) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            await store.delete(id);
        } catch (error) {
            console.warn('Failed to remove local product:', error);
        }
    }
    
    async searchLocalProducts(query) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const products = await store.getAll();
            
            const searchTerm = query.toLowerCase();
            return products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.barcode === query
            );
        } catch (error) {
            console.warn('Local search failed:', error);
            return [];
        }
    }
    
    async saveOfflineAction(action, data) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['offline_actions'], 'readwrite');
            const store = transaction.objectStore('offline_actions');
            
            await store.add({
                id: `${action}_${Date.now()}`,
                type: 'product',
                action: action,
                data: data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Failed to save offline action:', error);
        }
    }
    
    async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('pos_products', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('offline_actions')) {
                    db.createObjectStore('offline_actions', { keyPath: 'id' });
                }
            };
        });
    }
}

// Initialize Products API
window.productsAPI = new ProductsAPI(window.apiClient);