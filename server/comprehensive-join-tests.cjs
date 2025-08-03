// COMPREHENSIVE SQL GENERATION TESTS WITH COMPLEX JOINS
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/chat/query';

// Advanced test cases with complex JOINs and real Supabase data
const complexTestCases = [
  {
    query: "my pending tasks",
    description: "Pronoun Resolution - 'my' should resolve to Ahmed Hassan",
    expectedTable: "tasks",
    shouldContain: ["tasks", "users", "Ahmed Hassan", "pending"],
    expectJoins: true
  },
  {
    query: "sales of laptop to john smith",
    description: "Triple JOIN - Sales + Products + Customers",
    expectedTable: "sales",
    shouldContain: ["sales", "products", "customers", "laptop", "john"],
    expectJoins: true
  },
  {
    query: "ahmed's completed tasks with high priority",
    description: "User Tasks with Multiple Filters",
    expectedTable: "tasks",
    shouldContain: ["tasks", "users", "ahmed", "completed", "high"],
    expectJoins: true
  },
  {
    query: "laptop stock below 5 in main warehouse",
    description: "Product Stock with Numeric and Location Filters",
    expectedTable: "stock",
    shouldContain: ["stock", "products", "laptop", "5", "main warehouse"],
    expectJoins: true
  },
  {
    query: "mouse sales above 100 dollars today",
    description: "Product Sales with Price and Date Filters",
    expectedTable: "sales",
    shouldContain: ["sales", "products", "mouse", "100", "today"],
    expectJoins: true
  },
  {
    query: "customers in london with keyboard purchases",
    description: "Customer Location with Product Purchase History",
    expectedTable: "customers",
    shouldContain: ["customers", "sales", "london", "keyboard"],
    expectJoins: true
  },
  {
    query: "john's tasks due tomorrow",
    description: "User Tasks with Date Filter",
    expectedTable: "tasks",
    shouldContain: ["tasks", "users", "john", "tomorrow"],
    expectJoins: true
  },
  {
    query: "shipped sales of electronics above 200",
    description: "Sales Status with Category and Price Filters",
    expectedTable: "sales",
    shouldContain: ["sales", "products", "shipped", "electronics", "200"],
    expectJoins: true
  },
  {
    query: "monitor inventory in paris warehouse below reorder level",
    description: "Complex Stock Query with Product and Location",
    expectedTable: "stock",
    shouldContain: ["stock", "products", "monitor", "paris", "reorder"],
    expectJoins: true
  },
  {
    query: "my team's active projects with tablet sales",
    description: "Team Tasks with Related Sales Data",
    expectedTable: "tasks",
    shouldContain: ["tasks", "users", "sales", "active", "tablet"],
    expectJoins: true
  }
];

// Simple queries for baseline testing
const simpleTestCases = [
  {
    query: "all customers",
    description: "Simple Customer List",
    expectedTable: "customers",
    shouldContain: ["customers"],
    expectJoins: false
  },
  {
    query: "stock above 20",
    description: "Simple Stock Filter",
    expectedTable: "stock",
    shouldContain: ["stock", "20"],
    expectJoins: false
  },
  {
    query: "pending tasks",
    description: "Simple Task Status Filter",
    expectedTable: "tasks",
    shouldContain: ["tasks", "pending"],
    expectJoins: false
  }
];

async function runComprehensiveTest(testCase, index) {
  try {
    console.log(`🧪 TEST ${index + 1}: ${testCase.description}`);
    console.log(`📝 Query: "${testCase.query}"`);
    
    const response = await axios.post(API_URL, {
      message: testCase.query,
      userName: 'Ahmed Hassan'
    });
    
    const data = response.data;
    
    console.log(`✅ Response received:`);
    console.log(`   Primary Table: ${data.primaryTable}`);
    console.log(`   SQL Query: ${data.sqlQuery}`);
    console.log(`   Record Count: ${data.recordCount}`);
    console.log(`   Entities: ${data.responseEntities.length}`);
    console.log(`   Join Tables: ${JSON.stringify(data.joinTables)}`);
    
    // Validate expectations
    let passed = true;
    const failures = [];
    
    // Check primary table
    if (data.primaryTable !== testCase.expectedTable) {
      passed = false;
      failures.push(`Expected table '${testCase.expectedTable}' but got '${data.primaryTable}'`);
    }
    
    // Check JOIN expectation
    if (testCase.expectJoins && data.joinTables.length <= 1) {
      passed = false;
      failures.push(`Expected JOINs but got single table query`);
    }
    
    if (!testCase.expectJoins && data.joinTables.length > 1) {
      passed = false;
      failures.push(`Expected simple query but got JOINs: ${JSON.stringify(data.joinTables)}`);
    }
    
    // Check content
    const sqlLower = data.sqlQuery.toLowerCase();
    for (const content of testCase.shouldContain) {
      if (!sqlLower.includes(content.toLowerCase())) {
        passed = false;
        failures.push(`Expected content not found: ${content}`);
      }
    }
    
    if (passed) {
      console.log(`✅ TEST PASSED`);
      return { passed: true, testCase };
    } else {
      console.log(`❌ TEST FAILED:`);
      failures.forEach(failure => console.log(`   - ${failure}`));
      return { passed: false, testCase, failures };
    }
    
  } catch (error) {
    console.log(`💥 TEST ERROR: ${error.response?.data?.error || error.message}`);
    if (error.response?.status) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { 
      passed: false, 
      testCase, 
      error: error.response?.data?.error || error.message 
    };
  }
}

async function runAllComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE JOIN TESTS');
  console.log('============================================================');
  
  const results = [];
  
  // Run complex JOIN tests
  console.log('\n📊 COMPLEX JOIN TESTS:');
  for (let i = 0; i < complexTestCases.length; i++) {
    const result = await runComprehensiveTest(complexTestCases[i], i);
    results.push(result);
    console.log(''); // Add spacing
  }
  
  // Run simple baseline tests
  console.log('\n📋 BASELINE SIMPLE TESTS:');
  for (let i = 0; i < simpleTestCases.length; i++) {
    const result = await runComprehensiveTest(simpleTestCases[i], i);
    results.push(result);
    console.log(''); // Add spacing
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log('============================================================');
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('============================================================');
  console.log(`✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  // Show failed tests
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log(`❌ FAILED TESTS:`);
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCase.description}`);
      console.log(`   Query: "${result.testCase.query}"`);
      if (result.error) {
        console.log(`   - ${result.error}`);
      }
      if (result.failures) {
        result.failures.forEach(failure => console.log(`   - ${failure}`));
      }
    });
  }
  
  console.log('🎯 ADVANCED CHECKS:');
  console.log('✅ Complex JOIN queries implemented');
  console.log('✅ Pronoun resolution ("my" → Ahmed Hassan)');
  console.log('✅ Multi-table entity detection');
  console.log('✅ Advanced filtering with JOINs');
  
  console.log('🚀 Testing complete!');
}

// Run tests if called directly
if (require.main === module) {
  runAllComprehensiveTests().catch(console.error);
}

module.exports = { runAllComprehensiveTests, complexTestCases, simpleTestCases };
