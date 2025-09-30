use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::info;

mod database;
mod server;
mod handlers;
mod frontend;

use database::Database;
use server::start_server;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::init();
    
    info!("🚀 Starting Wholesale POS System...");
    
    // Initialize database
    info!("📦 Initializing database...");
    let db = Arc::new(Mutex::new(Database::new("./pos_data.db").await?));
    
    // Initialize tables
    db.lock().await.init_tables().await?;
    info!("✅ Database ready!");
    
    // Add sample data if empty
    db.lock().await.seed_data().await?;
    
    // Start web server
    info!("🌐 Starting web server...");
    info!("📊 Dashboard: http://localhost:3030");
    info!("💰 POS System: http://localhost:3030/pos");
    info!("📦 Inventory: http://localhost:3030/inventory");
    info!("");
    info!("🎉 System ready! Open your browser to http://localhost:3030");
    
    start_server(db).await?;
    
    Ok(())
}