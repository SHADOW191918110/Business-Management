# POS Application - Rust Backend Setup

## 🛠️ Backend Architecture

### **Technology Stack:**
- **Framework**: Actix-web 4.0 (High-performance web server)
- **Database**: PostgreSQL with SQLx (Type-safe SQL)
- **Authentication**: JWT tokens with bcrypt
- **Serialization**: Serde JSON
- **Logging**: tracing with structured logs
- **CORS**: For frontend communication
- **Environment**: dotenv for config management

## 📦 Cargo.toml Dependencies

```toml
[package]
name = "pos-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web framework
actix-web = "4.4"
actix-cors = "0.6"
actix-multipart = "0.6"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json"] }
uuid = { version = "1.0", features = ["v4", "serde"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }

# Authentication
jsonwebtoken = "9.2"
bcrypt = "0.15"

# Environment & Logging
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
dotenv = "0.15"
anyhow = "1.0"

# Validation
validator = { version = "0.16", features = ["derive"] }
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── main.rs                  # Application entry point
│   ├── lib.rs                   # Library root
│   ├── config/
│   │   ├── mod.rs
│   │   └── database.rs          # Database configuration
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── products.rs          # Product CRUD endpoints
│   │   ├── customers.rs         # Customer CRUD endpoints
│   │   ├── suppliers.rs         # Supplier CRUD endpoints
│   │   ├── sales.rs             # Sales transaction endpoints
│   │   ├── auth.rs              # Authentication endpoints
│   │   └── settings.rs          # Settings management
│   ├── models/
│   │   ├── mod.rs
│   │   ├── product.rs           # Product data models
│   │   ├── customer.rs          # Customer data models
│   │   ├── supplier.rs          # Supplier data models
│   │   ├── sale.rs              # Sales data models
│   │   ├── user.rs              # User & auth models
│   │   └── settings.rs          # Settings models
│   ├── services/
│   │   ├── mod.rs
│   │   ├── product_service.rs   # Business logic for products
│   │   ├── customer_service.rs  # Business logic for customers
│   │   ├── sales_service.rs     # Business logic for sales
│   │   └── auth_service.rs      # Authentication business logic
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs              # JWT authentication middleware
│   │   └── cors.rs              # CORS configuration
│   └── utils/
│       ├── mod.rs
│       ├── error.rs             # Error handling
│       └── validation.rs        # Input validation helpers
├── migrations/
│   ├── 20250929000001_create_users.sql
│   ├── 20250929000002_create_customers.sql
│   ├── 20250929000003_create_products.sql
│   ├── 20250929000004_create_suppliers.sql
│   ├── 20250929000005_create_categories.sql
│   ├── 20250929000006_create_sales.sql
│   ├── 20250929000007_create_sale_items.sql
│   └── 20250929000008_create_settings.sql
├── .env                         # Environment variables
├── Cargo.toml                   # Dependencies
└── README.md                    # Backend documentation
```

## 🔧 Main Application (main.rs)

