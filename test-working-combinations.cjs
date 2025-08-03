const { default: fetch } = require('node-fetch');

async function testWorkingCombinations() {
  console.log('🔍 TESTING WORKING COMBINATIONS\n');
  
  // Based on logs, these should work
  const workingQueries = [
    "Wireless Mouse",
    "Mechanical Keyboard", 
    "USB-C Hub",
    "Wireless Mouse from sales",
    "sales Wireless Mouse",
    "Mechanical Keyboard products"
  ];
  
  for (const query of workingQueries) {
    try {
      console.log(`\n🧪 Testing: "${query}"`);
      
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        console.log(`📊 Response: ${result.response || 'No response'}`);
        console.log(`📋 Data: ${result.data ? result.data.length : 0} records`);
        
        if (result.entities && result.entities.length > 0) {
          console.log('🎯 Entities (API response):');
          result.entities.forEach(entity => {
            console.log(`  • ${entity.text} (${entity.type}) -> ${entity.value || entity.table} [confidence: ${entity.confidence}]`);
          });
        } else {
          console.log('❌ No entities in API response (but logs show detection!)');
        }
        
        // Check for relational behavior
        const hasProductInfo = result.entities && result.entities.some(e => e.type === 'info');
        const hasEntityTable = result.entities && result.entities.some(e => e.type === 'entity');
        const hasData = result.data && result.data.length > 0;
        
        console.log(`✅ Analysis: Info=${hasProductInfo ? '✅' : '❌'} Entity=${hasEntityTable ? '✅' : '❌'} Data=${hasData ? '✅' : '❌'}`);
        
        if (hasProductInfo && hasEntityTable && hasData) {
          console.log('🎉 PERFECT: Full relational info+entity query working!');
        } else if (hasProductInfo && hasData) {
          console.log('✅ GOOD: Product detection + data retrieval working');
        } else if (hasEntityTable && hasData) {
          console.log('✅ GOOD: Entity detection + data retrieval working');  
        }
        
      } else {
        console.error(`❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
    }
  }
}

testWorkingCombinations();
