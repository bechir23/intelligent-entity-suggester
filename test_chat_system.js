// Test Chat System with Entity Recognition
// Run this with: node test_chat_system.js

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Test cases for entity recognition
const testCases = [
  {
    query: "show me sales of laptop",
    expectedEntities: ['sales', 'laptop'],
    description: "Should find sales table and laptop product"
  },
  {
    query: "Ahmed attendance today",
    expectedEntities: ['Ahmed', 'attendance', 'today'],
    description: "Should find Ahmed user, attendance table, and today temporal"
  },
  {
    query: "customers from London",
    expectedEntities: ['customers', 'London'],
    description: "Should find customers table and London location"
  },
  {
    query: "show me headphones stock",
    expectedEntities: ['headphones', 'stock'],
    description: "Should find headphones product and stock table"
  },
  {
    query: "my tasks this week",
    expectedEntities: ['my', 'tasks', 'this week'],
    description: "Should resolve 'my' pronoun, find tasks table, and parse temporal"
  },
  {
    query: "Sarah sales last month",
    expectedEntities: ['Sarah', 'sales', 'last month'],
    description: "Should find Sarah user, sales table, and temporal expression"
  },
  {
    query: "Ahmed Special Coffee inventory",
    expectedEntities: ['Ahmed Special Coffee', 'inventory'],
    description: "Should find specific product name and stock/inventory concept"
  },
  {
    query: "Acme Corporation orders",
    expectedEntities: ['Acme Corporation', 'orders'],
    description: "Should find customer and sales/orders concept"
  }
];

async function testEntityExtraction(query) {
  try {
    const response = await fetch(`${API_BASE}/chat/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: query,
        userId: 'demo-user-123',
        userName: 'Ahmed Ali'
      })
    });
    
    const data = await response.json();
    return data.entities || [];
  } catch (error) {
    console.error('Entity extraction failed:', error);
    return [];
  }
}

async function testChatQuery(query, entities) {
  try {
    const response = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: query,
        entities,
        userId: 'demo-user-123',
        userName: 'Ahmed Ali'
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Chat query failed:', error);
    return { response: 'Error', data: [] };
  }
}

async function runTests() {
  console.log('🚀 Starting Chat System Tests...\n');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log('─'.repeat(60));
    
    // Step 1: Test entity extraction
    console.log('🔍 Extracting entities...');
    const entities = await testEntityExtraction(testCase.query);
    
    console.log('Found entities:');
    entities.forEach(entity => {
      console.log(`  • ${entity.text} (${entity.type}) -> ${entity.actualValue || 'N/A'} [${entity.confidence || 0}%]`);
    });
    
    // Step 2: Test query processing
    console.log('\n💬 Processing chat query...');
    const result = await testChatQuery(testCase.query, entities);
    
    console.log(`Response: ${result.response}`);
    console.log(`Data results: ${result.data ? result.data.length : 0} items`);
    
    if (result.data && result.data.length > 0) {
      console.log('Sample data:');
      result.data.slice(0, 2).forEach((item, idx) => {
        const displayKeys = Object.keys(item).filter(k => !k.includes('id') && !k.includes('_at')).slice(0, 3);
        const preview = displayKeys.map(k => `${k}: ${item[k]}`).join(', ');
        console.log(`  ${idx + 1}. ${preview}`);
      });
    }
    
    // Scoring
    const foundEntities = entities.map(e => e.text.toLowerCase());
    const expectedFound = testCase.expectedEntities.filter(expected => 
      foundEntities.some(found => found.includes(expected.toLowerCase()) || expected.toLowerCase().includes(found))
    );
    
    const score = Math.round((expectedFound.length / testCase.expectedEntities.length) * 100);
    console.log(`\n✅ Entity Recognition Score: ${score}% (${expectedFound.length}/${testCase.expectedEntities.length})`);
    console.log(`✅ Data Retrieved: ${result.data ? result.data.length : 0} items`);
  }
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
