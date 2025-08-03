-- Enhanced Supabase Schema with Full-Text Search and Comprehensive Tables
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sales_rep_id UUID REFERENCES public.users(id),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock table
CREATE TABLE IF NOT EXISTS public.stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id),
  warehouse_location VARCHAR(100),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.users(id),
  assigned_by UUID REFERENCES public.users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 30, -- minutes
  shift_type VARCHAR(50) DEFAULT 'regular',
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  shift_id UUID REFERENCES public.shifts(id),
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Date dimension table for analytics
CREATE TABLE IF NOT EXISTS public.date_dimension (
  date_key DATE PRIMARY KEY,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  month INTEGER NOT NULL,
  week INTEGER NOT NULL,
  day_of_year INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_name VARCHAR(20) NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  fiscal_year INTEGER,
  fiscal_quarter INTEGER
);

-- Audit trail for metadata persistence
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id VARCHAR(255) NOT NULL,
  entity_table VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  offset_start INTEGER NOT NULL,
  offset_end INTEGER NOT NULL,
  user_id UUID REFERENCES public.users(id),
  document_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate date dimension for current year and next year
INSERT INTO public.date_dimension (date_key, year, quarter, month, week, day_of_year, day_of_month, day_of_week, day_name, month_name, is_weekend, fiscal_year, fiscal_quarter)
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
  CASE 
    WHEN EXTRACT(MONTH FROM date_key) >= 4 THEN EXTRACT(YEAR FROM date_key)
    ELSE EXTRACT(YEAR FROM date_key) - 1
  END as fiscal_year,
  CASE 
    WHEN EXTRACT(MONTH FROM date_key) IN (4,5,6) THEN 1
    WHEN EXTRACT(MONTH FROM date_key) IN (7,8,9) THEN 2
    WHEN EXTRACT(MONTH FROM date_key) IN (10,11,12) THEN 3
    ELSE 4
  END as fiscal_quarter
FROM generate_series('2024-01-01'::date, '2026-12-31'::date, '1 day'::interval) as date_key
ON CONFLICT (date_key) DO NOTHING;

-- Create full-text search indexes with trigram support
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING GIN (to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, '')));
CREATE INDEX IF NOT EXISTS idx_customers_trigram ON public.customers USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || sku || ' ' || COALESCE(category, '') || ' ' || COALESCE(brand, '')));
CREATE INDEX IF NOT EXISTS idx_products_trigram ON public.products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_search ON public.users USING GIN (to_tsvector('english', name || ' ' || email || ' ' || COALESCE(department, '')));
CREATE INDEX IF NOT EXISTS idx_users_trigram ON public.users USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tasks_search ON public.tasks USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_tasks_trigram ON public.tasks USING GIN (title gin_trgm_ops);

-- Advanced search function with ranking
CREATE OR REPLACE FUNCTION search_entities(
  search_text TEXT,
  entity_types TEXT[] DEFAULT ARRAY['customers', 'products', 'users', 'tasks'],
  limit_results INTEGER DEFAULT 10
) RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  display_label TEXT,
  entity_data JSONB,
  search_rank REAL
) AS $$
DECLARE
  query_text TEXT;
BEGIN
  query_text := plainto_tsquery('english', search_text)::TEXT;
  
  RETURN QUERY
  (
    -- Search customers
    SELECT 
      'customers'::TEXT as entity_type,
      c.id as entity_id,
      c.name as display_label,
      row_to_json(c)::JSONB as entity_data,
      (
        ts_rank_cd(to_tsvector('english', c.name || ' ' || COALESCE(c.email, '') || ' ' || COALESCE(c.company, '')), plainto_tsquery('english', search_text)) +
        (1.0 - (levenshtein(LOWER(search_text), LOWER(c.name))::REAL / GREATEST(length(search_text), length(c.name))))
      ) as search_rank
    FROM public.customers c
    WHERE 'customers' = ANY(entity_types)
      AND (
        to_tsvector('english', c.name || ' ' || COALESCE(c.email, '') || ' ' || COALESCE(c.company, '')) @@ plainto_tsquery('english', search_text)
        OR c.name ILIKE '%' || search_text || '%'
        OR similarity(c.name, search_text) > 0.3
      )
      AND c.status = 'active'
    
    UNION ALL
    
    -- Search products
    SELECT 
      'products'::TEXT as entity_type,
      p.id as entity_id,
      p.name as display_label,
      row_to_json(p)::JSONB as entity_data,
      (
        ts_rank_cd(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.sku), plainto_tsquery('english', search_text)) +
        (1.0 - (levenshtein(LOWER(search_text), LOWER(p.name))::REAL / GREATEST(length(search_text), length(p.name))))
      ) as search_rank
    FROM public.products p
    WHERE 'products' = ANY(entity_types)
      AND (
        to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.sku) @@ plainto_tsquery('english', search_text)
        OR p.name ILIKE '%' || search_text || '%'
        OR p.sku ILIKE '%' || search_text || '%'
        OR similarity(p.name, search_text) > 0.3
      )
      AND p.status = 'active'
    
    UNION ALL
    
    -- Search users
    SELECT 
      'users'::TEXT as entity_type,
      u.id as entity_id,
      u.name as display_label,
      row_to_json(u)::JSONB as entity_data,
      (
        ts_rank_cd(to_tsvector('english', u.name || ' ' || u.email), plainto_tsquery('english', search_text)) +
        (1.0 - (levenshtein(LOWER(search_text), LOWER(u.name))::REAL / GREATEST(length(search_text), length(u.name))))
      ) as search_rank
    FROM public.users u
    WHERE 'users' = ANY(entity_types)
      AND (
        to_tsvector('english', u.name || ' ' || u.email) @@ plainto_tsquery('english', search_text)
        OR u.name ILIKE '%' || search_text || '%'
        OR u.email ILIKE '%' || search_text || '%'
        OR similarity(u.name, search_text) > 0.3
      )
    
    UNION ALL
    
    -- Search tasks
    SELECT 
      'tasks'::TEXT as entity_type,
      t.id as entity_id,
      t.title as display_label,
      row_to_json(t)::JSONB as entity_data,
      (
        ts_rank_cd(to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')), plainto_tsquery('english', search_text)) +
        (1.0 - (levenshtein(LOWER(search_text), LOWER(t.title))::REAL / GREATEST(length(search_text), length(t.title))))
      ) as search_rank
    FROM public.tasks t
    WHERE 'tasks' = ANY(entity_types)
      AND (
        to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')) @@ plainto_tsquery('english', search_text)
        OR t.title ILIKE '%' || search_text || '%'
        OR similarity(t.title, search_text) > 0.3
      )
      AND t.status != 'deleted'
  )
  ORDER BY search_rank DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve pronouns (e.g., "me" to current user)
