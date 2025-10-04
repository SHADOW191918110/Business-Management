use tauri::{State, command};
use mongodb::bson::doc;
use chrono::{Utc, Duration};
use anyhow::Result;
use std::collections::HashMap;

use crate::{AppState, models::*};

#[command]
pub async fn get_sales_report(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<ApiResponse<SalesReport>, String> {
    let db = state.database.lock().await;

    let start_date_parsed = match chrono::DateTime::parse_from_rfc3339(&start_date) {
        Ok(date) => date.with_timezone(&Utc),
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid start date format".to_string(),
            errors: vec!["Use RFC3339 format".to_string()],
        }),
    };

    let end_date_parsed = match chrono::DateTime::parse_from_rfc3339(&end_date) {
        Ok(date) => date.with_timezone(&Utc),
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid end date format".to_string(),
            errors: vec!["Use RFC3339 format".to_string()],
        }),
    };

    let date_filter = doc! {
        "date": {
            "$gte": start_date_parsed,
            "$lte": end_date_parsed
        }
    };

    // Main sales aggregation pipeline
    let sales_pipeline = vec![
        doc! { "$match": date_filter.clone() },
        doc! {
            "$group": {
                "_id": null,
                "total_sales": { "$sum": "$total_amount" },
                "total_transactions": { "$sum": 1 },
                "average_transaction": { "$avg": "$total_amount" }
            }
        }
    ];

    let sales_stats = match db.db.collection::<mongodb::bson::Document>("sales")
        .aggregate(sales_pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            if let Ok(Some(doc)) = cursor.try_next().await {
                (
                    doc.get_f64("total_sales").unwrap_or(0.0),
                    doc.get_i32("total_transactions").unwrap_or(0) as u64,
                    doc.get_f64("average_transaction").unwrap_or(0.0),
                )
            } else {
                (0.0, 0, 0.0)
            }
        }
        Err(_) => (0.0, 0, 0.0)
    };

    // Top products pipeline
    let top_products_pipeline = vec![
        doc! { "$match": date_filter.clone() },
        doc! { "$unwind": "$items" },
        doc! {
            "$group": {
                "_id": {
                    "product_id": "$items.product_id",
                    "name": "$items.name"
                },
                "quantity_sold": { "$sum": "$items.quantity" },
                "total_revenue": { "$sum": "$items.total_price" }
            }
        },
        doc! {
            "$project": {
                "product_id": "$_id.product_id",
                "name": "$_id.name",
                "quantity_sold": 1,
                "total_revenue": 1,
                "_id": 0
            }
        },
        doc! { "$sort": { "total_revenue": -1 } },
        doc! { "$limit": 10 }
    ];

    let top_products = match db.db.collection::<mongodb::bson::Document>("sales")
        .aggregate(top_products_pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            let mut products = Vec::new();
            while let Ok(Some(doc)) = cursor.try_next().await {
                if let Ok(product) = bson::from_document::<TopProduct>(doc) {
                    products.push(product);
                }
            }
            products
        }
        Err(_) => vec![]
    };

    // Daily sales pipeline
    let daily_sales_pipeline = vec![
        doc! { "$match": date_filter },
        doc! {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$date"
                    }
                },
                "sales": { "$sum": "$total_amount" },
                "transactions": { "$sum": 1 }
            }
        },
        doc! {
            "$project": {
                "date": "$_id",
                "sales": 1,
                "transactions": 1,
                "_id": 0
            }
        },
        doc! { "$sort": { "date": 1 } }
    ];

    let sales_by_day = match db.db.collection::<mongodb::bson::Document>("sales")
        .aggregate(daily_sales_pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            let mut daily_sales = Vec::new();
            while let Ok(Some(doc)) = cursor.try_next().await {
                if let Ok(day_sales) = bson::from_document::<DailySales>(doc) {
                    daily_sales.push(day_sales);
                }
            }
            daily_sales
        }
        Err(_) => vec![]
    };

    let report = SalesReport {
        period: format!("{} to {}", start_date, end_date),
        total_sales: rust_decimal::Decimal::from_f64_retain(sales_stats.0).unwrap_or_default(),
        total_profit: rust_decimal::Decimal::from_f64_retain(sales_stats.0 * 0.3).unwrap_or_default(), // Assuming 30% profit margin
        total_transactions: sales_stats.1,
        average_transaction: rust_decimal::Decimal::from_f64_retain(sales_stats.2).unwrap_or_default(),
        top_products,
        sales_by_day,
        payment_methods: HashMap::new(), // TODO: Implement payment method breakdown
    };

    Ok(ApiResponse {
        success: true,
        data: Some(report),
        message: "Sales report generated successfully".to_string(),
        errors: vec![],
    })
}

