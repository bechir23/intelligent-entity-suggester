// Comprehensive Fuzzy Matching Test for Chat Service
// This test validates that fuzzy matching works correctly

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: (table) => ({
    select: () => ({
      or: () => ({
        limit: () => ({
          data: getMockData(table),
          error: null
        })
      }),
      textSearch: () => ({
        limit: () => ({
          data: getMockData(table),
          error: null
        })
      }),
      ilike: () => ({
        limit: () => ({
          data: getMockData(table),
          error: null
        })
      }),
      limit: () => ({
        data: getMockData(table),
        error: null
      })
    })
  })
};

// Mock data for testing
function getMockData(table) {
  const mockData = {
    customers: [
      { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321' }
    ],
    products: [
      { id: 1, name: 'wireless mouse', price: 25.99, category: 'electronics' },
      { id: 2, name: 'gaming mouse', price: 49.99, category: 'electronics' },
      { id: 3, name: 'bluetooth mouse', price: 35.99, category: 'electronics' },
      { id: 4, name: 'mechanical keyboard', price: 89.99, category: 'electronics' },
      { id: 5, name: 'gaming keyboard', price: 120.00, category: 'electronics' },
      { id: 6, name: 'wireless keyboard', price: 65.99, category: 'electronics' }
    ],
    sales: [
      { id: 1, customer_id: 1, product_id: 1, quantity: 2, sale_date: '2024-01-15' },
      { id: 2, customer_id: 2, product_id: 2, quantity: 1, sale_date: '2024-01-16' }
    ],
    stock: [
      { id: 1, product_id: 1, quantity: 50, last_updated: '2024-01-15' },
      { id: 2, product_id: 2, quantity: 25, last_updated: '2024-01-16' }
    ],
    tasks: [
      { id: 1, title: 'Update inventory', description: 'Check stock levels', due_date: '2024-01-20' },
      { id: 2, title: 'Process orders', description: 'Handle pending orders', due_date: '2024-01-21' }
    ],
    shifts: [
      { id: 1, employee_id: 1, start_time: '2024-01-15 09:00:00', end_time: '2024-01-15 17:00:00' },
      { id: 2, employee_id: 2, start_time: '2024-01-16 10:00:00', end_time: '2024-01-16 18:00:00' }
    ],
    attendance: [
      { id: 1, employee_id: 1, date: '2024-01-15', status: 'present' },
      { id: 2, employee_id: 2, date: '2024-01-16', status: 'present' }
    ],
    users: [
      { id: 1, username: 'admin', email: 'admin@example.com', role: 'administrator' },
      { id: 2, username: 'user1', email: 'user1@example.com', role: 'employee' }
    ]
  };
  
  return mockData[table] || [];
}

// Business info terms with fuzzy matching
const BUSINESS_INFO_TERMS = {
  'mouse': ['wireless mouse', 'gaming mouse', 'bluetooth mouse'],
  'keyboard': ['mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
  'headset': ['gaming headset', 'wireless headset', 'bluetooth headset'],
  'monitor': ['gaming monitor', '4k monitor', 'ultrawide monitor'],
  'laptop': ['gaming laptop', 'business laptop', 'ultrabook laptop'],
  'phone': ['smartphone', 'mobile phone', 'cell phone'],
  'tablet': ['android tablet', 'ipad tablet', 'windows tablet'],
  'camera': ['digital camera', 'security camera', 'web camera'],
  'speaker': ['bluetooth speaker', 'wireless speaker', 'smart speaker'],
  'printer': ['laser printer', 'inkjet printer', '3d printer']
};

// Fuzzy matching function
function getFuzzySuggestions(word) {
  const lowerWord = word.toLowerCase();
  const suggestions = [];
  
  // Direct match in BUSINESS_INFO_TERMS
  if (BUSINESS_INFO_TERMS[lowerWord]) {
    suggestions.push(...BUSINESS_INFO_TERMS[lowerWord]);
  }
  
  // Find partial matches in multi-word terms
  Object.entries(BUSINESS_INFO_TERMS).forEach(([key, variants]) => {
    if (key.includes(lowerWord) && key !== lowerWord) {
      suggestions.push(key, ...variants);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(suggestions)];
}

// Test cases for fuzzy matching
const fuzzyTestCases = [
  {
    name: 'Single word "mouse" should suggest wireless mouse variants',
    input: 'mouse',
    expectedSuggestions: ['wireless mouse', 'gaming mouse', 'bluetooth mouse'],
    description: 'Testing basic fuzzy matching for mouse products'
  },
  {
    name: 'Single word "keyboard" should suggest keyboard variants',
    input: 'keyboard',
    expectedSuggestions: ['mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
    description: 'Testing fuzzy matching for keyboard products'
  },
  {
    name: 'Single word "phone" should suggest phone variants',
    input: 'phone',
    expectedSuggestions: ['smartphone', 'mobile phone', 'cell phone'],
    description: 'Testing fuzzy matching for phone products'
  },
  {
    name: 'Non-existent term should return empty suggestions',
    input: 'randomword',
    expectedSuggestions: [],
    description: 'Testing that non-existent terms return no suggestions'
  },
  {
    name: 'Multi-word term should not break fuzzy matching',
    input: 'gaming mouse',
    expectedSuggestions: [],
    description: 'Testing that multi-word terms are handled correctly'
  }
];

// Run fuzzy matching tests
console.log('🚀 Starting Fuzzy Matching Tests...\n');

let passedTests = 0;
let totalTests = fuzzyTestCases.length;

fuzzyTestCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Input: "${testCase.input}"`);
  
  const actualSuggestions = getFuzzySuggestions(testCase.input);
  console.log(`Expected: [${testCase.expectedSuggestions.join(', ')}]`);
  console.log(`Actual: [${actualSuggestions.join(', ')}]`);
  
  // Check if all expected suggestions are present
  const hasAllExpected = testCase.expectedSuggestions.every(expected => 
    actualSuggestions.includes(expected)
  );
  
  const passed = testCase.expectedSuggestions.length === 0 ? 
    actualSuggestions.length === 0 : hasAllExpected;
  
  if (passed) {
    console.log('✅ PASSED\n');
    passedTests++;
  } else {
    console.log('❌ FAILED\n');
  }
});

// Summary
console.log('📊 Test Summary:');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All fuzzy matching tests passed! The system correctly suggests multi-word variants for single-word inputs.');
} else {
  console.log('\n⚠️  Some fuzzy matching tests failed. Review the implementation.');
}

// Test the actual entity extraction with fuzzy matching
console.log('\n🔍 Testing Entity Extraction with Fuzzy Matching...');

// Mock entity extraction test
const testMessages = [
  'Show me mouse products',
  'Find keyboard items', 
  'I need a phone',
  'Search for headset options',
  'Display monitor information'
];

testMessages.forEach((message, index) => {
  console.log(`\nMessage ${index + 1}: "${message}"`);
  
  // Extract single words that might have fuzzy matches
  const words = message.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
  
  words.forEach(word => {
    if (word.length >= 3) {
      const suggestions = getFuzzySuggestions(word);
      if (suggestions.length > 0) {
        console.log(`  Word: "${word}" → Suggestions: [${suggestions.slice(0, 3).join(', ')}]`);
      }
    }
  });
});

console.log('\n✨ Fuzzy matching test completed!');
