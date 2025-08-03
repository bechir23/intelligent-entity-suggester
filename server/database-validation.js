// Database Schema and Data Validation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function validateDatabaseSchema() {
  console.log('🗄️ VALIDATING DATABASE SCHEMA AND DATA');
  console.log('='.repeat(60));
  
  const tables = ['customers', 'products', 'sales', 'stock', 'tasks', 'users', 'shifts', 'attendance'];
  
  for (const table of tables) {
    try {
      console.log(`\n📋 TABLE: ${table.toUpperCase()}`);
      
      // Get table structure by querying first row
      const { data: sampleData, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log(`   ❌ Error accessing table: ${sampleError.message}`);
        continue;
      }
      
      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`   ✅ Columns: ${columns.join(', ')}`);
      }
      
      // Count total records
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`   📊 Total records: ${count}`);
      }
      
      // Show sample data
      const { data: samples, error: samplesError } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (!samplesError && samples && samples.length > 0) {
        console.log(`   📝 Sample data:`, samples[0]);
      }
      
    } catch (error) {
      console.log(`   ❌ Error with table ${table}:`, error.message);
    }
  }
}

// Test specific relationships
async function validateRelationships() {
  console.log('\n🔗 VALIDATING TABLE RELATIONSHIPS');
  console.log('='.repeat(60));
  
  try {
    // Test stock -> products relationship
    console.log('\n1. STOCK -> PRODUCTS JOIN:');
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select(`
        *,
        products!inner(name, sku, category)
      `)
      .limit(3);
    
    if (stockError) {
      console.log(`   ❌ Stock-Products join error: ${stockError.message}`);
    } else {
      console.log(`   ✅ Stock-Products join successful:`, stockData);
    }
    
    // Test sales -> customers and products relationship
    console.log('\n2. SALES -> CUSTOMERS + PRODUCTS JOIN:');
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        customers!inner(name, email, city),
        products!inner(name, category)
      `)
      .limit(3);
    
    if (salesError) {
      console.log(`   ❌ Sales joins error: ${salesError.message}`);
    } else {
      console.log(`   ✅ Sales joins successful:`, salesData);
    }
    
    // Test tasks -> users relationship
    console.log('\n3. TASKS -> USERS JOIN:');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        users!inner(name, email)
      `)
      .limit(3);
    
    if (tasksError) {
      console.log(`   ❌ Tasks-Users join error: ${tasksError.message}`);
    } else {
      console.log(`   ✅ Tasks-Users join successful:`, tasksData);
    }
    
  } catch (error) {
    console.log(`   ❌ Relationship validation error:`, error.message);
  }
}

// Test specific queries we need to support
async function validateTestQueries() {
  console.log('\n🧪 VALIDATING SPECIFIC TEST QUERIES');
  console.log('='.repeat(60));
  
  const testQueries = [
    {
      name: 'Customer Ahmed',
      query: () => supabase.from('customers').select('*').ilike('name', '%ahmed%'),
      expected: 'Should find customer named Ahmed'
    },
    {
      name: 'Stock Below 10',
      query: () => supabase.from('stock').select('*, products(name)').lt('quantity_on_hand', 10),
      expected: 'Should find stock items with low quantity'
    },
    {
      name: 'Laptop Products',
      query: () => supabase.from('products').select('*').ilike('name', '%laptop%'),
      expected: 'Should find laptop products'
    },
    {
      name: 'Stock in Paris',
      query: () => supabase.from('stock').select('*').ilike('warehouse_location', '%paris%'),
      expected: 'Should find stock in Paris warehouse'
    },
    {
      name: 'Sales Above 1000',
      query: () => supabase.from('sales').select('*, customers(name), products(name)').gt('total_amount', 1000),
      expected: 'Should find high-value sales'
    }
  ];
  
  for (const test of testQueries) {
    try {
      console.log(`\n🔍 ${test.name}:`);
      const { data, error, count } = await test.query();
      
      if (error) {
        console.log(`   ❌ Query failed: ${error.message}`);
      } else {
        console.log(`   ✅ Query successful: ${data?.length || 0} results`);
        console.log(`   📝 Expected: ${test.expected}`);
        if (data && data.length > 0) {
          console.log(`   📊 Sample result:`, data[0]);
        }
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
    }
  }
}

// Run all validations
async function runFullValidation() {
  await validateDatabaseSchema();
  await validateRelationships(); 
  await validateTestQueries();
  
  console.log('\n🎯 VALIDATION COMPLETE!');
  console.log('Use this information to fix the backend queries.');
}

runFullValidation().catch(console.error);
