use tauri::State;
use mongodb::bson::{doc, oid::ObjectId};
use chrono::Utc;
use log::{info, error};
use rust_decimal::Decimal;
use std::str::FromStr;

use crate::database::Database;
use crate::models::*;

// Product Commands
#[tauri::command]
pub async fn get_products(db: State<'_, Database>) -> Result<Vec<Product>, String> {
    info!("Fetching all products");
    
    let collection = db.products();
    let cursor = collection.find(None, None).await.map_err(|e| e.to_string())?;
    
    let mut products = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let product = cursor.deserialize_current().map_err(|e| e.to_string())?;
        products.push(product);
    }
    
    info!("Retrieved {} products", products.len());
    Ok(products)
}

#[tauri::command]
pub async fn create_product(
    db: State<'_, Database>,
    product_data: ProductCreateRequest,
) -> Result<Product, String> {
    info!("Creating new product: {}", product_data.name);
    
    let now = Utc::now();
    let product = Product {
        id: None,
        sku: product_data.sku,
        name: product_data.name,
        description: product_data.description,
        category: product_data.category,
        price: product_data.price,
        cost_price: product_data.cost_price,
        stock_quantity: product_data.stock_quantity,
        min_stock_level: product_data.min_stock_level,
        unit: product_data.unit,
        gst_rate: product_data.gst_rate,
        hsn_code: product_data.hsn_code,
        barcode: product_data.barcode,
        image_url: product_data.image_url,
        is_active: true,
        created_at: now,
        updated_at: now,
    };
    
    let collection = db.products();
    let result = collection.insert_one(&product, None).await.map_err(|e| e.to_string())?;
    
    let mut created_product = product;
    created_product.id = Some(result.inserted_id.as_object_id().unwrap());
    
    info!("Product created successfully with ID: {:?}", created_product.id);
    Ok(created_product)
}

#[tauri::command]
pub async fn update_product(
    db: State<'_, Database>,
    product_id: String,
    product_data: ProductCreateRequest,
) -> Result<Product, String> {
    info!("Updating product: {}", product_id);
    
    let object_id = ObjectId::from_str(&product_id).map_err(|e| e.to_string())?;
    let collection = db.products();
    
    let update = doc! {
        "$set": {
            "name": &product_data.name,
            "description": &product_data.description,
            "category": &product_data.category,
            "price": product_data.price.to_string(),
            "cost_price": product_data.cost_price.map(|p| p.to_string()),
            "stock_quantity": product_data.stock_quantity,
            "min_stock_level": product_data.min_stock_level,
            "unit": &product_data.unit,
            "gst_rate": product_data.gst_rate.to_string(),
            "hsn_code": &product_data.hsn_code,
            "barcode": &product_data.barcode,
            "image_url": &product_data.image_url,
            "updated_at": Utc::now(),
        }
    };
    
    collection.update_one(doc! {"_id": object_id}, update, None)
        .await
        .map_err(|e| e.to_string())?;
    
    // Fetch and return updated product
    let updated_product = collection
        .find_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Product not found after update")?;
    
    info!("Product updated successfully");
    Ok(updated_product)
}

#[tauri::command]
pub async fn delete_product(db: State<'_, Database>, product_id: String) -> Result<bool, String> {
    info!("Deleting product: {}", product_id);
    
    let object_id = ObjectId::from_str(&product_id).map_err(|e| e.to_string())?;
    let collection = db.products();
    
    let result = collection.delete_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?;
    
    let success = result.deleted_count > 0;
    info!("Product deletion result: {}", success);
    Ok(success)
}

#[tauri::command]
pub async fn search_products(db: State<'_, Database>, query: String) -> Result<Vec<Product>, String> {
    info!("Searching products with query: {}", query);
    
    let collection = db.products();
    let filter = doc! {
        "$or": [
            {"name": {"$regex": &query, "$options": "i"}},
            {"sku": {"$regex": &query, "$options": "i"}},
            {"category": {"$regex": &query, "$options": "i"}},
        ]
    };
    
    let cursor = collection.find(filter, None).await.map_err(|e| e.to_string())?;
    
    let mut products = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let product = cursor.deserialize_current().map_err(|e| e.to_string())?;
        products.push(product);
    }
    
    info!("Found {} products matching query", products.len());
    Ok(products)
}

