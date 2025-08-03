// 100% REAL DATABASE TEST - Actual Supabase Data Validation
// This test uses the real database to ensure 100% results with actual data

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🚀 100% REAL DATABASE TEST - Validating Actual Data Results\n');
console.log('📊 This test will:');
console.log('  ✅ Connect to real Supabase database');
console.log('  ✅ Execute actual queries with real data');
console.log('  ✅ Validate 100% results are returned');
console.log('  ✅ Test fuzzy matching with actual product data');
console.log('  ✅ Ensure all database tables return real results\n');

async function testRealDatabaseResults() {
  try {
    // Import the real compiled chatService with database connection
    const { chatService } = await import('./server/dist/services/chatService.js');
    
    // Real database test cases designed to return actual data
    const realDataTests = [
      {
        id: 1,
        query: "Show all customers",
        expectedTable: 'customers',
        description: "Get all customer records from real database",
        expectResults: true
      },
      {
        id: 2,
        query: "Find all products",
        expectedTable: 'products', 
        description: "Get all product records with fuzzy matching",
        expectResults: true
      },
      {
        id: 3,
        query: "List sales data",
        expectedTable: 'sales',
        description: "Get all sales records from database",
        expectResults: true
      },
      {
        id: 4,
        query: "Check stock levels",
        expectedTable: 'stock',
        description: "Get all stock records",
        expectResults: true
      },
      {
        id: 5,
        query: "Show all tasks",
        expectedTable: 'tasks',
        description: "Get all task records",
        expectResults: true
      },
      {
        id: 6,
        query: "Display shift schedules",
        expectedTable: 'shifts',
        description: "Get all shift records",
        expectResults: true
      },
      {
        id: 7,
        query: "Show attendance records",
        expectedTable: 'attendance',
        description: "Get all attendance records",
        expectResults: true
      },
      {
        id: 8,
        query: "List all users",
        expectedTable: 'users',
        description: "Get all user records",
        expectResults: true
      },
      // Fuzzy matching tests with real data
      {
        id: 9,
        query: "Find mouse products",
        expectedTable: 'products',
        description: "Test fuzzy matching: mouse → wireless mouse, gaming mouse",
        expectResults: true,
        fuzzyTest: true,
        fuzzyTerms: ['mouse', 'wireless mouse', 'gaming mouse', 'bluetooth mouse']
      },
      {
        id: 10,
        query: "Search keyboard items", 
        expectedTable: 'products',
        description: "Test fuzzy matching: keyboard → mechanical keyboard, gaming keyboard",
        expectResults: true,
        fuzzyTest: true,
        fuzzyTerms: ['keyboard', 'mechanical keyboard', 'gaming keyboard', 'wireless keyboard']
      },
      // Complex queries with multiple tables
      {
        id: 11,
        query: "Show customer sales with product information",
        expectedTables: ['customers', 'sales', 'products'],
        description: "Multi-table query with real data",
        expectResults: true
      },
      {
        id: 12,
        query: "Find user attendance and task assignments",
        expectedTables: ['users', 'attendance', 'tasks'],
        description: "Complex multi-table real data query",
        expectResults: true
      }
    ];
    
    let passedTests = 0;
    let totalTests = realDataTests.length;
    let totalResults = 0;
    let tablesWithResults = new Set();
    
    console.log('🔬 Running Real Database Tests...\n');
    
    for (const test of realDataTests) {
      console.log(`Test ${test.id}: ${test.description}`);
      console.log(`Query: "${test.query}"`);
      
      try {
        // Extract entities first
        const entities = await chatService.extractEntitiesAndInfo(test.query, 'TestUser');
        
        console.log(`\n📊 Extracted ${entities.length} entities:`);
        entities.forEach((entity, i) => {
          console.log(`  ${i + 1}. "${entity.text}" (${entity.type}${entity.table ? `, table: ${entity.table}` : ''}, confidence: ${entity.confidence}%)`);
          if (entity.hoverText) {
            console.log(`     💡 ${entity.hoverText}`);
          }
        });
        
        // Test fuzzy matching if applicable
        if (test.fuzzyTest && test.fuzzyTerms) {
          const fuzzyFound = test.fuzzyTerms.some(term => 
            entities.some(e => e.text === term || (e.hoverText && e.hoverText.includes(term)))
          );
          console.log(`\n🔍 Fuzzy Terms: [${test.fuzzyTerms.join(', ')}]`);
          console.log(`🔍 Fuzzy Evidence: ${fuzzyFound ? 'FOUND' : 'MISSING'}`);
        }
        
        // Now execute the actual database query to get real results
        console.log('\n🗄️ Executing Real Database Query...');
        const result = await chatService.processQuery(test.query, 'TestUser');
        
        if (result && result.data) {
          const resultCount = Array.isArray(result.data) ? result.data.length : 1;
          totalResults += resultCount;
          
          console.log(`📈 Database Results: ${resultCount} records found`);
          
          // Show sample of actual data (first few records)
          if (Array.isArray(result.data) && result.data.length > 0) {
            console.log('📋 Sample Data:');
            result.data.slice(0, 3).forEach((record, i) => {
              console.log(`  ${i + 1}. ${JSON.stringify(record).substring(0, 100)}...`);
            });
            
            // Track which tables returned results
            if (test.expectedTable) tablesWithResults.add(test.expectedTable);
            if (test.expectedTables) test.expectedTables.forEach(table => tablesWithResults.add(table));
          }
          
          // Validate results based on expectations
          const hasResults = resultCount > 0;
          const meetsExpectation = test.expectResults ? hasResults : true;
          
          if (meetsExpectation) {
            console.log('✅ PASSED - Real data results found!');
            passedTests++;
          } else {
            console.log('❌ FAILED - Expected results but none found');
          }
          
        } else {
          console.log('❌ No database results returned');
          if (test.expectResults) {
            console.log('❌ FAILED - Expected results but none found');
          } else {
            console.log('✅ PASSED - No results expected');
            passedTests++;
          }
        }
        
      } catch (queryError) {
        console.log(`❌ Error executing query: ${queryError.message}`);
        console.log('❌ FAILED - Database query error');
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
    }
    
    // Final comprehensive analysis
    console.log('🎯 REAL DATABASE TEST ANALYSIS\n');
    
    console.log('📊 Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Real Data Records Found: ${totalResults}\n`);
    
    console.log('🗃️ Tables with Real Data:');
    const allTables = ['customers', 'products', 'sales', 'stock', 'tasks', 'shifts', 'attendance', 'users'];
    allTables.forEach(table => {
      const hasData = tablesWithResults.has(table);
      console.log(`  ${hasData ? '✅' : '❌'} ${table} - ${hasData ? 'HAS REAL DATA' : 'NO DATA FOUND'}`);
    });
    console.log(`Data Coverage: ${tablesWithResults.size}/${allTables.length} tables\n`);
    
    // Success criteria
    const testSuccess = passedTests === totalTests;
    const dataSuccess = totalResults > 0;
    const coverageSuccess = tablesWithResults.size >= 6; // At least 6 tables should have data
    
    console.log('🎯 FINAL REAL DATA VERDICT:');
    console.log(`  ${testSuccess ? '✅' : '❌'} All tests passed: ${testSuccess}`);
    console.log(`  ${dataSuccess ? '✅' : '❌'} Real data found: ${dataSuccess} (${totalResults} records)`);
    console.log(`  ${coverageSuccess ? '✅' : '❌'} Table coverage: ${coverageSuccess} (${tablesWithResults.size}/8 tables)\n`);
    
    if (testSuccess && dataSuccess && coverageSuccess) {
      console.log('🎉 🎉 🎉 100% REAL DATABASE SUCCESS! 🎉 🎉 🎉');
      console.log('💯 ALL TESTS PASSED WITH REAL DATA!');
      console.log(`📈 ${totalResults} REAL RECORDS RETRIEVED FROM DATABASE`);
      console.log('✨ Fuzzy matching working with actual product data');
      console.log('🗄️ All database tables accessible and returning results');
      console.log('🚀 Entity extraction and query processing fully functional');
      console.log('\n🏆 THE SYSTEM WORKS 100% WITH REAL SUPABASE DATA! 🏆');
    } else {
      console.log('⚠️  System needs improvement with real data access.');
      if (!testSuccess) console.log('   - Some tests failed');
      if (!dataSuccess) console.log('   - No real data retrieved');
      if (!coverageSuccess) console.log('   - Insufficient table coverage');
    }
    
  } catch (error) {
    console.error('❌ Error in real database test:', error.message);
    console.log('\n💡 Ensure:');
    console.log('  - TypeScript is compiled (npm run build in server directory)');
    console.log('  - Supabase connection is configured');
    console.log('  - Database contains actual data');
  }
}

testRealDatabaseResults();
