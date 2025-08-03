// Schema Checker and Field Validator
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkActualSchema() {
  console.log('🔍 CHECKING ACTUAL DATABASE SCHEMA');
  console.log('==================================');
  
  // Test the specific query that works
  console.log('\n📋 TESTING WORKING QUERY:');
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select(`
      *,
      customers(*),
      products(*)
    `)
    .ilike('customers.name', '%ahmed%')
    .limit(1);
    
  if (salesError) {
    console.log(`❌ Sales query error: ${salesError.message}`);
  } else {
    console.log(`✅ Sales query success: ${salesData.length} records`);
    if (salesData.length > 0) {
      console.log('Sample record structure:');
      console.log('Sales fields:', Object.keys(salesData[0]).filter(k => typeof salesData[0][k] !== 'object'));
      if (salesData[0].customers) {
        console.log('Customer fields:', Object.keys(salesData[0].customers));
        console.log('Customer name value:', salesData[0].customers.name);
      }
      if (salesData[0].products) {
        console.log('Product fields:', Object.keys(salesData[0].products));
        console.log('Product name value:', salesData[0].products.name);
      }
    }
  }
  
  // Test each table individually
  const tables = ['products', 'customers', 'sales', 'stock', 'tasks', 'users'];
  
  for (const table of tables) {
    console.log(`\n📋 ${table.toUpperCase()} TABLE:`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        console.log(`   ✅ Fields (${fields.length}): ${fields.join(', ')}`);
        
        // Show sample values for key fields
        if (table === 'products' && data[0].name) {
          console.log(`   📄 Sample: name="${data[0].name}", category="${data[0].category}", price=${data[0].price}`);
        }
        if (table === 'customers' && data[0].name) {
          console.log(`   📄 Sample: name="${data[0].name}", email="${data[0].email}"`);
        }
        if (table === 'stock' && data[0].warehouse_location) {
          console.log(`   📄 Sample: warehouse="${data[0].warehouse_location}", quantity=${data[0].quantity_available}`);
        }
      } else {
        console.log(`   ⚠️  No data available`);
      }
    } catch (err) {
      console.log(`   💥 Exception: ${err.message}`);
    }
  }
  
  // Test specific join queries to see why fields are empty
  console.log('\n🔍 TESTING JOIN QUERIES:');
  
  // Test 1: Stock with Products
  console.log('\n1. Stock + Products Join:');
  const { data: stockData, error: stockError } = await supabase
    .from('stock')
    .select(`
      id, warehouse_location, quantity_available,
      products(id, name, category, price)
    `)
    .limit(2);
    
  if (stockError) {
    console.log(`❌ Error: ${stockError.message}`);
  } else {
    console.log(`✅ Success: ${stockData.length} records`);
    stockData.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`);
      console.log(`      Stock: warehouse=${record.warehouse_location}, qty=${record.quantity_available}`);
      console.log(`      Product: ${JSON.stringify(record.products)}`);
    });
  }
  
  // Test 2: Sales with Customers and Products
  console.log('\n2. Sales + Customers + Products Join:');
  const { data: fullSalesData, error: fullSalesError } = await supabase
    .from('sales')
    .select(`
      id, total_amount, quantity,
      customers(id, name, email),
      products(id, name, category)
    `)
    .limit(2);
    
  if (fullSalesError) {
    console.log(`❌ Error: ${fullSalesError.message}`);
  } else {
    console.log(`✅ Success: ${fullSalesData.length} records`);
    fullSalesData.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`);
      console.log(`      Sales: amount=${record.total_amount}, qty=${record.quantity}`);
      console.log(`      Customer: ${JSON.stringify(record.customers)}`);
      console.log(`      Product: ${JSON.stringify(record.products)}`);
    });
  }
}

checkActualSchema().catch(console.error);
