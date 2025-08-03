#!/usr/bin/env node

const http = require('http');

// Simple test function
const testEndpoint = (path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function quickTest() {
  console.log('🧪 Quick Backend Test');
  console.log('==========================================');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
    
    // Test 2: Entity extraction
    console.log('\n2. Testing entity extraction...');
    const extract = await testEndpoint('/api/chat/extract', { message: 'ahmed' });
    console.log(`   Status: ${extract.status}`);
    console.log(`   Entities: ${extract.data.entities ? extract.data.entities.length : 0}`);
    if (extract.data.entities) {
      extract.data.entities.forEach(e => {
        console.log(`   - ${e.text} (${e.type}:${e.table})`);
      });
    }
    
    // Test 3: Query processing
    console.log('\n3. Testing query processing...');
    const query = await testEndpoint('/api/chat/query', { message: 'customers', userName: 'test' });
    console.log(`   Status: ${query.status}`);
    console.log(`   Success: ${query.data.success}`);
    console.log(`   Records: ${query.data.recordCount || 0}`);
    console.log(`   SQL: ${query.data.sqlQuery || 'N/A'}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('Make sure the backend is running: node working-backend.cjs');
  }
}

quickTest();
