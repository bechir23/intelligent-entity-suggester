// Comprehensive Test with Corrected Schema
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

const CORRECTED_TEST_CASES = [
  {
    name: 'Customer Ahmed',
    message: 'ahmed',
    expectEntities: ['customer'],
    expectData: true,
    description: 'Should find Ahmed Hassan customer with correct data'
  },
  {
    name: 'Stock Below 10 (Corrected Field)',
    message: 'stock below 10',
    expectEntities: ['stock', 'numeric_filter'],
    expectData: true,
    description: 'Should use quantity_available field and return low stock items'
  },
  {
    name: 'Laptop Product Query',
    message: 'laptop',
    expectEntities: ['product'],
    expectData: true,
    description: 'Should find Laptop Pro 15" product'
  },
  {
    name: 'My Tasks with User Join',
    message: 'my tasks',
    expectEntities: ['pronoun', 'tasks'],
    expectData: true,
    description: 'Should query tasks with proper user join (full_name field)'
  },
  {
    name: 'Stock with Product Join',
    message: 'laptop stock',
    expectEntities: ['product', 'stock'],
    expectData: true,
    description: 'Should query stock with products joined, showing laptop inventory'
  },
  {
    name: 'Sales with Full Joins',
    message: 'laptop sales above 1000',
    expectEntities: ['product', 'sales', 'numeric_filter'],
    expectData: true,
    description: 'Should query sales with customer and product joins'
  },
  {
    name: 'Location in Address',
    message: 'customers in london',
    expectEntities: ['customer', 'location'],
    expectData: true,
    description: 'Should search address field for London customers'
  }
];

async function testCorrectedQuery(testCase) {
  console.log(`\\n🔍 TESTING: ${testCase.name}`);
  console.log(`📝 Query: "${testCase.message}"`);
  console.log(`📋 Expected: ${testCase.description}`);
  
  try {
    // Test entity extraction
    const extractResponse = await fetch(`${API_BASE}/api/chat/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testCase.message })
    });
    
    const extractData = await extractResponse.json();
    console.log(`   ✅ Entities (${extractData.entities.length}):`, 
      extractData.entities.map(e => `${e.text}(${e.type}:${e.table}${e.field ? ':' + e.field : ''})`));
    
    // Test query processing
    const queryResponse = await fetch(`${API_BASE}/api/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testCase.message, userName: 'test_user' })
    });
    
    const queryData = await queryResponse.json();
    console.log(`   ${queryData.success ? '✅' : '❌'} Query Success: ${queryData.success}`);
    console.log(`   📊 Records: ${queryData.recordCount || 0}`);
    console.log(`   🔍 Response Entities: ${queryData.responseEntities?.length || 0}`);
    
    if (queryData.data && queryData.data.length > 0) {
      console.log(`   📋 Sample Result:`, JSON.stringify(queryData.data[0], null, 2));
    }
    
    if (queryData.error) {
      console.log(`   ❌ Error: ${queryData.error} - ${queryData.details}`);
    }
    
    return {
      success: queryData.success,
      entityCount: extractData.entities.length,
      recordCount: queryData.recordCount || 0,
      hasJoins: queryData.data && queryData.data.length > 0 && 
                Object.keys(queryData.data[0]).some(key => typeof queryData.data[0][key] === 'object')
    };
    
  } catch (error) {
    console.log(`   ❌ Test Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runCorrectedValidation() {
  console.log('🧪 COMPREHENSIVE VALIDATION WITH CORRECTED SCHEMA');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const testCase of CORRECTED_TEST_CASES) {
    const result = await testCorrectedQuery(testCase);
    results.push({ testCase, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\\n' + '='.repeat(70));
  console.log('📊 CORRECTED SCHEMA VALIDATION SUMMARY');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.result.success).length;
  const withData = results.filter(r => r.result.recordCount > 0).length;
  const withJoins = results.filter(r => r.result.hasJoins).length;
  
  console.log(`✅ Successful Queries: ${successful}/${CORRECTED_TEST_CASES.length}`);
  console.log(`📊 Queries with Data: ${withData}/${CORRECTED_TEST_CASES.length}`);
  console.log(`🔗 Queries with Joins: ${withJoins}/${CORRECTED_TEST_CASES.length}`);
  
  console.log('\\n📋 DETAILED RESULTS:');
  results.forEach((result, i) => {
    const { testCase, result: res } = result;
    console.log(`${i + 1}. ${testCase.name}:`);
    console.log(`   Query: ${res.success ? '✅' : '❌'} | Data: ${res.recordCount > 0 ? '✅' : '❌'} | Joins: ${res.hasJoins ? '✅' : '❌'}`);
    console.log(`   Records: ${res.recordCount || 0} | Entities: ${res.entityCount || 0}`);
    if (res.error) console.log(`   Error: ${res.error}`);
  });
  
  console.log('\\n🎯 VALIDATION COMPLETE! Schema corrections applied.');
}

runCorrectedValidation().catch(console.error);
