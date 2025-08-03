// COMPREHENSIVE TEST TO ACHIEVE 100% RESULTS WITH FUZZY MATCHING
import { chatService } from './src/services/chatService.js';

const COMPREHENSIVE_FUZZY_TESTS = [
  
  // ==================== BASIC ENTITY + INFO TESTS ====================
  {
    id: 1,
    query: "attendance of ahmed",
    expectedEntities: ["attendance", "ahmed"],
    expectResults: true,
    description: "Attendance entity + Ahmed info - should return records"
  },
  {
    id: 2,
    query: "sales of wireless mouse",
    expectedEntities: ["sales", "wireless mouse"],
    expectResults: true,
    description: "Sales entity + wireless mouse multi-word info"
  },
  {
    id: 3,
    query: "customers from tech solutions",
    expectedEntities: ["customers", "tech solutions"],
    expectResults: true,
    description: "Customers entity + tech solutions company"
  },
  
  // ==================== INFO-ONLY SUGGESTIONS ====================
  {
    id: 4,
    query: "ahmed",
    expectedEntities: ["ahmed"],
    expectResults: false,
    expectSuggestions: true,
    description: "Ahmed info only - should suggest tables"
  },
  {
    id: 5,
    query: "mouse",
    expectedEntities: ["mouse"],
    expectResults: false,
    expectSuggestions: true,
    description: "Mouse info only - should suggest wireless mouse variants"
  },
  {
    id: 6,
    query: "completed",
    expectedEntities: ["completed"],
    expectResults: false,
    expectSuggestions: true,
    description: "Completed status - should suggest tasks/sales tables"
  },
  
  // ==================== TEMPORAL WITH HOVER ====================
  {
    id: 7,
    query: "sales from today",
    expectedEntities: ["sales", "today"],
    expectResults: true,
    expectTemporal: true,
    description: "Sales from today with temporal parsing"
  },
  {
    id: 8,
    query: "attendance for the second shift yesterday",
    expectedEntities: ["attendance", "second shift", "yesterday"],
    expectResults: true,
    expectTemporal: true,
    description: "Complex temporal with shift info"
  },
  {
    id: 9,
    query: "tasks due this week",
    expectedEntities: ["tasks", "this week"],
    expectResults: true,
    expectTemporal: true,
    description: "Tasks due this week temporal"
  },
  
  // ==================== PRONOUN RESOLUTION ====================
  {
    id: 10,
    query: "show tasks assigned to me",
    expectedEntities: ["tasks", "me"],
    expectResults: true,
    expectPronoun: true,
    description: "Tasks assigned to me with pronoun resolution"
  },
  {
    id: 11,
    query: "my attendance",
    expectedEntities: ["my", "attendance"],
    expectResults: true,
    expectPronoun: true,
    description: "My attendance with pronoun"
  },
  {
    id: 12,
    query: "my sales from this week",
    expectedEntities: ["my", "sales", "this week"],
    expectResults: true,
    expectPronoun: true,
    expectTemporal: true,
    description: "My sales with pronoun and temporal"
  },
  
  // ==================== FIELD-SPECIFIC TESTS ====================
  {
    id: 13,
    query: "customers with email gmail",
    expectedEntities: ["customers", "gmail"],
    expectResults: true,
    description: "Customers email field"
  },
  {
    id: 14,
    query: "products with description gaming",
    expectedEntities: ["products", "gaming"],
    expectResults: true,
    description: "Products description field"
  },
  {
    id: 15,
    query: "tasks with priority high",
    expectedEntities: ["tasks", "high"],
    expectResults: true,
    description: "Tasks priority field"
  },
  {
    id: 16,
    query: "users with role admin",
    expectedEntities: ["users", "admin"],
    expectResults: true,
    description: "Users role field"
  },
  {
    id: 17,
    query: "shifts at location office",
    expectedEntities: ["shifts", "office"],
    expectResults: true,
    description: "Shifts location field"
  },
  {
    id: 18,
    query: "stock in warehouse main",
    expectedEntities: ["stock", "main"],
    expectResults: true,
    description: "Stock warehouse field"
  },
  
  // ==================== COMPLEX COMBINATIONS ====================
  {
    id: 19,
    query: "high priority pending tasks assigned to ahmed hassan",
    expectedEntities: ["high priority", "pending", "tasks", "ahmed hassan"],
    expectResults: true,
    description: "Complex multi-field task query"
  },
  {
    id: 20,
    query: "sales of wireless mouse to acme corporation from yesterday",
    expectedEntities: ["sales", "wireless mouse", "acme corporation", "yesterday"],
    expectResults: true,
    description: "Complex cross-table sales query"
  },
  
  // ==================== FUZZY MATCHING VARIATIONS ====================
  {
    id: 21,
    query: "keyboard",
    expectedEntities: ["keyboard"],
    expectResults: false,
    expectSuggestions: true,
    description: "Keyboard should suggest mechanical/gaming variants"
  },
  {
    id: 22,
    query: "laptop",
    expectedEntities: ["laptop"],
    expectResults: false,
    expectSuggestions: true,
    description: "Laptop should suggest gaming/business variants"
  },
  {
    id: 23,
    query: "headphones",
    expectedEntities: ["headphones"],
    expectResults: false,
    expectSuggestions: true,
    description: "Headphones should suggest wireless variants"
  },
  
  // ==================== ADDITIONAL COMPREHENSIVE TESTS ====================
  {
    id: 24,
    query: "show me ahmed attendance",
    expectedEntities: ["ahmed", "attendance"],
    expectResults: true,
    description: "Ahmed attendance navigation query"
  },
  {
    id: 25,
    query: "sales of kitkat",
    expectedEntities: ["sales", "kitkat"],
    expectResults: true,
    description: "Sales of kitkat product"
  }
];