CREATE OR REPLACE FUNCTION resolve_pronoun(
  pronoun_text TEXT,
  current_user_id UUID
) RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  display_label TEXT,
  entity_data JSONB
) AS $$
BEGIN
  IF LOWER(pronoun_text) IN ('me', 'myself', 'i') THEN
    RETURN QUERY
    SELECT 
      'users'::TEXT as entity_type,
      u.id as entity_id,
      u.name as display_label,
      row_to_json(u)::JSONB as entity_data
    FROM public.users u
    WHERE u.auth_uid = current_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for demo
INSERT INTO public.users (auth_uid, email, name, role, department) VALUES
  (uuid_generate_v4(), 'ahmed@example.com', 'Ahmed Ali', 'admin', 'Management'),
  (uuid_generate_v4(), 'sarah@example.com', 'Sarah Johnson', 'user', 'Sales'),
  (uuid_generate_v4(), 'mike@example.com', 'Mike Chen', 'user', 'Engineering'),
  (uuid_generate_v4(), 'lisa@example.com', 'Lisa Rodriguez', 'manager', 'Marketing')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.customers (name, email, phone, company, address, city, country) VALUES
  ('Acme Corporation', 'contact@acme.com', '+1-555-0101', 'Acme Corp', '123 Business St', 'New York', 'USA'),
  ('Global Tech Solutions', 'info@globaltech.com', '+1-555-0102', 'Global Tech', '456 Innovation Ave', 'San Francisco', 'USA'),
  ('Ahmed Trading LLC', 'ahmed@trading.ae', '+971-4-555-0103', 'Ahmed Trading', 'Dubai Marina', 'Dubai', 'UAE'),
  ('European Enterprises', 'contact@eurenterprises.eu', '+49-30-555-0104', 'Euro Enterprises', 'Berlin Center', 'Berlin', 'Germany')
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, description, sku, category, brand, price, cost) VALUES
  ('Wireless Headphones Pro', 'Premium noise-cancelling wireless headphones', 'WHP-PRO-001', 'Electronics', 'TechBrand', 299.99, 150.00),
  ('Smart Watch Series X', 'Advanced fitness tracking smartwatch', 'SWX-001', 'Electronics', 'TechBrand', 449.99, 250.00),
  ('Ahmed Special Coffee', 'Premium arabica coffee blend', 'ASC-001', 'Food & Beverage', 'Ahmed Foods', 24.99, 12.00),
  ('Office Desk Organizer', 'Bamboo desk organizer with multiple compartments', 'ODO-001', 'Office Supplies', 'EcoOffice', 49.99, 25.00)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample sales data
INSERT INTO public.sales (customer_id, product_id, quantity, unit_price, total_amount, sale_date, sales_rep_id)
SELECT 
  c.id,
  p.id,
  (RANDOM() * 5 + 1)::INTEGER,
  p.price,
  p.price * (RANDOM() * 5 + 1)::INTEGER,
  CURRENT_DATE - (RANDOM() * 30)::INTEGER,
  u.id
FROM public.customers c
CROSS JOIN public.products p
CROSS JOIN public.users u
WHERE u.department = 'Sales'
LIMIT 20;

-- Insert sample tasks
INSERT INTO public.tasks (title, description, assigned_to, assigned_by, priority, due_date)
SELECT 
  'Review ' || c.name || ' account',
  'Quarterly review for customer ' || c.name,
  u.id,
  (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
  CASE (RANDOM() * 3)::INTEGER 
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    ELSE 'high'
  END,
  CURRENT_DATE + (RANDOM() * 30)::INTEGER
FROM public.customers c
CROSS JOIN public.users u
WHERE u.department IN ('Sales', 'Marketing')
LIMIT 15;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read all data" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read customers" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read sales" ON public.sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read stock" ON public.stock FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read shifts" ON public.shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert audit trail" ON public.audit_trail FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read own audit trail" ON public.audit_trail FOR SELECT USING (auth.role() = 'authenticated');
