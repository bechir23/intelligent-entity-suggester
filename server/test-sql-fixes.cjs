// COMPREHENSIVE TEST SUITE FOR SQL GENERATION FIXES
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/chat/query';

// Test cases to verify SQL generation and entity extraction fixes
const testCases = [
  {
    query: "ahmed tasks",
    description: "User + Tasks - Should show tasks table with user filter",
    expectedTable: "tasks",
    expectedSQL: "SELECT * FROM tasks WHERE",
    shouldContain: ["tasks", "assigned_to", "Ahmed Hassan"]
  },
  {
    query: "sales of laptop",
    description: "Sales + Product - Should show sales table with product join",
    expectedTable: "sales",
    expectedSQL: "SELECT",
    shouldContain: ["sales", "products"]
  },
  {
    query: "laptop stock in paris",
    description: "Product + Stock + Location - Should show stock table with filters",
    expectedTable: "stock",
    expectedSQL: "SELECT * FROM stock WHERE",
    shouldContain: ["stock", "warehouse_location", "paris"]
  },
  {
    query: "pending tasks for ahmed",
    description: "Status + Tasks + User - Should show tasks with status and user filters",
    expectedTable: "tasks",
    expectedSQL: "SELECT * FROM tasks WHERE",
    shouldContain: ["tasks", "status", "pending", "ahmed"]
  },
  {
    query: "wireless mouse sales",
    description: "Product + Sales - Should show sales table with product filter",
    expectedTable: "sales",
    expectedSQL: "SELECT",
    shouldContain: ["sales", "mouse"]
  },
  {
    query: "my tasks pending",
    description: "Pronoun + Tasks + Status - Should resolve 'my' to user name",
    expectedTable: "tasks",
    expectedSQL: "SELECT * FROM tasks WHERE",
    shouldContain: ["tasks", "Ahmed Hassan", "pending"]
  },
  {
    query: "customers in london",
    description: "Customers + Location - Should show customers table",
    expectedTable: "customers",
    expectedSQL: "SELECT * FROM customers",
    shouldContain: ["customers"]
  },
  {
    query: "stock below 10",
    description: "Stock + Numeric Filter - Should show stock with quantity filter",
    expectedTable: "stock",
    expectedSQL: "SELECT * FROM stock WHERE",
    shouldContain: ["stock", "quantity_available", "<", "10"]
  },
  {
    query: "sales today",
    description: "Sales + Date Filter - Should show sales with date filter",
    expectedTable: "sales",
    expectedSQL: "SELECT * FROM sales WHERE",
    shouldContain: ["sales", "sale_date"]
  },
  {
    query: "completed tasks",
    description: "Status + Tasks - Should show tasks with completed status",
    expectedTable: "tasks",
    expectedSQL: "SELECT * FROM tasks WHERE",
    shouldContain: ["tasks", "status", "completed"]
  }
];

async function runTest(testCase, index) {
  console.log(`\n🧪 TEST ${index + 1}: ${testCase.description}`);
  console.log(`📝 Query: "${testCase.query}"`);
  
  try {
    const response = await axios.post(API_URL, {
      message: testCase.query,
      userName: 'Ahmed Hassan'
    });
    
    const { sqlQuery, primaryTable, responseEntities, recordCount, filters } = response.data;
    
    console.log(`✅ Response received:`);
    console.log(`   Primary Table: ${primaryTable}`);
    console.log(`   SQL Query: ${sqlQuery}`);
    console.log(`   Record Count: ${recordCount}`);
    console.log(`   Entities: ${responseEntities.length}`);
    console.log(`   Filters Applied: ${JSON.stringify(filters, null, 2)}`);
    
    // Validate results
    let testPassed = true;
    const issues = [];
    
    // Check primary table
    if (primaryTable !== testCase.expectedTable) {
      testPassed = false;
      issues.push(`Expected table: ${testCase.expectedTable}, got: ${primaryTable}`);
    }
    
    // Check SQL doesn't contain "unknown" or "undefined"
    if (sqlQuery.includes('unknown') || sqlQuery.includes('undefined')) {
      testPassed = false;
      issues.push(`SQL contains 'unknown' or 'undefined': ${sqlQuery}`);
    }
    
    // Check SQL contains expected table name
    if (!sqlQuery.includes(testCase.expectedTable)) {
      testPassed = false;
      issues.push(`SQL doesn't contain expected table: ${testCase.expectedTable}`);
    }
    
    // Check for expected content
    testCase.shouldContain.forEach(expectedContent => {
      const found = sqlQuery.toLowerCase().includes(expectedContent.toLowerCase()) ||
                   JSON.stringify(filters).toLowerCase().includes(expectedContent.toLowerCase()) ||
                   responseEntities.some(e => 
                     e.text.toLowerCase().includes(expectedContent.toLowerCase()) ||
                     (e.actualValue && e.actualValue.toLowerCase().includes(expectedContent.toLowerCase()))
                   );
      
      if (!found) {
        testPassed = false;
        issues.push(`Expected content not found: ${expectedContent}`);
      }
    });
    
    // Check for entity deduplication
    const entityTexts = responseEntities.map(e => e.text.toLowerCase());
    const duplicates = entityTexts.filter((text, index) => entityTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      testPassed = false;
      issues.push(`Duplicate entities found: ${duplicates.join(', ')}`);
    }
    
    if (testPassed) {
      console.log(`✅ TEST PASSED`);
      return { passed: true, issues: [] };
    } else {
      console.log(`❌ TEST FAILED:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      return { passed: false, issues };
    }
    
  } catch (error) {
    console.log(`💥 TEST ERROR: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { passed: false, issues: [error.message] };
  }
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE SQL GENERATION TESTS');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push({
      testCase: testCases[i],
      ...result
    });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const successRate = ((passed / results.length) * 100).toFixed(1);
  
  console.log(`✅ Passed: ${passed}/${results.length} (${successRate}%)`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.testCase.description}`);
      console.log(`   Query: "${result.testCase.query}"`);
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    });
  }
  
  console.log('\n🎯 CRITICAL CHECKS:');
  
  // Check for SQL "unknown" issues
  const unknownSQLTests = results.filter(r => 
    r.issues.some(issue => issue.includes('unknown') || issue.includes('undefined'))
  );
  
  if (unknownSQLTests.length === 0) {
    console.log('✅ No "unknown" or "undefined" values in SQL queries');
  } else {
    console.log(`❌ ${unknownSQLTests.length} tests have "unknown" or "undefined" SQL issues`);
  }
  
  // Check for entity deduplication
  const duplicateEntityTests = results.filter(r => 
    r.issues.some(issue => issue.includes('Duplicate entities'))
  );
  
  if (duplicateEntityTests.length === 0) {
    console.log('✅ No duplicate entity issues detected');
  } else {
    console.log(`❌ ${duplicateEntityTests.length} tests have duplicate entity issues`);
  }
  
  // Check for proper table detection
  const tableDetectionTests = results.filter(r => 
    r.issues.some(issue => issue.includes('Expected table'))
  );
  
  if (tableDetectionTests.length === 0) {
    console.log('✅ All table detections are correct');
  } else {
    console.log(`❌ ${tableDetectionTests.length} tests have incorrect table detection`);
  }
  
  console.log('\n🚀 Testing complete!');
  
  return {
    totalTests: results.length,
    passed,
    failed,
    successRate: parseFloat(successRate),
    results
  };
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});
