use actix_web::{web, App, HttpServer};
use actix_cors::Cors;
use tracing::{info, error};
use std::env;

pub mod products;
pub mod customers;
pub mod suppliers;
pub mod sales;
pub mod auth;
pub mod settings;


// Re-export components from other files
mod config;
pub use config::Settings;

use config::database::create_pool;
use crate::products;
use crate::customers;
use crate::suppliers;
use crate::sales;
use crate::auth;
use crate::settings;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
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
            .wrap(actix_web::middleware::Logger::default())
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

// Basic settings configuration structure
pub struct Settings {
    pub database_url: String,
    pub server_port: u16,
}

impl Settings {
    pub fn new() -> Self {
        Settings {
            database_url: String::from("localhost"),
            server_port: 8080,
        }
    }
}