// Customer Commands
#[tauri::command]
pub async fn get_customers(db: State<'_, Database>) -> Result<Vec<Customer>, String> {
    info!("Fetching all customers");
    
    let collection = db.customers();
    let cursor = collection.find(None, None).await.map_err(|e| e.to_string())?;
    
    let mut customers = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let customer = cursor.deserialize_current().map_err(|e| e.to_string())?;
        customers.push(customer);
    }
    
    info!("Retrieved {} customers", customers.len());
    Ok(customers)
}

#[tauri::command]
pub async fn create_customer(
    db: State<'_, Database>,
    customer_data: CustomerCreateRequest,
) -> Result<Customer, String> {
    info!("Creating new customer: {}", customer_data.name);
    
    let now = Utc::now();
    let customer_code = format!("CUST{:06}", rand::random::<u32>() % 1000000);
    
    let customer = Customer {
        id: None,
        customer_code,
        name: customer_data.name,
        email: customer_data.email,
        phone: customer_data.phone,
        gst_number: customer_data.gst_number,
        address: customer_data.address,
        credit_limit: customer_data.credit_limit,
        outstanding_balance: Decimal::ZERO,
        is_active: true,
        customer_type: customer_data.customer_type,
        created_at: now,
        updated_at: now,
    };
    
    let collection = db.customers();
    let result = collection.insert_one(&customer, None).await.map_err(|e| e.to_string())?;
    
    let mut created_customer = customer;
    created_customer.id = Some(result.inserted_id.as_object_id().unwrap());
    
    info!("Customer created successfully with ID: {:?}", created_customer.id);
    Ok(created_customer)
}

#[tauri::command]
pub async fn update_customer(
    db: State<'_, Database>,
    customer_id: String,
    customer_data: CustomerCreateRequest,
) -> Result<Customer, String> {
    info!("Updating customer: {}", customer_id);
    
    let object_id = ObjectId::from_str(&customer_id).map_err(|e| e.to_string())?;
    let collection = db.customers();
    
    let update = doc! {
        "$set": {
            "name": &customer_data.name,
            "email": &customer_data.email,
            "phone": &customer_data.phone,
            "gst_number": &customer_data.gst_number,
            "address": mongodb::bson::to_bson(&customer_data.address).map_err(|e| e.to_string())?,
            "credit_limit": customer_data.credit_limit.map(|l| l.to_string()),
            "customer_type": mongodb::bson::to_bson(&customer_data.customer_type).map_err(|e| e.to_string())?,
            "updated_at": Utc::now(),
        }
    };
    
    collection.update_one(doc! {"_id": object_id}, update, None)
        .await
        .map_err(|e| e.to_string())?;
    
    // Fetch and return updated customer
    let updated_customer = collection
        .find_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Customer not found after update")?;
    
    info!("Customer updated successfully");
    Ok(updated_customer)
}

#[tauri::command]
pub async fn delete_customer(db: State<'_, Database>, customer_id: String) -> Result<bool, String> {
    info!("Deleting customer: {}", customer_id);
    
    let object_id = ObjectId::from_str(&customer_id).map_err(|e| e.to_string())?;
    let collection = db.customers();
    
    let result = collection.delete_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?;
    
    let success = result.deleted_count > 0;
    info!("Customer deletion result: {}", success);
    Ok(success)
}

// Order Commands
#[tauri::command]
pub async fn get_orders(db: State<'_, Database>) -> Result<Vec<Order>, String> {
    info!("Fetching all orders");
    
    let collection = db.orders();
    let cursor = collection.find(None, None).await.map_err(|e| e.to_string())?;
    
    let mut orders = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let order = cursor.deserialize_current().map_err(|e| e.to_string())?;
        orders.push(order);
    }
    
    info!("Retrieved {} orders", orders.len());
    Ok(orders)
}

