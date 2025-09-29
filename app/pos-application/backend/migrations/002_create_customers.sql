CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(20),
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_gst_number ON customers(gst_number);
CREATE INDEX idx_customers_status ON customers(status);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, gst_number, loyalty_points, total_orders, total_value) VALUES
('김민수 (Kim Min-su)', 'minsu.kim@email.kr', '+82-10-1234-5678', 'Gangnam-gu, Seoul', NULL, 1500, 12, 125000),
('박지은 (Park Ji-eun)', 'jieun.park@email.kr', '+82-10-2345-6789', 'Hongdae, Seoul', NULL, 890, 8, 89000),
('이준호 (Lee Jun-ho)', 'junho.lee@email.kr', '+82-10-3456-7890', 'Myeongdong, Seoul', 'KR-B2B-001', 2340, 23, 234000);
