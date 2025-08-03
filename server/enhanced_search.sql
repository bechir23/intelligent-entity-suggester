-- Enhanced search function that searches across all table fields
CREATE OR REPLACE FUNCTION search_entities_enhanced(
  search_query TEXT,
  entity_types TEXT[] DEFAULT ARRAY['customer', 'product', 'user', 'task', 'sale', 'stock', 'shift', 'attendance', 'date_dimension', 'audit_trail'],
  result_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  entity_id TEXT,
  entity_type TEXT,
  display_label TEXT,
  search_rank FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  query_term TEXT := TRIM(LOWER(search_query));
BEGIN
  RETURN QUERY
  WITH all_results AS (
    -- Customers
    SELECT 
      c.id::TEXT as entity_id,
      'customer'::TEXT as entity_type,
      c.name as display_label,
      CASE 
        WHEN LOWER(c.name) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(c.email) LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(c.company) LIKE '%' || query_term || '%' THEN 0.7
        WHEN LOWER(c.phone) LIKE '%' || query_term || '%' THEN 0.6
        WHEN LOWER(c.address) LIKE '%' || query_term || '%' THEN 0.5
        ELSE 0.3
      END as search_rank
    FROM customers c
    WHERE 'customer' = ANY(entity_types)
      AND (
        LOWER(c.name) LIKE '%' || query_term || '%' OR
        LOWER(c.email) LIKE '%' || query_term || '%' OR
        LOWER(c.company) LIKE '%' || query_term || '%' OR
        LOWER(c.phone) LIKE '%' || query_term || '%' OR
        LOWER(c.address) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Products
    SELECT 
      p.id::TEXT,
      'product'::TEXT,
      p.name,
      CASE 
        WHEN LOWER(p.name) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(p.description) LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(p.category) LIKE '%' || query_term || '%' THEN 0.7
        WHEN LOWER(p.sku) LIKE '%' || query_term || '%' THEN 0.8
        WHEN p.price::TEXT LIKE '%' || query_term || '%' THEN 0.6
        ELSE 0.3
      END
    FROM products p
    WHERE 'product' = ANY(entity_types)
      AND (
        LOWER(p.name) LIKE '%' || query_term || '%' OR
        LOWER(p.description) LIKE '%' || query_term || '%' OR
        LOWER(p.category) LIKE '%' || query_term || '%' OR
        LOWER(p.sku) LIKE '%' || query_term || '%' OR
        p.price::TEXT LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Users
    SELECT 
      u.id::TEXT,
      'user'::TEXT,
      u.full_name,
      CASE 
        WHEN LOWER(u.full_name) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(u.email) LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(u.role) LIKE '%' || query_term || '%' THEN 0.7
        ELSE 0.3
      END
    FROM users u
    WHERE 'user' = ANY(entity_types)
      AND (
        LOWER(u.full_name) LIKE '%' || query_term || '%' OR
        LOWER(u.email) LIKE '%' || query_term || '%' OR
        LOWER(u.role) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Tasks
    SELECT 
      t.id::TEXT,
      'task'::TEXT,
      t.title,
      CASE 
        WHEN LOWER(t.title) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(t.description) LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(t.status) LIKE '%' || query_term || '%' THEN 0.7
        WHEN LOWER(t.priority) LIKE '%' || query_term || '%' THEN 0.6
        ELSE 0.3
      END
    FROM tasks t
    WHERE 'task' = ANY(entity_types)
      AND (
        LOWER(t.title) LIKE '%' || query_term || '%' OR
        LOWER(t.description) LIKE '%' || query_term || '%' OR
        LOWER(t.status) LIKE '%' || query_term || '%' OR
        LOWER(t.priority) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Sales
    SELECT 
      s.id::TEXT,
      'sale'::TEXT,
      'sale ' || SUBSTRING(s.id::TEXT, 1, 8),
      CASE 
        WHEN s.quantity::TEXT LIKE '%' || query_term || '%' THEN 0.7
        WHEN s.unit_price::TEXT LIKE '%' || query_term || '%' THEN 0.7
        WHEN s.total_amount::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(s.status) LIKE '%' || query_term || '%' THEN 0.6
        WHEN LOWER(s.notes) LIKE '%' || query_term || '%' THEN 0.5
        ELSE 0.3
      END
    FROM sales s
    WHERE 'sale' = ANY(entity_types)
      AND (
        s.quantity::TEXT LIKE '%' || query_term || '%' OR
        s.unit_price::TEXT LIKE '%' || query_term || '%' OR
        s.total_amount::TEXT LIKE '%' || query_term || '%' OR
        LOWER(s.status) LIKE '%' || query_term || '%' OR
        LOWER(s.notes) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Stock
    SELECT 
      st.id::TEXT,
      'stock'::TEXT,
      'stock for ' || (SELECT name FROM products WHERE id = st.product_id),
      CASE 
        WHEN LOWER(st.warehouse_location) LIKE '%' || query_term || '%' THEN 0.8
        WHEN st.quantity_available::TEXT LIKE '%' || query_term || '%' THEN 0.7
        WHEN st.reserved_quantity::TEXT LIKE '%' || query_term || '%' THEN 0.6
        WHEN st.reorder_level::TEXT LIKE '%' || query_term || '%' THEN 0.6
        ELSE 0.3
      END
    FROM stock st
    WHERE 'stock' = ANY(entity_types)
      AND (
        LOWER(st.warehouse_location) LIKE '%' || query_term || '%' OR
        st.quantity_available::TEXT LIKE '%' || query_term || '%' OR
        st.reserved_quantity::TEXT LIKE '%' || query_term || '%' OR
        st.reorder_level::TEXT LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Shifts
    SELECT 
      sh.id::TEXT,
      'shift'::TEXT,
      'shift ' || TO_CHAR(sh.shift_date, 'YYYY-MM-DD') || ' ' || sh.start_time::TEXT,
      CASE 
        WHEN sh.start_time::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN sh.end_time::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN sh.break_duration::TEXT LIKE '%' || query_term || '%' THEN 0.6
        WHEN LOWER(sh.location) LIKE '%' || query_term || '%' THEN 0.7
        WHEN LOWER(sh.notes) LIKE '%' || query_term || '%' THEN 0.5
        ELSE 0.3
      END
    FROM shifts sh
    WHERE 'shift' = ANY(entity_types)
      AND (
        sh.start_time::TEXT LIKE '%' || query_term || '%' OR
        sh.end_time::TEXT LIKE '%' || query_term || '%' OR
        sh.break_duration::TEXT LIKE '%' || query_term || '%' OR
        LOWER(sh.location) LIKE '%' || query_term || '%' OR
        LOWER(sh.notes) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Attendance
    SELECT 
      a.id::TEXT,
      'attendance'::TEXT,
      'attendance ' || (SELECT full_name FROM users WHERE id = a.user_id),
      CASE 
        WHEN a.clock_in::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN a.clock_out::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(a.status) LIKE '%' || query_term || '%' THEN 0.7
        WHEN LOWER(a.notes) LIKE '%' || query_term || '%' THEN 0.5
        ELSE 0.3
      END
    FROM attendance a
    WHERE 'attendance' = ANY(entity_types)
      AND (
        a.clock_in::TEXT LIKE '%' || query_term || '%' OR
        a.clock_out::TEXT LIKE '%' || query_term || '%' OR
        LOWER(a.status) LIKE '%' || query_term || '%' OR
        LOWER(a.notes) LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Date Dimension
    SELECT 
      d.date_key::TEXT,
      'date'::TEXT,
      LOWER(d.month_name) || ' (' || d.date_key || ')',
      CASE 
        WHEN d.year::TEXT LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(d.month_name) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(d.day_name) LIKE '%' || query_term || '%' THEN 0.8
        WHEN d.quarter::TEXT LIKE '%' || query_term || '%' THEN 0.7
        ELSE 0.3
      END
    FROM date_dimension d
    WHERE 'date_dimension' = ANY(entity_types)
      AND (
        d.year::TEXT LIKE '%' || query_term || '%' OR
        LOWER(d.month_name) LIKE '%' || query_term || '%' OR
        LOWER(d.day_name) LIKE '%' || query_term || '%' OR
        d.quarter::TEXT LIKE '%' || query_term || '%'
      )
    
    UNION ALL
    
    -- Audit Trail
    SELECT 
      at.id::TEXT,
      'audit_trail'::TEXT,
      at.action || ' on ' || at.entity_table,
      CASE 
        WHEN LOWER(at.entity_table) LIKE '%' || query_term || '%' THEN 0.8
        WHEN LOWER(at.action) LIKE '%' || query_term || '%' THEN 0.9
        WHEN LOWER(at.document_context) LIKE '%' || query_term || '%' THEN 0.7
        ELSE 0.3
      END
    FROM audit_trail at
    WHERE 'audit_trail' = ANY(entity_types)
      AND (
        LOWER(at.entity_table) LIKE '%' || query_term || '%' OR
        LOWER(at.action) LIKE '%' || query_term || '%' OR
        LOWER(at.document_context) LIKE '%' || query_term || '%'
      )
  )
  SELECT 
    ar.entity_id,
    ar.entity_type,
    ar.display_label,
    ar.search_rank
  FROM all_results ar
  WHERE ar.search_rank > 0.2
  ORDER BY ar.search_rank DESC, ar.display_label ASC
  LIMIT result_limit;
END;
$$;
