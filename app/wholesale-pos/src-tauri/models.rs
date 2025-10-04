use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub price: Decimal,
    pub cost_price: Option<Decimal>,
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit: String, // kg, piece, liter, etc.
    pub gst_rate: Decimal,
    pub hsn_code: Option<String>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub customer_code: String,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub gst_number: Option<String>,
    pub address: Address,
    pub credit_limit: Option<Decimal>,
    pub outstanding_balance: Decimal,
    pub is_active: bool,
    pub customer_type: CustomerType,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Address {
    pub street: String,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CustomerType {
    Retail,
    Wholesale,
    Distributor,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Order {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub order_number: String,
    pub customer_id: ObjectId,
    pub customer_info: CustomerInfo,
    pub items: Vec<OrderItem>,
    pub subtotal: Decimal,
    pub discount: Option<Decimal>,
    pub cgst: Decimal,
    pub sgst: Decimal,
    pub igst: Option<Decimal>,
    pub total_amount: Decimal,
    pub payment_status: PaymentStatus,
    pub order_status: OrderStatus,
    pub payment_method: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerInfo {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub gst_number: Option<String>,
    pub address: Address,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItem {
    pub product_id: ObjectId,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub discount: Option<Decimal>,
    pub gst_rate: Decimal,
    pub total_price: Decimal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PaymentStatus {
    Pending,
    Partial,
    Paid,
    Overdue,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum OrderStatus {
    Draft,
    Confirmed,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryItem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub product_id: ObjectId,
    pub sku: String,
    pub current_stock: i32,
    pub reserved_stock: i32,
    pub available_stock: i32,
    pub min_stock_level: i32,
    pub max_stock_level: Option<i32>,
    pub reorder_point: i32,
    pub reorder_quantity: Option<i32>,
    pub last_updated: DateTime<Utc>,
    pub movements: Vec<StockMovement>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockMovement {
    pub movement_type: MovementType,
    pub quantity: i32,
    pub reference: String, // Order ID, Purchase ID, etc.
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MovementType {
    Sale,
    Purchase,
    Return,
    Adjustment,
    Damage,
    Transfer,
}

// DTOs for API responses
#[derive(Debug, Serialize, Deserialize)]
pub struct ProductCreateRequest {
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub price: Decimal,
    pub cost_price: Option<Decimal>,
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit: String,
    pub gst_rate: Decimal,
    pub hsn_code: Option<String>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerCreateRequest {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub gst_number: Option<String>,
    pub address: Address,
    pub credit_limit: Option<Decimal>,
    pub customer_type: CustomerType,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderCreateRequest {
    pub customer_id: String,
    pub items: Vec<OrderItemRequest>,
    pub discount: Option<Decimal>,
    pub payment_method: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderItemRequest {
    pub product_id: String,
    pub quantity: i32,
    pub discount: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GstCalculation {
    pub base_amount: Decimal,
    pub gst_rate: Decimal,
    pub cgst: Decimal,
    pub sgst: Decimal,
    pub igst: Option<Decimal>,
    pub total_amount: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalesReport {
    pub period: String,
    pub total_sales: Decimal,
    pub total_orders: i64,
    pub average_order_value: Decimal,
    pub top_products: Vec<ProductSales>,
    pub sales_by_month: Vec<MonthlySales>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductSales {
    pub product_id: ObjectId,
    pub sku: String,
    pub name: String,
    pub quantity_sold: i32,
    pub total_revenue: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlySales {
    pub month: String,
    pub total_sales: Decimal,
    pub order_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReport {
    pub total_products: i64,
    pub low_stock_items: i64,
    pub out_of_stock_items: i64,
    pub total_inventory_value: Decimal,
    pub items: Vec<InventoryReportItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReportItem {
    pub sku: String,
    pub name: String,
    pub current_stock: i32,
    pub min_stock_level: i32,
    pub stock_value: Decimal,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub total_products: u64,
    pub total_customers: u64,
    pub total_orders: u64,
    pub pending_orders: u64,
    pub low_stock_items: u64,
    pub database_health: bool,
}

// Error types
#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("MongoDB error: {0}")]
    MongoError(#[from] mongodb::error::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] mongodb::bson::ser::Error),
    
    #[error("Deserialization error: {0}")]
    DeserializationError(#[from] mongodb::bson::de::Error),
    
    #[error("Product not found")]
    ProductNotFound,
    
    #[error("Customer not found")]
    CustomerNotFound,
    
    #[error("Order not found")]
    OrderNotFound,
    
    #[error("Insufficient stock for product: {sku}")]
    InsufficientStock { sku: String },
    
    #[error("Duplicate SKU: {sku}")]
    DuplicateSku { sku: String },
    
    #[error("Invalid GST rate: {rate}")]
    InvalidGstRate { rate: Decimal },
}

pub type DatabaseResult<T> = Result<T, DatabaseError>;