CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(20),
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_gst_number ON suppliers(gst_number);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, rating, outstanding_balance) VALUES
('Seoul Food Co.', '이상민 (Lee Sang-min)', '+82-2-5678-9012', 'contact@seoulfood.kr', 'Food District, Seoul', 'KR-SUPP-001', 4.8, 0),
('Nongshim Co.', '박영호 (Park Young-ho)', '+82-2-6789-0123', 'sales@nongshim.kr', 'Industrial Area, Seoul', 'KR-SUPP-002', 4.9, 45000),
('CJ Foods', '김영희 (Kim Young-hee)', '+82-2-7890-1234', 'info@cjfoods.kr', 'Business District, Seoul', 'KR-SUPP-003', 4.7, 28000);
