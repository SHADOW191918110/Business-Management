-- Create products table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100),
    hsn_code VARCHAR(20) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    supplier VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_stock_reorder ON products(stock, reorder_level);

-- Insert sample Korean products
INSERT INTO products (name, description, category, price, stock, reorder_level, gst_rate, hsn_code, barcode, supplier) VALUES
('김치 (Kimchi) 500g', 'Traditional Korean fermented cabbage', 'Korean Food', 8500, 50, 10, 5, '2005', '8801234567890', 'Seoul Food Co.'),
('라면 (Ramyeon) Pack', 'Instant Korean noodles - Spicy flavor', 'Noodles', 1200, 100, 20, 5, '1902', '8801234567891', 'Nongshim Co.'),
('참기름 (Sesame Oil) 320ml', 'Pure Korean sesame oil for cooking', 'Cooking Oil', 12000, 30, 5, 18, '1515', '8801234567892', 'CJ Foods'),
('고추장 (Gochujang) 500g', 'Korean chili paste - Spicy and sweet', 'Condiments', 6500, 25, 8, 5, '2103', '8801234567893', 'Seoul Food Co.'),
('쌀 (Rice) 10kg', 'Premium Korean white rice', 'Grains', 25000, 40, 10, 5, '1006', '8801234567894', 'Korean Rice Co.');
