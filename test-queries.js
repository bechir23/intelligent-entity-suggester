const fetch = require('node-fetch');

async function testQueries() {
  const queries = [
    'sales of laptop',
    'ahmed tasks', 
    'laptop stock in paris',
    'pending tasks for ahmed',
    'sales last month by product'
  ];

  for (const query of queries) {
    console.log(`\n🧪 TESTING: "${query}"`);
    console.log('=' .repeat(50));
    
    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      const result = await response.json();
      
      console.log('📊 Response Summary:');
      console.log('- Success:', result.success);
      console.log('- Records found:', result.recordCount || 0);
      console.log('- SQL Query:', result.sqlQuery || 'None');
      console.log('- Tables involved:', result.metadata?.tablesInvolved || []);
      console.log('- Entities:', result.responseEntities?.length || 0);
      
      if (result.responseEntities) {
        result.responseEntities.forEach((entity, i) => {
          console.log(`  Entity ${i+1}: "${entity.word || entity.text}" (${entity.type}) -> ${entity.table}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testQueries();
