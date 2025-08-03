// Comprehensive test for all advanced features
const fetch = require('node-fetch');

const baseURL = 'http://localhost:3001';

async function testCompleteAdvancedSystem() {
  console.log('🚀 TESTING COMPLETE ADVANCED QUERY SYSTEM');
  console.log('==========================================\n');
  
  // Test 1: Advanced Entity Extraction
  console.log('1️⃣ Testing Advanced Entity Extraction...\n');
  
  const entityTests = [
    'laptop sales above 1000',
    'my tasks',
    'stock below 100 in main warehouse',
    'ahmed sales this month',
    'completed tasks today'
  ];
  
  for (const query of entityTests) {
    try {
      console.log(`🔍 Testing: "${query}"`);
      
      const response = await fetch(`${baseURL}/api/chat/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          userName: 'ahmed_hassan'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Found ${data.entities.length} entities`);
        data.entities.forEach(entity => {
          console.log(`      - "${entity.text}" → ${entity.table}.${entity.field} (${entity.type}, confidence: ${entity.confidence})`);
        });
        
        if (data.filters && Object.keys(data.filters).some(key => data.filters[key].length > 0)) {
          console.log('   🔍 Filters:');
          Object.entries(data.filters).forEach(([type, values]) => {
            if (values.length > 0) {
              console.log(`      - ${type}: ${JSON.stringify(values)}`);
            }
          });
        }
      } else {
        console.log(`   ❌ Failed: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    console.log('');
  }
  
  // Test 2: Intelligent Suggestions
  console.log('2️⃣ Testing Intelligent Suggestions...\n');
  
  const suggestionTests = [
    { query: 'lap', description: 'Auto-complete for laptop' },
    { query: 'my', description: 'Pronoun resolution suggestions' },
    { query: 'sales', description: 'Sales-based suggestions' },
    { query: 'stock', description: 'Inventory suggestions' },
    { query: '', description: 'Default suggestions' }
  ];
  
  for (const test of suggestionTests) {
    try {
      console.log(`🔮 Testing: "${test.query}" (${test.description})`);
      
      const response = await fetch(`${baseURL}/api/chat/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          partialQuery: test.query,
          userName: 'ahmed_hassan'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Generated ${data.suggestions.length} suggestions:`);
        data.suggestions.slice(0, 3).forEach((suggestion, i) => {
          console.log(`      ${i + 1}. "${suggestion.text}" (${suggestion.category}, confidence: ${suggestion.confidence})`);
        });
      } else {
        console.log(`   ❌ Failed: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    console.log('');
  }
  
  // Test 3: Complex Query Processing
  console.log('3️⃣ Testing Complex Query Processing...\n');
  
  const complexQueries = [
    'laptop sales above 1000',
    'stock below 50 in north warehouse',
    'my tasks',
    'ahmed sales this month',
    'completed tasks today'
  ];
  
  for (const query of complexQueries) {
    try {
      console.log(`🎯 Testing: "${query}"`);
      
      const response = await fetch(`${baseURL}/api/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          userName: 'ahmed_hassan'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Query executed successfully`);
        console.log(`   📊 Found ${data.recordCount} records`);
        console.log(`   📋 Primary table: ${data.metadata?.primaryTable || 'N/A'}`);
        console.log(`   🔗 Tables involved: ${data.metadata?.tablesInvolved?.join(', ') || 'N/A'}`);
        
        if (data.metadata?.filtersApplied) {
          const filters = data.metadata.filtersApplied;
          if (filters.numeric) console.log(`   🔢 Numeric filter: ${filters.numeric}`);
          if (filters.text?.length > 0) console.log(`   📝 Text filters: ${filters.text.join(', ')}`);
          if (filters.user) console.log(`   👤 User filter: ${filters.user}`);
        }
        
        console.log(`   🔍 SQL: ${data.sqlQuery.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ Failed: ${data.response}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎉 COMPLETE ADVANCED SYSTEM TESTING FINISHED!');
}

// Check server status first
async function checkServer() {
  try {
    const response = await fetch(`${baseURL}/health`);
    if (response.ok) {
      console.log('✅ Server is running with advanced features\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Server not running. Please start with: node working-backend.cjs\n');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testCompleteAdvancedSystem();
  }
}

main().catch(console.error);
