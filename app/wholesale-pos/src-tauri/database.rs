use anyhow::Result;
use mongodb::{Client, Database as MongoDatabase, Collection};
use log::{info, error};
use std::env;

use crate::models::{Product, Customer, Order, InventoryItem};

pub struct Database {
    db: MongoDatabase,
}

impl Database {
    pub async fn new() -> Result<Self> {
        // Load environment variables
        dotenv::dotenv().ok();
        
        // Get MongoDB connection string from environment or use default
        let connection_string = env::var("MONGODB_URI")
            .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
        
        let database_name = env::var("DATABASE_NAME")
            .unwrap_or_else(|_| "wholesale_erp".to_string());

        info!("Connecting to MongoDB at: {}", connection_string);
        
        // Create MongoDB client
        let client = Client::with_uri_str(&connection_string).await?;
        
        // Test connection
        client
            .database("admin")
            .run_command(mongodb::bson::doc! {"ismaster": 1}, None)
            .await?;
            
        info!("Successfully connected to MongoDB");
        
        let db = client.database(&database_name);
        
        Ok(Database { db })
    }

    pub async fn init_collections(&self) -> Result<()> {
        info!("Initializing database collections...");
        
        // Create indexes for better performance
        let products: Collection<Product> = self.db.collection("products");
        products.create_index(
            mongodb::IndexModel::builder()
                .keys(mongodb::bson::doc! { "sku": 1 })
                .options(
                    mongodb::options::IndexOptions::builder()
                        .unique(true)
                        .build()
                )
                .build(),
            None
        ).await?;

        let customers: Collection<Customer> = self.db.collection("customers");
        customers.create_index(
            mongodb::IndexModel::builder()
                .keys(mongodb::bson::doc! { "email": 1 })
                .options(
                    mongodb::options::IndexOptions::builder()
                        .unique(true)
                        .build()
                )
                .build(),
            None
        ).await?;

        let orders: Collection<Order> = self.db.collection("orders");
        orders.create_index(
            mongodb::IndexModel::builder()
                .keys(mongodb::bson::doc! { "order_number": 1 })
                .options(
                    mongodb::options::IndexOptions::builder()
                        .unique(true)
                        .build()
                )
                .build(),
            None
        ).await?;

        info!("Database collections initialized successfully");
        Ok(())
    }

    // Product operations
    pub fn products(&self) -> Collection<Product> {
        self.db.collection("products")
    }

    // Customer operations
    pub fn customers(&self) -> Collection<Customer> {
        self.db.collection("customers")
    }

    // Order operations
    pub fn orders(&self) -> Collection<Order> {
        self.db.collection("orders")
    }

    // Inventory operations
    pub fn inventory(&self) -> Collection<InventoryItem> {
        self.db.collection("inventory")
    }

    // Health check
    pub async fn health_check(&self) -> Result<bool> {
        match self.db.run_command(mongodb::bson::doc! {"ping": 1}, None).await {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Database health check failed: {}", e);
                Ok(false)
            }
        }
    }

    // Backup operations
    pub async fn backup_collection(&self, collection_name: &str) -> Result<Vec<mongodb::bson::Document>> {
        let collection: Collection<mongodb::bson::Document> = self.db.collection(collection_name);
        let cursor = collection.find(None, None).await?;
        
        let mut documents = Vec::new();
        let mut cursor = cursor;
        while cursor.advance().await? {
            documents.push(cursor.deserialize_current()?);
        }
        
        Ok(documents)
    }

    // Statistics
    pub async fn get_collection_count(&self, collection_name: &str) -> Result<u64> {
        let collection: Collection<mongodb::bson::Document> = self.db.collection(collection_name);
        let count = collection.count_documents(None, None).await?;
        Ok(count)
    }
}