#[tauri::command]
pub async fn create_order(
    db: State<'_, Database>,
    order_data: OrderCreateRequest,
) -> Result<Order, String> {
    info!("Creating new order for customer: {}", order_data.customer_id);
    
    let customer_id = ObjectId::from_str(&order_data.customer_id).map_err(|e| e.to_string())?;
    
    // Fetch customer info
    let customer = db.customers()
        .find_one(doc! {"_id": customer_id}, None)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Customer not found")?;
    
    let order_number = format!("ORD{:08}", rand::random::<u32>() % 100000000);
    let now = Utc::now();
    
    // Build order items with product details
    let mut order_items = Vec::new();
    let mut subtotal = Decimal::ZERO;
    
    for item_req in order_data.items {
        let product_id = ObjectId::from_str(&item_req.product_id).map_err(|e| e.to_string())?;
        let product = db.products()
            .find_one(doc! {"_id": product_id}, None)
            .await
            .map_err(|e| e.to_string())?
            .ok_or("Product not found")?;
        
        let unit_price = product.price;
        let discount = item_req.discount.unwrap_or(Decimal::ZERO);
        let discounted_price = unit_price - discount;
        let total_price = discounted_price * Decimal::from(item_req.quantity);
        
        let order_item = OrderItem {
            product_id,
            sku: product.sku,
            name: product.name,
            quantity: item_req.quantity,
            unit_price,
            discount: item_req.discount,
            gst_rate: product.gst_rate,
            total_price,
        };
        
        subtotal += total_price;
        order_items.push(order_item);
    }
    
    // Calculate GST
    let total_gst_rate = Decimal::from(18); // 18% total GST (9% CGST + 9% SGST)
    let gst_amount = subtotal * total_gst_rate / Decimal::from(100);
    let cgst = gst_amount / Decimal::from(2);
    let sgst = gst_amount / Decimal::from(2);
    
    let total_discount = order_data.discount.unwrap_or(Decimal::ZERO);
    let total_amount = subtotal + gst_amount - total_discount;
    
    let order = Order {
        id: None,
        order_number,
        customer_id,
        customer_info: CustomerInfo {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            gst_number: customer.gst_number,
            address: customer.address,
        },
        items: order_items,
        subtotal,
        discount: order_data.discount,
        cgst,
        sgst,
        igst: None, // For interstate transactions
        total_amount,
        payment_status: PaymentStatus::Pending,
        order_status: OrderStatus::Confirmed,
        payment_method: order_data.payment_method,
        notes: order_data.notes,
        created_at: now,
        updated_at: now,
    };
    
    let collection = db.orders();
    let result = collection.insert_one(&order, None).await.map_err(|e| e.to_string())?;
    
    let mut created_order = order;
    created_order.id = Some(result.inserted_id.as_object_id().unwrap());
    
    info!("Order created successfully with ID: {:?}", created_order.id);
    Ok(created_order)
}

#[tauri::command]
pub async fn update_order(
    db: State<'_, Database>,
    order_id: String,
    status: String,
) -> Result<Order, String> {
    info!("Updating order: {} with status: {}", order_id, status);
    
    let object_id = ObjectId::from_str(&order_id).map_err(|e| e.to_string())?;
    let collection = db.orders();
    
    let order_status = match status.as_str() {
        "confirmed" => OrderStatus::Confirmed,
        "processing" => OrderStatus::Processing,
        "shipped" => OrderStatus::Shipped,
        "delivered" => OrderStatus::Delivered,
        "cancelled" => OrderStatus::Cancelled,
        _ => return Err("Invalid order status".to_string()),
    };
    
    let update = doc! {
        "$set": {
            "order_status": mongodb::bson::to_bson(&order_status).map_err(|e| e.to_string())?,
            "updated_at": Utc::now(),
        }
    };
    
    collection.update_one(doc! {"_id": object_id}, update, None)
        .await
        .map_err(|e| e.to_string())?;
    
    // Fetch and return updated order
    let updated_order = collection
        .find_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Order not found after update")?;
    
    info!("Order updated successfully");
    Ok(updated_order)
}

#[tauri::command]
pub async fn get_order_by_id(db: State<'_, Database>, order_id: String) -> Result<Option<Order>, String> {
    info!("Fetching order by ID: {}", order_id);
    
    let object_id = ObjectId::from_str(&order_id).map_err(|e| e.to_string())?;
    let collection = db.orders();
    
    let order = collection
        .find_one(doc! {"_id": object_id}, None)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(order)
}

