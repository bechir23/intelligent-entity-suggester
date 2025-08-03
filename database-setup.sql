-- =====================================================
-- INTELLIGENT ENTITY SUGGESTER - COMPLETE DATABASE SETUP
-- Execute this script in your Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, ''))
    ) STORED
);

-- =====================================================
-- 3. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(sku, ''))
    ) STORED
);

-- =====================================================
-- 4. SALES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(notes, '') || ' ' || coalesce(status, ''))
    ) STORED
);

-- =====================================================
-- 5. STOCK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    warehouse_location VARCHAR(255),
    quantity_available INTEGER NOT NULL,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    last_restocked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(warehouse_location, ''))
    ) STORED
);

-- =====================================================
-- 6. TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(status, '') || ' ' || coalesce(priority, ''))
    ) STORED
);

-- =====================================================
-- 7. SHIFTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- in minutes
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(location, '') || ' ' || coalesce(notes, ''))
    ) STORED
);

-- =====================================================
-- 8. ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    shift_id UUID REFERENCES shifts(id),
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(status, '') || ' ' || coalesce(notes, ''))
    ) STORED
);

-- =====================================================
-- 9. DATE DIMENSION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS date_dimension (
    date_key DATE PRIMARY KEY,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    week INTEGER,
    day_of_year INTEGER,
    day_of_month INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    month_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name VARCHAR(255),
    fiscal_year INTEGER,
    fiscal_quarter INTEGER
);

