// QUICK TEST FOR "MY TASKS" QUERY
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/chat/query';

async function testMyTasks() {
  try {
    console.log('🧪 Testing "my tasks" query...');
    
    const response = await axios.post(API_URL, {
      message: "my tasks",
      userName: 'Ahmed Hassan'
    });
    
    const data = response.data;
    
    console.log('✅ SUCCESS!');
    console.log('📋 Query: "my tasks"');
    console.log('🎯 Primary Table:', data.primaryTable);
    console.log('🔗 Join Tables:', JSON.stringify(data.joinTables));
    console.log('📊 Records Found:', data.recordCount);
    console.log('🔍 Entities:', data.responseEntities.length);
    console.log('');
    console.log('📝 Generated SQL:');
    console.log(data.sqlQuery);
    console.log('');
    console.log('💾 Sample Data:');
    if (data.data && data.data.length > 0) {
      console.log(JSON.stringify(data.data[0], null, 2));
    }
    
    // Verify the key points
    console.log('');
    console.log('🎯 VERIFICATION:');
    console.log('✅ Resolves "my" to Ahmed Hassan:', data.sqlQuery.includes('Ahmed Hassan'));
    console.log('✅ Uses tasks table:', data.primaryTable === 'tasks');
    console.log('✅ Has JOIN with users:', data.joinTables.includes('users'));
    console.log('✅ Found records:', data.recordCount > 0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

testMyTasks();
