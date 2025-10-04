// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;

// Import modules
mod database;
mod models;
mod handlers;
mod utils;

use database::Database;
use handlers::*;

// Application state
pub struct AppState {
    pub database: Arc<Mutex<Database>>,
}

#[tokio::main]
async fn main() {
    // Initialize logger
    env_logger::init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize database
    let db = match Database::new().await {
        Ok(database) => database,
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            std::process::exit(1);
        }
    };

    let app_state = AppState {
        database: Arc::new(Mutex::new(db)),
    };

    // Build and run the application
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Product handlers
            get_products,
            get_product_by_id,
            create_product,
            update_product,
            delete_product,
            search_products,
            get_product_by_barcode,
            
            // Category handlers
            get_categories,
            create_category,
            update_category,
            delete_category,
            
            // Customer handlers
            get_customers,
            get_customer_by_id,
            create_customer,
            update_customer,
            delete_customer,
            search_customers,
            
            // Sales handlers
            create_sale,
            get_sales,
            get_sale_by_id,
            get_sales_by_date,
            process_payment,
            
            // Inventory handlers
            get_inventory,
            update_stock,
            get_low_stock_items,
            adjust_stock,
            
            // User handlers
            login,
            logout,
            get_current_user,
            change_password,
            
            // Report handlers
            get_sales_report,
            get_inventory_report,
            get_customer_report,
            export_data,
            
            // System handlers
            get_app_info,
            backup_database,
            restore_database,
            get_system_status,
            
            // Utility handlers
            generate_barcode,
            print_receipt,
            scan_barcode,
        ])
        .setup(|app| {
            // Setup system tray
            setup_system_tray(app)?;
            
            // Setup global shortcuts
            setup_shortcuts(app)?;
            
            // Initialize application data
            initialize_app_data(app)?;
            
            Ok(())
        })
        .on_system_tray_event(|app, event| {
            handle_system_tray_event(app, event);
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Setup system tray
fn setup_system_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem};
    
    let show = CustomMenuItem::new("show".to_string(), "Show POS-App");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_item(quit);
    
    SystemTray::new()
        .with_menu(tray_menu)
        .build(app)?;
    
    Ok(())
}

// Setup global shortcuts
fn setup_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::GlobalShortcutManager;
    
    let handle = app.handle();
    
    // Register F1 for quick sale
    app.global_shortcut_manager().register("F1", move || {
        let window = handle.get_window("main").unwrap();
        window.emit("shortcut:quick_sale", {}).unwrap();
    })?;
    
    // Register F2 for product search
    let handle = app.handle();
    app.global_shortcut_manager().register("F2", move || {
        let window = handle.get_window("main").unwrap();
        window.emit("shortcut:product_search", {}).unwrap();
    })?;
    
    // Register F9 for cash drawer
    let handle = app.handle();
    app.global_shortcut_manager().register("F9", move || {
        let window = handle.get_window("main").unwrap();
        window.emit("shortcut:cash_drawer", {}).unwrap();
    })?;
    
    Ok(())
}

// Initialize application data
fn initialize_app_data(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Create necessary directories
    let app_dir = app.path_resolver().app_data_dir().unwrap();
    std::fs::create_dir_all(&app_dir)?;
    
    let logs_dir = app_dir.join("logs");
    std::fs::create_dir_all(&logs_dir)?;
    
    let backups_dir = app_dir.join("backups");
    std::fs::create_dir_all(&backups_dir)?;
    
    let uploads_dir = app_dir.join("uploads");
    std::fs::create_dir_all(&uploads_dir)?;
    
    log::info!("Application initialized successfully");
    log::info!("App data directory: {:?}", app_dir);
    
    Ok(())
}

// Handle system tray events
fn handle_system_tray_event(app: &tauri::AppHandle, event: tauri::SystemTrayEvent) {
    match event {
        tauri::SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}