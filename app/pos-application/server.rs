use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{Filter, http::Response};
use crate::{database::Database, handlers, frontend};

pub async fn start_server(db: Arc<Mutex<Database>>) -> anyhow::Result<()> {
    // API routes
    let api_routes = warp::path("api")
        .and(
            // Products
            warp::path("products")
                .and(warp::get())
                .and(with_db(db.clone()))
                .and_then(handlers::get_products)
            .or(
                warp::path("products")
                    .and(warp::post())
                    .and(warp::body::json())
                    .and(with_db(db.clone()))
                    .and_then(handlers::create_product)
            )
            // Customers
            .or(
                warp::path("customers")
                    .and(warp::get())
                    .and(with_db(db.clone()))
                    .and_then(handlers::get_customers)
            )
            .or(
                warp::path("customers")
                    .and(warp::post())
                    .and(warp::body::json())
                    .and(with_db(db.clone()))
                    .and_then(handlers::create_customer)
            )
            // Sales
            .or(
                warp::path("sales")
                    .and(warp::get())
                    .and(with_db(db.clone()))
                    .and_then(handlers::get_sales)
            )
            .or(
                warp::path("sales")
                    .and(warp::post())
                    .and(warp::body::json())
                    .and(with_db(db.clone()))
                    .and_then(handlers::create_sale)
            )
            // Dashboard
            .or(
                warp::path("dashboard")
                    .and(warp::path("stats"))
                    .and(warp::get())
                    .and(with_db(db.clone()))
                    .and_then(handlers::get_dashboard_stats)
            )
        );

    // Frontend routes
    let frontend_routes = warp::path::end()
        .map(|| {
            Response::builder()
                .header("content-type", "text/html")
                .body(frontend::get_main_page())
        })
        .or(
            warp::path("pos")
                .map(|| {
                    Response::builder()
                        .header("content-type", "text/html")
                        .body(frontend::get_pos_page())
                })
        )
        .or(
            warp::path("inventory")
                .map(|| {
                    Response::builder()
                        .header("content-type", "text/html")
                        .body(frontend::get_inventory_page())
                })
        );

    let routes = api_routes
        .or(frontend_routes)
        .with(warp::cors().allow_any_origin().allow_headers(vec!["content-type"]).allow_methods(vec!["GET", "POST", "PUT", "DELETE"]));

    warp::serve(routes)
        .run(([0, 0, 0, 0], 3030))
        .await;

    Ok(())
}

fn with_db(db: Arc<Mutex<Database>>) -> impl Filter<Extract = (Arc<Mutex<Database>>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db.clone())
}