```rust
use actix_web::{web, App, HttpServer, Result, middleware::Logger};
use actix_cors::Cors;
use sqlx::postgres::PgPoolOptions;
use tracing::{info, error};
use std::env;

mod config;
mod handlers;
mod models;
mod services;
mod middleware;
mod utils;

use config::database::create_pool;
use handlers::{products, customers, suppliers, sales, auth, settings};

#[actix_web::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::init();
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let bind_address = env::var("BIND_ADDRESS")
        .unwrap_or_else(|_| "127.0.0.1:8080".to_string());
    
    info!("Starting POS Application Backend Server");
    
    // Create database connection pool
    let db_pool = match create_pool(&database_url).await {
        Ok(pool) => {
            info!("✅ Database connection established");
            pool
        }
        Err(e) => {
            error!("❌ Failed to connect to database: {}", e);
            std::process::exit(1);
        }
    };
    
    info!("🚀 Server starting on: http://{}", bind_address);
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("tauri://localhost")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Content-Type", "Authorization"])
            .supports_credentials();
        
        App::new()
            .app_data(web::Data::new(db_pool.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api/v1")
                    // Authentication routes
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to(auth::login))
                            .route("/register", web::post().to(auth::register))
                            .route("/verify", web::get().to(auth::verify_token))
                    )
                    // Products routes
                    .service(
                        web::scope("/products")
                            .route("", web::get().to(products::get_products))
                            .route("", web::post().to(products::create_product))
                            .route("/{id}", web::get().to(products::get_product))
                            .route("/{id}", web::put().to(products::update_product))
                            .route("/{id}", web::delete().to(products::delete_product))
                            .route("/search", web::get().to(products::search_products))
                            .route("/barcode/{barcode}", web::get().to(products::get_by_barcode))
                    )
                    // Customers routes
                    .service(
                        web::scope("/customers")
                            .route("", web::get().to(customers::get_customers))
                            .route("", web::post().to(customers::create_customer))
                            .route("/{id}", web::get().to(customers::get_customer))
                            .route("/{id}", web::put().to(customers::update_customer))
                            .route("/{id}", web::delete().to(customers::delete_customer))
                    )
                    // Suppliers routes
                    .service(
                        web::scope("/suppliers")
                            .route("", web::get().to(suppliers::get_suppliers))
                            .route("", web::post().to(suppliers::create_supplier))
                            .route("/{id}", web::get().to(suppliers::get_supplier))
                            .route("/{id}", web::put().to(suppliers::update_supplier))
                            .route("/{id}", web::delete().to(suppliers::delete_supplier))
                    )
                    // Sales routes
                    .service(
                        web::scope("/sales")
                            .route("", web::get().to(sales::get_sales))
                            .route("", web::post().to(sales::create_sale))
                            .route("/{id}", web::get().to(sales::get_sale))
                            .route("/reports/daily", web::get().to(sales::daily_report))
                            .route("/reports/monthly", web::get().to(sales::monthly_report))
                    )
                    // Settings routes
                    .service(
                        web::scope("/settings")
                            .route("", web::get().to(settings::get_settings))
                            .route("", web::put().to(settings::update_settings))
                    )
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}
```

## 🗄️ Database Models (models/product.rs)

```rust
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
```

## 🔌 API Handlers (handlers/products.rs)

```rust
use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::models::product::{Product, CreateProductRequest, UpdateProductRequest, ProductFilter};
use crate::services::product_service;
use crate::utils::error::ApiError;

pub async fn get_products(
    pool: web::Data<PgPool>,
    query: web::Query<ProductFilter>,
) -> Result<HttpResponse, ApiError> {
    let products = product_service::get_products(&pool, &query).await?;
    Ok(HttpResponse::Ok().json(products))
}

pub async fn get_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let product_id = path.into_inner();
    let product = product_service::get_product_by_id(&pool, product_id).await?;
    
    match product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}

pub async fn create_product(
    pool: web::Data<PgPool>,
    product_data: web::Json<CreateProductRequest>,
) -> Result<HttpResponse, ApiError> {
    // Validate input data
    product_data.validate()?;
    
    let product = product_service::create_product(&pool, &product_data).await?;
    Ok(HttpResponse::Created().json(product))
}

pub async fn update_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    product_data: web::Json<UpdateProductRequest>,
) -> Result<HttpResponse, ApiError> {
    // Validate input data
    product_data.validate()?;
    
    let product_id = path.into_inner();
    let updated_product = product_service::update_product(&pool, product_id, &product_data).await?;
    
    match updated_product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}

pub async fn delete_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let product_id = path.into_inner();
    let deleted = product_service::delete_product(&pool, product_id).await?;
    
    if deleted {
        Ok(HttpResponse::NoContent().finish())
    } else {
        Err(ApiError::NotFound("Product not found".to_string()))
    }
}

pub async fn search_products(
    pool: web::Data<PgPool>,
    query: web::Query<ProductFilter>,
) -> Result<HttpResponse, ApiError> {
    let products = product_service::search_products(&pool, &query).await?;
    Ok(HttpResponse::Ok().json(products))
}

pub async fn get_by_barcode(
    pool: web::Data<PgPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let barcode = path.into_inner();
    let product = product_service::get_product_by_barcode(&pool, &barcode).await?;
    
    match product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}
```

## 🏪 Business Logic (services/product_service.rs)

