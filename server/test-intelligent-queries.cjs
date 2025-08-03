const fetch = require('node-fetch');

// Test intelligent query processing
async function testIntelligentQueries() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🧠 Testing Intelligent Query Processing System');
  console.log('===============================================\n');
  
  const testQueries = [
    {
      name: "Laptop Sales Query",
      query: "laptop sales above 1000",
      description: "Should detect laptop in products table and sales in sales table, create joins"
    },
    {
      name: "Stock Below Threshold",
      query: "stock below 100",
      description: "Should query stock table with quantity filter"
    },
    {
      name: "Ahmed Customer",
      query: "ahmed",
      description: "Should find Ahmed in customers table"
    },
    {
      name: "My Tasks",
      query: "my tasks",
      description: "Should query tasks for current user"
    },
    {
      name: "Laptop Inventory",
      query: "laptop stock",
      description: "Should query stock table with laptop product filter"
    }
  ];
  
  // Start with entity extraction test
  console.log('1️⃣ Testing Entity Extraction...\n');
  
  for (const test of testQueries) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   Query: "${test.query}"`);
      console.log(`   Expected: ${test.description}`);
      
      const response = await fetch(`${baseURL}/api/chat/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: test.query })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Entities found: ${data.entities.length}`);
        data.entities.forEach(entity => {
          console.log(`      - "${entity.text}" → ${entity.table} (${entity.type})`);
        });
      } else {
        console.log(`   ❌ Failed: ${data.error || 'Unknown error'}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   💥 Error: ${error.message}\n`);
    }
  }
  
  // Now test query processing
  console.log('\n2️⃣ Testing Query Processing...\n');
  
  for (const test of testQueries) {
    try {
      console.log(`🎯 Testing: ${test.name}`);
      console.log(`   Query: "${test.query}"`);
      
      const response = await fetch(`${baseURL}/api/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: test.query,
          userName: 'test_user'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Query executed successfully`);
        console.log(`   📊 Found ${data.recordCount} records`);
        console.log(`   📋 Primary table: ${data.metadata?.primaryTable || 'N/A'}`);
        console.log(`   🔗 Tables involved: ${data.metadata?.tablesInvolved?.join(', ') || 'N/A'}`);
        console.log(`   🔍 SQL: ${data.sqlQuery}`);
        
        if (data.metadata?.filtersApplied) {
          const filters = data.metadata.filtersApplied;
          if (filters.numeric) console.log(`   🔢 Numeric filter: ${filters.numeric}`);
          if (filters.text?.length > 0) console.log(`   📝 Text filters: ${filters.text.join(', ')}`);
          if (filters.user) console.log(`   👤 User filter: ${filters.user}`);
        }
      } else {
        console.log(`   ❌ Failed: ${data.response || 'Unknown error'}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   💥 Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Intelligent Query Testing Complete!');
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    console.log('✅ Backend server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running. Please start it first.\n');
    console.log('Run: node working-backend.cjs\n');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await testIntelligentQueries();
  }
}

main().catch(console.error);
