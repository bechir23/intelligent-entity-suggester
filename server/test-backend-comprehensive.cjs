#!/usr/bin/env node

/**
 * COMPREHENSIVE BACKEND TESTING SUITE
 * Tests the real Supabase backend with thorough validation
 */

const http = require('http');

// Test cases covering all the scenarios we need to validate
const COMPREHENSIVE_TEST_CASES = [
  {
    name: "1. Entity Extraction - Customer (Ahmed)",
    endpoint: '/api/chat/extract',
    payload: { message: "ahmed" },
    expectations: {
      entityTypes: ['entity'],
      tables: ['customers'],
      hasEntities: true,
      minEntities: 1
    }
  },
  {
    name: "2. Entity Extraction - Stock with Numeric Filter",
    endpoint: '/api/chat/extract', 
    payload: { message: "stock below 10" },
    expectations: {
      entityTypes: ['info', 'numeric_filter'],
      tables: ['stock'],
      hasNumericFilter: true,
      numericField: 'quantity_on_hand'
    }
  },
  {
    name: "3. Entity Extraction - Sales with Amount Filter",
    endpoint: '/api/chat/extract',
    payload: { message: "laptop sales above 1000" },
    expectations: {
      entityTypes: ['entity', 'numeric_filter'],
      tables: ['products', 'sales'],
      hasNumericFilter: true,
      numericField: 'total_amount'
    }
  },
  {
    name: "4. Entity Extraction - My Tasks (Pronoun)",
    endpoint: '/api/chat/extract',
    payload: { message: "my tasks" },
    expectations: {
      entityTypes: ['pronoun', 'entity'],
      tables: ['users', 'tasks'],
      hasPronoun: true
    }
  },
  {
    name: "5. Entity Extraction - Products",
    endpoint: '/api/chat/extract',
    payload: { message: "laptop" },
    expectations: {
      entityTypes: ['entity'],
      tables: ['products'],
      hasEntities: true
    }
  },
  {
    name: "6. Query Processing - Customer Search",
    endpoint: '/api/chat/query',
    payload: { message: "ahmed", userName: "test_user" },
    expectations: {
      hasData: true,
      usesSupabase: true,
      hasResponseEntities: true,
      hasSqlQuery: true
    }
  },
  {
    name: "7. Query Processing - Stock Below Threshold",
    endpoint: '/api/chat/query',
    payload: { message: "stock below 10", userName: "test_user" },
    expectations: {
      hasData: true,
      usesSupabase: true,
      hasNumericFilter: true,
      correctField: 'quantity_on_hand'
    }
  },
  {
    name: "8. Query Processing - Sales Data",
    endpoint: '/api/chat/query',
    payload: { message: "sales", userName: "test_user" },
    expectations: {
      hasData: true,
      usesSupabase: true,
      hasJoins: true
    }
  },
  {
    name: "9. Query Processing - Products Search",
    endpoint: '/api/chat/query',
    payload: { message: "laptop", userName: "test_user" },
    expectations: {
      hasData: true,
      usesSupabase: true,
      hasResponseEntities: true
    }
  },
  {
    name: "10. Health Check",
    endpoint: '/health',
    payload: null,
    expectations: {
      hasStatus: true,
      statusOk: true,
      hasSupabaseInfo: true
    }
  }
];

// Function to make HTTP requests
const makeRequest = (path, postData = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: postData ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

// Validation functions
const validateEntityExtraction = (result, expectations) => {
  const { data } = result;
  const issues = [];

  if (!data.entities || !Array.isArray(data.entities)) {
    issues.push('❌ No entities array found in response');
    return issues;
  }

  if (expectations.hasEntities && data.entities.length === 0) {
    issues.push('❌ Expected entities but got none');
  }

  if (expectations.minEntities && data.entities.length < expectations.minEntities) {
    issues.push(`❌ Expected at least ${expectations.minEntities} entities, got ${data.entities.length}`);
  }

  if (expectations.entityTypes) {
    const foundTypes = data.entities.map(e => e.type);
    const expectedTypes = expectations.entityTypes;
    const missingTypes = expectedTypes.filter(type => !foundTypes.includes(type));
    if (missingTypes.length > 0) {
      issues.push(`❌ Missing entity types: ${missingTypes.join(', ')}`);
    }
  }

  if (expectations.tables) {
    const foundTables = data.entities.map(e => e.table);
    const expectedTables = expectations.tables;
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));
    if (missingTables.length > 0) {
      issues.push(`❌ Missing tables: ${missingTables.join(', ')}`);
    }
  }

  if (expectations.hasNumericFilter) {
    const numericFilters = data.entities.filter(e => e.type === 'numeric_filter');
    if (numericFilters.length === 0) {
      issues.push('❌ Expected numeric filter but found none');
    } else if (expectations.numericField) {
      const hasCorrectField = numericFilters.some(f => f.field === expectations.numericField);
      if (!hasCorrectField) {
        issues.push(`❌ Expected numeric filter field '${expectations.numericField}' but found: ${numericFilters.map(f => f.field).join(', ')}`);
      }
    }
  }

  if (expectations.hasPronoun) {
    const pronouns = data.entities.filter(e => e.type === 'pronoun');
    if (pronouns.length === 0) {
      issues.push('❌ Expected pronoun but found none');
    }
  }

  return issues;
};