```rust
use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

use crate::models::product::{Product, CreateProductRequest, UpdateProductRequest, ProductFilter};
use crate::utils::error::ApiError;

pub async fn get_products(
    pool: &PgPool,
    filter: &ProductFilter,
) -> Result<Vec<Product>, ApiError> {
    let limit = filter.limit.unwrap_or(50).min(100);
    let offset = filter.page.unwrap_or(0) * limit;
    
    let mut query = "SELECT * FROM products WHERE status = 'active'".to_string();
    let mut bind_count = 0;
    
    if let Some(_category) = &filter.category {
        bind_count += 1;
        query.push_str(&format!(" AND category = ${}", bind_count));
    }
    
    if let Some(_supplier) = &filter.supplier {
        bind_count += 1;
        query.push_str(&format!(" AND supplier = ${}", bind_count));
    }
    
    if let Some(true) = filter.low_stock {
        query.push_str(" AND stock <= reorder_level");
    }
    
    if let Some(_search) = &filter.search {
        bind_count += 1;
        query.push_str(&format!(" AND (name ILIKE ${} OR description ILIKE ${})", bind_count, bind_count));
    }
    
    query.push_str(" ORDER BY created_at DESC");
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));
    
    let mut query_builder = sqlx::query_as::<_, Product>(&query);
    
    if let Some(category) = &filter.category {
        query_builder = query_builder.bind(category);
    }
    
    if let Some(supplier) = &filter.supplier {
        query_builder = query_builder.bind(supplier);
    }
    
    if let Some(search) = &filter.search {
        let search_term = format!("%{}%", search);
        query_builder = query_builder.bind(&search_term);
    }
    
    let products = query_builder
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(products)
}

pub async fn get_product_by_id(
    pool: &PgPool,
    product_id: Uuid,
) -> Result<Option<Product>, ApiError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = $1 AND status = 'active'"
    )
    .bind(product_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn create_product(
    pool: &PgPool,
    product_data: &CreateProductRequest,
) -> Result<Product, ApiError> {
    let product_id = Uuid::new_v4();
    let now = Utc::now();
    
    let product = sqlx::query_as::<_, Product>(
        r#"
        INSERT INTO products (
            id, name, description, category, price, stock, 
            reorder_level, gst_rate, hsn_code, barcode, 
            supplier, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13)
        RETURNING *
        "#
    )
    .bind(product_id)
    .bind(&product_data.name)
    .bind(&product_data.description)
    .bind(&product_data.category)
    .bind(product_data.price)
    .bind(product_data.stock)
    .bind(product_data.reorder_level)
    .bind(product_data.gst_rate)
    .bind(&product_data.hsn_code)
    .bind(&product_data.barcode)
    .bind(&product_data.supplier)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn update_product(
    pool: &PgPool,
    product_id: Uuid,
    update_data: &UpdateProductRequest,
) -> Result<Option<Product>, ApiError> {
    let now = Utc::now();
    
    let product = sqlx::query_as::<_, Product>(
        r#"
        UPDATE products SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            price = COALESCE($5, price),
            stock = COALESCE($6, stock),
            reorder_level = COALESCE($7, reorder_level),
            gst_rate = COALESCE($8, gst_rate),
            hsn_code = COALESCE($9, hsn_code),
            barcode = COALESCE($10, barcode),
            supplier = COALESCE($11, supplier),
            status = COALESCE($12, status),
            updated_at = $13
        WHERE id = $1 AND status = 'active'
        RETURNING *
        "#
    )
    .bind(product_id)
    .bind(&update_data.name)
    .bind(&update_data.description)
    .bind(&update_data.category)
    .bind(update_data.price)
    .bind(update_data.stock)
    .bind(update_data.reorder_level)
    .bind(update_data.gst_rate)
    .bind(&update_data.hsn_code)
    .bind(&update_data.barcode)
    .bind(&update_data.supplier)
    .bind(&update_data.status)
    .bind(now)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn delete_product(
    pool: &PgPool,
    product_id: Uuid,
) -> Result<bool, ApiError> {
    let now = Utc::now();
    
    let result = sqlx::query(
        "UPDATE products SET status = 'deleted', updated_at = $2 WHERE id = $1 AND status = 'active'"
    )
    .bind(product_id)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(result.rows_affected() > 0)
}

pub async fn get_product_by_barcode(
    pool: &PgPool,
    barcode: &str,
) -> Result<Option<Product>, ApiError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE barcode = $1 AND status = 'active'"
    )
    .bind(barcode)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn search_products(
    pool: &PgPool,
    filter: &ProductFilter,
) -> Result<Vec<Product>, ApiError> {
    if let Some(search_term) = &filter.search {
        let search_pattern = format!("%{}%", search_term);
        
        let products = sqlx::query_as::<_, Product>(
            r#"
            SELECT * FROM products 
            WHERE status = 'active' 
            AND (
                name ILIKE $1 
                OR description ILIKE $1 
                OR category ILIKE $1 
                OR supplier ILIKE $1
                OR barcode = $2
            )
            ORDER BY 
                CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
                name
            LIMIT 20
            "#
        )
        .bind(&search_pattern)
        .bind(search_term)
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
        
        Ok(products)
    } else {
        Ok(Vec::new())
    }
}
```

