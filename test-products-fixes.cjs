const { default: fetch } = require('node-fetch');

async function testProductsTableFixes() {
  console.log('🔍 TESTING PRODUCTS TABLE FIXES\n');
  
  const testCases = [
    { query: "laptop products", description: "Product + products table should work now" },
    { query: "mouse products", description: "Product + products table should work now" },
    { query: "mechanical products", description: "Product + products table should work now" },
    { query: "Mechanical Keyboard products", description: "Full product name + products table" },
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
        
        // Check if this is a successful product query
        const hasProductInfo = result.entities && result.entities.some(e => e.type === 'info');
        const hasProductsEntity = result.entities && result.entities.some(e => e.type === 'entity' && e.table === 'products');
        const hasData = result.data && result.data.length > 0;
        
        if (hasProductInfo && hasProductsEntity && hasData) {
          console.log('🎉 SUCCESS: Product + products table query working!');
        } else if (hasProductInfo && hasProductsEntity) {
          console.log('⚠️ PARTIAL: Entities detected but no data returned');
        } else {
          console.log('❌ FAILED: Missing entities or incorrect detection');
        }
        
      } else {
        console.error(`❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${testCase.query}":`, error.message);
    }
  }
}

testProductsTableFixes();
