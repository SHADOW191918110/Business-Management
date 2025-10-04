use tauri::{State, command};
use mongodb::bson::{doc, oid::ObjectId};
use chrono::Utc;
use anyhow::Result;
use rust_decimal::Decimal;

use crate::{AppState, models::*};

#[command]
pub async fn get_inventory(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<InventoryItem>>, String> {
    let db = state.database.lock().await;

    match db.inventory.find(doc! {}, None).await {
        Ok(mut cursor) => {
            let mut inventory = Vec::new();
            while let Ok(Some(item)) = cursor.try_next().await {
                inventory.push(item);
            }

            Ok(ApiResponse {
                success: true,
                data: Some(inventory),
                message: "Inventory retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve inventory".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn update_stock(
    state: State<'_, AppState>,
    product_id: String,
    new_stock: i32,
    reason: String,
    user_id: String,
) -> Result<ApiResponse<InventoryItem>, String> {
    let db = state.database.lock().await;
    
    let product_object_id = match ObjectId::parse_str(&product_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid product ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    let user_object_id = match ObjectId::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid user ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    // Get current inventory
    let current_inventory = match db.inventory.find_one(
        doc! { "product_id": product_object_id }, 
        None
    ).await {
        Ok(Some(inv)) => inv,
        Ok(None) => {
            // Create new inventory record
            InventoryItem {
                id: None,
                product_id: product_object_id,
                current_stock: 0,
                reserved_stock: 0,
                available_stock: 0,
                last_updated: Utc::now(),
                movements: vec![],
            }
        },
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Error retrieving inventory".to_string(),
            errors: vec![e.to_string()],
        }),
    };

    let stock_difference = new_stock - current_inventory.current_stock;
    
    let movement = StockMovement {
        movement_type: MovementType::Adjustment,
        quantity: stock_difference,
        reason,
        reference_id: None,
        user_id: user_object_id,
        date: Utc::now(),
    };

    let update = doc! {
        "$set": {
            "current_stock": new_stock,
            "available_stock": new_stock - current_inventory.reserved_stock,
            "last_updated": Utc::now()
        },
        "$push": {
            "movements": bson::to_bson(&movement).unwrap()
        }
    };

    // Also update the product stock
    let product_update = doc! {
        "$set": {
            "stock": new_stock,
            "updated_at": Utc::now()
        }
    };

    match db.products.update_one(
        doc! { "_id": product_object_id },
        product_update,
        None,
    ).await {
        Ok(_) => {},
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update product stock".to_string(),
            errors: vec![e.to_string()],
        }),
    }

    match db.inventory.find_one_and_update(
        doc! { "product_id": product_object_id },
        update,
        mongodb::options::FindOneAndUpdateOptions::builder()
            .upsert(true)
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await {
        Ok(Some(updated_inventory)) => Ok(ApiResponse {
            success: true,
            data: Some(updated_inventory),
            message: "Stock updated successfully".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update inventory".to_string(),
            errors: vec!["Update operation failed".to_string()],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update inventory".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_low_stock_items(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<LowStockItem>>, String> {
    let db = state.database.lock().await;

    let pipeline = vec![
        doc! {
            "$lookup": {
                "from": "inventory",
                "localField": "_id",
                "foreignField": "product_id",
                "as": "inventory"
            }
        },
        doc! {
            "$unwind": {
                "path": "$inventory",
                "preserveNullAndEmptyArrays": true
            }
        },
        doc! {
            "$addFields": {
                "current_stock": {
                    "$ifNull": ["$inventory.current_stock", "$stock"]
                }
            }
        },
        doc! {
            "$match": {
                "$expr": {
                    "$lte": ["$current_stock", "$min_stock"]
                },
                "is_active": true
            }
        },
        doc! {
            "$project": {
                "product_id": "$_id",
                "name": 1,
                "current_stock": 1,
                "min_stock": 1,
                "days_until_out": {
                    "$cond": {
                        "if": { "$gt": ["$current_stock", 0] },
                        "then": null,
                        "else": 0
                    }
                }
            }
        }
    ];

    match db.db.collection::<mongodb::bson::Document>("products")
        .aggregate(pipeline, None)
        .await
    {
        Ok(mut cursor) => {
            let mut low_stock_items = Vec::new();
            
            while let Ok(Some(doc)) = cursor.try_next().await {
                if let Ok(item) = bson::from_document::<LowStockItem>(doc) {
                    low_stock_items.push(item);
                }
            }

            Ok(ApiResponse {
                success: true,
                data: Some(low_stock_items),
                message: "Low stock items retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve low stock items".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn adjust_stock(
    state: State<'_, AppState>,
    product_id: String,
    adjustment: i32,
    reason: String,
    user_id: String,
) -> Result<ApiResponse<InventoryItem>, String> {
    let db = state.database.lock().await;
    
    let product_object_id = match ObjectId::parse_str(&product_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid product ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    let user_object_id = match ObjectId::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid user ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    let movement = StockMovement {
        movement_type: MovementType::Adjustment,
        quantity: adjustment,
        reason,
        reference_id: None,
        user_id: user_object_id,
        date: Utc::now(),
    };

    let update = doc! {
        "$inc": {
            "current_stock": adjustment,
            "available_stock": adjustment
        },
        "$set": {
            "last_updated": Utc::now()
        },
        "$push": {
            "movements": bson::to_bson(&movement).unwrap()
        }
    };

    // Also update the product stock
    let product_update = doc! {
        "$inc": { "stock": adjustment },
        "$set": { "updated_at": Utc::now() }
    };

    match db.products.update_one(
        doc! { "_id": product_object_id },
        product_update,
        None,
    ).await {
        Ok(_) => {},
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update product stock".to_string(),
            errors: vec![e.to_string()],
        }),
    }

    match db.inventory.find_one_and_update(
        doc! { "product_id": product_object_id },
        update,
        mongodb::options::FindOneAndUpdateOptions::builder()
            .upsert(true)
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await {
        Ok(Some(updated_inventory)) => Ok(ApiResponse {
            success: true,
            data: Some(updated_inventory),
            message: "Stock adjusted successfully".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to adjust inventory".to_string(),
            errors: vec!["Adjustment operation failed".to_string()],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to adjust inventory".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}