use tauri::{State, command};
use mongodb::bson::{doc, oid::ObjectId};
use futures::stream::TryStreamExt;
use chrono::Utc;
use anyhow::Result;

use crate::{AppState, models::*};

#[command]
pub async fn get_customers(
    state: State<'_, AppState>,
    page: Option<u64>,
    limit: Option<u64>,
) -> Result<ApiResponse<PaginatedResponse<Customer>>, String> {
    let db = state.database.lock().await;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(50);
    let skip = (page - 1) * limit;

    let find_options = mongodb::options::FindOptions::builder()
        .limit(limit as i64)
        .skip(skip)
        .sort(doc! { "name": 1 })
        .build();

    match db.customers.find(doc! {}, find_options).await {
        Ok(mut cursor) => {
            let mut customers = Vec::new();
            while let Ok(Some(customer)) = cursor.try_next().await {
                customers.push(customer);
            }

            let total = db.customers.count_documents(doc! {}, None).await.unwrap_or(0);

            let response = PaginatedResponse {
                data: customers,
                total,
                page,
                limit,
                has_next: (page * limit) < total,
                has_prev: page > 1,
            };

            Ok(ApiResponse {
                success: true,
                data: Some(response),
                message: "Customers retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve customers".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_customer_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<Customer>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid customer ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.customers.find_one(doc! { "_id": object_id }, None).await {
        Ok(Some(customer)) => Ok(ApiResponse {
            success: true,
            data: Some(customer),
            message: "Customer found".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Customer not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Error retrieving customer".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn create_customer(
    state: State<'_, AppState>,
    mut customer: Customer,
) -> Result<ApiResponse<Customer>, String> {
    let db = state.database.lock().await;
    
    customer.created_at = Utc::now();
    customer.updated_at = Utc::now();
    customer.id = None;

    match db.customers.insert_one(&customer, None).await {
        Ok(result) => {
            customer.id = Some(result.inserted_id.as_object_id().unwrap());
            Ok(ApiResponse {
                success: true,
                data: Some(customer),
                message: "Customer created successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to create customer".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn update_customer(
    state: State<'_, AppState>,
    id: String,
    mut customer: Customer,
) -> Result<ApiResponse<Customer>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid customer ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    customer.updated_at = Utc::now();
    customer.id = Some(object_id);

    match db.customers.replace_one(doc! { "_id": object_id }, &customer, None).await {
        Ok(result) if result.matched_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(customer),
            message: "Customer updated successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Customer not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update customer".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn delete_customer(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<()>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid customer ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.customers.delete_one(doc! { "_id": object_id }, None).await {
        Ok(result) if result.deleted_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(()),
            message: "Customer deleted successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Customer not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to delete customer".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn search_customers(
    state: State<'_, AppState>,
    query: String,
    page: Option<u64>,
    limit: Option<u64>,
) -> Result<ApiResponse<PaginatedResponse<Customer>>, String> {
    let db = state.database.lock().await;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    let skip = (page - 1) * limit;

    let search_filter = doc! {
        "$or": [
            { "name": { "$regex": &query, "$options": "i" } },
            { "email": { "$regex": &query, "$options": "i" } },
            { "phone": { "$regex": &query, "$options": "i" } },
            { "customer_id": &query }
        ]
    };

    let find_options = mongodb::options::FindOptions::builder()
        .limit(limit as i64)
        .skip(skip)
        .sort(doc! { "name": 1 })
        .build();

    match db.customers.find(search_filter.clone(), find_options).await {
        Ok(mut cursor) => {
            let mut customers = Vec::new();
            while let Ok(Some(customer)) = cursor.try_next().await {
                customers.push(customer);
            }

            let total = db.customers.count_documents(search_filter, None).await.unwrap_or(0);

            let response = PaginatedResponse {
                data: customers,
                total,
                page,
                limit,
                has_next: (page * limit) < total,
                has_prev: page > 1,
            };

            Ok(ApiResponse {
                success: true,
                data: Some(response),
                message: "Customer search completed".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to search customers".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}