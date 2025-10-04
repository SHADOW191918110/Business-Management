// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod models;

use database::Database;
use log::info;

#[tokio::main]
async fn main() {
    // Initialize logger
    env_logger::init();
    info!("Starting WholesalePro ERP System...");

    // Initialize database connection
    let db = Database::new().await.expect("Failed to connect to MongoDB");
    
    // Initialize database collections
    db.init_collections().await.expect("Failed to initialize database collections");

    tauri::Builder::default()
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            // Product commands
            commands::get_products,
            commands::create_product,
            commands::update_product,
            commands::delete_product,
            commands::search_products,
            
            // Customer commands
            commands::get_customers,
            commands::create_customer,
            commands::update_customer,
            commands::delete_customer,
            
            // Order commands
            commands::get_orders,
            commands::create_order,
            commands::update_order,
            commands::get_order_by_id,
            
            // Inventory commands
            commands::get_inventory,
            commands::update_inventory,
            commands::get_low_stock_items,
            
            // GST and calculations
            commands::calculate_gst,
            commands::calculate_order_total,
            
            // Reports
            commands::get_sales_report,
            commands::get_inventory_report,
            commands::get_customer_report,
            
            // System commands
            commands::backup_data,
            commands::get_system_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}