// COMPREHENSIVE TABLE TESTING: 4 TEST TYPES PER TABLE FOR ALL 10 TABLES
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class ComprehensiveTableTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runTest(testName, query, expectedTable, expectedJoinTables = [], expectedEntityCount = null) {
    this.totalTests++;
    
    try {
      console.log(`\n🧪 Running Test: ${testName}`);
      console.log(`📝 Query: "${query}"`);
      
      const response = await axios.post(`${BASE_URL}/api/extract-entities`, {
        message: query,
        userName: 'Ahmed Hassan'
      });
      
      if (response.data.success) {
        const { entities, query: queryData, summary } = response.data;
        const primaryTable = summary.primaryTable;
        const tablesDetected = summary.tablesDetected;
        
        // Check primary table
        let primaryTableMatch = primaryTable === expectedTable;
        
        // Check JOIN tables if specified
        let joinTablesMatch = true;
        if (expectedJoinTables.length > 0) {
          joinTablesMatch = expectedJoinTables.every(table => tablesDetected.includes(table));
        }
        
        // Check entity count if specified
        let entityCountMatch = true;
        if (expectedEntityCount !== null) {
          entityCountMatch = entities.length >= expectedEntityCount;
        }
        
        const testPassed = primaryTableMatch && joinTablesMatch && entityCountMatch;
        
        if (testPassed) {
          this.passedTests++;
          console.log(`✅ PASSED: ${testName}`);
        } else {
          this.failedTests++;
          console.log(`❌ FAILED: ${testName}`);
          if (!primaryTableMatch) console.log(`   Expected table: ${expectedTable}, Got: ${primaryTable}`);
          if (!joinTablesMatch) console.log(`   Expected JOIN tables: ${expectedJoinTables.join(', ')}, Got: ${tablesDetected.join(', ')}`);
          if (!entityCountMatch) console.log(`   Expected entity count >= ${expectedEntityCount}, Got: ${entities.length}`);
        }
        
        this.results.push({
          testName,
          query,
          passed: testPassed,
          expectedTable,
          actualTable: primaryTable,
          expectedJoinTables,
          actualTables: tablesDetected,
          entityCount: entities.length,
          sql: queryData.sql
        });
        
        console.log(`📊 Primary Table: ${primaryTable}`);
        console.log(`🔗 Tables Detected: ${tablesDetected.join(', ')}`);
        console.log(`📈 Entity Count: ${entities.length}`);
        console.log(`🔍 Generated SQL: ${queryData.sql}`);
        
      } else {
        throw new Error(response.data.error || 'API call failed');
      }
      
    } catch (error) {
      this.failedTests++;
      console.log(`❌ ERROR in ${testName}: ${error.message}`);
      
      this.results.push({
        testName,
        query,
        passed: false,
        error: error.message
      });
    }
  }

  async runAllComprehensiveTests() {
    console.log('🚀 STARTING COMPREHENSIVE TABLE TESTING - 4 TYPES PER TABLE');
    console.log('📋 Test Types: info+entity, entity+entity, info, entity');
    console.log('📊 Tables: customers, products, sales, stock, tasks, users, shifts, attendance, audit_trail, date_dimension\n');

    // ====== CUSTOMERS TABLE TESTS ======
    console.log('\n🎯 CUSTOMERS TABLE TESTS (4 types)');
    
    // Type 1: info+entity (query contains both information and entity)
    await this.runTest(
      'Customers Info+Entity Test',
      'Show me customer Ahmed details including email and company',
      'customers',
      [],
      2 // Should detect "customer" and "Ahmed"
    );
    
    // Type 2: entity+entity (multiple entities)
    await this.runTest(
      'Customers Entity+Entity Test',
      'Find customers Ahmed and Sarah from Paris',
      'customers',
      [],
      3 // Should detect "customers", "Ahmed", "Sarah"
    );
    
    // Type 3: info (information query)
    await this.runTest(
      'Customers Info Test',
      'What customer information do we have available?',
      'customers',
      [],
      1 // Should detect "customer"
    );
    
    // Type 4: entity (single entity)
    await this.runTest(
      'Customers Entity Test',
      'customers',
      'customers',
      [],
      1 // Should detect "customers"
    );

    // ====== PRODUCTS TABLE TESTS ======
    console.log('\n🎯 PRODUCTS TABLE TESTS (4 types)');
    
    await this.runTest(
      'Products Info+Entity Test',
      'Show me laptop products with pricing and category details',
      'products',
      [],
      2 // Should detect "laptop" and "products"
    );
    
    await this.runTest(
      'Products Entity+Entity Test',
      'Find laptop and mouse products in electronics category',
      'products',
      [],
      3 // Should detect "laptop", "mouse", "products"
    );
    
    await this.runTest(
      'Products Info Test',
      'What product specifications are available?',
      'products',
      [],
      1 // Should detect "product"
    );
    
    await this.runTest(
      'Products Entity Test',
      'headphones',
      'products',
      [],
      1 // Should detect "headphones"
    );

    // ====== SALES TABLE TESTS ======
    console.log('\n🎯 SALES TABLE TESTS (4 types)');
    
    await this.runTest(
      'Sales Info+Entity Test',
      'Show me sales data for Ahmed with customer and product details',
      'sales',
      ['customers', 'products'],
      3 // Should detect "sales", "Ahmed", and trigger JOINs
    );
    
    await this.runTest(
      'Sales Entity+Entity Test',
      'Find sales from Ahmed to customers buying laptops',
      'sales',
      ['customers', 'products'],
      3 // Should detect "sales", "Ahmed", "customers", "laptops"
    );
    
    await this.runTest(
      'Sales Info Test',
      'What sales information is recorded in the system?',
      'sales',
      [],
      1 // Should detect "sales"
    );
    
    await this.runTest(
      'Sales Entity Test',
      'purchase',
      'sales',
      [],
      1 // Should detect "purchase" → sales
    );

    // ====== STOCK TABLE TESTS ======
    console.log('\n🎯 STOCK TABLE TESTS (4 types)');
    
    await this.runTest(
      'Stock Info+Entity Test',
      'Show me stock levels for laptop products in warehouse',
      'stock',
      ['products'],
      3 // Should detect "stock", "laptop", "warehouse"
    );
    
    await this.runTest(
      'Stock Entity+Entity Test',
      'Find inventory of laptops and monitors in main warehouse',
      'stock',
      ['products'],
      4 // Should detect "inventory", "laptops", "monitors", "warehouse"
    );
    
    await this.runTest(
      'Stock Info Test',
      'What inventory information is tracked?',
      'stock',
      [],
      1 // Should detect "inventory" → stock
    );
    
    await this.runTest(
      'Stock Entity Test',
      'warehouse',
      'stock',
      [],
      1 // Should detect "warehouse" → stock
    );

    // ====== TASKS TABLE TESTS ======
    console.log('\n🎯 TASKS TABLE TESTS (4 types)');
    
    await this.runTest(
      'Tasks Info+Entity Test',
      'Show me task assignments for Ahmed with user details and priority',
      'tasks',
      ['users'],
      3 // Should detect "task", "Ahmed", and trigger users JOIN
    );
    
    await this.runTest(
      'Tasks Entity+Entity Test',
      'Find high priority tasks assigned to Ahmed and Hassan',
      'tasks',
      ['users'],
      4 // Should detect "tasks", "high", "Ahmed", "Hassan"
    );
    
    await this.runTest(
      'Tasks Info Test',
      'What task management features are available?',
      'tasks',
      [],
      1 // Should detect "task"
    );
    
    await this.runTest(
      'Tasks Entity Test',
      'my tasks',
      'tasks',
      ['users'],
      2 // Should detect "my" and "tasks"
    );

    // ====== USERS TABLE TESTS ======
    console.log('\n🎯 USERS TABLE TESTS (4 types)');
    
    await this.runTest(
      'Users Info+Entity Test',
      'Show me user profiles for Ahmed including role and department',
      'users',
      [],
      2 // Should detect "user" and "Ahmed"
    );
    
    await this.runTest(
      'Users Entity+Entity Test',
      'Find users Ahmed and Hassan in engineering department',
      'users',
      [],
      3 // Should detect "users", "Ahmed", "Hassan"
    );
    
    await this.runTest(
      'Users Info Test',
      'What user account information is stored?',
      'users',
      [],
      1 // Should detect "user"
    );
    
    await this.runTest(
      'Users Entity Test',
      'Ahmed',
      'users',
      [],
      1 // Should detect "Ahmed"
    );

    // ====== SHIFTS TABLE TESTS ======
    console.log('\n🎯 SHIFTS TABLE TESTS (4 types)');
    
    await this.runTest(
      'Shifts Info+Entity Test',
      'Show me shift schedules for Ahmed with user details and timing',
      'shifts',
      ['users'],
      3 // Should detect "shift", "Ahmed", and trigger users JOIN
    );
    
    await this.runTest(
      'Shifts Entity+Entity Test',
      'Find morning shifts assigned to Ahmed and evening shifts for Sarah',
      'shifts',
      ['users'],
      4 // Should detect "morning shifts", "Ahmed", "evening shifts", "Sarah"
    );
    
    await this.runTest(
      'Shifts Info Test',
      'What shift scheduling information is available?',
      'shifts',
      [],
      1 // Should detect "shift"
    );
    
    await this.runTest(
      'Shifts Entity Test',
      'weekend shift',
      'shifts',
      [],
      1 // Should detect "weekend shift"
    );

    // ====== ATTENDANCE TABLE TESTS ======
    console.log('\n🎯 ATTENDANCE TABLE TESTS (4 types)');
    
    await this.runTest(
      'Attendance Info+Entity Test',
      'Show me attendance records for Ahmed with shift and user details',
      'attendance',
      ['users', 'shifts'],
      3 // Should detect "attendance", "Ahmed", and trigger JOINs
    );
    
    await this.runTest(
      'Attendance Entity+Entity Test',
      'Find attendance where Ahmed clocked in late and Sarah was absent',
      'attendance',
      ['users'],
      4 // Should detect "attendance", "Ahmed", "late", "Sarah", "absent"
    );
    
    await this.runTest(
      'Attendance Info Test',
      'What attendance tracking features are available?',
      'attendance',
      [],
      1 // Should detect "attendance"
    );
    
    await this.runTest(
      'Attendance Entity Test',
      'clock in',
      'attendance',
      [],
      1 // Should detect "clock in"
    );

    // ====== AUDIT_TRAIL TABLE TESTS ======
    console.log('\n🎯 AUDIT_TRAIL TABLE TESTS (4 types)');
    
    await this.runTest(
      'Audit Trail Info+Entity Test',
      'Show me audit trail records for Ahmed with metadata and document details',
      'audit_trail',
      ['users'],
      3 // Should detect "audit", "Ahmed", "metadata"
    );
    
    await this.runTest(
      'Audit Trail Entity+Entity Test',
      'Find audit logs and metadata tokens for document tracking',
      'audit_trail',
      [],
      3 // Should detect "audit", "logs", "metadata", "tokens"
    );
    
    await this.runTest(
      'Audit Trail Info Test',
      'What audit trail information is being recorded?',
      'audit_trail',
      [],
      1 // Should detect "audit"
    );
    
    await this.runTest(
      'Audit Trail Entity Test',
      'token',
      'audit_trail',
      [],
      1 // Should detect "token"
    );

    // ====== DATE_DIMENSION TABLE TESTS ======
    console.log('\n🎯 DATE_DIMENSION TABLE TESTS (4 types)');
    
    await this.runTest(
      'Date Dimension Info+Entity Test',
      'Show me quarterly data with fiscal year and weekend information',
      'date_dimension',
      [],
      3 // Should detect "quarterly", "fiscal year", "weekend"
    );
    
    await this.runTest(
      'Date Dimension Entity+Entity Test',
      'Find weekend dates and holiday information for quarter analysis',
      'date_dimension',
      [],
      3 // Should detect "weekend", "holiday", "quarter"
    );
    
    await this.runTest(
      'Date Dimension Info Test',
      'What date dimension analytics are available?',
      'date_dimension',
      [],
      1 // Should detect dimension-related keywords
    );
    
    await this.runTest(
      'Date Dimension Entity Test',
      'fiscal year',
      'date_dimension',
      [],
      1 // Should detect "fiscal year"
    );

    // ====== COMPREHENSIVE SUMMARY ======
    this.printComprehensiveSummary();
  }

  printComprehensiveSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE TABLE TESTING SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`📊 Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`🎯 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    // Group results by table
    const tableResults = {};
    this.results.forEach(result => {
      if (result.expectedTable) {
        if (!tableResults[result.expectedTable]) {
          tableResults[result.expectedTable] = { passed: 0, total: 0, tests: [] };
        }
        tableResults[result.expectedTable].total++;
        if (result.passed) tableResults[result.expectedTable].passed++;
        tableResults[result.expectedTable].tests.push(result);
      }
    });
    
    console.log('\n📋 RESULTS BY TABLE:');
    Object.entries(tableResults).forEach(([table, stats]) => {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${table}: ${stats.passed}/${stats.total} (${successRate}%)`);
    });
    
    console.log('\n🔍 FAILED TESTS DETAILS:');
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length === 0) {
      console.log('  🎉 All tests passed!');
    } else {
      failedTests.forEach(test => {
        console.log(`  ❌ ${test.testName}: ${test.query}`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        } else {
          console.log(`     Expected: ${test.expectedTable}, Got: ${test.actualTable}`);
        }
      });
    }
    
    console.log('\n✨ COMPREHENSIVE TESTING COMPLETE!');
    console.log('📊 All 10 database tables tested with 4 test types each');
    console.log('🔗 Total test coverage: 40 comprehensive tests');
    console.log('='.repeat(80));
  }
}

// ====== RUN COMPREHENSIVE TESTS ======
async function runComprehensiveTableTests() {
  const tester = new ComprehensiveTableTester();
  
  try {
    // Check if server is running
    console.log('🔍 Checking server connection...');
    await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running and responsive');
    
    // Run all comprehensive tests
    await tester.runAllComprehensiveTests();
    
  } catch (error) {
    console.error('❌ Failed to connect to server:', error.message);
    console.log('💡 Make sure the server is running on port 3001');
    console.log('🚀 Start the server with: node server/comprehensive-entity-backend.cjs');
  }
}

// Run the tests
if (require.main === module) {
  runComprehensiveTableTests().catch(console.error);
}

module.exports = { ComprehensiveTableTester, runComprehensiveTableTests };
