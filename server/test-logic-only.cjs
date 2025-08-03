// Simplified test of intelligent query processing logic
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧠 Testing Intelligent Entity Detection Logic');
console.log('============================================\n');

// Test intelligent entity detection function
function testIntelligentEntityDetection(text) {
  console.log(`🔍 Testing query: "${text}"`);
  
  const words = text.toLowerCase().split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'below', 'above', 'over', 'under', 'than', 'less', 'greater', 'more'].includes(word.toLowerCase())
  );
  
  console.log('📝 Filtered words:', words);
  
  const detectedEntities = [];
  const tablesInvolved = new Set();
  
  for (const word of words) {
    // Test intelligent detection logic
    if (['laptop', 'laptops', 'mouse', 'keyboard'].includes(word)) {
      detectedEntities.push({ word, table: 'products', field: 'name', type: 'product' });
      tablesInvolved.add('products');
    } else if (['sales', 'revenue', 'selling', 'sold'].includes(word)) {
      detectedEntities.push({ word, table: 'sales', field: 'status', type: 'entity' });
      tablesInvolved.add('sales');
    } else if (['stock', 'inventory', 'warehouse'].includes(word)) {
      detectedEntities.push({ word, table: 'stock', field: 'warehouse_location', type: 'info' });
      tablesInvolved.add('stock');
    } else if (['ahmed', 'john', 'jane'].includes(word)) {
      detectedEntities.push({ word, table: 'customers', field: 'name', type: 'entity' });
      tablesInvolved.add('customers');
    } else if (['tasks', 'task'].includes(word)) {
      detectedEntities.push({ word, table: 'tasks', field: 'title', type: text.includes('my') ? 'info' : 'entity' });
      tablesInvolved.add('tasks');
    }
  }
  
  console.log('🎯 Detected entities:', detectedEntities);
  console.log('📊 Tables involved:', Array.from(tablesInvolved));
  
  // Determine primary table logic
  let primaryTable = null;
  let joinStrategy = null;
  
  if (tablesInvolved.has('sales')) {
    primaryTable = 'sales';
    joinStrategy = 'sales with product/customer joins';
  } else if (tablesInvolved.has('stock')) {
    primaryTable = 'stock';
    joinStrategy = 'stock with product joins';
  } else if (tablesInvolved.has('products')) {
    primaryTable = 'products';
    joinStrategy = 'products standalone';
  } else if (tablesInvolved.has('customers')) {
    primaryTable = 'customers';
    joinStrategy = 'customers standalone';
  } else if (tablesInvolved.has('tasks')) {
    primaryTable = 'tasks';
    joinStrategy = 'tasks with user joins';
  }
  
  console.log(`📋 Primary table: ${primaryTable}`);
  console.log(`🔗 Join strategy: ${joinStrategy}`);
  
  return {
    detectedEntities,
    tablesInvolved: Array.from(tablesInvolved),
    primaryTable,
    joinStrategy
  };
}

// Test a real query execution
async function testRealQuery(queryText) {
  console.log(`\n🚀 Testing real Supabase query for: "${queryText}"`);
  
  try {
    if (queryText.includes('stock') && queryText.includes('below')) {
      // Test stock below threshold
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          products(name, category, sku)
        `)
        .lt('quantity_available', 100)
        .limit(5);
        
      if (error) {
        console.error('❌ Query error:', error);
        return;
      }
      
      console.log(`✅ Found ${data.length} stock records below 100`);
      data.forEach((record, index) => {
        console.log(`   ${index + 1}. Product: ${record.products?.name || 'N/A'} - Stock: ${record.quantity_available}`);
      });
      
    } else if (queryText.includes('ahmed')) {
      // Test customer search
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', '%ahmed%')
        .limit(5);
        
      if (error) {
        console.error('❌ Query error:', error);
        return;
      }
      
      console.log(`✅ Found ${data.length} customers matching 'ahmed'`);
      data.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} - ${customer.email}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Database error:', error.message);
  }
}

// Run tests
async function runTests() {
  const testQueries = [
    "laptop sales above 1000",
    "stock below 100", 
    "ahmed",
    "my tasks",
    "laptop inventory"
  ];
  
  for (const query of testQueries) {
    const result = testIntelligentEntityDetection(query);
    console.log('─'.repeat(50));
  }
  
  // Test real database queries
  console.log('\n🔍 Testing Real Database Queries');
  console.log('===============================');
  
  await testRealQuery("stock below 100");
  await testRealQuery("ahmed");
  
  console.log('\n🎉 Testing Complete!');
}

runTests().catch(console.error);