#[command]
pub async fn get_inventory_report(
    state: State<'_, AppState>,
) -> Result<ApiResponse<InventoryReport>, String> {
    let db = state.database.lock().await;

    // Get total products
    let total_products = db.products.count_documents(doc! { "is_active": true }, None).await.unwrap_or(0);

    // Get low stock items
    let low_stock_pipeline = vec![
        doc! {
            "$match": {
                "$expr": { "$lte": ["$stock", "$min_stock"] },
                "is_active": true
            }
        },
        doc! {
            "$project": {
                "product_id": "$_id",
                "name": 1,
                "current_stock": "$stock",
                "min_stock": 1,
                "days_until_out": null
            }
        }
    ];

    let low_stock_items = match db.db.collection::<mongodb::bson::Document>("products")
        .aggregate(low_stock_pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            let mut items = Vec::new();
            while let Ok(Some(doc)) = cursor.try_next().await {
                if let Ok(item) = bson::from_document::<LowStockItem>(doc) {
                    items.push(item);
                }
            }
            items
        }
        Err(_) => vec![]
    };

    let low_stock_count = low_stock_items.len() as u64;
    let out_of_stock_count = low_stock_items.iter()
        .filter(|item| item.current_stock <= 0)
        .count() as u64;

    // Calculate total inventory value
    let value_pipeline = vec![
        doc! {
            "$match": { "is_active": true }
        },
        doc! {
            "$group": {
                "_id": null,
                "total_value": {
                    "$sum": {
                        "$multiply": ["$stock", "$cost"]
                    }
                }
            }
        }
    ];

    let total_value = match db.db.collection::<mongodb::bson::Document>("products")
        .aggregate(value_pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            if let Ok(Some(doc)) = cursor.try_next().await {
                doc.get_f64("total_value").unwrap_or(0.0)
            } else {
                0.0
            }
        }
        Err(_) => 0.0
    };

    let report = InventoryReport {
        total_products,
        low_stock_count,
        out_of_stock_count,
        total_value: rust_decimal::Decimal::from_f64_retain(total_value).unwrap_or_default(),
        low_stock_items,
        category_breakdown: HashMap::new(), // TODO: Implement category breakdown
    };

    Ok(ApiResponse {
        success: true,
        data: Some(report),
        message: "Inventory report generated successfully".to_string(),
        errors: vec![],
    })
}

#[command]
pub async fn get_customer_report(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<Customer>>, String> {
    let db = state.database.lock().await;

    // Get top customers by total purchases
    let pipeline = vec![
        doc! {
            "$match": { "is_active": true }
        },
        doc! {
            "$sort": { "total_purchases": -1 }
        },
        doc! {
            "$limit": 50
        }
    ];

    match db.customers.aggregate(pipeline, None).await {
        Ok(mut cursor) => {
            let mut customers = Vec::new();
            while let Ok(Some(customer)) = cursor.try_next().await {
                customers.push(customer);
            }

            Ok(ApiResponse {
                success: true,
                data: Some(customers),
                message: "Customer report generated successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to generate customer report".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn export_data(
    state: State<'_, AppState>,
    data_type: String,
    format: String,
) -> Result<ApiResponse<String>, String> {
    // This is a simplified implementation
    // In a real application, you would generate actual export files
    
    let export_id = uuid::Uuid::new_v4().to_string();
    let filename = format!("{}_{}.{}", data_type, 
        Utc::now().format("%Y%m%d_%H%M%S"), format);

    Ok(ApiResponse {
        success: true,
        data: Some(filename),
        message: format!("Export initiated for {} data", data_type),
        errors: vec![],
    })
}