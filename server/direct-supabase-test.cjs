// Direct Supabase Query Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDirectQuery() {
  console.log('🧪 TESTING DIRECT SUPABASE QUERIES');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Simple stock query
    console.log('\n1. Testing basic stock query:');
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('*')
      .limit(5);
    
    if (stockError) {
      console.log('❌ Stock query error:', stockError);
    } else {
      console.log('✅ Stock query success:', stockData?.length, 'records');
      if (stockData?.length > 0) {
        console.log('📊 Sample stock data:', stockData[0]);
      }
    }
    
    // Test 2: Stock with numeric filter
    console.log('\n2. Testing stock with quantity filter:');
    const { data: filteredStock, error: filterError } = await supabase
      .from('stock')
      .select('*')
      .lt('quantity_available', 100)
      .limit(5);
    
    if (filterError) {
      console.log('❌ Filtered stock error:', filterError);
    } else {
      console.log('✅ Filtered stock success:', filteredStock?.length, 'records');
      if (filteredStock?.length > 0) {
        console.log('📊 Sample filtered data:', filteredStock[0]);
      }
    }
    
    // Test 3: Stock with joins
    console.log('\n3. Testing stock with product join:');
    const { data: joinedStock, error: joinError } = await supabase
      .from('stock')
      .select(`
        *,
        products(name, sku, category)
      `)
      .limit(5);
    
    if (joinError) {
      console.log('❌ Joined stock error:', joinError);
    } else {
      console.log('✅ Joined stock success:', joinedStock?.length, 'records');
      if (joinedStock?.length > 0) {
        console.log('📊 Sample joined data:', joinedStock[0]);
      }
    }
    
    // Test 4: All table counts
    console.log('\n4. Testing table counts:');
    const tables = ['customers', 'products', 'sales', 'stock', 'tasks', 'users'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testDirectQuery();
