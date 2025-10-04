use mongodb::{Client, Database as MongoDatabase, Collection};
use bson::{doc, Document};
use std::env;
use anyhow::{Result, Context};
use log::{info, error, warn};

use crate::models::*;

pub struct Database {
    pub client: Client,
    pub db: MongoDatabase,
    // Collections
    pub products: Collection<Product>,
    pub categories: Collection<Category>,
    pub customers: Collection<Customer>,
    pub sales: Collection<Sale>,
    pub inventory: Collection<InventoryItem>,
    pub users: Collection<User>,
}

impl Database {
    pub async fn new() -> Result<Self> {
        let mongodb_uri = env::var("MONGODB_URI")
            .unwrap_or_else(|_| "mongodb://admin:admin123@localhost:27017/pos_app?authSource=admin".to_string());
        
        let database_name = env::var("MONGODB_DATABASE")
            .unwrap_or_else(|_| "pos_app".to_string());

        info!("Connecting to MongoDB at: {}", mongodb_uri);

        // Create MongoDB client
        let client = Client::with_uri_str(&mongodb_uri)
            .await
            .context("Failed to create MongoDB client")?;

        // Test the connection
        client
            .database("admin")
            .run_command(doc! {"ping": 1}, None)
            .await
            .context("Failed to ping MongoDB server")?;

        info!("Successfully connected to MongoDB");

        // Get database
        let db = client.database(&database_name);

        // Initialize collections
        let products = db.collection::<Product>("products");
        let categories = db.collection::<Category>("categories");
        let customers = db.collection::<Customer>("customers");
        let sales = db.collection::<Sale>("sales");
        let inventory = db.collection::<InventoryItem>("inventory");
        let users = db.collection::<User>("users");

        // Create indexes for better performance
        Self::create_indexes(&db).await?;

        Ok(Database {
            client,
            db,
            products,
            categories,
            customers,
            sales,
            inventory,
            users,
        })
    }

    async fn create_indexes(db: &MongoDatabase) -> Result<()> {
        info!("Creating database indexes...");

        // Product indexes
        let products = db.collection::<Document>("products");
        products.create_index(
            doc! { "barcode": 1 },
            mongodb::options::IndexOptions::builder()
                .unique(true)
                .sparse(true)
                .build(),
        ).await?;
        
        products.create_index(
            doc! { "sku": 1 },
            mongodb::options::IndexOptions::builder()
                .unique(true)
                .build(),
        ).await?;

        products.create_index(
            doc! { "name": "text", "description": "text" },
            None,
        ).await?;

        // Customer indexes
        let customers = db.collection::<Document>("customers");
        customers.create_index(
            doc! { "email": 1 },
            mongodb::options::IndexOptions::builder()
                .unique(true)
                .sparse(true)
                .build(),
        ).await?;

        customers.create_index(doc! { "phone": 1 }, None).await?;

        // Sales indexes
        let sales = db.collection::<Document>("sales");
        sales.create_index(doc! { "date": -1 }, None).await?;
        sales.create_index(doc! { "customer_id": 1 }, None).await?;

        // Inventory indexes
        let inventory = db.collection::<Document>("inventory");
        inventory.create_index(doc! { "product_id": 1 }, None).await?;

        // User indexes
        let users = db.collection::<Document>("users");
        users.create_index(
            doc! { "username": 1 },
            mongodb::options::IndexOptions::builder()
                .unique(true)
                .build(),
        ).await?;

        users.create_index(
            doc! { "email": 1 },
            mongodb::options::IndexOptions::builder()
                .unique(true)
                .build(),
        ).await?;

        info!("Database indexes created successfully");
        Ok(())
    }

    // Utility methods
    pub async fn health_check(&self) -> Result<bool> {
        match self.client
            .database("admin")
            .run_command(doc! {"ping": 1}, None)
            .await
        {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Database health check failed: {}", e);
                Ok(false)
            }
        }
    }

    pub async fn get_stats(&self) -> Result<DatabaseStats> {
        let db_stats = self.db
            .run_command(doc! {"dbStats": 1}, None)
            .await?;

        let products_count = self.products.estimated_document_count(None).await?;
        let customers_count = self.customers.estimated_document_count(None).await?;
        let sales_count = self.sales.estimated_document_count(None).await?;

        Ok(DatabaseStats {
            products_count,
            customers_count,
            sales_count,
            db_size: db_stats.get_f64("dataSize").unwrap_or(0.0) as u64,
            storage_size: db_stats.get_f64("storageSize").unwrap_or(0.0) as u64,
            indexes: db_stats.get_i32("indexes").unwrap_or(0) as u32,
        })
    }

    pub async fn backup(&self, backup_path: &str) -> Result<()> {
        // This is a simplified backup - in production, you'd use mongodump
        warn!("Database backup to {} requested - implement mongodump integration", backup_path);
        // TODO: Implement actual backup using mongodump or similar
        Ok(())
    }

    pub async fn restore(&self, backup_path: &str) -> Result<()> {
        // This is a simplified restore - in production, you'd use mongorestore
        warn!("Database restore from {} requested - implement mongorestore integration", backup_path);
        // TODO: Implement actual restore using mongorestore or similar
        Ok(())
    }

    // Transaction support
    pub async fn start_transaction(&self) -> Result<mongodb::ClientSession> {
        let mut session = self.client.start_session(None).await?;
        session.start_transaction(None).await?;
        Ok(session)
    }

    // Aggregation pipeline helper
    pub async fn aggregate<T>(&self, collection_name: &str, pipeline: Vec<Document>) -> Result<Vec<T>>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let collection = self.db.collection::<T>(collection_name);
        let mut cursor = collection.aggregate(pipeline, None).await?;
        let mut results = Vec::new();

        while cursor.advance().await? {
            results.push(cursor.deserialize_current()?);
        }

        Ok(results)
    }
}

#[derive(Debug, serde::Serialize)]
pub struct DatabaseStats {
    pub products_count: u64,
    pub customers_count: u64,
    pub sales_count: u64,
    pub db_size: u64,
    pub storage_size: u64,
    pub indexes: u32,
}