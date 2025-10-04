use tauri::{State, command};
use mongodb::bson::{doc, oid::ObjectId};
use chrono::Utc;
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};

use crate::{AppState, models::*};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String, // User ID
    username: String,
    role: String,
    exp: usize, // Expiration time
}

#[command]
pub async fn login(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<LoginResponse, String> {
    let db = state.database.lock().await;

    // Find user by username
    match db.users.find_one(doc! { "username": &username }, None).await {
        Ok(Some(mut user)) => {
            // Verify password
            match verify(&password, &user.password_hash) {
                Ok(true) => {
                    // Update last login
                    user.last_login = Some(Utc::now());
                    let _ = db.users.update_one(
                        doc! { "_id": user.id },
                        doc! { "$set": { "last_login": Utc::now() } },
                        None,
                    ).await;

                    // Generate JWT token
                    let claims = Claims {
                        sub: user.id.unwrap().to_string(),
                        username: user.username.clone(),
                        role: format!("{:?}", user.role).to_lowercase(),
                        exp: (Utc::now().timestamp() + 24 * 60 * 60) as usize, // 24 hours
                    };

                    let token = match encode(
                        &Header::default(),
                        &claims,
                        &EncodingKey::from_secret("your-secret-key".as_ref()),
                    ) {
                        Ok(t) => t,
                        Err(e) => return Ok(LoginResponse {
                            success: false,
                            user: None,
                            token: None,
                            message: "Failed to generate token".to_string(),
                        }),
                    };

                    Ok(LoginResponse {
                        success: true,
                        user: Some(user),
                        token: Some(token),
                        message: "Login successful".to_string(),
                    })
                }
                Ok(false) => Ok(LoginResponse {
                    success: false,
                    user: None,
                    token: None,
                    message: "Invalid credentials".to_string(),
                }),
                Err(e) => Ok(LoginResponse {
                    success: false,
                    user: None,
                    token: None,
                    message: "Authentication error".to_string(),
                }),
            }
        }
        Ok(None) => Ok(LoginResponse {
            success: false,
            user: None,
            token: None,
            message: "Invalid credentials".to_string(),
        }),
        Err(e) => Ok(LoginResponse {
            success: false,
            user: None,
            token: None,
            message: "Database error".to_string(),
        }),
    }
}

#[command]
pub async fn logout() -> Result<ApiResponse<()>, String> {
    // In a real application, you might want to maintain a blacklist of tokens
    Ok(ApiResponse {
        success: true,
        data: Some(()),
        message: "Logout successful".to_string(),
        errors: vec![],
    })
}

#[command]
pub async fn get_current_user(
    state: State<'_, AppState>,
    token: String,
) -> Result<ApiResponse<User>, String> {
    // Decode and verify token
    let claims = match decode::<Claims>(
        &token,
        &DecodingKey::from_secret("your-secret-key".as_ref()),
        &Validation::default(),
    ) {
        Ok(token_data) => token_data.claims,
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid token".to_string(),
            errors: vec![e.to_string()],
        }),
    };

    let db = state.database.lock().await;
    let user_id = match ObjectId::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid user ID in token".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    match db.users.find_one(doc! { "_id": user_id }, None).await {
        Ok(Some(user)) => Ok(ApiResponse {
            success: true,
            data: Some(user),
            message: "User found".to_string(),
            errors: vec![],
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "User not found".to_string(),
            errors: vec![],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Database error".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}

#[command]
pub async fn change_password(
    state: State<'_, AppState>,
    user_id: String,
    current_password: String,
    new_password: String,
) -> Result<ApiResponse<()>, String> {
    let db = state.database.lock().await;
    
    let user_object_id = match ObjectId::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Invalid user ID".to_string(),
            errors: vec!["Invalid ObjectId format".to_string()],
        }),
    };

    // Get current user
    let user = match db.users.find_one(doc! { "_id": user_object_id }, None).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "User not found".to_string(),
            errors: vec![],
        }),
        Err(e) => return Ok(ApiResponse {
            success: false,
            data: None,
            message: "Database error".to_string(),
            errors: vec![e.to_string()],
        }),
    };

    // Verify current password
    match verify(&current_password, &user.password_hash) {
        Ok(true) => {
            // Hash new password
            let new_hash = match hash(&new_password, DEFAULT_COST) {
                Ok(hash) => hash,
                Err(e) => return Ok(ApiResponse {
                    success: false,
                    data: None,
                    message: "Failed to hash password".to_string(),
                    errors: vec![e.to_string()],
                }),
            };

            // Update password
            match db.users.update_one(
                doc! { "_id": user_object_id },
                doc! {
                    "$set": {
                        "password_hash": new_hash,
                        "updated_at": Utc::now()
                    }
                },
                None,
            ).await {
                Ok(_) => Ok(ApiResponse {
                    success: true,
                    data: Some(()),
                    message: "Password changed successfully".to_string(),
                    errors: vec![],
                }),
                Err(e) => Ok(ApiResponse {
                    success: false,
                    data: None,
                    message: "Failed to update password".to_string(),
                    errors: vec![e.to_string()],
                }),
            }
        }
        Ok(false) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Current password is incorrect".to_string(),
            errors: vec!["Invalid current password".to_string()],
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            message: "Password verification failed".to_string(),
            errors: vec![e.to_string()],
        }),
    }
}