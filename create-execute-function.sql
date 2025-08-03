-- Create the execute_dynamic_query function for intelligent SQL interpretation
CREATE OR REPLACE FUNCTION execute_dynamic_query(
  query_sql TEXT,
  max_rows INTEGER DEFAULT 50
)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  result_count INTEGER := 0;
  allowed_operations TEXT[] := ARRAY['SELECT'];
  first_word TEXT;
BEGIN
  -- Security: Only allow SELECT statements
  first_word := UPPER(TRIM(SPLIT_PART(query_sql, ' ', 1)));
  
  IF NOT (first_word = ANY(allowed_operations)) THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed. Got: %', first_word;
  END IF;
  
  -- Security: Prevent dangerous keywords
  IF UPPER(query_sql) ~ '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|GRANT|REVOKE|TRUNCATE)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Execute the query with row limit
  FOR rec IN EXECUTE format('SELECT row_to_json(t) as json_result FROM (%s LIMIT %s) t', query_sql, max_rows)
  LOOP
    result_count := result_count + 1;
    RETURN NEXT rec.json_result;
  END LOOP;
  
  -- Log the execution if audit_trail table exists
  BEGIN
    INSERT INTO audit_trail (
      operation_type,
      table_name,
      record_id,
      old_values,
      new_values,
      user_id,
      timestamp
    ) VALUES (
      'dynamic_query',
      'system',
      'sql_interpreter',
      NULL,
      jsonb_build_object('query', query_sql, 'result_count', result_count),
      current_setting('app.current_user_id', true),
      NOW()
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignore if audit_trail doesn't exist
    NULL;
  END;
  
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION execute_dynamic_query(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_dynamic_query(TEXT) TO anon, authenticated;
