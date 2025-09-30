use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::models::product::{Product, CreateProductRequest, UpdateProductRequest, ProductFilter};
use crate::services::product_service;
use crate::utils::error::ApiError;

pub async fn get_products(
    pool: web::Data<PgPool>,
    query: web::Query<ProductFilter>,
) -> Result<HttpResponse, ApiError> {
    let products = product_service::get_products(&pool, &query).await?;
    Ok(HttpResponse::Ok().json(products))
}

pub async fn get_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let product_id = path.into_inner();
    let product = product_service::get_product_by_id(&pool, product_id).await?;
    
    match product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}

pub async fn create_product(
    pool: web::Data<PgPool>,
    product_data: web::Json<CreateProductRequest>,
) -> Result<HttpResponse, ApiError> {
    // Validate input data
    product_data.validate()?;
    
    let product = product_service::create_product(&pool, &product_data).await?;
    Ok(HttpResponse::Created().json(product))
}

pub async fn update_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    product_data: web::Json<UpdateProductRequest>,
) -> Result<HttpResponse, ApiError> {
    // Validate input data
    product_data.validate()?;
    
    let product_id = path.into_inner();
    let updated_product = product_service::update_product(&pool, product_id, &product_data).await?;
    
    match updated_product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}

pub async fn delete_product(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let product_id = path.into_inner();
    let deleted = product_service::delete_product(&pool, product_id).await?;
    
    if deleted {
        Ok(HttpResponse::NoContent().finish())
    } else {
        Err(ApiError::NotFound("Product not found".to_string()))
    }
}

pub async fn search_products(
    pool: web::Data<PgPool>,
    query: web::Query<ProductFilter>,
) -> Result<HttpResponse, ApiError> {
    let products = product_service::search_products(&pool, &query).await?;
    Ok(HttpResponse::Ok().json(products))
}

pub async fn get_by_barcode(
    pool: web::Data<PgPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let barcode = path.into_inner();
    let product = product_service::get_product_by_barcode(&pool, &barcode).await?;
    
    match product {
        Some(product) => Ok(HttpResponse::Ok().json(product)),
        None => Err(ApiError::NotFound("Product not found".to_string())),
    }
}