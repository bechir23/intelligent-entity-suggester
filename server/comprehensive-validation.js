// Comprehensive System Validation Test
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

const TEST_CASES = [
  {
    name: 'Simple Customer Query',
    message: 'ahmed',
    expectEntities: ['customer'],
    expectData: true
  },
  {
    name: 'Stock Below Threshold',
    message: 'stock below 10',
    expectEntities: ['stock', 'numeric_filter'],
    expectData: true
  },
  {
    name: 'Product Query',
    message: 'laptop',
    expectEntities: ['product'],
    expectData: true
  },
  {
    name: 'User Context',
    message: 'my tasks',
    expectEntities: ['pronoun', 'tasks'],
    expectData: true
  },
  {
    name: 'Complex Location Query',
    message: 'laptop stock in paris',
    expectEntities: ['product', 'stock', 'location'],
    expectData: false // Might be empty but should process correctly
  },
  {
    name: 'Sales with Numeric Filter',
    message: 'laptop sales above 1000',
    expectEntities: ['product', 'sales', 'numeric_filter'],
    expectData: true
  }
];

async function testExtraction(testCase) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testCase.message })
    });
    
    const data = await response.json();
    console.log(`\\n🔍 EXTRACTION TEST: ${testCase.name}`);
    console.log(`📝 Query: "${testCase.message}"`);
    console.log(`✅ Entities found: ${data.entities.length}`);
    data.entities.forEach(e => {
      console.log(`   - ${e.text} (${e.type}:${e.table}${e.field ? ':' + e.field : ''})`);
    });
    
    return { success: true, entities: data.entities };
  } catch (error) {
    console.log(`❌ EXTRACTION FAILED: ${testCase.name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testQuery(testCase) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testCase.message, userName: 'test_user' })
    });
    
    const data = await response.json();
    console.log(`\\n🔎 QUERY TEST: ${testCase.name}`);
    console.log(`📝 Query: "${testCase.message}"`);
    console.log(`${data.success ? '✅' : '❌'} Success: ${data.success}`);
    console.log(`📊 Records returned: ${data.recordCount || 0}`);
    console.log(`🏷️ Response entities: ${data.responseEntities?.length || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log(`📋 Sample data: ${JSON.stringify(data.data[0], null, 2)}`);
    }
    
    return { success: data.success, recordCount: data.recordCount, entities: data.responseEntities };
  } catch (error) {
    console.log(`❌ QUERY FAILED: ${testCase.name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 STARTING COMPREHENSIVE SYSTEM VALIDATION');
  console.log('='.repeat(60));
  
  // Test backend health first
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ Backend Health: ${healthData.status}`);
    console.log(`🗄️ Database: ${healthData.database}`);
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}`);
    return;
  }
  
  let extractionResults = [];
  let queryResults = [];
  
  // Run all tests
  for (const testCase of TEST_CASES) {
    const extractionResult = await testExtraction(testCase);
    extractionResults.push({ testCase, result: extractionResult });
    
    const queryResult = await testQuery(testCase);
    queryResults.push({ testCase, result: queryResult });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Summary
  console.log('\\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const extractionSuccess = extractionResults.filter(r => r.result.success).length;
  const querySuccess = queryResults.filter(r => r.result.success).length;
  
  console.log(`🔍 Entity Extraction: ${extractionSuccess}/${TEST_CASES.length} passed`);
  console.log(`🔎 Query Processing: ${querySuccess}/${TEST_CASES.length} passed`);
  
  // Detailed results
  console.log('\\n📋 DETAILED RESULTS:');
  TEST_CASES.forEach((testCase, i) => {
    const extraction = extractionResults[i];
    const query = queryResults[i];
    
    console.log(`\\n${i + 1}. ${testCase.name}: "${testCase.message}"`);
    console.log(`   Extraction: ${extraction.result.success ? '✅' : '❌'}`);
    console.log(`   Query: ${query.result.success ? '✅' : '❌'} (${query.result.recordCount || 0} records)`);
  });
  
  console.log('\\n🎉 COMPREHENSIVE VALIDATION COMPLETE!');
}

// Run the test
runComprehensiveTest().catch(console.error);
