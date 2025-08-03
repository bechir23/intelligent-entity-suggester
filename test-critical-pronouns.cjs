const { default: fetch } = require('node-fetch');

async function testCriticalPronounCases() {
  console.log('🎯 TESTING CRITICAL PRONOUN CASES\n');
  
  const criticalQueries = [
    "sales assigned to me",
    "my tasks",
    "my shifts", 
    "my attendance",
    "tasks assigned to me",
    "Wireless Mouse",
    "laptop from sales",
    "sales laptop"
  ];
  
  for (const query of criticalQueries) {
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
          console.log('🎯 Entities (FIXED!):');
          result.entities.forEach(entity => {
            console.log(`  • ${entity.text} (${entity.type}) -> ${entity.value || entity.table} [confidence: ${entity.confidence}]`);
          });
        } else {
          console.log('❌ No entities in API response');
        }
        
        // Analyze critical aspects
        const hasPronoun = result.entities && result.entities.some(e => e.type === 'pronoun');
        const hasInfo = result.entities && result.entities.some(e => e.type === 'info');
        const hasEntity = result.entities && result.entities.some(e => e.type === 'entity');
        const hasData = result.data && result.data.length > 0;
        
        console.log(`✅ Analysis: Pronoun=${hasPronoun ? '✅' : '❌'} Info=${hasInfo ? '✅' : '❌'} Entity=${hasEntity ? '✅' : '❌'} Data=${hasData ? '✅' : '❌'}`);
        
        if (query.includes('me') || query.includes('my')) {
          if (hasPronoun && hasData) {
            console.log('🎉 SUCCESS: Pronoun resolution working correctly!');
          } else if (hasPronoun && !hasData) {
            console.log('⚠️ PARTIAL: Pronoun detected but no filtered data');
          } else {
            console.log('❌ FAILED: Pronoun not detected');
          }
        }
        
        if (query.includes('Wireless Mouse') || query.includes('laptop')) {
          if (hasInfo && hasData) {
            console.log('🎉 SUCCESS: Product detection working correctly!');
          } else if (hasInfo && !hasData) {
            console.log('⚠️ PARTIAL: Product detected but no data');
          } else {
            console.log('❌ FAILED: Product not detected');
          }
        }
        
      } else {
        console.error(`❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
    }
  }
}

testCriticalPronounCases();