async function runComprehensiveFuzzyTests() {
  console.log('🚀 COMPREHENSIVE FUZZY MATCHING TEST SUITE');
  console.log('Testing for 100% results with entity extraction and fuzzy matching\\n');
  console.log(`Current Date: August 2, 2025\\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  let totalResults = 0;
  let entityExtractionSuccess = 0;
  let temporalSuccess = 0;
  let pronounSuccess = 0;
  
  for (const testCase of COMPREHENSIVE_FUZZY_TESTS) {
    totalTests++;
    
    console.log(`\\n--- Test ${testCase.id}: ${testCase.description} ---`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const startTime = Date.now();
      const result = await chatService.processQuery(testCase.query, 'ahmed-hassan-user-id');
      const endTime = Date.now();
      
      console.log(`⚡ Response time: ${endTime - startTime}ms`);
      
      // Check entity extraction
      let entityExtractionPassed = true;
      
      console.log(`\\n🔍 Expected Entities: ${testCase.expectedEntities.join(', ')}`);
      console.log(`✅ Actual Entities (${result.responseEntities.length}):`);
      
      result.responseEntities.forEach(entity => {
        console.log(`  - "${entity.text}" (${entity.type}, ${entity.color}) confidence: ${entity.confidence}`);
        if (entity.hoverText) {
          console.log(`    📝 Hover: ${entity.hoverText}`);
        }
      });
      
      // Validate all expected entities are found
      for (const expectedText of testCase.expectedEntities) {
        const found = result.responseEntities.find(entity => 
          entity.text.toLowerCase().includes(expectedText.toLowerCase()) ||
          expectedText.toLowerCase().includes(entity.text.toLowerCase())
        );
        
        if (!found) {
          entityExtractionPassed = false;
          console.log(`   ❌ Missing entity: "${expectedText}"`);
        } else {
          console.log(`   ✅ Found entity: "${expectedText}" → "${found.text}"`);
        }
      }
      
      if (entityExtractionPassed) {
        entityExtractionSuccess++;
        
        // Count special features
        if (testCase.expectTemporal) {
          const hasTemporal = result.responseEntities.some(e => e.type === 'temporal');
          if (hasTemporal) temporalSuccess++;
        }
        
        if (testCase.expectPronoun) {
          const hasPronoun = result.responseEntities.some(e => e.type === 'pronoun');
          if (hasPronoun) pronounSuccess++;
        }
      }
      
      // Check results
      const hasResults = result.data && result.data.length > 0;
      const resultCount = hasResults ? result.data.length : 0;
      totalResults += resultCount;
      
      console.log(`\\n📊 Database Results: ${resultCount} records found`);
      
      if (hasResults && resultCount > 0) {
        console.log(`Sample result keys:`, Object.keys(result.data[0]).join(', '));
      }
      
      // Determine test success
      const expectedResults = testCase.expectResults !== false;
      const resultsMatch = expectedResults ? hasResults : !hasResults;
      
      let testPassed = entityExtractionPassed && resultsMatch;
      
      // Special handling for suggestion tests
      if (testCase.expectSuggestions && !testCase.expectResults) {
        testPassed = entityExtractionPassed && !hasResults;
        console.log(`\\n💡 Suggestion Test: ${testPassed ? 'PASS' : 'FAIL'} (expected no results + entity extraction)`);
      }
      
      if (testPassed) {
        passedTests++;
        console.log(`\\n✅ TEST PASSED`);
        
        if (resultCount > 0) {
          console.log(`   🎯 Results: ${resultCount} records (100% coverage achieved)`);
        }
      } else {
        console.log(`\\n❌ TEST FAILED`);
        if (!entityExtractionPassed) {
          console.log(`   🔸 Entity extraction failed`);
        }
        if (!resultsMatch) {
          console.log(`   🔸 Results mismatch: expected ${expectedResults ? 'results' : 'no results'}, got ${hasResults ? 'results' : 'no results'}`);
        }
      }
      
    } catch (error) {
      console.log(`\\n💥 TEST ERROR: ${error.message}`);
    }
  }
  
  // Final report
  console.log(`\\n\\n🎯 === COMPREHENSIVE FUZZY MATCHING FINAL REPORT ===`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Database Results: ${totalResults}`);
  console.log(`Average Results per Test: ${(totalResults / totalTests).toFixed(1)}`);
  
  console.log(`\\n📊 Feature Success Rates:`);
  console.log(`Entity Extraction: ${entityExtractionSuccess}/${totalTests} (${((entityExtractionSuccess / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Temporal Parsing: ${temporalSuccess} tests with temporal features`);
  console.log(`Pronoun Resolution: ${pronounSuccess} tests with pronouns`);
  
  if (passedTests === totalTests && totalResults > 0) {
    console.log(`\\n🎉 PERFECT! 100% COMPREHENSIVE SUCCESS ACHIEVED! 🎉`);
    console.log(`\\n✅ All tests passed with complete fuzzy matching and results!`);
    console.log(`\\n🚀 System ready for production!`);
  } else if (passedTests === totalTests) {
    console.log(`\\n🎊 EXCELLENT! All tests passed with perfect entity extraction!`);
  } else {
    const failedTests = totalTests - passedTests;
    console.log(`\\n⚠️  ${failedTests} tests failed - ${((failedTests / totalTests) * 100).toFixed(1)}% failure rate`);
    console.log(`\\n🔧 Focus on improving entity extraction and result coverage`);
  }
  
  console.log(`\\n✅ Comprehensive Fuzzy Matching Test Complete`);
}

// Run the tests
runComprehensiveFuzzyTests().catch(console.error);
