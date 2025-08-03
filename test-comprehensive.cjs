const { default: fetch } = require('node-fetch');

async function testComprehensive() {
  console.log('🔍 COMPREHENSIVE TESTING - All info+entity combinations\n');
  
  // Test 1: Check what products are actually in the database
  console.log('📦 Testing direct product queries:');
  const productQueries = [
    "products",
    "show products", 
    "list products",
    "all products"
  ];
  
  for (const query of productQueries) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ "${query}" -> ${result.data ? result.data.length : 0} records`);
        if (result.data && result.data.length > 0) {
          console.log('   Products found:');
          result.data.slice(0, 5).forEach(product => {
            console.log(`   • ${product.name || product.product_name || product.title || 'Unnamed'} (${product.sku || 'No SKU'})`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ "${query}" failed:`, error.message);
    }
  }
  
  console.log('\n🎯 Testing specific product name queries:');
  const specificProducts = [
    "laptop",
    "mouse", 
    "keyboard",
    "monitor",
    "wireless",
    "mechanical",
    "4k",
    "usb"
  ];
  
  for (const product of specificProducts) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: product })
      });
      
      if (response.ok) {
        const result = await response.json();
        const hasProductInfo = result.entities && result.entities.some(e => e.type === 'info');
        const hasProductEntity = result.entities && result.entities.some(e => e.table === 'products');
        
        console.log(`🔍 "${product}": Info=${hasProductInfo ? '✅' : '❌'} Entity=${hasProductEntity ? '✅' : '❌'} Records=${result.data ? result.data.length : 0}`);
        
        if (result.entities && result.entities.length > 0) {
          result.entities.forEach(entity => {
            console.log(`   • ${entity.text} (${entity.type}) -> ${entity.value || entity.table || 'No value'}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ "${product}" failed:`, error.message);
    }
  }
  
  console.log('\n🔗 Testing info+entity combinations:');
  const combinations = [
    "laptop from sales",
    "mouse from products", 
    "keyboard sales",
    "wireless mouse products",
    "sales laptop",
    "products mouse",
    "laptop in sales",
    "mouse in products"
  ];
  
  for (const combo of combinations) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: combo })
      });
      
      if (response.ok) {
        const result = await response.json();
        const hasInfo = result.entities && result.entities.some(e => e.type === 'info');
        const hasEntity = result.entities && result.entities.some(e => e.type === 'entity');
        const isHomogeneous = result.data && result.data.length > 0;
        
        console.log(`🔗 "${combo}": Info=${hasInfo ? '✅' : '❌'} Entity=${hasEntity ? '✅' : '❌'} Homogeneous=${isHomogeneous ? '✅' : '❌'} (${result.data ? result.data.length : 0} records)`);
        
        if (result.entities) {
          result.entities.forEach(entity => {
            console.log(`   • ${entity.text} (${entity.type}) -> ${entity.value || entity.table || 'No value'}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ "${combo}" failed:`, error.message);
    }
  }
  
  console.log('\n🔄 Testing pronoun resolution:');
  const pronouns = [
    "my tasks",
    "tasks for me", 
    "show me products",
    "sales assigned to me"
  ];
  
  for (const pronoun of pronouns) {
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: pronoun })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`👤 "${pronoun}": ${result.data ? result.data.length : 0} records`);
      }
    } catch (error) {
      console.log(`❌ "${pronoun}" failed:`, error.message);
    }
  }
}

testComprehensive();
