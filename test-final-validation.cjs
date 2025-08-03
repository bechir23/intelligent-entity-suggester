const { default: fetch } = require('node-fetch');

async function comprehensiveValidationTest() {
  console.log('🎯 COMPREHENSIVE VALIDATION TEST\n');
  console.log('Testing ALL major functionality to ensure 100% working system\n');
  
  const testCases = [
    {
      name: 'Pronoun Resolution - Sales',
      query: 'sales assigned to me',
      expectedEntities: ['sales', 'me'],
      expectedTable: 'sales',
      shouldHaveData: true
    },
    {
      name: 'Pronoun Resolution - Tasks', 
      query: 'my tasks',
      expectedEntities: ['tasks', 'my'],
      expectedTable: 'tasks',
      shouldHaveData: false // Might not have task data
    },
    {
      name: 'Product Detection - Exact Name',
      query: 'Wireless Mouse',
      expectedEntities: ['Wireless Mouse'],
      expectedTable: 'products',
      shouldHaveData: true
    },
    {
      name: 'Product + Entity - Laptop Sales',
      query: 'laptop from sales',
      expectedEntities: ['laptop', 'sales'],
      expectedTable: 'sales',
      shouldHaveData: true
    },
    {
      name: 'Direct Entity Query',
      query: 'products',
      expectedEntities: ['products'],
      expectedTable: 'products', 
      shouldHaveData: true
    },
    {
      name: 'Direct Entity Query - Users',
      query: 'users',
      expectedEntities: ['users'],
      expectedTable: 'users',
      shouldHaveData: true
    }
  ];
  
  let passedTests = 0;
  const totalTests = testCases.length;
  
  for (const testCase of testCases) {
    try {
      console.log(`\\n🧪 ${testCase.name}: "${testCase.query}"`);
      
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testCase.query })
      });
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      
      // Analyze results
      const hasData = result.data && result.data.length > 0;
      const entities = result.entities || [];
      const entityTexts = entities.map(e => e.text.toLowerCase());
      
      console.log(`📊 Response: ${result.response}`);
      console.log(`📋 Data: ${result.data ? result.data.length : 0} records`);
      console.log(`🎯 Entities: ${entities.map(e => `${e.text} (${e.type})`).join(', ')}`);
      
      // Validation
      let passed = true;
      let issues = [];
      
      // Check entity detection
      const detectedExpectedEntities = testCase.expectedEntities.filter(expected => 
        entityTexts.some(detected => detected.includes(expected.toLowerCase()) || expected.toLowerCase().includes(detected))
      );
      
      if (detectedExpectedEntities.length !== testCase.expectedEntities.length) {
        passed = false;
        const missing = testCase.expectedEntities.filter(expected => 
          !entityTexts.some(detected => detected.includes(expected.toLowerCase()) || expected.toLowerCase().includes(detected))
        );
        issues.push(`Missing entities: ${missing.join(', ')}`);
      }
      
      // Check data expectation
      if (testCase.shouldHaveData && !hasData) {
        passed = false;
        issues.push('Expected data but got none');
      }
      
      if (passed) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log(`❌ FAILED: ${issues.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 FINAL RESULTS: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! System is working perfectly!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('✅ Most functionality working! Minor fixes needed.');
  } else {
    console.log('⚠️ Major issues detected. System needs comprehensive fixes.');
  }
}

comprehensiveValidationTest();
