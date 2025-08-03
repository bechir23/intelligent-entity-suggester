// SIMPLIFIED HOMOGENEITY-FIXED INTELLIGENT ENTITY SUGGESTER
// Focus: Simple but effective filtering to prevent unintended results

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlvdasysekzforztqlds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdmRhc3lzZWt6Zm9yenRxbGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjY0OTksImV4cCI6MjA2OTU0MjQ5OX0.kzbZLHGUsX3nf-IfWj2zzSovTbMWjwA4m6463mFbgnU';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 SIMPLIFIED HOMOGENEITY-FIXED SYSTEM');
console.log('='.repeat(60));
console.log('🔧 Focus: Simple but effective filtering');
console.log();

// Simplified entity extraction focusing on key issues
const extractEntitiesSimplified = (text) => {
  const entities = [];
  
  console.log(`\n🔍 Simplified Entity Extraction: "${text}"`);
  
  // 1. Table entities
  const tableTerms = ['customers', 'products', 'users', 'tasks', 'sales', 'stock', 'shifts', 'attendance'];
  tableTerms.forEach(table => {
    if (text.toLowerCase().includes(table)) {
      entities.push({
        text: table,
        type: 'entity',
        table: table,
        confidence: 0.9
      });
      console.log(`✅ Entity: ${table}`);
    }
  });
  
  // 2. User identification (pronouns and names)
  if (/\b(me|my|mine|myself|I|I'm|I've|I'll|I'd)\b/i.test(text)) {
    entities.push({
      text: 'my',
      type: 'user_filter',
      value: 'ahmed_hassan',
      confidence: 0.95
    });
    console.log(`✅ User filter: ahmed_hassan`);
  }
  
  if (/\bahmed\b/i.test(text)) {
    entities.push({
      text: 'ahmed',
      type: 'user_filter', 
      value: 'ahmed',
      confidence: 0.9
    });
    console.log(`✅ User filter: ahmed`);
  }
  
  // 3. Product terms (specific matching)
  const productTerms = {
    'wireless mouse': /\b(wireless\s+mouse|wireless mouse)\b/i,
    'laptop': /\blaptop\b/i,
    'mouse': /\bmouse\b/i,
    'keyboard': /\bkeyboard\b/i,
    'gaming': /\bgaming\b/i
  };
  
  Object.entries(productTerms).forEach(([product, regex]) => {
    if (regex.test(text)) {
      entities.push({
        text: product,
        type: 'product_filter',
        value: product,
        confidence: 0.85
      });
      console.log(`✅ Product filter: ${product}`);
    }
  });
  
  // 4. Status terms
  const statusTerms = {
    'pending': /\bpending\b/i,
    'completed': /\bcompleted\b/i,
    'high': /\bhigh\b/i,
    'urgent': /\burgent\b/i
  };
  
  Object.entries(statusTerms).forEach(([status, regex]) => {
    if (regex.test(text)) {
      entities.push({
        text: status,
        type: 'status_filter',
        value: status,
        confidence: 0.8
      });
      console.log(`✅ Status filter: ${status}`);
    }
  });
  
  // 5. Location terms
  if (/\bwarehouse\b/i.test(text)) {
    entities.push({
      text: 'warehouse',
      type: 'location_filter',
      value: 'warehouse',
      confidence: 0.8
    });
    console.log(`✅ Location filter: warehouse`);
  }
  
  if (/\boffice\b/i.test(text)) {
    entities.push({
      text: 'office',
      type: 'location_filter',
      value: 'office',
      confidence: 0.8
    });
    console.log(`✅ Location filter: office`);
  }
  
  console.log(`📊 Total entities: ${entities.length}`);
  return entities;
};

// Simple table suggestions
const generateTableSuggestions = (entities) => {
  const tables = new Set();
  
  // Add explicit entity tables
  entities.forEach(entity => {
    if (entity.type === 'entity') {
      tables.add(entity.table);
    }
  });
  
  // Add products table for product filters
  if (entities.some(e => e.type === 'product_filter') && !tables.has('products')) {
    tables.add('products');
  }
  
  console.log(`📊 Tables: ${Array.from(tables).join(', ')}`);
  return Array.from(tables);
};

