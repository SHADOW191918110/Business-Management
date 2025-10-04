use anyhow::Result;
use chrono::{DateTime, Utc};
use rusqlite::{Connection, params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use uuid::Uuid;
use crate::Database;  // Import your Database struct from the main module or lib
use anyhow::Result;
use tokio::net::TcpListener;
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};




#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub sku: String,
    pub price: f64,
    pub cost: f64,
    pub stock: i32,
    pub category: String,
    pub gst_rate: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub gst_number: Option<String>,
    pub credit_limit: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sale {
    pub id: String,
    pub customer_id: Option<String>,
    pub total: f64,
    pub gst_amount: f64,
    pub payment_method: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleItem {
    pub id: String,
    pub sale_id: String,
    pub product_id: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub gst_rate: f64,
    pub total: f64,
}

pub struct Database {
    conn: Connection,
}

// FIXED: Add Send + Sync
unsafe impl Send for Database {}
unsafe impl Sync for Database {}

pub async fn start_server(db: Database) -> Result<()> {
    // Bind to a local address (change to your desired port)
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on 127.0.0.1:8080");

    loop {
        // Accept incoming connections
        let (mut socket, addr) = listener.accept().await?;
        println!("New connection from {}", addr);

        // Spawn a task to handle each connection (using the shared Database)
        tokio::spawn(async move {
            // Example: Read data from client and echo it back
            let mut buf = vec![0; 1024];
            match socket.read(&mut buf).await {
                Ok(n) if n == 0 => return,  // Connection closed
                Ok(n) => {
                    // Process data (e.g., query the database here)
                    // For demo: Echo back the received data
                    if let Err(e) = socket.write_all(&buf[0..n]).await {
                        eprintln!("Failed to write to socket: {}", e);
                    }

                    // Example DB interaction: Get products (adapt to your needs)
                    if let Ok(products) = db.get_products().await {
                        println!("Products fetched: {:?}", products);
                    }
                }
                Err(e) => eprintln!("Failed to read from socket: {}", e),
            }
        });
    }
}

impl Database {
    pub async fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;
        // FIXED: Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL;", [])?;
        conn.execute("PRAGMA synchronous=NORMAL;", [])?;
        Ok(Database { conn })
    }

    pub async fn init_tables(&mut self) -> Result<()> {
        // Products table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                price REAL NOT NULL,
                cost REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category TEXT NOT NULL,
                gst_rate REAL NOT NULL DEFAULT 18.0,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // Customers table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                gst_number TEXT,
                credit_limit REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // Sales table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                total REAL NOT NULL,
                gst_amount REAL NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'completed',
                created_at TEXT NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )",
            [],
        )?;

        // Sale items table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sale_items (
                id TEXT PRIMARY KEY,
                sale_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                gst_rate REAL NOT NULL,
                total REAL NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )",
            [],
        )?;

        Ok(())
    }

    pub async fn seed_data(&mut self) -> Result<()> {
        // Check if we already have data
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM products",
            [],
            |row| row.get(0)
        )?;

        if count > 0 {
            return Ok(());
        }

        // Add sample products
        let products = vec![
            ("Rice - Basmati 1kg", "RICE001", 150.0, 120.0, 100, "Grocery", 5.0),
            ("Sugar - White 1kg", "SUGAR001", 45.0, 40.0, 200, "Grocery", 5.0),
            ("Cooking Oil - 1L", "OIL001", 180.0, 160.0, 50, "Grocery", 5.0),
            ("Wheat Flour - 5kg", "WHEAT001", 250.0, 220.0, 80, "Grocery", 5.0),
            ("Tea - Premium 500g", "TEA001", 320.0, 280.0, 40, "Beverage", 12.0),
            ("Coffee - Instant 200g", "COFFEE001", 280.0, 250.0, 30, "Beverage", 12.0),
        ];

        for (name, sku, price, cost, stock, category, gst_rate) in products {
            let product = Product {
                id: Uuid::new_v4().to_string(),
                name: name.to_string(),
                sku: sku.to_string(),
                price,
                cost,
                stock,
                category: category.to_string(),
                gst_rate,
                created_at: Utc::now(),
            };
            self.create_product(product).await?;
        }

        // Add sample customer
        let customer = Customer {
            id: Uuid::new_v4().to_string(),
            name: "Walk-in Customer".to_string(),
            phone: "0000000000".to_string(),
            email: None,
            address: None,
            gst_number: None,
            credit_limit: 0.0,
            created_at: Utc::now(),
        };
        self.create_customer(customer).await?;

        Ok(())
    }

    // Product operations
    pub async fn create_product(&mut self, product: Product) -> Result<()> {
        self.conn.execute(
            "INSERT INTO products (id, name, sku, price, cost, stock, category, gst_rate, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                product.id,
                product.name,
                product.sku,
                product.price,
                product.cost,
                product.stock,
                product.category,
                product.gst_rate,
                product.created_at.to_rfc3339()
            ],
        )?;
        Ok(())
    }

    pub async fn get_products(&self) -> Result<Vec<Product>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, sku, price, cost, stock, category, gst_rate, created_at FROM products ORDER BY name"
        )?;

        let products = stmt.query_map([], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                sku: row.get(2)?,
                price: row.get(3)?,
                cost: row.get(4)?,
                stock: row.get(5)?,
                category: row.get(6)?,
                gst_rate: row.get(7)?,
                created_at: row.get::<_, String>(8)?.parse().unwrap_or(Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(products)
    }

    pub async fn get_product_by_id(&self, id: &str) -> Result<Option<Product>> {
        let product = self.conn.query_row(
            "SELECT id, name, sku, price, cost, stock, category, gst_rate, created_at 
             FROM products WHERE id = ?1",
            params![id],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    sku: row.get(2)?,
                    price: row.get(3)?,
                    cost: row.get(4)?,
                    stock: row.get(5)?,
                    category: row.get(6)?,
                    gst_rate: row.get(7)?,
                    created_at: row.get::<_, String>(8)?.parse().unwrap_or(Utc::now()),
                })
            }
        ).optional()?;

        Ok(product)
    }

    // Customer operations
    pub async fn create_customer(&mut self, customer: Customer) -> Result<()> {
        self.conn.execute(
            "INSERT INTO customers (id, name, phone, email, address, gst_number, credit_limit, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                customer.id,
                customer.name,
                customer.phone,
                customer.email,
                customer.address,
                customer.gst_number,
                customer.credit_limit,
                customer.created_at.to_rfc3339()
            ],
        )?;
        Ok(())
    }

    pub async fn get_customers(&self) -> Result<Vec<Customer>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, phone, email, address, gst_number, credit_limit, created_at 
             FROM customers ORDER BY name"
        )?;

        let customers = stmt.query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                gst_number: row.get(5)?,
                credit_limit: row.get(6)?,
                created_at: row.get::<_, String>(7)?.parse().unwrap_or(Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(customers)
    }

    // Sales operations
    pub async fn create_sale(&mut self, sale: Sale, items: Vec<SaleItem>) -> Result<()> {
        let tx = self.conn.unchecked_transaction()?;
        
        // Insert sale
        tx.execute(
            "INSERT INTO sales (id, customer_id, total, gst_amount, payment_method, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                sale.id,
                sale.customer_id,
                sale.total,
                sale.gst_amount,
                sale.payment_method,
                sale.status,
                sale.created_at.to_rfc3339()
            ],
        )?;

        // Insert sale items and update stock
        for item in items {
            tx.execute(
                "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, gst_rate, total)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    item.id,
                    item.sale_id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.gst_rate,
                    item.total
                ],
            )?;

            // Update product stock
            tx.execute(
                "UPDATE products SET stock = stock - ?1 WHERE id = ?2",
                params![item.quantity, item.product_id],
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    pub async fn get_sales(&self, limit: Option<i32>) -> Result<Vec<Sale>> {
        let limit_clause = match limit {
            Some(l) => format!("LIMIT {}", l),
            None => String::new(),
        };

        let query = format!(
            "SELECT id, customer_id, total, gst_amount, payment_method, status, created_at 
             FROM sales ORDER BY created_at DESC {}", 
            limit_clause
        );

        let mut stmt = self.conn.prepare(&query)?;

        let sales = stmt.query_map([], |row| {
            Ok(Sale {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                total: row.get(2)?,
                gst_amount: row.get(3)?,
                payment_method: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get::<_, String>(6)?.parse().unwrap_or(Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(sales)
    }

    pub async fn get_dashboard_stats(&self) -> Result<serde_json::Value> {
        // Total sales today
        let today_sales: f64 = self.conn.query_row(
            "SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = DATE('now')",
            [],
            |row| row.get(0)
        ).unwrap_or(0.0);

        // Total products
        let total_products: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM products",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        // Low stock products (less than 10)
        let low_stock_products: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM products WHERE stock < 10",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        // Total customers
        let total_customers: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM customers",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        Ok(serde_json::json!({
            "today_sales": today_sales,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "total_customers": total_customers
        }))
    }
}