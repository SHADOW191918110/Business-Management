use tauri::{State, command};
use mongodb::bson::{doc, oid::ObjectId};
use futures::stream::TryStreamExt;
use chrono::Utc;
use anyhow::Result;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::{AppState, models::*};

#[command]
pub async fn create_sale(
    state: State<'_, AppState>,
    mut sale: Sale,
    cashier_id: String,
) -> Result<ApiResponse<Sale>, String> {
    let db = state.database.lock().await;
    
    let cashier_object_id = match ObjectId::parse_str(&cashier_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid cashier ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    // Generate sale number
    let sale_count = db.sales.count_documents(doc! {}, None).await.unwrap_or(0);
    sale.sale_number = format!("SALE-{:06}", sale_count + 1);
    sale.cashier_id = cashier_object_id;
    sale.date = Utc::now();
    sale.created_at = Utc::now();
    sale.updated_at = Utc::now();
    sale.id = None;

    // Start a transaction
    let mut session = db.client.start_session(None).await.map_err(|e| e.to_string())?;
    session.start_transaction(None).await.map_err(|e| e.to_string())?;

    // Update inventory for each item
    for item in &sale.items {
        let product_id = item.product_id;
        
        // Find and update product stock
        let product_update = doc! {
            "$inc": { "stock": -(item.quantity) },
            "$set": { "updated_at": Utc::now() }
        };

        match db.products.update_one_with_session(
            doc! { "_id": product_id },
            product_update,
            None,
            &mut session,
        ).await {
            Ok(result) if result.matched_count == 0 => {
                session.abort_transaction().await.map_err(|e| e.to_string())?;
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    message: format!("Product {} not found", item.sku),
                    errors: vec!["Product not found".to_string()],
                });
            }
            Err(e) => {
                session.abort_transaction().await.map_err(|e| e.to_string())?;
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    message: "Failed to update inventory".to_string(),
                    errors: vec![e.to_string()],
                });
            }
            _ => {}
        }

        // Update inventory tracking
        let inventory_update = doc! {
            "$inc": {
                "current_stock": -(item.quantity),
                "available_stock": -(item.quantity)
            },
            "$set": { "last_updated": Utc::now() },
            "$push": {
                "movements": {
                    "movement_type": "sale",
                    "quantity": -(item.quantity),
                    "reason": format!("Sale: {}", sale.sale_number),
                    "reference_id": sale.id,
                    "user_id": cashier_object_id,
                    "date": Utc::now()
                }
            }
        };

        db.inventory.update_one_with_session(
            doc! { "product_id": product_id },
            inventory_update,
            None,
            &mut session,
        ).await.map_err(|e| {
            futures::executor::block_on(async {
                session.abort_transaction().await.ok();
            });
            e.to_string()
        })?;
    }

    // Insert the sale
    match db.sales.insert_one_with_session(&sale, None, &mut session).await {
        Ok(result) => {
            sale.id = Some(result.inserted_id.as_object_id().unwrap());
            
            // Update customer total purchases if applicable
            if let Some(customer_id) = sale.customer_id {
                let customer_update = doc! {
                    "$inc": { 
                        "total_purchases": sale.total_amount.to_f64().unwrap_or(0.0),
                        "loyalty_points": (sale.total_amount.to_f64().unwrap_or(0.0) * 0.01).floor()
                    },
                    "$set": { "updated_at": Utc::now() }
                };

                db.customers.update_one_with_session(
                    doc! { "_id": customer_id },
                    customer_update,
                    None,
                    &mut session,
                ).await.map_err(|e| {
                    futures::executor::block_on(async {
                        session.abort_transaction().await.ok();
                    });
                    e.to_string()
                })?;
            }

            // Commit transaction
            session.commit_transaction().await.map_err(|e| e.to_string())?;

            Ok(ApiResponse {
                success: true,
                data: Some(sale),
                message: "Sale created successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => {
            session.abort_transaction().await.map_err(|e| e.to_string())?;
            Ok(ApiResponse {
                success: false,
                data: None,
                message: "Failed to create sale".to_string(),
                errors: vec![e.to_string()],
            })
        }
    }
}

#[command]
pub async fn get_sales(
    state: State<'_, AppState>,
    page: Option<u64>,
    limit: Option<u64>,
) -> Result<ApiResponse<PaginatedResponse<Sale>>, String> {
    let db = state.database.lock().await;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(50);
    let skip = (page - 1) * limit;

    let find_options = mongodb::options::FindOptions::builder()
        .limit(limit as i64)
        .skip(skip)
        .sort(doc! { "date": -1 })
        .build();

    match db.sales.find(doc! {}, find_options).await {
        Ok(mut cursor) => {
            let mut sales = Vec::new();
            while let Ok(Some(sale)) = cursor.try_next().await {
                sales.push(sale);
            }

            let total = db.sales.count_documents(doc! {}, None).await.unwrap_or(0);

            let response = PaginatedResponse {
                data: sales,
                total,
                page,
                limit,
                has_next: (page * limit) < total,
                has_prev: page > 1,
            };

            Ok(ApiResponse {
                success: true,
                data: Some(response),
                message: "Sales retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve sales".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_sale_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<Sale>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid sale ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.sales.find_one(doc! { "_id": object_id }, None).await {
        Ok(Some(sale)) => Ok(ApiResponse {
            success: true,
            data: Some(sale),
            message: "Sale found".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Sale not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Error retrieving sale".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_sales_by_date(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<ApiResponse<Vec<Sale>>, String> {
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

    let filter = doc! {
        "date": {
            "$gte": start_date_parsed,
            "$lte": end_date_parsed
        }
    };

    match db.sales.find(filter, None).await {
        Ok(mut cursor) => {
            let mut sales = Vec::new();
            while let Ok(Some(sale)) = cursor.try_next().await {
                sales.push(sale);
            }

            Ok(ApiResponse {
                success: true,
                data: Some(sales),
                message: "Sales retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve sales".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn process_payment(
    state: State<'_, AppState>,
    sale_id: String,
    payment_info: PaymentInfo,
) -> Result<ApiResponse<Sale>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&sale_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid sale ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    let update = doc! {
        "$set": {
            "payment": bson::to_bson(&payment_info).unwrap(),
            "status": "completed",
            "updated_at": Utc::now()
        }
    };

    match db.sales.find_one_and_update(
        doc! { "_id": object_id },
        update,
        None,
    ).await {
        Ok(Some(updated_sale)) => Ok(ApiResponse {
            success: true,
            data: Some(updated_sale),
            message: "Payment processed successfully".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Sale not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to process payment".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}