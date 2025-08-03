const { default: fetch } = require('node-fetch');

async function testMultipleQueries() {
  const queries = [
    "laptop from sales",
    "macbook from sales", 
    "computer from sales",
    "product from sales",
    "items from sales"
  ];
  
  for (const query of queries) {
    try {
      console.log(`\n🧪 Testing RELATIONAL query: "${query}"`);
      
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`Response: ${result.response || 'No response'}`);
      console.log(`Data Records: ${result.data ? result.data.length : 0}`);
      
      if (result.entities && result.entities.length > 0) {
        console.log('🎯 Entities:');
        result.entities.forEach(entity => {
          console.log(`  • "${entity.text}" (${entity.type}) - ${entity.hoverText || entity.value || 'No value'}`);
        });
      }
      
      // Check for relational behavior
      const hasProductInfo = result.entities && result.entities.some(e => e.type === 'info');
      const hasSalesEntity = result.entities && result.entities.some(e => e.type === 'entity' && e.table === 'sales');
      
      if (hasProductInfo && hasSalesEntity) {
        console.log('✅ SUCCESS: Product info + Sales entity detected!');
      } else if (hasSalesEntity) {
        console.log('⚪ PARTIAL: Sales entity detected, but no product info recognized');
      } else {
        console.log('❌ FAILED: No proper entity detection');
      }
      
    } catch (error) {
      console.error(`❌ Test failed for "${query}":`, error.message);
    }
  }
}

testMultipleQueries();
