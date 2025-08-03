const { default: fetch } = require('node-fetch');

async function testTableStructure() {
  console.log('🔍 TESTING TABLE STRUCTURE\n');
  
  try {
    // Test a simple query to see actual table structure
    const response = await fetch('http://localhost:3001/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'sales' }) // Just query sales table
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        console.log('📊 Sales Table Structure (first record):');
        console.log(JSON.stringify(result.data[0], null, 2));
        
        console.log('\n🔑 Available columns in sales table:');
        Object.keys(result.data[0]).forEach(key => {
          console.log(`  • ${key}: ${typeof result.data[0][key]} (${result.data[0][key]})`);
        });
      } else {
        console.log('❌ No sales data found');
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

testTableStructure();
