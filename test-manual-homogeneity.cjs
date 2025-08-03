// MANUAL ONE-BY-ONE HOMOGENEITY TESTING
// Test each query individually to verify record matching quality

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlvdasysekzforztqlds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdmRhc3lzZWt6Zm9yenRxbGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjY0OTksImV4cCI6MjA2OTU0MjQ5OX0.kzbZLHGUsX3nf-IfWj2zzSovTbMWjwA4m6463mFbgnU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 MANUAL HOMOGENEITY TESTING - ONE BY ONE');
console.log('='.repeat(60));
console.log('🎯 Goal: Verify each query gets intended results only');
console.log('📊 Method: Manual inspection of query-record matching');
console.log();

// Test queries for manual verification
const TEST_QUERIES = [
  {
    id: 1,
    query: "products wireless mouse",
    intention: "Find products that contain 'wireless mouse'",
    expectedTable: "products",
    expectedField: "name or description containing wireless mouse"
  },
  {
    id: 2,
    query: "tasks pending status",
    intention: "Find tasks with pending status",
    expectedTable: "tasks", 
    expectedField: "status = 'pending'"
  },
  {
    id: 3,
    query: "my tasks pending",
    intention: "Find my (ahmed_hassan) pending tasks",
    expectedTable: "tasks",
    expectedField: "assigned to ahmed_hassan AND status = pending"
  },
  {
    id: 4,
    query: "sales keyboard notes",
    intention: "Find sales records with keyboard in notes",
    expectedTable: "sales",
    expectedField: "notes containing 'keyboard'"
  },
  {
    id: 5,
    query: "stock warehouse location",
    intention: "Find stock with warehouse location info",
    expectedTable: "stock",
    expectedField: "warehouse_location field populated"
  },
  {
    id: 6,
    query: "users ahmed employee",
    intention: "Find user ahmed or employees",
    expectedTable: "users",
    expectedField: "full_name containing ahmed or role containing employee"
  },
  {
    id: 7,
    query: "customers company contact",
    intention: "Find customers with company info",
    expectedTable: "customers",
    expectedField: "company field or contact info"
  },
  {
    id: 8,
    query: "products laptop gaming",
    intention: "Find laptop products, especially gaming ones",
    expectedTable: "products",
    expectedField: "name/description containing laptop"
  },
  {
    id: 9,
    query: "attendance present status",
    intention: "Find attendance records showing present",
    expectedTable: "attendance", 
    expectedField: "status showing present or similar"
  },
  {
    id: 10,
    query: "shifts office location",
    intention: "Find shifts at office location",
    expectedTable: "shifts",
    expectedField: "location containing office"
  },
  {
    id: 11,
    query: "sales office notes",
    intention: "Find sales with office in notes",
    expectedTable: "sales",
    expectedField: "notes containing office"
  },
  {
    id: 12,
    query: "products stock mouse warehouse",
    intention: "Find mouse products and related stock/warehouse info",
    expectedTable: "products, stock",
    expectedField: "mouse products + warehouse stock"
  },
  {
    id: 13,
    query: "customers sales transaction",
    intention: "Find customer and sales transaction data",
    expectedTable: "customers, sales",
    expectedField: "customer info + sales records"
  },
  {
    id: 14,
    query: "users shifts attendance office",
    intention: "Find user HR data with office location",
    expectedTable: "users, shifts, attendance",
    expectedField: "HR data with office location"
  },
  {
    id: 15,
    query: "I completed urgent tasks",
    intention: "Find my completed urgent tasks",
    expectedTable: "tasks",
    expectedField: "assigned to ahmed_hassan + completed + urgent"
  },
  {
    id: 16,
    query: "sales products customer laptop",
    intention: "Find sales of laptop products to customers",
    expectedTable: "sales, products, customers",
    expectedField: "laptop sales transactions"
  },
  {
    id: 17,
    query: "stock products warehouse mouse inventory",
    intention: "Find mouse inventory in warehouse",
    expectedTable: "stock, products",
    expectedField: "mouse products + warehouse stock"
  },
  {
    id: 18,
    query: "my attendance shifts office today",
    intention: "Find my attendance/shifts at office today",
    expectedTable: "attendance, shifts",
    expectedField: "ahmed_hassan + office + today"
  },
  {
    id: 19,
    query: "users tasks customers sales products",
    intention: "Comprehensive business data query",
    expectedTable: "all tables",
    expectedField: "comprehensive business records"
  },
  {
    id: 20,
    query: "products wireless mouse sales customers warehouse",
    intention: "Complete wireless mouse business chain",
    expectedTable: "products, sales, customers, stock",
    expectedField: "wireless mouse business ecosystem"
  }
];