const validateQueryProcessing = (result, expectations) => {
  const { data } = result;
  const issues = [];

  if (expectations.hasData && (!data.data || data.data.length === 0)) {
    issues.push('❌ Expected data but got none');
  }

  if (expectations.usesSupabase && !data.success) {
    issues.push('❌ Expected successful Supabase query');
  }

  if (expectations.hasResponseEntities && (!data.responseEntities || data.responseEntities.length === 0)) {
    issues.push('❌ Expected response entities but got none');
  }

  if (expectations.hasSqlQuery && !data.sqlQuery) {
    issues.push('❌ Expected SQL query but got none');
  }

  if (expectations.hasNumericFilter && data.responseEntities) {
    const hasNumericFilter = data.responseEntities.some(e => e.type === 'numeric_filter');
    if (!hasNumericFilter) {
      issues.push('❌ Expected numeric filter in response entities');
    }
  }

  if (expectations.correctField && data.responseEntities) {
    const numericFilters = data.responseEntities.filter(e => e.type === 'numeric_filter');
    if (numericFilters.length > 0) {
      const hasCorrectField = numericFilters.some(f => f.field === expectations.correctField);
      if (!hasCorrectField) {
        issues.push(`❌ Expected field '${expectations.correctField}' in numeric filter`);
      }
    }
  }

  return issues;
};

const validateHealthCheck = (result, expectations) => {
  const { data } = result;
  const issues = [];

  if (expectations.hasStatus && !data.status) {
    issues.push('❌ No status field in health check');
  }

  if (expectations.statusOk && data.status !== 'ok') {
    issues.push(`❌ Expected status 'ok' but got '${data.status}'`);
  }

  if (expectations.hasSupabaseInfo && !data.database) {
    issues.push('❌ No database info in health check');
  }

  return issues;
};

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE BACKEND TESTING SUITE');
  console.log('======================================================================');
  
  // Check if backend is running
  try {
    const healthCheck = await makeRequest('/health');
    if (healthCheck.status !== 200) {
      console.log('❌ Backend is not running or health check failed');
      console.log('Please start the backend with: node working-backend.cjs');
      return;
    }
    console.log('✅ Backend is running and responding');
  } catch (error) {
    console.log('❌ Cannot connect to backend on localhost:3001');
    console.log('Please start the backend with: node working-backend.cjs');
    return;
  }

  console.log('');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of COMPREHENSIVE_TEST_CASES) {
    totalTests++;
    console.log(`🧪 ${testCase.name}`);
    console.log('--------------------------------------------------');

    try {
      const result = await makeRequest(testCase.endpoint, testCase.payload);
      
      if (result.status !== 200) {
        console.log(`❌ HTTP Error: ${result.status}`);
        failedTests++;
        continue;
      }

      console.log(`📊 Response Status: ${result.status}`);
      
      let issues = [];
      
      // Route-specific validation
      if (testCase.endpoint === '/api/chat/extract') {
        issues = validateEntityExtraction(result, testCase.expectations);
        
        if (result.data.entities) {
          console.log(`🔍 Entities found: ${result.data.entities.length}`);
          result.data.entities.forEach((entity, i) => {
            console.log(`   ${i+1}. Type: ${entity.type}, Text: "${entity.text}", Table: ${entity.table}${entity.field ? `, Field: ${entity.field}` : ''}`);
          });
        }
        
      } else if (testCase.endpoint === '/api/chat/query') {
        issues = validateQueryProcessing(result, testCase.expectations);
        
        console.log(`📋 Records returned: ${result.data.recordCount || 0}`);
        console.log(`🔍 Response entities: ${result.data.entityCount || 0}`);
        if (result.data.sqlQuery) {
          console.log(`📊 SQL: ${result.data.sqlQuery.substring(0, 100)}${result.data.sqlQuery.length > 100 ? '...' : ''}`);
        }
        
      } else if (testCase.endpoint === '/health') {
        issues = validateHealthCheck(result, testCase.expectations);
        
        console.log(`💚 Status: ${result.data.status}`);
        console.log(`🗄️  Database: ${result.data.database || 'Not specified'}`);
      }

      // Report results
      if (issues.length === 0) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        issues.forEach(issue => console.log(`   ${issue}`));
        failedTests++;
      }

    } catch (error) {
      console.log(`❌ Test Error: ${error.message}`);
      failedTests++;
    }

    console.log('');
  }

  // Final summary
  console.log('======================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('======================================================================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! The backend is working correctly.');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);
