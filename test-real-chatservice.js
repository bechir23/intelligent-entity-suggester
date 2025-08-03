// Real TypeScript Chat Service Test
// This test imports and tests the actual compiled chatService.ts

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test the real chatService after compilation
async function testRealChatService() {
  console.log('🚀 Testing Real Chat Service with Fuzzy Matching...\n');
  
  try {
    // Import the compiled chatService
    const { chatService } = await import('./server/dist/services/chatService.js');
    
    const testCases = [
      {
        query: "Show me mouse products",
        expectedFuzzy: ['wireless mouse', 'gaming mouse', 'bluetooth mouse'],
        description: "Test mouse fuzzy matching"
      },
      {
        query: "Find keyboard for my customer today",
        expectedFuzzy: ['mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
        description: "Test keyboard fuzzy with pronoun and temporal"
      },
      {
        query: "Check phone sales yesterday",
        expectedFuzzy: ['smartphone', 'mobile phone', 'cell phone'],
        description: "Test phone fuzzy with temporal"
      }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const [index, testCase] of testCases.entries()) {
      console.log(`Test ${index + 1}: ${testCase.description}`);
      console.log(`Query: "${testCase.query}"`);
      
      // Call the real extractEntitiesAndInfo method
      const entities = await chatService.extractEntitiesAndInfo(testCase.query, 'TestUser');
      
      console.log(`\n📊 Extracted ${entities.length} entities:`);
      entities.forEach((entity, i) => {
        console.log(`  ${i + 1}. "${entity.text}" (${entity.type}, confidence: ${entity.confidence}%)`);
        if (entity.hoverText) {
          console.log(`     💡 Hover: ${entity.hoverText}`);
        }
      });
      
      // Check for fuzzy matches
      const fuzzyMatches = entities.filter(e => 
        testCase.expectedFuzzy.includes(e.text) || 
        (e.hoverText && e.hoverText.includes('suggests:'))
      );
      
      const hasExpectedFuzzy = testCase.expectedFuzzy.some(expected =>
        entities.some(entity => entity.text === expected || 
          (entity.hoverText && entity.hoverText.includes(expected)))
      );
      
      console.log(`\n🔍 Expected Fuzzy: [${testCase.expectedFuzzy.join(', ')}]`);
      console.log(`🔍 Found Fuzzy Evidence: ${hasExpectedFuzzy ? 'YES' : 'NO'}`);
      
      if (hasExpectedFuzzy) {
        console.log('✅ PASSED\n');
        passedTests++;
      } else {
        console.log('❌ FAILED\n');
      }
      
      console.log('─'.repeat(80) + '\n');
    }
    
    console.log('📊 Real Service Test Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL REAL SERVICE TESTS PASSED!');
      console.log('✨ The TypeScript chatService.ts is working with fuzzy matching!');
    } else {
      console.log('\n⚠️  Some real service tests failed.');
    }
    
  } catch (error) {
    console.error('❌ Error testing real chatService:', error.message);
    console.log('\n💡 Note: Make sure to compile the TypeScript first with npm run build:backend');
  }
}

testRealChatService();
