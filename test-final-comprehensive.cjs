const { default: fetch } = require('node-fetch');

async function testSuggestionsAndFiltering() {
  console.log('🎯 COMPREHENSIVE FILTERING & SUGGESTIONS TEST\n');
  
  const testCases = [
    // Test cases that should work with suggestions
    { query: "laptop", description: "Single product word - should suggest exact matches" },
    { query: "mouse", description: "Single product word - should suggest wireless mouse, etc." },
    { query: "mechanical", description: "Partial product word - should suggest mechanical keyboard" },
    { query: "usb", description: "Partial product word - should suggest USB-C Hub" },
    
    // Test cases for table relationships
    { query: "products", description: "Direct products table query" },
    { query: "laptop products", description: "Product + products table" },
    { query: "mouse products", description: "Product + products table" },
    
    // Test cases for user data verification
    { query: "tasks", description: "All tasks to verify data exists" },
    { query: "shifts", description: "All shifts to verify data exists" },
    { query: "attendance", description: "All attendance to verify data exists" },
    { query: "users", description: "All users to verify user ID exists" },
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Testing: "${testCase.query}"`);
      console.log(`💡 Expected: ${testCase.description}`);
      
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testCase.query })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        console.log(`📊 Response: ${result.response || 'No response'}`);
        console.log(`📋 Data: ${result.data ? result.data.length : 0} records`);
        
        if (result.entities && result.entities.length > 0) {
          console.log('🎯 Entities:');
          result.entities.forEach(entity => {
            console.log(`  • ${entity.text} (${entity.type}) -> ${entity.value || entity.table} [confidence: ${entity.confidence}]`);
          });
        }
        
        // For products queries, show first few records to understand data structure
        if (result.data && result.data.length > 0 && testCase.query.includes('products')) {
          console.log('📦 Sample records:');
          result.data.slice(0, 2).forEach((record, index) => {
            console.log(`  Record ${index + 1}: ${JSON.stringify(record, null, 2)}`);
          });
        }
        
        // For user-related queries, check for actual user data
        if (result.data && result.data.length > 0 && ['tasks', 'shifts', 'attendance', 'users'].includes(testCase.query)) {
          console.log('👤 User data sample:');
          result.data.slice(0, 1).forEach((record, index) => {
            console.log(`  Record ${index + 1}: ${JSON.stringify(record, null, 2)}`);
          });
        }
        
      } else {
        console.error(`❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${testCase.query}":`, error.message);
    }
  }
}

testSuggestionsAndFiltering();
