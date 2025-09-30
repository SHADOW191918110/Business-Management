use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{Reply, Rejection, reject};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;
use crate::database::{Database, Product, Customer, Sale, SaleItem};

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub sku: String,
    pub price: f64,
    pub cost: f64,
    pub stock: i32,
    pub category: String,
    pub gst_rate: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub gst_number: Option<String>,
    pub credit_limit: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateSaleRequest {
    pub customer_id: Option<String>,
    pub items: Vec<CreateSaleItemRequest>,
    pub payment_method: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSaleItemRequest {
    pub product_id: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub gst_rate: f64,
}

// Products
pub async fn get_products(db: Arc<Mutex<Database>>) -> Result<impl Reply, Rejection> {
    match db.lock().await.get_products().await {
        Ok(products) => Ok(warp::reply::json(&products)),
        Err(e) => {
            eprintln!("Error getting products: {}", e);
            Err(reject())
        }
    }
}

pub async fn create_product(
    req: CreateProductRequest,
    db: Arc<Mutex<Database>>
) -> Result<impl Reply, Rejection> {
    let product = Product {
        id: Uuid::new_v4().to_string(),
        name: req.name,
        sku: req.sku,
        price: req.price,
        cost: req.cost,
        stock: req.stock,
        category: req.category,
        gst_rate: req.gst_rate,
        created_at: Utc::now(),
    };

    match db.lock().await.create_product(product.clone()).await {
        Ok(_) => Ok(warp::reply::json(&product)),
        Err(e) => {
            eprintln!("Error creating product: {}", e);
            Err(reject())
        }
    }
}

// Customers
pub async fn get_customers(db: Arc<Mutex<Database>>) -> Result<impl Reply, Rejection> {
    match db.lock().await.get_customers().await {
        Ok(customers) => Ok(warp::reply::json(&customers)),
        Err(e) => {
            eprintln!("Error getting customers: {}", e);
            Err(reject())
        }
    }
}

pub async fn create_customer(
    req: CreateCustomerRequest,
    db: Arc<Mutex<Database>>
) -> Result<impl Reply, Rejection> {
    let customer = Customer {
        id: Uuid::new_v4().to_string(),
        name: req.name,
        phone: req.phone,
        email: req.email,
        address: req.address,
        gst_number: req.gst_number,
        credit_limit: req.credit_limit,
        created_at: Utc::now(),
    };

    match db.lock().await.create_customer(customer.clone()).await {
        Ok(_) => Ok(warp::reply::json(&customer)),
        Err(e) => {
            eprintln!("Error creating customer: {}", e);
            Err(reject())
        }
    }
}

// Sales
pub async fn get_sales(db: Arc<Mutex<Database>>) -> Result<impl Reply, Rejection> {
    match db.lock().await.get_sales(Some(100)).await {
        Ok(sales) => Ok(warp::reply::json(&sales)),
        Err(e) => {
            eprintln!("Error getting sales: {}", e);
            Err(reject())
        }
    }
}

pub async fn create_sale(
    req: CreateSaleRequest,
    db: Arc<Mutex<Database>>
) -> Result<impl Reply, Rejection> {
    let sale_id = Uuid::new_v4().to_string();
    
    // Calculate totals
    let mut subtotal = 0.0;
    let mut gst_amount = 0.0;
    
    let mut sale_items = Vec::new();
    
    for item_req in req.items {
        let item_total = item_req.unit_price * item_req.quantity as f64;
        let item_gst = item_total * (item_req.gst_rate / 100.0);
        
        subtotal += item_total;
        gst_amount += item_gst;
        
        let sale_item = SaleItem {
            id: Uuid::new_v4().to_string(),
            sale_id: sale_id.clone(),
            product_id: item_req.product_id,
            quantity: item_req.quantity,
            unit_price: item_req.unit_price,
            gst_rate: item_req.gst_rate,
            total: item_total + item_gst,
        };
        
        sale_items.push(sale_item);
    }
    
    let total = subtotal + gst_amount;
    
    let sale = Sale {
        id: sale_id,
        customer_id: req.customer_id,
        total,
        gst_amount,
        payment_method: req.payment_method,
        status: "completed".to_string(),
        created_at: Utc::now(),
    };

    match db.lock().await.create_sale(sale.clone(), sale_items).await {
        Ok(_) => Ok(warp::reply::json(&sale)),
        Err(e) => {
            eprintln!("Error creating sale: {}", e);
            Err(reject())
        }
    }
}

// Dashboard
pub async fn get_dashboard_stats(db: Arc<Mutex<Database>>) -> Result<impl Reply, Rejection> {
    match db.lock().await.get_dashboard_stats().await {
        Ok(stats) => Ok(warp::reply::json(&stats)),
        Err(e) => {
            eprintln!("Error getting dashboard stats: {}", e);
            Err(reject())
        }
    }
}