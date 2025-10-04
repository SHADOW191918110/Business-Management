use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use std::collections::HashMap;

// Product model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub sku: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_ja: Option<String>,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description_ja: Option<String>,
    pub category_id: ObjectId,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub barcode: Option<String>,
    #[serde(with = "rust_decimal::serde::float")]
    pub price: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub cost: Decimal,
    pub stock: i32,
    pub min_stock: i32,
    pub unit: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub tax_rate: Decimal,
    pub is_active: bool,
    #[serde(default)]
    pub images: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub variants: Vec<ProductVariant>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductVariant {
    pub name: String,
    pub value: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub price_adjustment: Decimal,
    pub stock: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub barcode: Option<String>,
}

// Category model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_ja: Option<String>,
    pub description: String,
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<ObjectId>,
    pub is_active: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Customer model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub customer_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<Address>,
    #[serde(with = "rust_decimal::serde::float")]
    pub loyalty_points: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_purchases: Decimal,
    pub customer_type: CustomerType,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub notes: Vec<CustomerNote>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub street: String,
    pub city: String,
    pub state: String,
    pub zip: String,
    pub country: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerNote {
    pub note: String,
    pub created_by: ObjectId,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CustomerType {
    #[serde(rename = "regular")]
    Regular,
    #[serde(rename = "vip")]
    Vip,
    #[serde(rename = "wholesale")]
    Wholesale,
    #[serde(rename = "employee")]
    Employee,
}

// Sale model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sale {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub sale_number: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_id: Option<ObjectId>,
    pub items: Vec<SaleItem>,
    #[serde(with = "rust_decimal::serde::float")]
    pub subtotal: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub tax_amount: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub discount_amount: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_amount: Decimal,
    pub payment: PaymentInfo,
    pub status: SaleStatus,
    pub cashier_id: ObjectId,
    pub notes: Option<String>,
    pub receipt_printed: bool,
    pub date: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleItem {
    pub product_id: ObjectId,
    pub sku: String,
    pub name: String,
    pub quantity: i32,
    #[serde(with = "rust_decimal::serde::float")]
    pub unit_price: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_price: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub tax_rate: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub tax_amount: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub discount_amount: Decimal,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentInfo {
    pub payment_method: PaymentMethod,
    #[serde(with = "rust_decimal::serde::float")]
    pub amount_paid: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub change_amount: Decimal,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(default)]
    pub split_payments: Vec<SplitPayment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitPayment {
    pub payment_method: PaymentMethod,
    #[serde(with = "rust_decimal::serde::float")]
    pub amount: Decimal,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaymentMethod {
    #[serde(rename = "cash")]
    Cash,
    #[serde(rename = "card")]
    Card,
    #[serde(rename = "digital")]
    Digital,
    #[serde(rename = "gift_card")]
    GiftCard,
    #[serde(rename = "loyalty_points")]
    LoyaltyPoints,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SaleStatus {
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "refunded")]
    Refunded,
    #[serde(rename = "partial_refund")]
    PartialRefund,
}

// Inventory model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub product_id: ObjectId,
    pub current_stock: i32,
    pub reserved_stock: i32,
    pub available_stock: i32,
    pub last_updated: DateTime<Utc>,
    pub movements: Vec<StockMovement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockMovement {
    pub movement_type: MovementType,
    pub quantity: i32,
    pub reason: String,
    pub reference_id: Option<ObjectId>,
    pub user_id: ObjectId,
    pub date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MovementType {
    #[serde(rename = "sale")]
    Sale,
    #[serde(rename = "purchase")]
    Purchase,
    #[serde(rename = "adjustment")]
    Adjustment,
    #[serde(rename = "return")]
    Return,
    #[serde(rename = "damage")]
    Damage,
    #[serde(rename = "transfer")]
    Transfer,
}

// User model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub is_active: bool,
    pub permissions: Vec<Permission>,
    pub profile: UserProfile,
    pub last_login: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub first_name: String,
    pub last_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    #[serde(rename = "admin")]
    Admin,
    #[serde(rename = "manager")]
    Manager,
    #[serde(rename = "cashier")]
    Cashier,
    #[serde(rename = "inventory")]
    Inventory,
    #[serde(rename = "reports")]
    Reports,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    #[serde(rename = "read_products")]
    ReadProducts,
    #[serde(rename = "write_products")]
    WriteProducts,
    #[serde(rename = "read_customers")]
    ReadCustomers,
    #[serde(rename = "write_customers")]
    WriteCustomers,
    #[serde(rename = "read_sales")]
    ReadSales,
    #[serde(rename = "write_sales")]
    WriteSales,
    #[serde(rename = "read_reports")]
    ReadReports,
    #[serde(rename = "read_users")]
    ReadUsers,
    #[serde(rename = "write_users")]
    WriteUsers,
    #[serde(rename = "system_settings")]
    SystemSettings,
    #[serde(rename = "backup_restore")]
    BackupRestore,
}

// Request/Response DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub user: Option<User>,
    pub token: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub filters: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: u64,
    pub page: u64,
    pub limit: u64,
    pub has_next: bool,
    pub has_prev: bool,
}

// Report models
#[derive(Debug, Serialize, Deserialize)]
pub struct SalesReport {
    pub period: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_sales: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_profit: Decimal,
    pub total_transactions: u64,
    pub average_transaction: Decimal,
    pub top_products: Vec<TopProduct>,
    pub sales_by_day: Vec<DailySales>,
    pub payment_methods: HashMap<String, Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TopProduct {
    pub product_id: ObjectId,
    pub name: String,
    pub quantity_sold: i32,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_revenue: Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailySales {
    pub date: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub sales: Decimal,
    pub transactions: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryReport {
    pub total_products: u64,
    pub low_stock_count: u64,
    pub out_of_stock_count: u64,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_value: Decimal,
    pub low_stock_items: Vec<LowStockItem>,
    pub category_breakdown: HashMap<String, CategoryStock>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LowStockItem {
    pub product_id: ObjectId,
    pub name: String,
    pub current_stock: i32,
    pub min_stock: i32,
    pub days_until_out: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryStock {
    pub total_products: u64,
    pub total_stock: i32,
    #[serde(with = "rust_decimal::serde::float")]
    pub total_value: Decimal,
}

// System models
#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub build_date: String,
    pub environment: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStatus {
    pub database_connected: bool,
    pub uptime: String,
    pub memory_usage: u64,
    pub cpu_usage: f32,
    pub disk_space: DiskSpace,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskSpace {
    pub total: u64,
    pub free: u64,
    pub used: u64,
    pub usage_percentage: f32,
}