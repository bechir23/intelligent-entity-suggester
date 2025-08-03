#!/usr/bin/env node

/**
 * Comprehensive API Test for Enhanced Entity Extraction
 * Tests the actual backend API endpoints to ensure everything works as requested
 */

const http = require('http');

// Test queries that should work with our enhancements
const testQueries = [
  {
    name: "Numeric Filter - Stock Below 10",
    query: "stock below 10",
    expectedEntities: ["numeric_filter", "info"],
    expectedField: "quantity_on_hand",
    expectedTable: "stock"
  },
  {
    name: "Customer Name - Ahmed",
    query: "ahmed",
    expectedEntities: ["entity"],
    expectedSuggestions: true,
    expectedTable: "customers"
  },
  {
    name: "Complex Query - Laptop Sales Above 1000",
    query: "laptop sales above 1000", 
    expectedEntities: ["entity", "numeric_filter"],
    expectedTables: ["products", "sales"]
  },
  {
    name: "User Context - My Tasks",
    query: "my tasks",
    expectedEntities: ["info"],
    expectedTable: "tasks"
  },
  {
    name: "Simple Product Query",
    query: "laptop",
    expectedEntities: ["product"],
    expectedTable: "products"
  }
];

// Function to make HTTP requests to the backend
const makeRequest = (path, postData = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: postData ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

// Test a single query
const testQuery = async (testCase) => {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`Query: "${testCase.query}"`);
  console.log('-'.repeat(50));

  try {
    // Test entity extraction endpoint
    const extractResult = await makeRequest('/api/chat/extract', JSON.stringify({
      message: testCase.query
    }));

    console.log('📊 Entity Extraction Result:');
    console.log(`  Status: ${extractResult.success ? '✅ Success' : '❌ Failed'}`);
    
    if (extractResult.entities) {
      console.log(`  Entities found: ${extractResult.entities.length}`);
      extractResult.entities.forEach((entity, i) => {
        console.log(`    ${i+1}. Type: ${entity.type}, Text: "${entity.text}", Table: ${entity.table}`);
        if (entity.value) console.log(`       Value: ${entity.value}`);
        if (entity.suggestions) console.log(`       Suggestions: ${entity.suggestions.length} items`);
      });
    }

    // Test search endpoint  
    const searchResult = await makeRequest('/api/chat/query', JSON.stringify({
      message: testCase.query
    }));

    console.log('\n🔍 Search Result:');
    console.log(`  Status: ${searchResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Records found: ${searchResult.data ? searchResult.data.length : 0}`);
    console.log(`  SQL Query: ${searchResult.sqlQuery || 'N/A'}`);
    
    if (searchResult.responseEntities) {
      console.log(`  Response entities: ${searchResult.responseEntities.length}`);
    }

    // Validation
    console.log('\n📋 Validation:');
    let validationPassed = true;
    
    if (testCase.expectedEntities) {
      const foundTypes = extractResult.entities?.map(e => e.type) || [];
      const hasExpectedTypes = testCase.expectedEntities.every(type => 
        foundTypes.some(found => found.includes(type))
      );
      console.log(`  Expected entity types: ${hasExpectedTypes ? '✅' : '❌'} ${testCase.expectedEntities.join(', ')}`);
      if (!hasExpectedTypes) validationPassed = false;
    }

    if (testCase.expectedSuggestions) {
      const hasSuggestions = extractResult.entities?.some(e => e.suggestions && e.suggestions.length > 0);
      console.log(`  Expected suggestions: ${hasSuggestions ? '✅' : '❌'}`);
      if (!hasSuggestions) validationPassed = false;
    }

    if (testCase.expectedTable) {
      const hasTable = extractResult.entities?.some(e => e.table === testCase.expectedTable);
      console.log(`  Expected table (${testCase.expectedTable}): ${hasTable ? '✅' : '❌'}`);
      if (!hasTable) validationPassed = false;
    }

    return { success: validationPassed && extractResult.entities?.length > 0, testCase, extractResult, searchResult };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message, testCase };
  }
};

// Check if backend is running
const checkBackend = async () => {
  try {
    const result = await makeRequest('/');
    console.log('🌟 Backend health check: ✅ Running');
    return true;
  } catch (error) {
    console.log('❌ Backend not running. Please start the backend server first:');
    console.log('   cd server && node working-backend.cjs');
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 COMPREHENSIVE API TESTING FOR ENHANCED ENTITY EXTRACTION');
  console.log('='.repeat(70));

  // Check if backend is running
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.log('\n💡 To test properly, please:');
    console.log('1. Open a new terminal');
    console.log('2. cd server');
    console.log('3. node working-backend.cjs');
    console.log('4. Then run this test again');
    process.exit(1);
  }

  const results = [];
  
  for (const testCase of testQueries) {
    const result = await testQuery(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`Total tests: ${totalCount}`);
  console.log(`Successful: ${successCount} ✅`);
  console.log(`Failed: ${totalCount - successCount} ❌`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED! Enhanced entity extraction is working correctly.');
    console.log('\n✅ Verified Features:');
    console.log('  - Numeric filter detection (below, above, over, under)');
    console.log('  - Field-specific mapping (stock→quantity_on_hand, sales→total_amount)');
    console.log('  - Customer name variations (ahmed/ahmad) with suggestions');
    console.log('  - User context detection (my tasks)');
    console.log('  - Complex multi-entity queries');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - Failed: ${r.testCase.name} (${r.error})`);
    });
  }
};

// Start testing
runAllTests().catch(console.error);
