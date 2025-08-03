-- Fix the search_entities function to match column types
DROP FUNCTION IF EXISTS search_entities(TEXT, TEXT[], INTEGER);

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
            c.name::TEXT as display_label,
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
            )::REAL as search_rank
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
            p.name::TEXT as display_label,
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
            )::REAL as search_rank
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
            t.title::TEXT as display_label,
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
            )::REAL as search_rank
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
            u.full_name::TEXT as display_label,
            jsonb_build_object(
                'email', u.email,
                'role', u.role
            ) as entity_data,
            GREATEST(
                similarity(u.full_name, search_query),
                CASE WHEN u.email ILIKE '%' || search_query || '%' THEN 0.8 ELSE 0 END
            )::REAL as search_rank
        FROM users u
        WHERE u.full_name ILIKE '%' || search_query || '%'
           OR u.email ILIKE '%' || search_query || '%'
           OR similarity(u.full_name, search_query) > 0.3;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Also fix the pronoun resolution function
DROP FUNCTION IF EXISTS resolve_pronoun(TEXT, UUID);

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
            u.full_name::TEXT as display_label,
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
