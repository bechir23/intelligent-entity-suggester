const { default: fetch } = require('node-fetch');

async function testCacheDebugging() {
  console.log('🔍 TESTING CACHE DEBUGGING\n');
  
  // Single test to see cache loading
  try {
    const response = await fetch('http://localhost:3001/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "debug cache laptop" })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 Cache Debug Response:', result.response);
      
      if (result.entities) {
        console.log('🎯 Entities found:', result.entities.length);
        result.entities.forEach(entity => {
          console.log(`  • ${entity.text} (${entity.type}) -> ${entity.value || entity.table}`);
        });
      } else {
        console.log('❌ No entities in response');
      }
      
      if (result.data) {
        console.log(`📋 Data records: ${result.data.length}`);
      }
    } else {
      console.error('❌ API Error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Test the exact products we know exist
  console.log('\n🎯 Testing exact product names from database:');
  const exactProducts = [
    "Laptop Pro 15\"",
    "Wireless Mouse", 
    "Mechanical Keyboard",
    "4K Monitor 27\"",
    "USB-C Hub"
  ];
  
  for (const product of exactProducts) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: product })
      });
      
      if (response.ok) {
        const result = await response.json();
        const hasEntity = result.entities && result.entities.length > 0;
        console.log(`📦 "${product}": Entities=${hasEntity ? '✅' : '❌'} Records=${result.data ? result.data.length : 0}`);
        
        if (result.entities && result.entities.length > 0) {
          result.entities.forEach(entity => {
            console.log(`    • ${entity.text} (${entity.type}) -> ${entity.value || entity.table}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ "${product}" failed:`, error.message);
    }
  }
}

testCacheDebugging();