// Inventory Commands
#[tauri::command]
pub async fn get_inventory(db: State<'_, Database>) -> Result<Vec<InventoryItem>, String> {
    info!("Fetching inventory items");
    
    let collection = db.inventory();
    let cursor = collection.find(None, None).await.map_err(|e| e.to_string())?;
    
    let mut items = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let item = cursor.deserialize_current().map_err(|e| e.to_string())?;
        items.push(item);
    }
    
    info!("Retrieved {} inventory items", items.len());
    Ok(items)
}

#[tauri::command]
pub async fn update_inventory(
    db: State<'_, Database>,
    product_id: String,
    quantity: i32,
    movement_type: String,
    reference: String,
) -> Result<bool, String> {
    info!("Updating inventory for product: {}", product_id);
    
    let object_id = ObjectId::from_str(&product_id).map_err(|e| e.to_string())?;
    let collection = db.inventory();
    
    let movement_type = match movement_type.as_str() {
        "sale" => MovementType::Sale,
        "purchase" => MovementType::Purchase,
        "return" => MovementType::Return,
        "adjustment" => MovementType::Adjustment,
        _ => return Err("Invalid movement type".to_string()),
    };
    
    let movement = StockMovement {
        movement_type,
        quantity,
        reference,
        notes: None,
        created_at: Utc::now(),
    };
    
    let update = doc! {
        "$inc": {"current_stock": quantity},
        "$push": {"movements": mongodb::bson::to_bson(&movement).map_err(|e| e.to_string())?},
        "$set": {"last_updated": Utc::now()},
    };
    
    let result = collection
        .update_one(doc! {"product_id": object_id}, update, None)
        .await
        .map_err(|e| e.to_string())?;
    
    let success = result.modified_count > 0;
    info!("Inventory update result: {}", success);
    Ok(success)
}

#[tauri::command]
pub async fn get_low_stock_items(db: State<'_, Database>) -> Result<Vec<Product>, String> {
    info!("Fetching low stock items");
    
    let collection = db.products();
    let filter = doc! {
        "$expr": {"$lte": ["$stock_quantity", "$min_stock_level"]}
    };
    
    let cursor = collection.find(filter, None).await.map_err(|e| e.to_string())?;
    
    let mut products = Vec::new();
    let mut cursor = cursor;
    while cursor.advance().await.map_err(|e| e.to_string())? {
        let product = cursor.deserialize_current().map_err(|e| e.to_string())?;
        products.push(product);
    }
    
    info!("Found {} low stock items", products.len());
    Ok(products)
}

// Calculation Commands
#[tauri::command]
pub async fn calculate_gst(
    base_amount: f64,
    gst_rate: f64,
) -> Result<GstCalculation, String> {
    let base = Decimal::from_f64_retain(base_amount).ok_or("Invalid base amount")?;
    let rate = Decimal::from_f64_retain(gst_rate).ok_or("Invalid GST rate")?;
    
    let gst_amount = base * rate / Decimal::from(100);
    let cgst = gst_amount / Decimal::from(2);
    let sgst = gst_amount / Decimal::from(2);
    let total = base + gst_amount;
    
    Ok(GstCalculation {
        base_amount: base,
        gst_rate: rate,
        cgst,
        sgst,
        igst: None,
        total_amount: total,
    })
}

#[tauri::command]
pub async fn calculate_order_total(
    items: Vec<OrderItemRequest>,
    discount: Option<f64>,
) -> Result<Decimal, String> {
    let mut total = Decimal::ZERO;
    
    for item in items {
        let quantity = Decimal::from(item.quantity);
        let item_discount = item.discount.unwrap_or(Decimal::ZERO);
        // Note: You would need to fetch product price from database
        // This is a simplified calculation
        total += quantity * Decimal::from(100) - item_discount; // Assuming price of 100
    }
    
    if let Some(d) = discount {
        let discount_amount = Decimal::from_f64_retain(d).ok_or("Invalid discount")?;
        total -= discount_amount;
    }
    
    Ok(total)
}