// Enhanced entity extraction
const extractEntitiesAdvanced = (text) => {
  const entities = [];
  const processedIndices = new Set();
  
  console.log(`\n🔍 ENTITY EXTRACTION: "${text}"`);
  
  // 1. Table/Entity detection
  const tableTerms = ['customers', 'products', 'users', 'tasks', 'sales', 'stock', 'shifts', 'attendance'];
  tableTerms.forEach(table => {
    const regex = new RegExp(`\\b${table}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        entities.push({
          text: match[0],
          type: 'entity',
          table: table,
          actualValue: table,
          startIndex,
          endIndex,
          confidence: 0.9
        });
      }
    }
  });
  
  // 2. Multi-word phrases
  const businessPhrases = [
    'wireless mouse', 'gaming laptop', 'mechanical keyboard', 'bluetooth headset',
    'high priority', 'low priority', 'medium priority', 'pending status',
    'warehouse location', 'office location'
  ];
  
  businessPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        entities.push({
          text: match[0],
          type: 'info',
          actualValue: phrase.toLowerCase(),
          startIndex,
          endIndex,
          confidence: 0.8
        });
      }
    }
  });
  
  // 3. Single word terms
  const infoTerms = ['mouse', 'keyboard', 'laptop', 'headset', 'pending', 'completed', 'urgent', 'high', 'medium', 'low', 'warehouse', 'office', 'ahmed', 'gaming', 'wireless', 'bluetooth'];
  infoTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        entities.push({
          text: match[0],
          type: 'info',
          actualValue: term,
          startIndex,
          endIndex,
          confidence: 0.7
        });
      }
    }
  });
  
  // 4. Pronouns
  const pronounRegex = /\b(me|my|mine|myself|I|I'm|I've|I'll|I'd)\b/gi;
  let match;
  while ((match = pronounRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    if (!isOverlapping(startIndex, endIndex, processedIndices)) {
      markIndices(startIndex, endIndex, processedIndices);
      entities.push({
        text: match[0],
        type: 'pronoun',
        actualValue: 'ahmed_hassan',
        startIndex,
        endIndex,
        confidence: 0.9
      });
    }
  }
  
  // 5. Temporal
  const temporalPatterns = [
    { pattern: /\b(today|yesterday|tomorrow)\b/gi, type: 'relative_day' },
    { pattern: /\b(this week|last week|next week)\b/gi, type: 'relative_week' },
    { pattern: /\b(this month|last month|next month)\b/gi, type: 'relative_month' }
  ];
  
  temporalPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        entities.push({
          text: match[0],
          type: 'temporal',
          actualValue: match[0].toLowerCase(),
          startIndex,
          endIndex,
          confidence: 0.8,
          temporalType: type
        });
      }
    }
  });
  
  return entities.sort((a, b) => a.startIndex - b.startIndex);
};

// Helper functions
const isOverlapping = (start, end, processedIndices) => {
  for (let i = start; i < end; i++) {
    if (processedIndices.has(i)) return true;
  }
  return false;
};

const markIndices = (start, end, processedIndices) => {
  for (let i = start; i < end; i++) {
    processedIndices.add(i);
  }
};

// Smart table suggestions
const generateSmartTableSuggestions = (entities) => {
  const suggestions = new Set();
  
  entities.forEach(entity => {
    if (entity.type === 'entity' && entity.table) {
      suggestions.add(entity.table);
    }
  });
  
  entities.forEach(entity => {
    if (entity.type === 'info' || entity.type === 'temporal') {
      const term = entity.actualValue?.toLowerCase() || entity.text.toLowerCase();
      
      if (['mouse', 'keyboard', 'laptop', 'headset', 'wireless', 'gaming', 'bluetooth'].includes(term)) {
        suggestions.add('products');
        suggestions.add('sales');
        suggestions.add('stock');
      }
      
      if (['pending', 'completed', 'urgent', 'high', 'medium', 'low'].includes(term)) {
        suggestions.add('tasks');
      }
      
      if (['customer', 'client', 'company'].includes(term)) {
        suggestions.add('customers');
      }
      
      if (['user', 'employee', 'staff', 'ahmed'].includes(term)) {
        suggestions.add('users');
        suggestions.add('attendance');
        suggestions.add('shifts');
      }
      
      if (['warehouse', 'office', 'location'].includes(term)) {
        suggestions.add('stock');
        suggestions.add('shifts');
      }
      
      if (['sale', 'transaction', 'purchase', 'order'].includes(term)) {
        suggestions.add('sales');
      }
    }
  });
  
  if (suggestions.size === 0) {
    ['customers', 'products', 'sales', 'tasks', 'users'].forEach(table => suggestions.add(table));
  }
  
  return Array.from(suggestions);
};

// Query database with filtering
const queryDatabaseWithFiltering = async (tableName, entities = []) => {
  try {
    const { data: allData, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(50);
    
    if (error) {
      console.error(`❌ Query error for ${tableName}:`, error);
      return [];
    }
    
    if (!allData || allData.length === 0) {
      return [];
    }
    
    const filterEntities = entities.filter(e => ['info', 'pronoun', 'temporal'].includes(e.type));
    
    if (filterEntities.length > 0) {
      const filteredData = allData.filter(record => {
        return filterEntities.some(entity => {
          const searchTerm = entity.actualValue || entity.text;
          return Object.entries(record).some(([field, value]) => {
            if (typeof value === 'string') {
              const lowerValue = value.toLowerCase();
              const lowerTerm = searchTerm.toLowerCase();
              return lowerValue === lowerTerm || lowerValue.includes(lowerTerm);
            }
            return false;
          });
        });
      });
      
      if (filteredData.length > 0) {
        return filteredData;
      }
    }
    
    return allData;
  } catch (error) {
    console.error(`❌ Database error for ${tableName}:`, error);
    return [];
  }
};

// Detailed homogeneity analysis
const analyzeHomogeneity = (query, entities, tableName, records, intention) => {
  const analysis = {
    queryIntention: intention,
    totalRecords: records.length,
    relevantRecords: 0,
    irrelevantRecords: 0,
    homogeneityScore: 0,
    detailedMatches: [],
    issues: []
  };
  
  if (records.length === 0) {
    analysis.issues.push('❌ No records found');
    return analysis;
  }
  
  const filterEntities = entities.filter(e => ['info', 'pronoun', 'temporal'].includes(e.type));
  
  if (filterEntities.length === 0) {
    // Entity-only query
    analysis.relevantRecords = records.length;
    analysis.homogeneityScore = 100;
    analysis.detailedMatches.push(`✅ Entity-only query: All ${records.length} records are relevant`);
    return analysis;
  }
  
  // Detailed record analysis
  records.forEach((record, index) => {
    let recordRelevant = false;
    let matchedFields = [];
    let matchedTerms = [];
    
    filterEntities.forEach(entity => {
      const searchTerm = entity.actualValue || entity.text;
      
      Object.entries(record).forEach(([field, value]) => {
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          const lowerTerm = searchTerm.toLowerCase();
          
          if (lowerValue === lowerTerm || lowerValue.includes(lowerTerm)) {
            recordRelevant = true;
            matchedFields.push(`${field}="${value}"`);
            matchedTerms.push(searchTerm);
          }
        }
      });
    });
    
    if (recordRelevant) {
      analysis.relevantRecords++;
      analysis.detailedMatches.push(`✅ Record ${index + 1}: Matches [${matchedTerms.join(', ')}] in [${matchedFields.slice(0, 2).join(', ')}]`);
    } else {
      analysis.irrelevantRecords++;
      analysis.detailedMatches.push(`❌ Record ${index + 1}: NO MATCH - Unintended result`);
      
      // Show the record for manual inspection
      const recordPreview = Object.entries(record).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
      analysis.issues.push(`⚠️  Unintended record: {${recordPreview}}`);
    }
  });
  
  analysis.homogeneityScore = Math.round((analysis.relevantRecords / analysis.totalRecords) * 100);
  
  return analysis;
};

// Manual test runner for single query
async function runSingleTest(testId) {
  const testCase = TEST_QUERIES.find(t => t.id === testId);
  
  if (!testCase) {
    console.log('❌ Test ID not found. Available IDs: 1-20');
    return;
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 MANUAL TEST ${testCase.id}: ${testCase.query}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`💭 Intention: ${testCase.intention}`);
  console.log(`🎯 Expected: ${testCase.expectedTable}`);
  console.log(`📍 Expected Field: ${testCase.expectedField}`);
  console.log();
  
  try {
    const startTime = Date.now();
    
    // Step 1: Extract entities
    const entities = extractEntitiesAdvanced(testCase.query);
    console.log(`\n📊 Extracted ${entities.length} entities:`);
    entities.forEach((entity, index) => {
      console.log(`   ${index + 1}. "${entity.text}" (${entity.type}) → ${entity.actualValue || entity.text}`);
    });
    
    // Step 2: Generate table suggestions
    const suggestedTables = generateSmartTableSuggestions(entities);
    console.log(`\n📊 Suggested tables: ${suggestedTables.join(', ')}`);
    
    // Step 3: Query each table and analyze homogeneity
    let overallHomogeneity = 0;
    let totalRecords = 0;
    let totalRelevant = 0;
    
    for (const tableName of suggestedTables) {
      console.log(`\n🔍 ANALYZING TABLE: ${tableName}`);
      console.log('-'.repeat(50));
      
      const records = await queryDatabaseWithFiltering(tableName, entities);
      
      if (records.length > 0) {
        const analysis = analyzeHomogeneity(testCase.query, entities, tableName, records, testCase.intention);
        
        console.log(`📊 Records: ${analysis.totalRecords} total, ${analysis.relevantRecords} relevant`);
        console.log(`🎯 Homogeneity: ${analysis.homogeneityScore}%`);
        
        console.log(`\n📋 DETAILED ANALYSIS:`);
        analysis.detailedMatches.slice(0, 5).forEach(match => console.log(`   ${match}`));
        
        if (analysis.detailedMatches.length > 5) {
          console.log(`   ... and ${analysis.detailedMatches.length - 5} more records`);
        }
        
        if (analysis.issues.length > 0) {
          console.log(`\n⚠️  HOMOGENEITY ISSUES:`);
          analysis.issues.slice(0, 3).forEach(issue => console.log(`   ${issue}`));
        }
        
        totalRecords += analysis.totalRecords;
        totalRelevant += analysis.relevantRecords;
        
        if (analysis.homogeneityScore > overallHomogeneity) {
          overallHomogeneity = analysis.homogeneityScore;
        }
        
      } else {
        console.log(`⚠️  No records found in ${tableName}`);
      }
    }
    
    const endTime = Date.now();
    
    // Final assessment
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📈 FINAL ASSESSMENT:`);
    console.log(`   ⚡ Time: ${endTime - startTime}ms`);
    console.log(`   🔍 Entities: ${entities.length}`);
    console.log(`   📊 Tables: ${suggestedTables.length}`);
    console.log(`   📁 Total Records: ${totalRecords}`);
    console.log(`   ✅ Relevant Records: ${totalRelevant}`);
    console.log(`   🎯 Overall Homogeneity: ${totalRecords > 0 ? Math.round((totalRelevant/totalRecords)*100) : 0}%`);
    
    const finalHomogeneity = totalRecords > 0 ? Math.round((totalRelevant/totalRecords)*100) : 0;
    
    if (finalHomogeneity >= 80) {
      console.log(`\n🎉 EXCELLENT HOMOGENEITY! Query gets intended results!`);
    } else if (finalHomogeneity >= 60) {
      console.log(`\n🎊 GOOD HOMOGENEITY! Mostly intended results with some noise.`);
    } else if (finalHomogeneity >= 40) {
      console.log(`\n⚠️  MODERATE HOMOGENEITY! Mixed intended and unintended results.`);
    } else {
      console.log(`\n❌ POOR HOMOGENEITY! Too many unintended results.`);
    }
    
    console.log(`\n💡 RECOMMENDATION:`);
    if (finalHomogeneity >= 70) {
      console.log(`   ✅ This query works well - ready for production use`);
    } else {
      console.log(`   🔧 This query needs refinement to reduce unintended results`);
    }
    
  } catch (error) {
    console.error(`\n💥 TEST ERROR:`, error.message);
  }
}

// Get test ID from command line argument
const testId = process.argv[2];

if (!testId) {
  console.log('📋 AVAILABLE TESTS:');
  console.log('Usage: node test-manual-homogeneity.cjs <test_id>');
  console.log('');
  TEST_QUERIES.forEach(test => {
    console.log(`${test.id.toString().padStart(2)}: "${test.query}" - ${test.intention}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node test-manual-homogeneity.cjs 1    # Test products wireless mouse');
  console.log('  node test-manual-homogeneity.cjs 2    # Test tasks pending status');
  console.log('  node test-manual-homogeneity.cjs 20   # Test comprehensive query');
} else {
  runSingleTest(parseInt(testId));
}
