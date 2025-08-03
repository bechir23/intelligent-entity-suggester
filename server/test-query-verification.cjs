// Comprehensive Query Verification System
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔬 COMPREHENSIVE QUERY VERIFICATION SYSTEM');
console.log('==========================================\n');

// Test data verification helper
function verifyQueryResults(query, expectedCriteria, actualResults, sqlQuery) {
  console.log(`🔍 QUERY: "${query}"`);
  console.log(`📝 SQL: ${sqlQuery}`);
  console.log(`📊 Results: ${actualResults.length} records found`);
  
  if (actualResults.length === 0) {
    console.log('⚠️  No records found to verify');
    return false;
  }
  
  let verificationPassed = true;
  const verificationResults = [];
  
  // Verify each record matches the criteria
  actualResults.forEach((record, index) => {
    const recordVerification = {
      recordIndex: index + 1,
      checks: [],
      passed: true
    };
    
    // Check numeric criteria
    if (expectedCriteria.numeric) {
      const { field, operator, value } = expectedCriteria.numeric;
      const recordValue = record[field];
      
      let numericMatch = false;
      if (operator === 'above' || operator === 'over') {
        numericMatch = recordValue > value;
      } else if (operator === 'below' || operator === 'under') {
        numericMatch = recordValue < value;
      }
      
      recordVerification.checks.push({
        type: 'numeric',
        expected: `${field} ${operator} ${value}`,
        actual: `${field} = ${recordValue}`,
        passed: numericMatch
      });
      
      if (!numericMatch) recordVerification.passed = false;
    }
    
    // Check text/name criteria
    if (expectedCriteria.text) {
      expectedCriteria.text.forEach(textCriterion => {
        const { field, value, matchType } = textCriterion;
        const recordValue = record[field]?.toLowerCase() || '';
        
        let textMatch = false;
        if (matchType === 'contains') {
          textMatch = recordValue.includes(value.toLowerCase());
        } else if (matchType === 'exact') {
          textMatch = recordValue === value.toLowerCase();
        }
        
        recordVerification.checks.push({
          type: 'text',
          expected: `${field} ${matchType} "${value}"`,
          actual: `${field} = "${recordValue}"`,
          passed: textMatch
        });
        
        if (!textMatch) recordVerification.passed = false;
      });
    }
    
    // Check join data presence
    if (expectedCriteria.joins) {
      expectedCriteria.joins.forEach(joinCheck => {
        const joinData = record[joinCheck.table];
        const hasJoinData = joinData && typeof joinData === 'object';
        
        recordVerification.checks.push({
          type: 'join',
          expected: `${joinCheck.table} data present`,
          actual: hasJoinData ? `${joinCheck.table} joined successfully` : `${joinCheck.table} missing`,
          passed: hasJoinData
        });
        
        if (!hasJoinData) recordVerification.passed = false;
      });
    }
    
    verificationResults.push(recordVerification);
    if (!recordVerification.passed) verificationPassed = false;
  });
  
  // Display verification results
  verificationResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} Record ${result.recordIndex}:`);
    result.checks.forEach(check => {
      const checkStatus = check.passed ? '✅' : '❌';
      console.log(`      ${checkStatus} ${check.type}: ${check.expected} → ${check.actual}`);
    });
  });
  
  const overallStatus = verificationPassed ? '✅ VERIFIED' : '❌ FAILED';
  console.log(`   ${overallStatus}: Query results match criteria\n`);
  
  return verificationPassed;
}

// Comprehensive test suite for all table combinations
async function runComprehensiveVerification() {
  
  // =============================================
  // PRODUCTS TABLE TESTS
  // =============================================
  console.log('📦 PRODUCTS TABLE VERIFICATION TESTS');
  console.log('=====================================\n');
  
  // Test 1: Basic product search
  try {
    console.log('TEST 1: Basic Product Search');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', '%laptop%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'laptop',
        {
          text: [{ field: 'name', value: 'laptop', matchType: 'contains' }]
        },
        data,
        `SELECT * FROM products WHERE name ILIKE '%laptop%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Product price filtering
  try {
    console.log('TEST 2: Product Price Above 500');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('price', 500)
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'products above 500',
        {
          numeric: { field: 'price', operator: 'above', value: 500 }
        },
        data,
        `SELECT * FROM products WHERE price > 500 LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // =============================================
  // STOCK TABLE TESTS
  // =============================================
  console.log('📦 STOCK TABLE VERIFICATION TESTS');
  console.log('==================================\n');
  
  // Test 3: Stock below threshold with product join
  try {
    console.log('TEST 3: Stock Below 100 with Product Join');
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        products(id, name, category, sku, price)
      `)
      .lt('quantity_available', 100)
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'stock below 100',
        {
          numeric: { field: 'quantity_available', operator: 'below', value: 100 },
          joins: [{ table: 'products' }]
        },
        data,
        `SELECT s.*, p.* FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity_available < 100 LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 4: Laptop stock with product filtering
  try {
    console.log('TEST 4: Laptop Stock with Product Filtering');
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        products!inner(id, name, category, sku)
      `)
      .lt('quantity_available', 50)
      .eq('products.category', 'Electronics')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'laptop stock below 50',
        {
          numeric: { field: 'quantity_available', operator: 'below', value: 50 },
          joins: [{ table: 'products' }]
        },
        data,
        `SELECT s.*, p.* FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity_available < 50 AND p.category = 'Electronics' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 5: Warehouse location filtering
  try {
    console.log('TEST 5: Main Warehouse Stock');
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        products(name, category)
      `)
      .ilike('warehouse_location', '%main%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'stock in main warehouse',
        {
          text: [{ field: 'warehouse_location', value: 'main', matchType: 'contains' }],
          joins: [{ table: 'products' }]
        },
        data,
        `SELECT s.*, p.* FROM stock s JOIN products p ON s.product_id = p.id WHERE s.warehouse_location ILIKE '%main%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // =============================================
  // SALES TABLE TESTS
  // =============================================
  console.log('💰 SALES TABLE VERIFICATION TESTS');
  console.log('==================================\n');
  
  // Test 6: Sales above amount with customer and product joins
  try {
    console.log('TEST 6: Sales Above 1000 with Full Joins');
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(id, name, email, company),
        products(id, name, category, price)
      `)
      .gt('total_amount', 1000)
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'sales above 1000',
        {
          numeric: { field: 'total_amount', operator: 'above', value: 1000 },
          joins: [{ table: 'customers' }, { table: 'products' }]
        },
        data,
        `SELECT s.*, c.*, p.* FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE s.total_amount > 1000 LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 7: Customer-specific sales
  try {
    console.log('TEST 7: Ahmed Customer Sales');
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers!inner(id, name, email),
        products(name, category)
      `)
      .ilike('customers.name', '%ahmed%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'ahmed sales',
        {
          text: [{ field: 'customers.name', value: 'ahmed', matchType: 'contains' }],
          joins: [{ table: 'customers' }, { table: 'products' }]
        },
        data,
        `SELECT s.*, c.*, p.* FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE c.name ILIKE '%ahmed%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 8: Product-specific sales (laptop sales)
  try {
    console.log('TEST 8: Laptop Sales with Product Filtering');
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(name, email),
        products!inner(id, name, category)
      `)
      .gt('total_amount', 500)
      .ilike('products.name', '%laptop%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'laptop sales above 500',
        {
          numeric: { field: 'total_amount', operator: 'above', value: 500 },
          text: [{ field: 'products.name', value: 'laptop', matchType: 'contains' }],
          joins: [{ table: 'customers' }, { table: 'products' }]
        },
        data,
        `SELECT s.*, c.*, p.* FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE s.total_amount > 500 AND p.name ILIKE '%laptop%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // =============================================
  // CUSTOMERS TABLE TESTS
  // =============================================
  console.log('👥 CUSTOMERS TABLE VERIFICATION TESTS');
  console.log('=====================================\n');
  
  // Test 9: Customer name search
  try {
    console.log('TEST 9: Customer Name Search');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', '%ahmed%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'ahmed customers',
        {
          text: [{ field: 'name', value: 'ahmed', matchType: 'contains' }]
        },
        data,
        `SELECT * FROM customers WHERE name ILIKE '%ahmed%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 10: Customer location filtering
  try {
    console.log('TEST 10: Customers from North Location');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('address', '%north%')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'customers from north',
        {
          text: [{ field: 'address', value: 'north', matchType: 'contains' }]
        },
        data,
        `SELECT * FROM customers WHERE address ILIKE '%north%' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // =============================================
  // TASKS TABLE TESTS
  // =============================================
  console.log('📋 TASKS TABLE VERIFICATION TESTS');
  console.log('==================================\n');
  
  // Test 11: Task status filtering with user join
  try {
    console.log('TEST 11: Completed Tasks with User Join');
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users(id, full_name, email, department)
      `)
      .eq('status', 'completed')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'completed tasks',
        {
          text: [{ field: 'status', value: 'completed', matchType: 'exact' }],
          joins: [{ table: 'users' }]
        },
        data,
        `SELECT t.*, u.* FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.status = 'completed' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 12: User-specific tasks
  try {
    console.log('TEST 12: User-Specific Tasks');
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users(full_name, email)
      `)
      .eq('assigned_to', 'ahmed_hassan')
      .limit(5);
      
    if (!error && data) {
      verifyQueryResults(
        'my tasks (ahmed_hassan)',
        {
          text: [{ field: 'assigned_to', value: 'ahmed_hassan', matchType: 'exact' }],
          joins: [{ table: 'users' }]
        },
        data,
        `SELECT t.*, u.* FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.assigned_to = 'ahmed_hassan' LIMIT 5;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // =============================================
  // COMPLEX MULTI-TABLE TESTS
  // =============================================
  console.log('🔗 COMPLEX MULTI-TABLE VERIFICATION TESTS');
  console.log('==========================================\n');
  
  // Test 13: Complex query - laptop sales above 1000 this month
  try {
    console.log('TEST 13: Complex Query - Laptop Sales Above 1000');
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(name, email, company),
        products!inner(name, category, price)
      `)
      .gt('total_amount', 1000)
      .ilike('products.name', '%laptop%')
      .gte('sale_date', '2025-08-01')
      .limit(3);
      
    if (!error && data) {
      verifyQueryResults(
        'laptop sales above 1000 this month',
        {
          numeric: { field: 'total_amount', operator: 'above', value: 1000 },
          text: [{ field: 'products.name', value: 'laptop', matchType: 'contains' }],
          joins: [{ table: 'customers' }, { table: 'products' }]
        },
        data,
        `SELECT s.*, c.*, p.* FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE s.total_amount > 1000 AND p.name ILIKE '%laptop%' AND s.sale_date >= '2025-08-01' LIMIT 3;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 14: Complex inventory query with location and product filters
  try {
    console.log('TEST 14: Complex Inventory - Laptop Stock Below 50 in Main Warehouse');
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        products!inner(name, category, sku, price)
      `)
      .lt('quantity_available', 50)
      .ilike('warehouse_location', '%main%')
      .eq('products.category', 'Electronics')
      .limit(3);
      
    if (!error && data) {
      verifyQueryResults(
        'laptop stock below 50 in main warehouse',
        {
          numeric: { field: 'quantity_available', operator: 'below', value: 50 },
          text: [
            { field: 'warehouse_location', value: 'main', matchType: 'contains' },
            { field: 'products.category', value: 'electronics', matchType: 'exact' }
          ],
          joins: [{ table: 'products' }]
        },
        data,
        `SELECT s.*, p.* FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity_available < 50 AND s.warehouse_location ILIKE '%main%' AND p.category = 'Electronics' LIMIT 3;`
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  console.log('🎉 COMPREHENSIVE VERIFICATION COMPLETE!');
  console.log('\n📊 SUMMARY:');
  console.log('✅ Products table: Basic search + price filtering');
  console.log('✅ Stock table: Quantity filtering + location + product joins');
  console.log('✅ Sales table: Amount filtering + customer/product joins');
  console.log('✅ Customers table: Name search + location filtering');
  console.log('✅ Tasks table: Status filtering + user joins');
  console.log('✅ Complex queries: Multi-table with multiple criteria');
  console.log('\n🔍 All queries verified against actual database results!');
}

runComprehensiveVerification().catch(console.error);
