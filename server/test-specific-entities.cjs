#!/usr/bin/env node

/**
 * Quick test for specific entity extraction issues
 */

const http = require('http');

const makeRequest = (path, postData = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: postData ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const testSpecificQueries = async () => {
  console.log('🧪 TESTING SPECIFIC ENTITY EXTRACTION ISSUES\n');
  
  const testCases = [
    {
      name: "Customer Entity Test", 
      query: "customer",
      expected: "Should extract 'customer' as entity with customers table"
    },
    {
      name: "Ahmed Entity Test",
      query: "ahmed", 
      expected: "Should extract 'ahmed' as entity with customers table and suggestions"
    },
    {
      name: "My Tasks Pronoun Test",
      query: "my tasks",
      expected: "Should extract 'my' as pronoun and 'tasks' as entity"
    },
    {
      name: "Today Temporal Test", 
      query: "today",
      expected: "Should extract 'today' as temporal entity"
    },
    {
      name: "Stock Below Numeric Test",
      query: "stock below 10", 
      expected: "Should extract 'stock' as entity and 'below 10' as numeric_filter"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      // Test entity extraction
      const extractResult = await makeRequest('/api/chat/extract', JSON.stringify({
        message: testCase.query
      }));
      
      console.log('📊 Result:');
      if (extractResult.entities && extractResult.entities.length > 0) {
        extractResult.entities.forEach((entity, i) => {
          console.log(`  ${i+1}. "${entity.text}" → type: ${entity.type}, table: ${entity.table}`);
          if (entity.suggestions) console.log(`     Suggestions: ${entity.suggestions.length} items`);
        });
      } else {
        console.log('  ❌ No entities found!');
      }
      
      // Test query processing  
      const queryResult = await makeRequest('/api/chat/query', JSON.stringify({
        message: testCase.query
      }));
      
      if (queryResult.sqlQuery) {
        console.log(`📋 SQL: ${queryResult.sqlQuery}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(60));
  }
};

testSpecificQueries().catch(console.error);