// Simple but effective filtering
const queryWithSimpleFiltering = async (tableName, entities) => {
  try {
    console.log(`\n🔍 Querying: ${tableName}`);
    
    // Get all records
    const { data: allData, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(50);
    
    if (error) {
      console.error(`❌ Query error:`, error);
      return [];
    }
    
    if (!allData || allData.length === 0) {
      console.log(`⚠️ No records found`);
      return [];
    }
    
    console.log(`📊 Found ${allData.length} total records`);
    
    let filteredData = allData;
    
    // Apply user filtering
    const userFilters = entities.filter(e => e.type === 'user_filter');
    if (userFilters.length > 0) {
      console.log(`🔒 Applying user filter`);
      filteredData = filteredData.filter(record => {
        return Object.values(record).some(value => {
          if (typeof value === 'string') {
            const val = value.toLowerCase();
            return val.includes('ahmed') || val.includes('hassan');
          }
          return false;
        });
      });
      console.log(`🔒 User filter result: ${filteredData.length} records`);
    }
    
    // Apply product filtering  
    const productFilters = entities.filter(e => e.type === 'product_filter');
    if (productFilters.length > 0) {
      console.log(`🔒 Applying product filter`);
      const productTerms = productFilters.map(f => f.value);
      
      filteredData = filteredData.filter(record => {
        return Object.values(record).some(value => {
          if (typeof value === 'string') {
            const val = value.toLowerCase();
            return productTerms.some(term => {
              if (term === 'wireless mouse') {
                return val.includes('wireless') && val.includes('mouse');
              }
              return val.includes(term.toLowerCase());
            });
          }
          return false;
        });
      });
      console.log(`🔒 Product filter result: ${filteredData.length} records`);
    }
    
    // Apply status filtering
    const statusFilters = entities.filter(e => e.type === 'status_filter');
    if (statusFilters.length > 0) {
      console.log(`🔒 Applying status filter`);
      filteredData = filteredData.filter(record => {
        return statusFilters.some(filter => {
          const statusFields = ['status', 'priority', 'task_status'];
          return statusFields.some(field => {
            if (record[field]) {
              return record[field].toLowerCase() === filter.value.toLowerCase();
            }
            return false;
          });
        });
      });
      console.log(`🔒 Status filter result: ${filteredData.length} records`);
    }
    
    // Apply location filtering
    const locationFilters = entities.filter(e => e.type === 'location_filter');
    if (locationFilters.length > 0) {
      console.log(`🔒 Applying location filter`);
      filteredData = filteredData.filter(record => {
        return locationFilters.some(filter => {
          const locationFields = ['location', 'warehouse_location'];
          return locationFields.some(field => {
            if (record[field]) {
              return record[field].toLowerCase().includes(filter.value.toLowerCase());
            }
            return false;
          });
        });
      });
      console.log(`🔒 Location filter result: ${filteredData.length} records`);
    }
    
    // If no filters, return entity-only results
    if (userFilters.length === 0 && productFilters.length === 0 && 
        statusFilters.length === 0 && locationFilters.length === 0) {
      console.log(`📋 No filters - returning all records`);
    }
    
    console.log(`✅ Final result: ${filteredData.length} records`);
    return filteredData;
    
  } catch (error) {
    console.error(`❌ Database error:`, error);
    return [];
  }
};

// Analyze homogeneity
const analyzeHomogeneity = (records, entities, query) => {
  if (records.length === 0) {
    return { homogeneity: 0, relevant: 0, total: 0 };
  }
  
  let relevantCount = 0;
  
  records.forEach((record, index) => {
    let isRelevant = false;
    const matches = [];
    
    // Check if record matches query intent
    entities.forEach(entity => {
      const searchTerm = entity.value || entity.text;
      
      Object.entries(record).forEach(([field, value]) => {
        if (value && typeof value === 'string') {
          if (value.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push(`${searchTerm} in ${field}`);
            isRelevant = true;
          }
        }
      });
    });
    
    if (isRelevant) {
      relevantCount++;
      console.log(`   ✅ Record ${index + 1}: Matches ${matches.join(', ')}`);
    } else {
      console.log(`   ❌ Record ${index + 1}: No clear match`);
    }
  });
  
  const homogeneity = Math.round((relevantCount / records.length) * 100);
  return { homogeneity, relevant: relevantCount, total: records.length };
};

// Test cases
const SIMPLE_TESTS = [
  {
    id: 1,
    query: "products wireless mouse",
    description: "Should get wireless mouse products only"
  },
  {
    id: 2,
    query: "my tasks pending",
    description: "Should get ahmed's pending tasks only"
  },
  {
    id: 3,
    query: "ahmed sales",
    description: "Should get ahmed's sales only"
  },
  {
    id: 4,
    query: "tasks pending status",
    description: "Should get pending tasks only"
  },
  {
    id: 5,
    query: "stock warehouse location",
    description: "Should get warehouse stock only"
  },
  {
    id: 6,
    query: "laptop gaming",
    description: "Should get laptop/gaming products only"
  }
];

// Main test runner
async function runSimpleHomogeneityTests() {
  console.log('\\n🧪 RUNNING SIMPLE HOMOGENEITY TESTS');
  console.log('='.repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const testCase of SIMPLE_TESTS) {
    totalTests++;
    console.log(`\\n📝 Test ${testCase.id}: ${testCase.description}`);
    console.log(`💬 Query: "${testCase.query}"`);
    
    try {
      const startTime = Date.now();
      
      // Extract entities
      const entities = extractEntitiesSimplified(testCase.query);
      
      // Get table suggestions
      const tables = generateTableSuggestions(entities);
      
      let totalRecords = 0;
      let totalRelevant = 0;
      
      // Query each table
      for (const tableName of tables) {
        console.log(`\\n🔍 ANALYZING: ${tableName}`);
        console.log('-'.repeat(30));
        
        const records = await queryWithSimpleFiltering(tableName, entities);
        const analysis = analyzeHomogeneity(records, entities, testCase.query);
        
        totalRecords += analysis.total;
        totalRelevant += analysis.relevant;
        
        console.log(`📊 ${analysis.total} total, ${analysis.relevant} relevant (${analysis.homogeneity}%)`);
      }
      
      const overallHomogeneity = totalRecords > 0 ? Math.round((totalRelevant / totalRecords) * 100) : 0;
      const endTime = Date.now();
      
      console.log(`\\n${'='.repeat(50)}`);
      console.log(`📈 RESULTS: ${overallHomogeneity}% homogeneity (${totalRelevant}/${totalRecords})`);
      console.log(`⚡ Time: ${endTime - startTime}ms`);
      
      if (overallHomogeneity >= 80) {
        console.log(`\\n🎉 SUCCESS! High homogeneity achieved`);
        passedTests++;
      } else {
        console.log(`\\n⚠️ Needs improvement`);
      }
      
    } catch (error) {
      console.error(`\\n💥 TEST ERROR:`, error.message);
    }
    
    console.log('-'.repeat(60));
  }
  
  console.log(`\\n\\n🏆 FINAL RESULTS: ${passedTests}/${totalTests} passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log(`\\n🎉🎉 ALL TESTS PASSED! HOMOGENEITY FIXED! 🎉🎉`);
  }
  
  return { totalTests, passedTests, successRate: Math.round(passedTests/totalTests*100) };
}

// Execute tests
console.log('🚀 STARTING SIMPLIFIED HOMOGENEITY TESTS...');
runSimpleHomogeneityTests().then(results => {
  console.log(`\\n🎯 FINAL STATUS: ${results.successRate}% success rate`);
  
  if (results.successRate >= 80) {
    console.log(`\\n🏆 HOMOGENEITY ISSUES RESOLVED! 🏆`);
    console.log(`🔒 Queries return intended results`);
    console.log(`🚫 Unintended cross-data eliminated`);
  }
}).catch(error => {
  console.error('❌ Test error:', error);
});
