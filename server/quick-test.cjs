// QUICK INDIVIDUAL TEST FOR SQL FIXES
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/chat/query';

async function testSingleQuery(query, description) {
  console.log(`\n🧪 ${description}`);
  console.log(`📝 Query: "${query}"`);
  
  try {
    const response = await axios.post(API_URL, {
      message: query,
      userName: 'Ahmed Hassan'
    });
    
    const { sqlQuery, primaryTable, responseEntities, recordCount, filters } = response.data;
    
    console.log(`✅ SUCCESS:`);
    console.log(`   Primary Table: ${primaryTable}`);
    console.log(`   SQL Query: ${sqlQuery}`);
    console.log(`   Record Count: ${recordCount}`);
    console.log(`   Entities: ${responseEntities.map(e => `${e.text}(${e.type})`).join(', ')}`);
    
    // Check for issues
    const issues = [];
    if (sqlQuery.includes('unknown') || sqlQuery.includes('undefined')) {
      issues.push(`SQL contains 'unknown' or 'undefined'`);
    }
    
    if (issues.length === 0) {
      console.log(`✅ No issues detected!`);
    } else {
      console.log(`❌ Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function quickTests() {
  console.log('🚀 QUICK SQL GENERATION TESTS');
  console.log('=' .repeat(50));
  
  // Test individual cases to see improvements
  await testSingleQuery("sales today", "Sales with date filter (should only use sales table)");
  await testSingleQuery("ahmed tasks", "User + tasks (should detect user properly)");
  await testSingleQuery("customers in london", "Customer table detection");
  await testSingleQuery("laptop stock", "Product + stock (should use stock table)");
  await testSingleQuery("stock below 10", "Numeric filter test");
  
  console.log('\n🚀 Quick tests complete!');
}

quickTests().catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