-- =====================================================
-- 10. AUDIT TRAIL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity_table VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    metadata JSONB,
    document_context TEXT,
    offset_start INTEGER,
    offset_end INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(document_context, '') || ' ' || coalesce(action, ''))
    ) STORED
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_sales_search ON sales USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_stock_search ON stock USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_shifts_search ON shifts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_attendance_search ON attendance USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_audit_trail_search ON audit_trail USING GIN(search_vector);

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING GIN(email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_company_trgm ON customers USING GIN(company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING GIN(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING GIN(title gin_trgm_ops);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_shift_id ON attendance(shift_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_table, entity_id);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample users
INSERT INTO users (id, email, full_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@company.com', 'System Administrator', 'admin'),
    ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@company.com', 'John Doe', 'user'),
    ('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@company.com', 'Jane Smith', 'manager'),
    ('550e8400-e29b-41d4-a716-446655440003', 'ahmed.hassan@company.com', 'Ahmed Hassan', 'user'),
    ('550e8400-e29b-41d4-a716-446655440004', 'sarah.wilson@company.com', 'Sarah Wilson', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, company, address) VALUES
    ('650e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john.doe@acme.com', '+1-555-0123', 'Acme Corporation', '123 Business Ave, New York, NY'),
    ('650e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane.smith@techcorp.com', '+1-555-0456', 'TechCorp Solutions', '456 Innovation St, San Francisco, CA'),
    ('650e8400-e29b-41d4-a716-446655440002', 'Ahmed Hassan', 'ahmed@digitalagency.com', '+44-20-1234-5678', 'Digital Agency Ltd', '789 London Road, London, UK'),
    ('650e8400-e29b-41d4-a716-446655440003', 'Sarah Wilson', 'sarah@startup.io', '+1-555-0789', 'Startup Innovation Inc', '321 Venture Blvd, Austin, TX'),
    ('650e8400-e29b-41d4-a716-446655440004', 'Michael Brown', 'mike@consulting.com', '+1-555-0321', 'Brown Consulting Group', '654 Professional Dr, Chicago, IL'),
    ('650e8400-e29b-41d4-a716-446655440005', 'Lisa Johnson', 'lisa@ecommerce.com', '+1-555-0654', 'E-Commerce Solutions', '987 Retail Ave, Miami, FL')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, price, sku, category, stock_quantity) VALUES
    ('750e8400-e29b-41d4-a716-446655440000', 'Laptop Pro 15"', 'High-performance laptop with 15-inch display, 16GB RAM, 512GB SSD', 1299.99, 'LAP-PRO-15', 'Electronics', 25),
    ('750e8400-e29b-41d4-a716-446655440001', 'Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'MOU-WIR-001', 'Accessories', 150),
    ('750e8400-e29b-41d4-a716-446655440002', 'Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard', 89.99, 'KEY-MECH-RGB', 'Accessories', 75),
    ('750e8400-e29b-41d4-a716-446655440003', '4K Monitor 27"', 'Ultra HD 4K monitor with USB-C connectivity', 449.99, 'MON-4K-27', 'Electronics', 40),
    ('750e8400-e29b-41d4-a716-446655440004', 'USB-C Hub', 'Multi-port USB-C hub with HDMI and ethernet', 59.99, 'HUB-USBC-001', 'Accessories', 100),
    ('750e8400-e29b-41d4-a716-446655440005', 'Webcam HD', 'Full HD webcam with auto-focus and noise cancellation', 79.99, 'CAM-HD-001', 'Electronics', 80)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample sales
INSERT INTO sales (customer_id, product_id, quantity, unit_price, total_amount, sale_date, status, notes) VALUES
    ('650e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', 2, 1299.99, 2599.98, '2025-07-15 10:30:00+00', 'completed', 'Bulk order for office setup'),
    ('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 10, 29.99, 299.90, '2025-07-20 14:15:00+00', 'completed', 'Team mouse upgrade'),
    ('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003', 1, 449.99, 449.99, '2025-07-25 09:45:00+00', 'pending', 'Monitor for new workstation'),
    ('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440002', 3, 89.99, 269.97, '2025-07-28 16:20:00+00', 'completed', 'Keyboards for development team'),
    ('650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', 5, 59.99, 299.95, '2025-07-30 11:10:00+00', 'processing', 'USB-C hubs for conference room');

-- Insert sample stock records
INSERT INTO stock (product_id, warehouse_location, quantity_available, reserved_quantity, reorder_level, last_restocked) VALUES
    ('750e8400-e29b-41d4-a716-446655440000', 'Main Warehouse - A1', 23, 2, 10, '2025-07-01 08:00:00+00'),
    ('750e8400-e29b-41d4-a716-446655440001', 'Main Warehouse - B2', 140, 10, 50, '2025-07-10 10:30:00+00'),
    ('750e8400-e29b-41d4-a716-446655440002', 'Main Warehouse - B3', 72, 3, 20, '2025-07-15 14:45:00+00'),
    ('750e8400-e29b-41d4-a716-446655440003', 'Main Warehouse - A2', 39, 1, 15, '2025-07-05 09:15:00+00'),
    ('750e8400-e29b-41d4-a716-446655440004', 'Main Warehouse - C1', 95, 5, 25, '2025-07-20 13:30:00+00'),
    ('750e8400-e29b-41d4-a716-446655440005', 'Main Warehouse - B1', 80, 0, 30, '2025-07-18 11:20:00+00');

-- Insert sample tasks
INSERT INTO tasks (id, title, description, assigned_to, status, priority, due_date) VALUES
    ('850e8400-e29b-41d4-a716-446655440000', 'Update website homepage', 'Redesign the homepage with new branding guidelines and improved user experience', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', 'high', '2025-08-05 17:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440001', 'Customer onboarding call', 'Schedule and conduct onboarding call with new client Ahmed Hassan', '550e8400-e29b-41d4-a716-446655440001', 'pending', 'medium', '2025-08-02 15:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440002', 'Inventory audit', 'Complete quarterly inventory audit for all warehouse locations', '550e8400-e29b-41d4-a716-446655440003', 'pending', 'medium', '2025-08-10 18:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440003', 'Security system upgrade', 'Upgrade office security system and update access controls', '550e8400-e29b-41d4-a716-446655440004', 'not_started', 'high', '2025-08-15 12:00:00+00'),
    ('850e8400-e29b-41d4-a716-446655440004', 'Quarterly report preparation', 'Prepare Q3 financial and operational reports for board meeting', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', 'high', '2025-08-08 16:00:00+00');

-- Insert sample shifts
INSERT INTO shifts (user_id, shift_date, start_time, end_time, break_duration, location, notes) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '2025-08-01', '09:00:00', '17:00:00', 60, 'Main Office - Floor 1', 'Regular office shift'),
    ('550e8400-e29b-41d4-a716-446655440002', '2025-08-01', '08:30:00', '16:30:00', 45, 'Main Office - Floor 2', 'Management shift'),
    ('550e8400-e29b-41d4-a716-446655440003', '2025-08-01', '10:00:00', '18:00:00', 60, 'Warehouse', 'Inventory management'),
    ('550e8400-e29b-41d4-a716-446655440004', '2025-08-01', '07:00:00', '15:00:00', 30, 'Security Office', 'Early security shift'),
    ('550e8400-e29b-41d4-a716-446655440001', '2025-08-02', '09:00:00', '17:00:00', 60, 'Main Office - Floor 1', 'Client meeting day');

-- Insert sample attendance
INSERT INTO attendance (user_id, shift_id, clock_in, clock_out, break_start, break_end, status, notes) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM shifts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND shift_date = '2025-08-01'), '2025-08-01 09:05:00+00', '2025-08-01 17:10:00+00', '2025-08-01 12:00:00+00', '2025-08-01 13:00:00+00', 'present', 'On time'),
    ('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM shifts WHERE user_id = '550e8400-e29b-41d4-a716-446655440002' AND shift_date = '2025-08-01'), '2025-08-01 08:30:00+00', '2025-08-01 16:35:00+00', '2025-08-01 12:30:00+00', '2025-08-01 13:15:00+00', 'present', 'Early arrival'),
    ('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM shifts WHERE user_id = '550e8400-e29b-41d4-a716-446655440003' AND shift_date = '2025-08-01'), '2025-08-01 10:15:00+00', '2025-08-01 18:05:00+00', '2025-08-01 13:00:00+00', '2025-08-01 14:00:00+00', 'late', 'Traffic delay'),
    ('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM shifts WHERE user_id = '550e8400-e29b-41d4-a716-446655440004' AND shift_date = '2025-08-01'), '2025-08-01 07:00:00+00', '2025-08-01 15:00:00+00', '2025-08-01 11:00:00+00', '2025-08-01 11:30:00+00', 'present', 'Perfect timing');

-- Insert sample date dimension data (next 90 days)
INSERT INTO date_dimension (date_key, year, quarter, month, week, day_of_year, day_of_month, day_of_week, day_name, month_name, is_weekend, is_holiday, fiscal_year, fiscal_quarter)
SELECT 
    date_key,
    EXTRACT(YEAR FROM date_key) as year,
    EXTRACT(QUARTER FROM date_key) as quarter,
    EXTRACT(MONTH FROM date_key) as month,
    EXTRACT(WEEK FROM date_key) as week,
    EXTRACT(DOY FROM date_key) as day_of_year,
    EXTRACT(DAY FROM date_key) as day_of_month,
    EXTRACT(DOW FROM date_key) as day_of_week,
    TO_CHAR(date_key, 'Day') as day_name,
    TO_CHAR(date_key, 'Month') as month_name,
    EXTRACT(DOW FROM date_key) IN (0, 6) as is_weekend,
    false as is_holiday,
    CASE 
        WHEN EXTRACT(MONTH FROM date_key) >= 7 THEN EXTRACT(YEAR FROM date_key) + 1
        ELSE EXTRACT(YEAR FROM date_key)
    END as fiscal_year,
    CASE 
        WHEN EXTRACT(MONTH FROM date_key) IN (7, 8, 9) THEN 1
        WHEN EXTRACT(MONTH FROM date_key) IN (10, 11, 12) THEN 2
        WHEN EXTRACT(MONTH FROM date_key) IN (1, 2, 3) THEN 3
        ELSE 4
    END as fiscal_quarter
FROM (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '90 days',
        INTERVAL '1 day'
    )::date as date_key
) dates
ON CONFLICT (date_key) DO NOTHING;

-- Insert sample audit trail
INSERT INTO audit_trail (user_id, entity_table, entity_id, action, metadata, document_context, offset_start, offset_end) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'customers', '650e8400-e29b-41d4-a716-446655440000', 'mention', '{"entity_type": "customer", "confidence": 0.95}', 'Meeting with John Doe scheduled for tomorrow', 13, 21),
    ('550e8400-e29b-41d4-a716-446655440002', 'products', '750e8400-e29b-41d4-a716-446655440000', 'mention', '{"entity_type": "product", "confidence": 0.90}', 'Need to order more Laptop Pro 15" units', 19, 32),
    ('550e8400-e29b-41d4-a716-446655440003', 'tasks', '850e8400-e29b-41d4-a716-446655440000', 'mention', '{"entity_type": "task", "confidence": 0.85}', 'Update website homepage is behind schedule', 0, 23),
    ('550e8400-e29b-41d4-a716-446655440001', 'customers', '650e8400-e29b-41d4-a716-446655440002', 'mention', '{"entity_type": "customer", "confidence": 0.92}', 'Ahmed Hassan wants to discuss the project timeline', 0, 12);

-- =====================================================
-- SEARCH FUNCTION FOR ENTITY SUGGESTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION search_entities(
    search_query TEXT,
    entity_types TEXT[] DEFAULT NULL,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    entity_id TEXT,
    entity_type TEXT,
    display_label TEXT,
    entity_data JSONB,
    search_rank REAL
) AS $$
DECLARE
    query_tsquery TSQUERY;
BEGIN
    -- Convert search query to tsquery
    query_tsquery := plainto_tsquery('english', search_query);
    
    -- Return empty if query is too short
    IF LENGTH(TRIM(search_query)) < 2 THEN
        RETURN;
    END IF;
    
    -- Search customers
    IF entity_types IS NULL OR 'customer' = ANY(entity_types) THEN
        RETURN QUERY
        SELECT 
            c.id::TEXT as entity_id,
            'customer'::TEXT as entity_type,
            c.name as display_label,
            jsonb_build_object(
                'email', c.email,
                'phone', c.phone,
                'company', c.company,
                'address', c.address
            ) as entity_data,
            GREATEST(
                ts_rank(c.search_vector, query_tsquery),
                similarity(c.name, search_query),
                CASE WHEN c.email ILIKE '%' || search_query || '%' THEN 0.8 ELSE 0 END,
                CASE WHEN c.company ILIKE '%' || search_query || '%' THEN 0.7 ELSE 0 END
            ) as search_rank
        FROM customers c
        WHERE c.search_vector @@ query_tsquery
           OR c.name ILIKE '%' || search_query || '%'
           OR c.email ILIKE '%' || search_query || '%'
           OR c.company ILIKE '%' || search_query || '%'
           OR similarity(c.name, search_query) > 0.3;
    END IF;
    
    -- Search products
    IF entity_types IS NULL OR 'product' = ANY(entity_types) THEN
        RETURN QUERY
        SELECT 
            p.id::TEXT as entity_id,
            'product'::TEXT as entity_type,
            p.name as display_label,
            jsonb_build_object(
                'description', p.description,
                'price', p.price,
                'sku', p.sku,
                'category', p.category,
                'stock_quantity', p.stock_quantity
            ) as entity_data,
            GREATEST(
                ts_rank(p.search_vector, query_tsquery),
                similarity(p.name, search_query),
                CASE WHEN p.description ILIKE '%' || search_query || '%' THEN 0.6 ELSE 0 END,
                CASE WHEN p.sku ILIKE '%' || search_query || '%' THEN 0.9 ELSE 0 END
            ) as search_rank
        FROM products p
        WHERE p.search_vector @@ query_tsquery
           OR p.name ILIKE '%' || search_query || '%'
           OR p.description ILIKE '%' || search_query || '%'
           OR p.sku ILIKE '%' || search_query || '%'
           OR similarity(p.name, search_query) > 0.3;
    END IF;
    
    -- Search tasks
    IF entity_types IS NULL OR 'task' = ANY(entity_types) THEN
        RETURN QUERY
        SELECT 
            t.id::TEXT as entity_id,
            'task'::TEXT as entity_type,
            t.title as display_label,
            jsonb_build_object(
                'description', t.description,
                'status', t.status,
                'priority', t.priority,
                'due_date', t.due_date,
                'assigned_to', u.full_name
            ) as entity_data,
            GREATEST(
                ts_rank(t.search_vector, query_tsquery),
                similarity(t.title, search_query),
                CASE WHEN t.description ILIKE '%' || search_query || '%' THEN 0.6 ELSE 0 END
            ) as search_rank
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.search_vector @@ query_tsquery
           OR t.title ILIKE '%' || search_query || '%'
           OR t.description ILIKE '%' || search_query || '%'
           OR similarity(t.title, search_query) > 0.3;
    END IF;
    
    -- Search users
    IF entity_types IS NULL OR 'user' = ANY(entity_types) THEN
        RETURN QUERY
        SELECT 
            u.id::TEXT as entity_id,
            'user'::TEXT as entity_type,
            u.full_name as display_label,
            jsonb_build_object(
                'email', u.email,
                'role', u.role
            ) as entity_data,
            GREATEST(
                similarity(u.full_name, search_query),
                CASE WHEN u.email ILIKE '%' || search_query || '%' THEN 0.8 ELSE 0 END
            ) as search_rank
        FROM users u
        WHERE u.full_name ILIKE '%' || search_query || '%'
           OR u.email ILIKE '%' || search_query || '%'
           OR similarity(u.full_name, search_query) > 0.3;
    END IF;
    
    -- Order by relevance and limit results
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PRONOUN RESOLUTION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION resolve_pronoun(
    pronoun_text TEXT,
    user_id_param UUID
)
RETURNS TABLE (
    entity_id TEXT,
    entity_type TEXT,
    display_label TEXT,
    entity_data JSONB
) AS $$
BEGIN
    -- Handle "me", "myself", "I" pronouns
    IF LOWER(pronoun_text) IN ('me', 'myself', 'i') THEN
        RETURN QUERY
        SELECT 
            u.id::TEXT as entity_id,
            'user'::TEXT as entity_type,
            u.full_name as display_label,
            jsonb_build_object(
                'email', u.email,
                'role', u.role,
                'is_current_user', true
            ) as entity_data
        FROM users u
        WHERE u.id = user_id_param;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS on sensitive tables if needed
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, customers, products, sales, stock, tasks, shifts, attendance, date_dimension, audit_trail';
    RAISE NOTICE 'Indexes created for full-text search and trigram matching';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Functions created: search_entities(), resolve_pronoun()';
    RAISE NOTICE 'You can now test the entity suggester system!';
END $$;
