use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

use crate::models::product::{Product, CreateProductRequest, UpdateProductRequest, ProductFilter};
use crate::utils::error::ApiError;

pub async fn get_products(
    pool: &PgPool,
    filter: &ProductFilter,
) -> Result<Vec<Product>, ApiError> {
    let limit = filter.limit.unwrap_or(50).min(100);
    let offset = filter.page.unwrap_or(0) * limit;
    
    let mut query = "SELECT * FROM products WHERE status = 'active'".to_string();
    let mut bind_count = 0;
    
    if let Some(_category) = &filter.category {
        bind_count += 1;
        query.push_str(&format!(" AND category = ${}", bind_count));
    }
    
    if let Some(_supplier) = &filter.supplier {
        bind_count += 1;
        query.push_str(&format!(" AND supplier = ${}", bind_count));
    }
    
    if let Some(true) = filter.low_stock {
        query.push_str(" AND stock <= reorder_level");
    }
    
    if let Some(_search) = &filter.search {
        bind_count += 1;
        query.push_str(&format!(" AND (name ILIKE ${} OR description ILIKE ${})", bind_count, bind_count));
    }
    
    query.push_str(" ORDER BY created_at DESC");
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));
    
    let mut query_builder = sqlx::query_as::<_, Product>(&query);
    
    if let Some(category) = &filter.category {
        query_builder = query_builder.bind(category);
    }
    
    if let Some(supplier) = &filter.supplier {
        query_builder = query_builder.bind(supplier);
    }
    
    if let Some(search) = &filter.search {
        let search_term = format!("%{}%", search);
        query_builder = query_builder.bind(&search_term);
    }
    
    let products = query_builder
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(products)
}

pub async fn get_product_by_id(
    pool: &PgPool,
    product_id: Uuid,
) -> Result<Option<Product>, ApiError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = $1 AND status = 'active'"
    )
    .bind(product_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn create_product(
    pool: &PgPool,
    product_data: &CreateProductRequest,
) -> Result<Product, ApiError> {
    let product_id = Uuid::new_v4();
    let now = Utc::now();
    
    let product = sqlx::query_as::<_, Product>(
        r#"
        INSERT INTO products (
            id, name, description, category, price, stock, 
            reorder_level, gst_rate, hsn_code, barcode, 
            supplier, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13)
        RETURNING *
        "#
    )
    .bind(product_id)
    .bind(&product_data.name)
    .bind(&product_data.description)
    .bind(&product_data.category)
    .bind(product_data.price)
    .bind(product_data.stock)
    .bind(product_data.reorder_level)
    .bind(product_data.gst_rate)
    .bind(&product_data.hsn_code)
    .bind(&product_data.barcode)
    .bind(&product_data.supplier)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn update_product(
    pool: &PgPool,
    product_id: Uuid,
    update_data: &UpdateProductRequest,
) -> Result<Option<Product>, ApiError> {
    let now = Utc::now();
    
    let product = sqlx::query_as::<_, Product>(
        r#"
        UPDATE products SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            price = COALESCE($5, price),
            stock = COALESCE($6, stock),
            reorder_level = COALESCE($7, reorder_level),
            gst_rate = COALESCE($8, gst_rate),
            hsn_code = COALESCE($9, hsn_code),
            barcode = COALESCE($10, barcode),
            supplier = COALESCE($11, supplier),
            status = COALESCE($12, status),
            updated_at = $13
        WHERE id = $1 AND status = 'active'
        RETURNING *
        "#
    )
    .bind(product_id)
    .bind(&update_data.name)
    .bind(&update_data.description)
    .bind(&update_data.category)
    .bind(update_data.price)
    .bind(update_data.stock)
    .bind(update_data.reorder_level)
    .bind(update_data.gst_rate)
    .bind(&update_data.hsn_code)
    .bind(&update_data.barcode)
    .bind(&update_data.supplier)
    .bind(&update_data.status)
    .bind(now)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn delete_product(
    pool: &PgPool,
    product_id: Uuid,
) -> Result<bool, ApiError> {
    let now = Utc::now();
    
    let result = sqlx::query(
        "UPDATE products SET status = 'deleted', updated_at = $2 WHERE id = $1 AND status = 'active'"
    )
    .bind(product_id)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(result.rows_affected() > 0)
}

pub async fn get_product_by_barcode(
    pool: &PgPool,
    barcode: &str,
) -> Result<Option<Product>, ApiError> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE barcode = $1 AND status = 'active'"
    )
    .bind(barcode)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
    
    Ok(product)
}

pub async fn search_products(
    pool: &PgPool,
    filter: &ProductFilter,
) -> Result<Vec<Product>, ApiError> {
    if let Some(search_term) = &filter.search {
        let search_pattern = format!("%{}%", search_term);
        
        let products = sqlx::query_as::<_, Product>(
            r#"
            SELECT * FROM products 
            WHERE status = 'active' 
            AND (
                name ILIKE $1 
                OR description ILIKE $1 
                OR category ILIKE $1 
                OR supplier ILIKE $1
                OR barcode = $2
            )
            ORDER BY 
                CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
                name
            LIMIT 20
            "#
        )
        .bind(&search_pattern)
        .bind(search_term)
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::DatabaseError(e.to_string()))?;
        
        Ok(products)
    } else {
        Ok(Vec::new())
    }
}