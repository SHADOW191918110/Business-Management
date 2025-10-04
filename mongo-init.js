// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Connect to the pos_app database
db = db.getSiblingDB('pos_app');

// Create collections
db.createCollection('products');
db.createCollection('customers');
db.createCollection('sales');
db.createCollection('inventory');
db.createCollection('categories');
db.createCollection('users');

// Create indexes for better performance
db.products.createIndex({ "barcode": 1 }, { unique: true, sparse: true });
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "name": "text", "description": "text" });
db.customers.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.customers.createIndex({ "phone": 1 });
db.sales.createIndex({ "date": -1 });
db.sales.createIndex({ "customer_id": 1 });
db.inventory.createIndex({ "product_id": 1 });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

// Insert sample categories
db.categories.insertMany([
  {
    _id: ObjectId(),
    name: "Electronics",
    description: "Electronic items and gadgets",
    color: "#3B82F6",
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    name: "Food & Beverages",
    description: "Food items and drinks",
    color: "#10B981",
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    name: "Clothing",
    description: "Apparel and accessories",
    color: "#8B5CF6",
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    name: "Books & Stationery",
    description: "Books, notebooks, and office supplies",
    color: "#F59E0B",
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// Insert sample products
const categories = db.categories.find().toArray();
const electronicsId = categories.find(c => c.name === "Electronics")._id;
const foodId = categories.find(c => c.name === "Food & Beverages")._id;

db.products.insertMany([
  {
    _id: ObjectId(),
    sku: "ELEC001",
    name: "Wireless Bluetooth Headphones",
    name_ja: "ワイヤレス Bluetooth ヘッドフォン",
    description: "High-quality wireless headphones with noise cancellation",
    description_ja: "ノイズキャンセリング機能付き高品質ワイヤレスヘッドフォン",
    category_id: electronicsId,
    barcode: "1234567890123",
    price: 89.99,
    cost: 45.00,
    stock: 25,
    min_stock: 5,
    unit: "piece",
    tax_rate: 0.10,
    is_active: true,
    images: ["https://via.placeholder.com/200x200?text=Headphones"],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    sku: "FOOD001",
    name: "Premium Green Tea",
    name_ja: "プレミアム緑茶",
    description: "Authentic Japanese green tea leaves",
    description_ja: "本格的な日本の緑茶葉",
    category_id: foodId,
    barcode: "2345678901234",
    price: 12.99,
    cost: 6.50,
    stock: 50,
    min_stock: 10,
    unit: "box",
    tax_rate: 0.08,
    is_active: true,
    images: ["https://via.placeholder.com/200x200?text=Green+Tea"],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    sku: "ELEC002",
    name: "Smartphone Case",
    name_ja: "スマートフォンケース",
    description: "Protective case for smartphones",
    description_ja: "スマートフォン用保護ケース",
    category_id: electronicsId,
    barcode: "3456789012345",
    price: 19.99,
    cost: 8.00,
    stock: 100,
    min_stock: 20,
    unit: "piece",
    tax_rate: 0.10,
    is_active: true,
    images: ["https://via.placeholder.com/200x200?text=Phone+Case"],
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// Insert sample customers
db.customers.insertMany([
  {
    _id: ObjectId(),
    customer_id: "CUST001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0101",
    address: {
      street: "123 Main Street",
      city: "Anytown",
      state: "NY",
      zip: "12345",
      country: "USA"
    },
    loyalty_points: 150,
    total_purchases: 299.97,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId(),
    customer_id: "CUST002",
    name: "田中太郎",
    email: "tanaka@email.com",
    phone: "+81-90-1234-5678",
    address: {
      street: "東京都渋谷区神宮前1-1-1",
      city: "東京",
      state: "東京都",
      zip: "150-0001",
      country: "Japan"
    },
    loyalty_points: 75,
    total_purchases: 89.98,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// Insert default admin user
db.users.insertOne({
  _id: ObjectId(),
  username: "admin",
  email: "admin@pos-app.com",
  password: "$2b$10$rXm5UJ7LGZXhxTLqk8GG1OhKrVNFiCLUbm7KM1fLLIiRFUPb9VGLG", // hashed "admin123"
  role: "admin",
  is_active: true,
  permissions: [
    "read_products",
    "write_products",
    "read_customers",
    "write_customers",
    "read_sales",
    "write_sales",
    "read_reports",
    "write_users",
    "read_users",
    "system_settings"
  ],
  profile: {
    first_name: "System",
    last_name: "Administrator",
    avatar: null
  },
  created_at: new Date(),
  updated_at: new Date()
});

// Insert sample inventory records
const products = db.products.find().toArray();
products.forEach(product => {
  db.inventory.insertOne({
    _id: ObjectId(),
    product_id: product._id,
    current_stock: product.stock,
    reserved_stock: 0,
    available_stock: product.stock,
    last_updated: new Date(),
    movements: [
      {
        type: "initial_stock",
        quantity: product.stock,
        reason: "Initial inventory setup",
        date: new Date(),
        user_id: null
      }
    ]
  });
});

print("✅ Database initialization completed successfully!");
print("📊 Created collections: products, customers, sales, inventory, categories, users");
print("🗂️ Inserted sample data: 4 categories, 3 products, 2 customers, 1 admin user");
print("🔑 Admin credentials: username=admin, password=admin123");
print("🌐 Access MongoDB Express at: http://localhost:8081 (admin/pass123)");