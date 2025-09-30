use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub price: f64,
    pub stock: i32,
    pub reorder_level: i32,
    pub gst_rate: f64,
    pub hsn_code: String,
    pub barcode: Option<String>,
    pub supplier: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateProductRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub category: String,
    
    #[validate(range(min = 0.0))]
    pub price: f64,
    
    #[validate(range(min = 0))]
    pub stock: i32,
    
    #[validate(range(min = 0))]
    pub reorder_level: i32,
    
    #[validate(range(min = 0.0, max = 100.0))]
    pub gst_rate: f64,
    
    #[validate(length(min = 1, max = 20))]
    pub hsn_code: String,
    
    #[validate(length(max = 50))]
    pub barcode: Option<String>,
    
    #[validate(length(max = 255))]
    pub supplier: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateProductRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub category: Option<String>,
    
    #[validate(range(min = 0.0))]
    pub price: Option<f64>,
    
    #[validate(range(min = 0))]
    pub stock: Option<i32>,
    
    #[validate(range(min = 0))]
    pub reorder_level: Option<i32>,
    
    #[validate(range(min = 0.0, max = 100.0))]
    pub gst_rate: Option<f64>,
    
    #[validate(length(min = 1, max = 20))]
    pub hsn_code: Option<String>,
    
    #[validate(length(max = 50))]
    pub barcode: Option<String>,
    
    #[validate(length(max = 255))]
    pub supplier: Option<String>,
    
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductFilter {
    pub category: Option<String>,
    pub supplier: Option<String>,
    pub low_stock: Option<bool>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}