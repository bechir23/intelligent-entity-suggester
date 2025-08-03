const { default: fetch } = require('node-fetch');

async function testDirectUserQuery() {
  console.log('🔍 TESTING DIRECT USER QUERIES TO GET REAL USER ID\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "users" })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`📊 Users Response: ${result.response}`);
      console.log(`📋 Users Data: ${result.data ? result.data.length : 0} records`);
      
      if (result.data && result.data.length > 0) {
        console.log('👥 Actual users in database:');
        result.data.forEach((user, i) => {
          console.log(`  ${i+1}. ${user.name} (${user.id}) - ${user.email}`);
        });
        
        // Use the first user ID for testing
        const firstUserId = result.data[0].id;
        console.log(`\\n🎯 Using user ID for testing: ${firstUserId}`);
        return firstUserId;
      }
    }
  } catch (error) {
    console.error('❌ Error getting users:', error.message);
  }
  return null;
}

async function testSalesQuery() {
  console.log('\\n🔍 TESTING SALES QUERY TO UNDERSTAND STRUCTURE\\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "sales" })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`📊 Sales Response: ${result.response}`);
      console.log(`📋 Sales Data: ${result.data ? result.data.length : 0} records`);
      
      if (result.data && result.data.length > 0) {
        console.log('💰 Sample sales records:');
        result.data.slice(0, 3).forEach((sale, i) => {
          console.log(`  ${i+1}. Customer: ${sale.customer_id}, Product: ${sale.product_id}, Sales Rep: ${sale.sales_rep_id || 'NULL'}, Amount: ${sale.total_amount}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error getting sales:', error.message);
  }
}

async function runTests() {
  const userId = await testDirectUserQuery();
  await testSalesQuery();
  
  if (userId) {
    console.log(`\\n✅ Found real user ID: ${userId}`);
    console.log('💡 This should be used instead of the mock ID in pronoun filtering');
  }
}

runTests();