// Report Commands
#[tauri::command]
pub async fn get_sales_report(
    db: State<'_, Database>,
    start_date: String,
    end_date: String,
) -> Result<SalesReport, String> {
    info!("Generating sales report from {} to {}", start_date, end_date);
    
    // This is a simplified implementation
    // In a real application, you would use MongoDB aggregation pipeline
    let orders = get_orders(db).await?;
    
    let total_orders = orders.len() as i64;
    let total_sales: Decimal = orders.iter().map(|o| o.total_amount).sum();
    let average_order_value = if total_orders > 0 {
        total_sales / Decimal::from(total_orders)
    } else {
        Decimal::ZERO
    };
    
    Ok(SalesReport {
        period: format!("{} to {}", start_date, end_date),
        total_sales,
        total_orders,
        average_order_value,
        top_products: Vec::new(), // Would be populated with aggregation
        sales_by_month: Vec::new(), // Would be populated with aggregation
    })
}

#[tauri::command]
pub async fn get_inventory_report(db: State<'_, Database>) -> Result<InventoryReport, String> {
    info!("Generating inventory report");
    
    let products = get_products(db).await?;
    let low_stock_items = get_low_stock_items(db).await?;
    
    let total_products = products.len() as i64;
    let low_stock_count = low_stock_items.len() as i64;
    let out_of_stock_count = products.iter().filter(|p| p.stock_quantity == 0).count() as i64;
    let total_inventory_value: Decimal = products.iter()
        .map(|p| p.price * Decimal::from(p.stock_quantity))
        .sum();
    
    let items: Vec<InventoryReportItem> = products.iter().map(|p| {
        let status = if p.stock_quantity == 0 {
            "Out of Stock".to_string()
        } else if p.stock_quantity <= p.min_stock_level {
            "Low Stock".to_string()
        } else {
            "In Stock".to_string()
        };
        
        InventoryReportItem {
            sku: p.sku.clone(),
            name: p.name.clone(),
            current_stock: p.stock_quantity,
            min_stock_level: p.min_stock_level,
            stock_value: p.price * Decimal::from(p.stock_quantity),
            status,
        }
    }).collect();
    
    Ok(InventoryReport {
        total_products,
        low_stock_items: low_stock_count,
        out_of_stock_items: out_of_stock_count,
        total_inventory_value,
        items,
    })
}

#[tauri::command]
pub async fn get_customer_report(db: State<'_, Database>) -> Result<Vec<Customer>, String> {
    info!("Generating customer report");
    get_customers(db).await
}

// System Commands
#[tauri::command]
pub async fn backup_data(db: State<'_, Database>) -> Result<String, String> {
    info!("Starting data backup");
    
    let collections = vec!["products", "customers", "orders", "inventory"];
    let mut backup_data = std::collections::HashMap::new();
    
    for collection_name in collections {
        let data = db.backup_collection(collection_name).await.map_err(|e| e.to_string())?;
        backup_data.insert(collection_name, data);
    }
    
    let backup_json = serde_json::to_string_pretty(&backup_data).map_err(|e| e.to_string())?;
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("wholesale_erp_backup_{}.json", timestamp);
    
    info!("Data backup completed: {}", filename);
    Ok(backup_json)
}

#[tauri::command]
pub async fn get_system_stats(db: State<'_, Database>) -> Result<SystemStats, String> {
    info!("Fetching system statistics");
    
    let total_products = db.get_collection_count("products").await.map_err(|e| e.to_string())?;
    let total_customers = db.get_collection_count("customers").await.map_err(|e| e.to_string())?;
    let total_orders = db.get_collection_count("orders").await.map_err(|e| e.to_string())?;
    
    // Count pending orders
    let orders = get_orders(db).await?;
    let pending_orders = orders.iter()
        .filter(|o| matches!(o.order_status, OrderStatus::Confirmed | OrderStatus::Processing))
        .count() as u64;
    
    let low_stock_items = get_low_stock_items(db).await?.len() as u64;
    let database_health = db.health_check().await.map_err(|e| e.to_string())?;
    
    Ok(SystemStats {
        total_products,
        total_customers,
        total_orders,
        pending_orders,
        low_stock_items,
        database_health,
    })
}