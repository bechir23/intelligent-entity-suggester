// Generate comprehensive test coverage for all database fields and entities
import { chatService } from './src/services/chatService.js';

// Based on actual database schema from entityFieldsMap.ts
const ALL_DATABASE_COVERAGE_TESTS = [
  
  // ==================== CUSTOMERS TABLE COMPREHENSIVE TESTS ====================
  // Test all searchable fields: name, email, phone, company, address
  {
    id: 1,
    query: "customers with name john",
    category: "Customers - Name Field",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "john", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Customer name field search"
  },
  {
    id: 2,
    query: "customers by email gmail",
    category: "Customers - Email Field", 
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "gmail", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Customer email field search"
  },
  {
    id: 3,
    query: "customers with phone 555",
    category: "Customers - Phone Field",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "555", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Customer phone field search"
  },
  {
    id: 4,
    query: "customers from company tech solutions",
    category: "Customers - Company Field",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "tech solutions", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Customer company field search"
  },
  {
    id: 5,
    query: "customers with address street",
    category: "Customers - Address Field",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "street", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Customer address field search"
  },
  {
    id: 6,
    query: "customers created today",
    category: "Customers - Temporal",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "today", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Customer temporal filtering on created_at"
  },

  // ==================== PRODUCTS TABLE COMPREHENSIVE TESTS ====================
  // Test all searchable fields: name, description, sku, category
  {
    id: 7,
    query: "products named mouse",
    category: "Products - Name Field",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "mouse", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Product name field search"
  },
  {
    id: 8,
    query: "products with description wireless",
    category: "Products - Description Field",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "wireless", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Product description field search"
  },
  {
    id: 9,
    query: "products with sku MOUSE",
    category: "Products - SKU Field",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "MOUSE", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Product SKU field search"
  },
  {
    id: 10,
    query: "products in category electronics",
    category: "Products - Category Field",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "electronics", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Product category field search"
  },
  {
    id: 11,
    query: "products created this week",
    category: "Products - Temporal",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "this week", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Product temporal filtering"
  },

  // ==================== SALES TABLE COMPREHENSIVE TESTS ====================
  // Test all searchable fields: status, notes + temporal on sale_date
  {
    id: 12,
    query: "sales with status completed",
    category: "Sales - Status Field",
    expectedEntities: [
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "completed", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Sales status field search"
  },
  {
    id: 13,
    query: "sales with notes rush",
    category: "Sales - Notes Field",
    expectedEntities: [
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "rush", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Sales notes field search"
  },
  {
    id: 14,
    query: "sales from yesterday",
    category: "Sales - Temporal",
    expectedEntities: [
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "yesterday", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Sales temporal filtering on sale_date"
  },

  // ==================== STOCK TABLE COMPREHENSIVE TESTS ====================
  // Test searchable field: warehouse_location
  {
    id: 15,
    query: "stock in warehouse main",
    category: "Stock - Warehouse Location Field",
    expectedEntities: [
      { text: "stock", type: "entity", color: "#10B981" },
      { text: "main", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Stock warehouse location field search"
  },
  {
    id: 16,
    query: "stock restocked today",
    category: "Stock - Temporal",
    expectedEntities: [
      { text: "stock", type: "entity", color: "#10B981" },
      { text: "today", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Stock temporal filtering on last_restocked"
  },

  // ==================== TASKS TABLE COMPREHENSIVE TESTS ====================
  // Test all searchable fields: title, description, status, priority
  {
    id: 17,
    query: "tasks with title update",
    category: "Tasks - Title Field",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "update", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Task title field search"
  },
  {
    id: 18,
    query: "tasks with description fix bug",
    category: "Tasks - Description Field",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "fix bug", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Task description field search"
  },
  {
    id: 19,
    query: "tasks with status pending",
    category: "Tasks - Status Field",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "pending", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Task status field search"
  },
  {
    id: 20,
    query: "tasks with priority high",
    category: "Tasks - Priority Field",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "high", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Task priority field search"
  },
  {
    id: 21,
    query: "my tasks due tomorrow",
    category: "Tasks - Pronoun + Temporal",
    expectedEntities: [
      { text: "my", type: "pronoun", color: "#F59E0B" },
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "tomorrow", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Tasks with pronoun resolution and due date temporal"
  },

  // ==================== SHIFTS TABLE COMPREHENSIVE TESTS ====================
  // Test searchable fields: location, notes
  {
    id: 22,
    query: "shifts at location office",
    category: "Shifts - Location Field",
    expectedEntities: [
      { text: "shifts", type: "entity", color: "#10B981" },
      { text: "office", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Shift location field search"
  },
  {
    id: 23,
    query: "shifts with notes training",
    category: "Shifts - Notes Field",
    expectedEntities: [
      { text: "shifts", type: "entity", color: "#10B981" },
      { text: "training", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Shift notes field search"
  },
  {
    id: 24,
    query: "shifts scheduled today",
    category: "Shifts - Temporal",
    expectedEntities: [
      { text: "shifts", type: "entity", color: "#10B981" },
      { text: "today", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Shifts temporal filtering on shift_date"
  },

  // ==================== ATTENDANCE TABLE COMPREHENSIVE TESTS ====================
  // Test searchable fields: status, notes
  {
    id: 25,
    query: "attendance with status present",
    category: "Attendance - Status Field",
    expectedEntities: [
      { text: "attendance", type: "entity", color: "#10B981" },
      { text: "present", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Attendance status field search"
  },
  {
    id: 26,
    query: "attendance with notes sick",
    category: "Attendance - Notes Field",
    expectedEntities: [
      { text: "attendance", type: "entity", color: "#10B981" },
      { text: "sick", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Attendance notes field search"
  },
  {
    id: 27,
    query: "my attendance today",
    category: "Attendance - Pronoun + Temporal",
    expectedEntities: [
      { text: "my", type: "pronoun", color: "#F59E0B" },
      { text: "attendance", type: "entity", color: "#10B981" },
      { text: "today", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Attendance with pronoun and temporal on clock_in/clock_out"
  },

  // ==================== USERS TABLE COMPREHENSIVE TESTS ====================
  // Test searchable fields: email, full_name, role
  {
    id: 28,
    query: "users with email ahmed",
    category: "Users - Email Field",
    expectedEntities: [
      { text: "users", type: "entity", color: "#10B981" },
      { text: "ahmed", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "User email field search"
  },
  {
    id: 29,
    query: "users named john doe",
    category: "Users - Full Name Field",
    expectedEntities: [
      { text: "users", type: "entity", color: "#10B981" },
      { text: "john doe", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "User full_name field search"
  },
  {
    id: 30,
    query: "users with role admin",
    category: "Users - Role Field",
    expectedEntities: [
      { text: "users", type: "entity", color: "#10B981" },
      { text: "admin", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "User role field search"
  },

  // ==================== CROSS-TABLE RELATIONSHIP TESTS ====================
  {
    id: 31,
    query: "sales of mouse to acme corporation",
    category: "Cross-Table - Sales + Product + Customer",
    expectedEntities: [
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "mouse", type: "info", color: "#3B82F6" },
      { text: "acme corporation", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Sales with product and customer relationship"
  },
  {
    id: 32,
    query: "tasks assigned to ahmed hassan with high priority",
    category: "Cross-Table - Tasks + User + Priority",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "ahmed hassan", type: "info", color: "#3B82F6" },
      { text: "high priority", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Tasks with user assignment and priority"
  },
  {
    id: 33,
    query: "stock of wireless mouse in warehouse main",
    category: "Cross-Table - Stock + Product + Location",
    expectedEntities: [
      { text: "stock", type: "entity", color: "#10B981" },
      { text: "wireless mouse", type: "info", color: "#3B82F6" },
      { text: "main", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Stock with product and warehouse location"
  },

  // ==================== TEMPORAL VARIATIONS COMPREHENSIVE TESTS ====================
  {
    id: 34,
    query: "sales from last month",
    category: "Temporal - Last Month",
    expectedEntities: [
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "last month", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Monthly temporal filtering"
  },
  {
    id: 35,
    query: "tasks due next week",
    category: "Temporal - Next Week",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "next week", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Future temporal filtering"
  },
  {
    id: 36,
    query: "attendance from last quarter",
    category: "Temporal - Last Quarter",
    expectedEntities: [
      { text: "attendance", type: "entity", color: "#10B981" },
      { text: "last quarter", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Quarterly temporal filtering"
  },
  {
    id: 37,
    query: "customers created this year",
    category: "Temporal - This Year",
    expectedEntities: [
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "this year", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Yearly temporal filtering"
  },

  // ==================== PRONOUN RESOLUTION COMPREHENSIVE TESTS ====================
  {
    id: 38,
    query: "my sales from today",
    category: "Pronoun - My Sales",
    expectedEntities: [
      { text: "my", type: "pronoun", color: "#F59E0B" },
      { text: "sales", type: "entity", color: "#10B981" },
      { text: "today", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Personal sales with pronoun resolution"
  },
  {
    id: 39,
    query: "my shifts this week",
    category: "Pronoun - My Shifts",
    expectedEntities: [
      { text: "my", type: "pronoun", color: "#F59E0B" },
      { text: "shifts", type: "entity", color: "#10B981" },
      { text: "this week", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Personal shifts with pronoun resolution"
  },
  {
    id: 40,
    query: "my customers created last month",
    category: "Pronoun - My Customers",
    expectedEntities: [
      { text: "my", type: "pronoun", color: "#F59E0B" },
      { text: "customers", type: "entity", color: "#10B981" },
      { text: "last month", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Personal customers with temporal filter"
  },

  // ==================== INFO-ONLY SUGGESTIONS TESTS ====================
  {
    id: 41,
    query: "mouse",
    category: "Info-Only - Product",
    expectedEntities: [
      { text: "mouse", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Product name only - should suggest multiple tables"
  },
  {
    id: 42,
    query: "ahmed hassan",
    category: "Info-Only - Person",
    expectedEntities: [
      { text: "ahmed hassan", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Person name only - should suggest multiple tables"
  },
  {
    id: 43,
    query: "high priority",
    category: "Info-Only - Priority",
    expectedEntities: [
      { text: "high priority", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Priority level only - should suggest tasks table"
  },
  {
    id: 44,
    query: "completed",
    category: "Info-Only - Status",
    expectedEntities: [
      { text: "completed", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Status only - should suggest multiple tables with status fields"
  },
  {
    id: 45,
    query: "tech solutions",
    category: "Info-Only - Company",
    expectedEntities: [
      { text: "tech solutions", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Company name only - should suggest customers table"
  },

  // ==================== EDGE CASES AND COMPLEX QUERIES ====================
  {
    id: 46,
    query: "pending high priority tasks assigned to john doe from last week",
    category: "Complex - Multiple Info + Temporal",
    expectedEntities: [
      { text: "pending", type: "info", color: "#3B82F6" },
      { text: "high priority", type: "info", color: "#3B82F6" },
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "john doe", type: "info", color: "#3B82F6" },
      { text: "last week", type: "temporal", color: "#F59E0B" }
    ],
    expectResults: true,
    description: "Complex query with multiple info fields and temporal"
  },
  {
    id: 47,
    query: "cancelled pending active",
    category: "Edge Case - Conflicting Status",
    expectedEntities: [
      { text: "cancelled", type: "info", color: "#3B82F6" },
      { text: "pending", type: "info", color: "#3B82F6" },
      { text: "active", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Conflicting status values - should suggest table selection"
  },
  {
    id: 48,
    query: "keyboard mouse monitor printer",
    category: "Edge Case - Multiple Products",
    expectedEntities: [
      { text: "keyboard", type: "info", color: "#3B82F6" },
      { text: "mouse", type: "info", color: "#3B82F6" },
      { text: "monitor", type: "info", color: "#3B82F6" },
      { text: "printer", type: "info", color: "#3B82F6" }
    ],
    expectResults: false,
    expectedSuggestions: true,
    description: "Multiple products without entity - should suggest table selection"
  },

  // ==================== FIELD TYPE SPECIFIC TESTS ====================
  {
    id: 49,
    query: "products with price greater than 100",
    category: "Numeric Field - Price Range",
    expectedEntities: [
      { text: "products", type: "entity", color: "#10B981" },
      { text: "100", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Numeric field filtering on price"
  },
  {
    id: 50,
    query: "tasks with quantity 5",
    category: "Numeric Field - Quantity",
    expectedEntities: [
      { text: "tasks", type: "entity", color: "#10B981" },
      { text: "5", type: "info", color: "#3B82F6" }
    ],
    expectResults: true,
    description: "Numeric field filtering on quantity"
  }
];

// Enhanced test runner for comprehensive database coverage
async function runAllDatabaseCoverageTests() {
  console.log('🎯 COMPREHENSIVE DATABASE COVERAGE TEST SUITE');
  console.log('Testing ALL searchable fields across ALL tables with 100% coverage goal\\n');
  console.log(`Current Date: August 2, 2025\\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  let totalResults = 0;
  let testsByCategory = {};
  
  for (const testCase of ALL_DATABASE_COVERAGE_TESTS) {
    totalTests++;
    
    if (!testsByCategory[testCase.category]) {
      testsByCategory[testCase.category] = { passed: 0, total: 0, results: 0 };
    }
    testsByCategory[testCase.category].total++;
    
    console.log(`\\n--- Test ${testCase.id}: ${testCase.description} ---`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Category: ${testCase.category}`);
    
    try {
      const startTime = Date.now();
      const result = await chatService.processQuery(testCase.query, 'ahmed-hassan-user-id');
      const endTime = Date.now();
      
      console.log(`⚡ Response time: ${endTime - startTime}ms`);
      
      // Validate entity extraction
      let entityExtractionPassed = true;
      let entityDetails = '';
      
      if (testCase.expectedEntities && testCase.expectedEntities.length > 0) {
        console.log(`\\n🔍 Expected Entities (${testCase.expectedEntities.length}):`);
        testCase.expectedEntities.forEach(expected => {
          console.log(`  - "${expected.text}" (${expected.type}, ${expected.color})`);
        });
        
        console.log(`\\n✅ Actual Entities (${result.responseEntities.length}):`);
        result.responseEntities.forEach(entity => {
          console.log(`  - "${entity.text}" (${entity.type}, ${entity.color}) [${entity.startIndex}-${entity.endIndex}] confidence: ${entity.confidence}`);
          if (entity.hoverText) {
            console.log(`    📝 Hover: ${entity.hoverText}`);
          }
        });
        
        // Check if all expected entities are found
        for (const expectedEntity of testCase.expectedEntities) {
          const found = result.responseEntities.find(entity => 
            entity.text === expectedEntity.text && 
            entity.type === expectedEntity.type && 
            entity.color === expectedEntity.color
          );
          
          if (!found) {
            entityExtractionPassed = false;
            entityDetails += `Missing: "${expectedEntity.text}" (${expectedEntity.type}) `;
          }
        }
      }
      
      // Check results
      const hasResults = result.data && result.data.length > 0;
      const resultCount = hasResults ? result.data.length : 0;
      totalResults += resultCount;
      testsByCategory[testCase.category].results += resultCount;
      
      console.log(`\\n📊 Database Results: ${resultCount} records found`);
      
      if (hasResults && resultCount > 0) {
        console.log(`First result preview:`, JSON.stringify(result.data[0], null, 2).substring(0, 200) + '...');
      }
      
      // Determine test pass/fail
      const expectedResults = testCase.expectResults !== false;
      const resultsMatch = expectedResults ? hasResults : !hasResults;
      
      let testPassed = entityExtractionPassed && resultsMatch;
      
      if (testCase.expectedSuggestions && !testCase.expectResults) {
        // For info-only tests, we expect suggestions but no results
        testPassed = entityExtractionPassed && !hasResults;
        console.log(`\\n💡 Suggestion Test: Expected no results + entity extraction = ${testPassed ? 'PASS' : 'FAIL'}`);
      }
      
      if (testPassed) {
        passedTests++;
        testsByCategory[testCase.category].passed++;
        console.log(`\\n✅ TEST PASSED`);
      } else {
        console.log(`\\n❌ TEST FAILED`);
        if (!entityExtractionPassed) {
          console.log(`   🔸 Entity extraction failed: ${entityDetails}`);
        }
        if (!resultsMatch) {
          console.log(`   🔸 Results mismatch: expected ${expectedResults ? 'results' : 'no results'}, got ${hasResults ? 'results' : 'no results'}`);
        }
      }
      
    } catch (error) {
      console.log(`\\n💥 TEST ERROR: ${error.message}`);
      testsByCategory[testCase.category].total++;
    }
  }
  
  // Final comprehensive report
  console.log(`\\n\\n🎯 === COMPREHENSIVE DATABASE COVERAGE FINAL REPORT ===`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Database Results Found: ${totalResults}`);
  console.log(`Average Results per Test: ${(totalResults / totalTests).toFixed(1)}`);
  
  console.log(`\\n📊 Results by Category:`);
  Object.entries(testsByCategory).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    const avgResults = (stats.results / stats.total).toFixed(1);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${successRate}%) - ${stats.results} results (avg: ${avgResults})`);
  });
  
  if (passedTests === totalTests) {
    console.log(`\\n🎉 ALL TESTS PASSED! 100% DATABASE COVERAGE ACHIEVED! 🎉`);
  } else {
    console.log(`\\n⚠️  ${totalTests - passedTests} tests need attention to reach 100% coverage`);
  }
  
  console.log(`\\n✅ Database Coverage Assessment Complete`);
}

// Run the comprehensive coverage tests
runAllDatabaseCoverageTests().catch(console.error);
