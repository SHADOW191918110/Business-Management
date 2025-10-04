import { invoke } from '@tauri-apps/api/tauri'

// Types
export interface Product {
  id?: string
  sku: string
  name: string
  description?: string
  category: string
  price: number
  cost_price?: number
  stock_quantity: number
  min_stock_level: number
  unit: string
  gst_rate: number
  hsn_code?: string
  barcode?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id?: string
  customer_code: string
  name: string
  email: string
  phone: string
  gst_number?: string
  address: Address
  credit_limit?: number
  outstanding_balance: number
  is_active: boolean
  customer_type: 'Retail' | 'Wholesale' | 'Distributor'
  created_at: string
  updated_at: string
}

export interface Address {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  id?: string
  order_number: string
  customer_id: string
  customer_info: CustomerInfo
  items: OrderItem[]
  subtotal: number
  discount?: number
  cgst: number
  sgst: number
  igst?: number
  total_amount: number
  payment_status: 'Pending' | 'Partial' | 'Paid' | 'Overdue'
  order_status: 'Draft' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  gst_number?: string
  address: Address
}

export interface OrderItem {
  product_id: string
  sku: string
  name: string
  quantity: number
  unit_price: number
  discount?: number
  gst_rate: number
  total_price: number
}

export interface GstCalculation {
  base_amount: number
  gst_rate: number
  cgst: number
  sgst: number
  igst?: number
  total_amount: number
}

export interface SystemStats {
  total_products: number
  total_customers: number
  total_orders: number
  pending_orders: number
  low_stock_items: number
  database_health: boolean
}

// Product API
export const productApi = {
  getAll: (): Promise<Product[]> => invoke('get_products'),
  
  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<Product> =>
    invoke('create_product', { productData: data }),
    
  update: (id: string, data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<Product> =>
    invoke('update_product', { productId: id, productData: data }),
    
  delete: (id: string): Promise<boolean> =>
    invoke('delete_product', { productId: id }),
    
  search: (query: string): Promise<Product[]> =>
    invoke('search_products', { query })
}

// Customer API
export const customerApi = {
  getAll: (): Promise<Customer[]> => invoke('get_customers'),
  
  create: (data: Omit<Customer, 'id' | 'customer_code' | 'outstanding_balance' | 'is_active' | 'created_at' | 'updated_at'>): Promise<Customer> =>
    invoke('create_customer', { customerData: data }),
    
  update: (id: string, data: Omit<Customer, 'id' | 'customer_code' | 'outstanding_balance' | 'is_active' | 'created_at' | 'updated_at'>): Promise<Customer> =>
    invoke('update_customer', { customerId: id, customerData: data }),
    
  delete: (id: string): Promise<boolean> =>
    invoke('delete_customer', { customerId: id })
}

// Order API
export const orderApi = {
  getAll: (): Promise<Order[]> => invoke('get_orders'),
  
  getById: (id: string): Promise<Order | null> =>
    invoke('get_order_by_id', { orderId: id }),
    
  create: (data: {
    customer_id: string
    items: { product_id: string; quantity: number; discount?: number }[]
    discount?: number
    payment_method?: string
    notes?: string
  }): Promise<Order> =>
    invoke('create_order', { orderData: data }),
    
  updateStatus: (id: string, status: string): Promise<Order> =>
    invoke('update_order', { orderId: id, status })
}

// Inventory API
export const inventoryApi = {
  getAll: (): Promise<any[]> => invoke('get_inventory'),
  
  getLowStock: (): Promise<Product[]> => invoke('get_low_stock_items'),
  
  update: (productId: string, quantity: number, movementType: string, reference: string): Promise<boolean> =>
    invoke('update_inventory', { productId, quantity, movementType, reference })
}

// GST and Calculations
export const calculationApi = {
  calculateGst: (baseAmount: number, gstRate: number): Promise<GstCalculation> =>
    invoke('calculate_gst', { baseAmount, gstRate }),
    
  calculateOrderTotal: (items: { product_id: string; quantity: number; discount?: number }[], discount?: number): Promise<number> =>
    invoke('calculate_order_total', { items, discount })
}

// Reports API
export const reportApi = {
  getSalesReport: (startDate: string, endDate: string): Promise<any> =>
    invoke('get_sales_report', { startDate, endDate }),
    
  getInventoryReport: (): Promise<any> =>
    invoke('get_inventory_report'),
    
  getCustomerReport: (): Promise<Customer[]> =>
    invoke('get_customer_report')
}

// System API
export const systemApi = {
  getStats: (): Promise<SystemStats> => invoke('get_system_stats'),
  
  backupData: (): Promise<string> => invoke('backup_data')
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Confirmed': 'bg-blue-100 text-blue-800',
    'Processing': 'bg-purple-100 text-purple-800',
    'Shipped': 'bg-indigo-100 text-indigo-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Paid': 'bg-green-100 text-green-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Partial': 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const validateGST = (gstNumber: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstRegex.test(gstNumber)
}

export const generateSKU = (name: string, category: string): string => {
  const namePrefix = name.substring(0, 3).toUpperCase()
  const categoryPrefix = category.substring(0, 2).toUpperCase()
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${namePrefix}${categoryPrefix}${randomNum}`
}