CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('store_info', '{
    "name": "Seoul Market",
    "address": "123 Gangnam-gu, Seoul, South Korea",
    "phone": "+82-2-1234-5678",
    "email": "info@seoulmarket.kr",
    "gst_number": "KR123456789"
}', 'Store basic information'),
('tax_rates', '{
    "cgst": 9,
    "sgst": 9,
    "igst": 18
}', 'Tax rates configuration'),
('receipt_settings', '{
    "header": "Thank You for Shopping!",
    "footer": "Visit Again Soon!",
    "show_logo": true,
    "paper_size": "80mm"
}', 'Receipt printing settings'),
('currency', '{
    "code": "KRW",
    "symbol": "₩",
    "decimal_places": 0
}', 'Currency configuration');
