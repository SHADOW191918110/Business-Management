use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::info;
use tracing_subscriber;

mod database;
mod server;
mod handlers;
mod frontend;

use database::Database;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging - FIXED
    tracing_subscriber::fmt::init();
    
    info!("🚀 Starting Wholesale POS System...");
    
    // Initialize database
    info!("📦 Initializing database...");
    let db = Arc::new(Mutex::new(Database::new("./pos_data.db").await?));
    
    // Initialize tables
    {
        let mut db_guard = db.lock().await;
        db_guard.init_tables().await?;
        info!("✅ Database ready!");
        
        // Add sample data if empty
        db_guard.seed_data().await?;
    }
    
    // Start web server - FIXED
    info!("🌐 Starting web server...");
    info!("📊 Dashboard: http://localhost:3030");
    info!("💰 POS System: http://localhost:3030/pos");
    info!("📦 Inventory: http://localhost:3030/inventory");
    info!("");
    info!("🎉 System ready! Open your browser to http://localhost:3030");
    
    server::start_server(db).await?;
    
    Ok(())
}