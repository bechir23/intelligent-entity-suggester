-- Enable required extensions for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create the main tables for our intelligent entity suggester

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, ''))
    ) STORED
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(sku, ''))
    ) STORED
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    sale_date DATE DEFAULT CURRENT_DATE,
    sales_person VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(sales_person, ''))
    ) STORED
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(reason, '') || ' ' || coalesce(created_by, ''))
    ) STORED
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(assigned_to, ''))
    ) STORED
);

-- Employee shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    hourly_rate DECIMAL(8,2),
    total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_minutes/60.0)
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(employee_name, ''))
    ) STORED
);

-- Attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(employee_name, '') || ' ' || coalesce(notes, ''))
    ) STORED
);

-- Date dimension table for analytics and date parsing
CREATE TABLE IF NOT EXISTS date_dimension (
    id SERIAL PRIMARY KEY,
    date_value DATE UNIQUE NOT NULL,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    week INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    month_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail table for tracking all interactions
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING GIN(email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_created ON stock(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_name);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_trail(created_at);

-- Create advanced search function
CREATE OR REPLACE FUNCTION search_entities(
    search_query TEXT,
    entity_types TEXT[] DEFAULT ARRAY['customers', 'products', 'sales', 'stock', 'tasks', 'shifts', 'attendance'],
    max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
    id INTEGER,
    entity_type TEXT,
    title TEXT,
    description TEXT,
    relevance REAL,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        -- Customers
        SELECT 
            c.id::INTEGER,
            'customer'::TEXT as entity_type,
            c.name as title,
            COALESCE(c.email || ' - ' || c.company, c.email, c.company, '')::TEXT as description,
            ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as relevance,
            jsonb_build_object(
                'email', c.email,
                'company', c.company,
                'phone', c.phone,
                'city', c.city
            ) as metadata
        FROM customers c
        WHERE 'customers' = ANY(entity_types)
        AND (
            c.search_vector @@ plainto_tsquery('english', search_query)
            OR c.name ILIKE '%' || search_query || '%'
            OR c.email ILIKE '%' || search_query || '%'
            OR similarity(c.name, search_query) > 0.2
        )
        
        UNION ALL
        
        -- Products
        SELECT 
            p.id::INTEGER,
            'product'::TEXT as entity_type,
            p.name as title,
            COALESCE(p.description, p.category || ' - $' || p.price::TEXT, p.category, '')::TEXT as description,
            ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as relevance,
            jsonb_build_object(
                'price', p.price,
                'category', p.category,
                'sku', p.sku,
                'stock_quantity', p.stock_quantity
            ) as metadata
        FROM products p
        WHERE 'products' = ANY(entity_types)
        AND (
            p.search_vector @@ plainto_tsquery('english', search_query)
            OR p.name ILIKE '%' || search_query || '%'
            OR p.category ILIKE '%' || search_query || '%'
            OR similarity(p.name, search_query) > 0.2
        )
        
        UNION ALL
        
        -- Tasks
        SELECT 
            t.id::INTEGER,
            'task'::TEXT as entity_type,
            t.title as title,
            COALESCE(t.description, t.status || ' - ' || COALESCE(t.assigned_to, 'Unassigned'), t.status, '')::TEXT as description,
            ts_rank(t.search_vector, plainto_tsquery('english', search_query)) as relevance,
            jsonb_build_object(
                'status', t.status,
                'priority', t.priority,
                'assigned_to', t.assigned_to,
                'due_date', t.due_date
            ) as metadata
        FROM tasks t
        WHERE 'tasks' = ANY(entity_types)
        AND (
            t.search_vector @@ plainto_tsquery('english', search_query)
            OR t.title ILIKE '%' || search_query || '%'
            OR t.assigned_to ILIKE '%' || search_query || '%'
            OR similarity(t.title, search_query) > 0.2
        )
        
        UNION ALL
        
        -- Shifts
        SELECT 
            s.id::INTEGER,
            'shift'::TEXT as entity_type,
            s.employee_name as title,
            (s.shift_date::TEXT || ' ' || s.start_time::TEXT || '-' || s.end_time::TEXT)::TEXT as description,
            ts_rank(s.search_vector, plainto_tsquery('english', search_query)) as relevance,
            jsonb_build_object(
                'shift_date', s.shift_date,
                'start_time', s.start_time,
                'end_time', s.end_time,
                'total_hours', s.total_hours
            ) as metadata
        FROM shifts s
        WHERE 'shifts' = ANY(entity_types)
        AND (
            s.search_vector @@ plainto_tsquery('english', search_query)
            OR s.employee_name ILIKE '%' || search_query || '%'
            OR similarity(s.employee_name, search_query) > 0.2
        )
        
        UNION ALL
        
        -- Attendance
        SELECT 
            a.id::INTEGER,
            'attendance'::TEXT as entity_type,
            a.employee_name as title,
            (a.date::TEXT || ' - ' || a.status)::TEXT as description,
            ts_rank(a.search_vector, plainto_tsquery('english', search_query)) as relevance,
            jsonb_build_object(
                'date', a.date,
                'status', a.status,
                'clock_in', a.clock_in,
                'clock_out', a.clock_out
            ) as metadata
        FROM attendance a
        WHERE 'attendance' = ANY(entity_types)
        AND (
            a.search_vector @@ plainto_tsquery('english', search_query)
            OR a.employee_name ILIKE '%' || search_query || '%'
            OR similarity(a.employee_name, search_query) > 0.2
        )
    ) combined_results
    ORDER BY relevance DESC, title ASC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Sample data to populate tables for testing

-- Insert sample customers
INSERT INTO customers (name, email, company, phone, city, country) VALUES
('John Doe', 'john.doe@acme.com', 'Acme Corporation', '+1-555-0123', 'New York', 'USA'),
('Jane Smith', 'jane.smith@techcorp.com', 'TechCorp Solutions', '+1-555-0456', 'San Francisco', 'USA'),
('Ahmed Hassan', 'ahmed@digitalagency.com', 'Digital Agency Ltd', '+44-20-1234-5678', 'London', 'UK'),
('Maria Garcia', 'maria.garcia@startup.io', 'Startup Innovations', '+1-555-0789', 'Austin', 'USA'),
('David Chen', 'david.chen@globaltech.com', 'GlobalTech Enterprises', '+86-138-0013-8000', 'Shanghai', 'China')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category, sku, stock_quantity) VALUES
('Laptop Pro 15"', 'High-performance laptop with 15-inch display, perfect for professionals', 1299.99, 'Electronics', 'LAP-PRO-15', 25),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'Accessories', 'MOU-WIR-001', 150),
('Office Desk', 'Standing desk with adjustable height, oak finish', 399.99, 'Furniture', 'DSK-STD-OAK', 12),
('Coffee Maker', 'Premium coffee maker with programmable settings', 89.99, 'Appliances', 'COF-PRO-001', 35),
('Project Management Software', 'Annual license for project management platform', 499.99, 'Software', 'PMS-ANN-LIC', 999)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, assigned_to, due_date) VALUES
('Update website homepage', 'Redesign the homepage with new branding guidelines', 'in_progress', 'high', 'Jane Smith', CURRENT_DATE + INTERVAL '7 days'),
('Customer onboarding call', 'Schedule and conduct onboarding call with new client Acme Corp', 'pending', 'medium', 'John Doe', CURRENT_DATE + INTERVAL '3 days'),
('Inventory audit', 'Complete quarterly inventory audit for all products', 'pending', 'low', 'Ahmed Hassan', CURRENT_DATE + INTERVAL '14 days'),
('Sales report preparation', 'Prepare monthly sales report for management review', 'completed', 'medium', 'Maria Garcia', CURRENT_DATE - INTERVAL '2 days'),
('Team meeting planning', 'Plan and organize next team meeting agenda', 'pending', 'low', 'David Chen', CURRENT_DATE + INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Insert sample shifts
INSERT INTO shifts (employee_name, shift_date, start_time, end_time, break_minutes, hourly_rate) VALUES
('John Doe', CURRENT_DATE, '09:00', '17:00', 60, 25.00),
('Jane Smith', CURRENT_DATE, '08:00', '16:00', 30, 30.00),
('Ahmed Hassan', CURRENT_DATE, '10:00', '18:00', 45, 28.50),
('Maria Garcia', CURRENT_DATE + INTERVAL '1 day', '09:00', '17:00', 60, 26.75),
('David Chen', CURRENT_DATE + INTERVAL '1 day', '08:30', '16:30', 30, 32.00)
ON CONFLICT DO NOTHING;

-- Insert sample attendance
INSERT INTO attendance (employee_name, date, clock_in, clock_out, status) VALUES
('John Doe', CURRENT_DATE, '08:55', '17:05', 'present'),
('Jane Smith', CURRENT_DATE, '08:00', '16:00', 'present'),
('Ahmed Hassan', CURRENT_DATE, '10:15', '18:10', 'late'),
('Maria Garcia', CURRENT_DATE - INTERVAL '1 day', '09:00', '13:00', 'half_day'),
('David Chen', CURRENT_DATE - INTERVAL '1 day', NULL, NULL, 'absent')
ON CONFLICT DO NOTHING;

-- Populate date dimension for the next year
INSERT INTO date_dimension (date_value, year, quarter, month, week, day_of_week, day_name, month_name, is_weekend)
SELECT 
    d::date as date_value,
    EXTRACT(YEAR FROM d) as year,
    EXTRACT(QUARTER FROM d) as quarter,
    EXTRACT(MONTH FROM d) as month,
    EXTRACT(WEEK FROM d) as week,
    EXTRACT(DOW FROM d) as day_of_week,
    TO_CHAR(d, 'Day') as day_name,
    TO_CHAR(d, 'Month') as month_name,
    EXTRACT(DOW FROM d) IN (0, 6) as is_weekend
FROM generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '365 days',
    INTERVAL '1 day'
) d
ON CONFLICT (date_value) DO NOTHING;

-- Enable Row Level Security (RLS) for public access
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_dimension ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since you're using public rules)
CREATE POLICY "Allow public read access" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON stock FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON shifts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON date_dimension FOR SELECT USING (true);

-- Allow public insert access for audit trail
CREATE POLICY "Allow public insert access" ON audit_trail FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access" ON audit_trail FOR SELECT USING (true);
