/*
🔧 SUPABASE SQL FUNCTIONS TO CREATE
Copy and paste these functions into your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
Execute each function one by one.
*/

-- 1. PARSE DATE EXPRESSION FUNCTION
-- This function handles relative date parsing like "tomorrow", "next week", etc.
CREATE OR REPLACE FUNCTION parse_date_expression(date_text TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  parsed_date DATE;
  formatted_date TEXT;
  is_relative BOOLEAN := false;
  confidence DECIMAL := 0.8;
BEGIN
  -- Handle relative dates
  CASE LOWER(TRIM(date_text))
    WHEN 'today', 'now' THEN
      parsed_date := CURRENT_DATE;
      is_relative := true;
      confidence := 0.95;
    WHEN 'tomorrow', 'tmr' THEN
      parsed_date := CURRENT_DATE + INTERVAL '1 day';
      is_relative := true;
      confidence := 0.95;
    WHEN 'yesterday', 'ytd' THEN
      parsed_date := CURRENT_DATE - INTERVAL '1 day';
      is_relative := true;
      confidence := 0.95;
    WHEN 'this week' THEN
      parsed_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;
      is_relative := true;
      confidence := 0.9;
    WHEN 'next week' THEN
      parsed_date := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week')::DATE;
      is_relative := true;
      confidence := 0.9;
    WHEN 'this month' THEN
      parsed_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
      is_relative := true;
      confidence := 0.9;
    WHEN 'next month' THEN
      parsed_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
      is_relative := true;
      confidence := 0.9;
    ELSE
      -- Try to parse as date
      BEGIN
        parsed_date := date_text::DATE;
        is_relative := false;
        confidence := 0.8;
      EXCEPTION WHEN OTHERS THEN
        -- Return failure
        result := json_build_object(
          'success', false,
          'error', 'Could not parse date: ' || date_text
        );
        RETURN result;
      END;
  END CASE;
  
  -- Format the date
  formatted_date := TO_CHAR(parsed_date, 'Mon DD, YYYY');
  
  -- Build success response
  result := json_build_object(
    'success', true,
    'parsed_date', parsed_date::TEXT,
    'formatted_date', formatted_date,
    'is_relative', is_relative,
    'confidence', confidence,
    'absolute_date', (parsed_date || ' 00:00:00+00')::TIMESTAMPTZ
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESOLVE PRONOUN FUNCTION  
-- This function resolves pronouns like "me" to actual user entities
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS resolve_pronoun(TEXT, UUID);

CREATE OR REPLACE FUNCTION resolve_pronoun(pronoun_text TEXT, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_record RECORD;
BEGIN
  -- Handle common pronouns
  CASE LOWER(TRIM(pronoun_text))
    WHEN 'me', 'myself', 'i' THEN
      -- Get user information
      SELECT * INTO user_record FROM users WHERE id = user_id_param;
      
      IF FOUND THEN
        result := json_build_array(
          json_build_object(
            'entity_type', 'user',
            'entity_id', user_record.id,
            'display_label', COALESCE(user_record.full_name, user_record.email),
            'entity_data', row_to_json(user_record),
            'search_rank', 1.0
          )
        );
      ELSE
        result := json_build_array();
      END IF;
    ELSE
      -- Unknown pronoun
      result := json_build_array();
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DYNAMIC SQL EXECUTION FUNCTION
-- This function allows safe execution of dynamic SQL queries for intelligent search
CREATE OR REPLACE FUNCTION execute_dynamic_query(query TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  rec RECORD;
  results JSON[] := '{}';
BEGIN
  -- Basic SQL injection protection
  IF query ~* '(drop|delete|update|insert|alter|create|truncate)' THEN
    result := json_build_object(
      'success', false,
      'error', 'Only SELECT queries are allowed'
    );
    RETURN result;
  END IF;
  
  -- Execute the query and collect results
  FOR rec IN EXECUTE query LOOP
    results := array_append(results, row_to_json(rec));
  END LOOP;
  
  result := json_build_object(
    'success', true,
    'data', array_to_json(results),
    'count', array_length(results, 1)
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS
-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION parse_date_expression(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION resolve_pronoun(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_dynamic_query(TEXT) TO anon, authenticated;

/*
🎯 INSTRUCTIONS:
1. Copy and execute the DROP FUNCTION statement first (if the function exists)
2. Copy each CREATE FUNCTION statement above
3. Paste into Supabase SQL Editor
4. Run each one individually
5. Execute the GRANT permissions
6. Test the functions work by running:
   SELECT parse_date_expression('tomorrow');
   SELECT resolve_pronoun('me', '550e8400-e29b-41d4-a716-446655440000'::uuid);

📝 TROUBLESHOOTING:
- If you get "cannot change return type" error, run the DROP FUNCTION first
- If you get "function does not exist" for DROP, that's normal - continue with CREATE
- If you get permission errors, make sure to run the GRANT statements
*/