## 🗄️ Database Migration (migrations/20250929000003_create_products.sql)

```sql
-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100),
    hsn_code VARCHAR(20) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    supplier VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_stock_reorder ON products(stock, reorder_level);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample Korean products
INSERT INTO products (name, description, category, price, stock, reorder_level, gst_rate, hsn_code, barcode, supplier) VALUES
('김치 (Kimchi) 500g', 'Traditional Korean fermented cabbage', 'Korean Food', 8500, 50, 10, 5, '2005', '8801234567890', 'Seoul Food Co.'),
('라면 (Ramyeon) Pack', 'Instant Korean noodles - Spicy flavor', 'Noodles', 1200, 100, 20, 5, '1902', '8801234567891', 'Nongshim Co.'),
('참기름 (Sesame Oil) 320ml', 'Pure Korean sesame oil for cooking', 'Cooking Oil', 12000, 30, 5, 18, '1515', '8801234567892', 'CJ Foods'),
('고추장 (Gochujang) 500g', 'Korean chili paste - Spicy and sweet', 'Condiments', 6500, 25, 8, 5, '2103', '8801234567893', 'Seoul Food Co.'),
('쌀 (Rice) 10kg', 'Premium Korean white rice', 'Grains', 25000, 40, 10, 5, '1006', '8801234567894', 'Korean Rice Co.');
```

## 🔧 Environment Configuration (.env)

```bash
# Database Configuration
DATABASE_URL=postgresql://pos_user:pos_password@localhost:5432/pos_database

# Server Configuration
BIND_ADDRESS=127.0.0.1:8080
RUST_LOG=debug

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRATION_HOURS=24

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,tauri://localhost

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Hardware Integration
PRINTER_PORT=COM3
CASH_DRAWER_PORT=COM4
BARCODE_SCANNER_PORT=COM5
```

## 🚀 Setup Instructions

### **1. Install Rust and Dependencies**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install required tools
cargo install sqlx-cli
cargo install cargo-watch  # For auto-reloading during development
```

### **2. Setup PostgreSQL Database**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE pos_database;
CREATE USER pos_user WITH PASSWORD 'pos_password';
GRANT ALL PRIVILEGES ON DATABASE pos_database TO pos_user;
\q
```

### **3. Setup Project**
```bash
# Create new Rust project
cargo new pos-backend
cd pos-backend

# Copy the provided Cargo.toml and source files
# Create .env file with your database credentials
cp .env.example .env
# Edit .env with your actual database credentials

# Run database migrations
sqlx database create
sqlx migrate run
```

### **4. Development Commands**
```bash
# Run in development mode with auto-reload
cargo watch -x run

# Run tests
cargo test

# Build for production
cargo build --release

# Check code formatting
cargo fmt
cargo clippy
```

### **5. API Testing**
```bash
# Test product creation
curl -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "category": "Test Category",
    "price": 99.99,
    "stock": 100,
    "reorder_level": 10,
    "gst_rate": 18.0,
    "hsn_code": "1234"
  }'

# Get all products
curl http://localhost:8080/api/v1/products

# Search products
curl "http://localhost:8080/api/v1/products/search?search=kimchi"
```

## 🏃‍♂️ Running the Backend

```bash
# Development mode
cargo run

# Production mode
cargo build --release
./target/release/pos-backend
```

The server will start on `http://localhost:8080` with full REST API endpoints for:
- Products CRUD
- Customers CRUD  
- Suppliers CRUD
- Sales transactions
- Settings management
- Authentication

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | Get all products |
| POST | `/api/v1/products` | Create new product |
| GET | `/api/v1/products/{id}` | Get product by ID |
| PUT | `/api/v1/products/{id}` | Update product |
| DELETE | `/api/v1/products/{id}` | Delete product |
| GET | `/api/v1/products/search` | Search products |
| GET | `/api/v1/products/barcode/{barcode}` | Get product by barcode |
| GET | `/api/v1/customers` | Get all customers |
| POST | `/api/v1/customers` | Create new customer |
| GET | `/api/v1/sales` | Get sales history |
| POST | `/api/v1/sales` | Create new sale |
| GET | `/api/v1/settings` | Get settings |
| PUT | `/api/v1/settings` | Update settings |

This backend provides a robust, type-safe, high-performance foundation for your POS application with proper error handling, validation, and database operations.