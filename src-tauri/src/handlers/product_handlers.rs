use tauri::{State, command};
use mongodb::{bson::{doc, oid::ObjectId}, options::FindOptions};
use futures::stream::TryStreamExt;
use chrono::Utc;
use anyhow::Result;

use crate::{AppState, models::*};

// Product handlers
#[command]
pub async fn get_products(
    state: State<'_, AppState>,
    page: Option<u64>,
    limit: Option<u64>,
) -> Result<ApiResponse<PaginatedResponse<Product>>, String> {
    let db = state.database.lock().await;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(50);
    let skip = (page - 1) * limit;

    let find_options = FindOptions::builder()
        .limit(limit as i64)
        .skip(skip)
        .sort(doc! { "name": 1 })
        .build();

    match db.products.find(doc! {}, find_options).await {
        Ok(mut cursor) => {
            let mut products = Vec::new();
            while let Ok(Some(product)) = cursor.try_next().await {
                products.push(product);
            }

            let total = db.products.count_documents(doc! {}, None).await.unwrap_or(0);

            let response = PaginatedResponse {
                data: products,
                total,
                page,
                limit,
                has_next: (page * limit) < total,
                has_prev: page > 1,
            };

            Ok(ApiResponse {
                success: true,
                data: Some(response),
                message: "Products retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve products".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_product_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<Product>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid product ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.products.find_one(doc! { "_id": object_id }, None).await {
        Ok(Some(product)) => Ok(ApiResponse {
            success: true,
            data: Some(product),
            message: "Product found".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Product not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Error retrieving product".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn get_product_by_barcode(
    state: State<'_, AppState>,
    barcode: String,
) -> Result<ApiResponse<Product>, String> {
    let db = state.database.lock().await;

    match db.products.find_one(doc! { "barcode": &barcode }, None).await {
        Ok(Some(product)) => Ok(ApiResponse {
            success: true,
            data: Some(product),
            message: "Product found".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Product not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Error retrieving product".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn create_product(
    state: State<'_, AppState>,
    mut product: Product,
) -> Result<ApiResponse<Product>, String> {
    let db = state.database.lock().await;
    
    // Set timestamps
    product.created_at = Utc::now();
    product.updated_at = Utc::now();
    product.id = None; // Let MongoDB generate the ID

    match db.products.insert_one(&product, None).await {
        Ok(result) => {
            product.id = Some(result.inserted_id.as_object_id().unwrap());
            Ok(ApiResponse {
                success: true,
                data: Some(product),
                message: "Product created successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to create product".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn update_product(
    state: State<'_, AppState>,
    id: String,
    mut product: Product,
) -> Result<ApiResponse<Product>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid product ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    product.updated_at = Utc::now();
    product.id = Some(object_id);

    match db.products.replace_one(doc! { "_id": object_id }, &product, None).await {
        Ok(result) if result.matched_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(product),
            message: "Product updated successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Product not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update product".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn delete_product(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<()>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid product ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.products.delete_one(doc! { "_id": object_id }, None).await {
        Ok(result) if result.deleted_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(()),
            message: "Product deleted successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Product not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to delete product".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn search_products(
    state: State<'_, AppState>,
    query: String,
    page: Option<u64>,
    limit: Option<u64>,
) -> Result<ApiResponse<PaginatedResponse<Product>>, String> {
    let db = state.database.lock().await;
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    let skip = (page - 1) * limit;

    let search_filter = doc! {
        "$or": [
            { "name": { "$regex": &query, "$options": "i" } },
            { "description": { "$regex": &query, "$options": "i" } },
            { "sku": { "$regex": &query, "$options": "i" } },
            { "barcode": &query }
        ]
    };

    let find_options = FindOptions::builder()
        .limit(limit as i64)
        .skip(skip)
        .sort(doc! { "name": 1 })
        .build();

    match db.products.find(search_filter.clone(), find_options).await {
        Ok(mut cursor) => {
            let mut products = Vec::new();
            while let Ok(Some(product)) = cursor.try_next().await {
                products.push(product);
            }

            let total = db.products.count_documents(search_filter, None).await.unwrap_or(0);

            let response = PaginatedResponse {
                data: products,
                total,
                page,
                limit,
                has_next: (page * limit) < total,
                has_prev: page > 1,
            };

            Ok(ApiResponse {
                success: true,
                data: Some(response),
                message: "Products search completed".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to search products".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

// Category handlers
#[command]
pub async fn get_categories(state: State<'_, AppState>) -> Result<ApiResponse<Vec<Category>>, String> {
    let db = state.database.lock().await;

    match db.categories.find(doc! {}, None).await {
        Ok(mut cursor) => {
            let mut categories = Vec::new();
            while let Ok(Some(category)) = cursor.try_next().await {
                categories.push(category);
            }

            Ok(ApiResponse {
                success: true,
                data: Some(categories),
                message: "Categories retrieved successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to retrieve categories".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn create_category(
    state: State<'_, AppState>,
    mut category: Category,
) -> Result<ApiResponse<Category>, String> {
    let db = state.database.lock().await;
    
    category.created_at = Utc::now();
    category.updated_at = Utc::now();
    category.id = None;

    match db.categories.insert_one(&category, None).await {
        Ok(result) => {
            category.id = Some(result.inserted_id.as_object_id().unwrap());
            Ok(ApiResponse {
                success: true,
                data: Some(category),
                message: "Category created successfully".to_string(),
                errors: vec![],
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to create category".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn update_category(
    state: State<'_, AppState>,
    id: String,
    mut category: Category,
) -> Result<ApiResponse<Category>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid category ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    category.updated_at = Utc::now();
    category.id = Some(object_id);

    match db.categories.replace_one(doc! { "_id": object_id }, &category, None).await {
        Ok(result) if result.matched_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(category),
            message: "Category updated successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Category not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to update category".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn delete_category(
    state: State<'_, AppState>,
    id: String,
) -> Result<ApiResponse<()>, String> {
    let db = state.database.lock().await;
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid category ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    // Check if category is used by any products
    let products_count = db.products.count_documents(doc! { "category_id": object_id }, None).await.unwrap_or(0);
    
    if products_count > 0 {
        return Ok(ApiResponse {
            success: false,
            data: None,
            message: format!("Cannot delete category. {} products are using this category", products_count),
            errors: vec!["Category is in use".to_string()],
        });
    }

    match db.categories.delete_one(doc! { "_id": object_id }, None).await {
        Ok(result) if result.deleted_count > 0 => Ok(ApiResponse {
            success: true,
            data: Some(()),
            message: "Category deleted successfully".to_string(),
            errors: vec![],
        }),
        Ok(_) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Category not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Failed to delete category".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}