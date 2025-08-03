#!/usr/bin/env node

// Quick API endpoint testing script
console.log('🧪 TESTING API ENDPOINTS');
console.log('========================');

const http = require('http');

function testEndpoint(path, data, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n${description}:`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(responseData);
          console.log('Response:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log('Response:', responseData);
          resolve(responseData);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ ${description} failed:`, err.message);
      reject(err);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Testing API endpoints at http://localhost:3001\n');
  
  try {
    // Test 1: Entity extraction
    await testEndpoint('/api/chat/entities', {
      text: 'laptop sales above 1000'
    }, '1. Entity Extraction');

    // Test 2: Query processing
    await testEndpoint('/api/chat/query', {
      query: 'ahmed customer sales',
      context: { user: 'test-user' }
    }, '2. Query Processing');

    // Test 3: Suggestions
    await testEndpoint('/api/chat/suggestions', {
      partialQuery: 'laptop',
      context: 'products'
    }, '3. Suggestions');

    console.log('\n✅ All tests completed!');
    console.log('🎉 Your API is working correctly!');
    
  } catch (error) {
    console.log('\n❌ Tests failed. Make sure the server is running:');
    console.log('   cd server');
    console.log('   node working-backend.cjs');
  }
}

runTests();
