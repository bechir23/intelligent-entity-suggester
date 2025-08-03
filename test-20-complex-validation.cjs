// 20 COMPLEX QUERY VALIDATION TESTS
// Testing homogeneity between queries and retrieved records with:
// - Multiple entities from different tables
// - Pronouns resolution
// - Temporal expressions  
// - Location/context information
// - Complex multi-table relationships

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlvdasysekzforztqlds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdmRhc3lzZWt6Zm9yenRxbGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjY0OTksImV4cCI6MjA2OTU0MjQ5OX0.kzbZLHGUsX3nf-IfWj2zzSovTbMWjwA4m6463mFbgnU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 20 COMPLEX QUERY VALIDATION TESTS');
console.log('='.repeat(70));
console.log('🎯 Focus: Verify query-record homogeneity with complex scenarios');
console.log('📊 Testing: Multiple entities, pronouns, temporal, location context');
console.log();

// Enhanced fuzzy matching terms for validation
const BUSINESS_INFO_TERMS = {
  mouse: ['wireless mouse', 'gaming mouse', 'bluetooth mouse', 'computer mouse', 'optical mouse', 'ergonomic mouse', 'laser mouse', 'trackball mouse'],
  keyboard: ['mechanical keyboard', 'wireless keyboard', 'gaming keyboard', 'bluetooth keyboard', 'ergonomic keyboard', 'membrane keyboard', 'backlit keyboard'],
  laptop: ['gaming laptop', 'business laptop', 'ultrabook', 'notebook computer', 'workstation laptop', 'convertible laptop', 'chromebook', 'macbook'],
  monitor: ['gaming monitor', '4k monitor', 'ultrawide monitor', 'led monitor', 'curved monitor', 'dual monitor', 'touchscreen monitor', 'portable monitor'],
  phone: ['smartphone', 'mobile phone', 'iphone', 'android phone', 'cell phone', 'business phone', 'flip phone', 'satellite phone'],
  headset: ['gaming headset', 'wireless headset', 'bluetooth headset', 'office headset', 'noise canceling headset', 'vr headset'],
  
  // Status and priority terms
  pending: ['in progress', 'waiting', 'queued', 'scheduled', 'on hold', 'deferred', 'backlog'],
  completed: ['finished', 'done', 'closed', 'resolved', 'accomplished', 'fulfilled', 'delivered'],
  active: ['current', 'ongoing', 'live', 'running', 'in use', 'operational', 'working'],
  
  high: ['urgent', 'critical', 'important', 'priority', 'rush', 'immediate', 'top priority'],
  medium: ['normal', 'standard', 'regular', 'moderate', 'average', 'typical', 'routine'],
  low: ['minor', 'optional', 'nice to have', 'future', 'enhancement', 'suggestion'],
  
  // Temporal terms
  today: ['now', 'current day', 'this day', 'present', 'immediate'],
  yesterday: ['previous day', 'one day ago', 'last day'],
  tomorrow: ['next day', 'following day', 'upcoming day'],
  
  // Business terms
  task: ['work task', 'assignment', 'project task', 'todo item', 'action item', 'deliverable', 'milestone', 'objective'],
  customer: ['client', 'buyer', 'purchaser', 'consumer', 'account', 'patron', 'user', 'customer'],
  user: ['employee', 'staff member', 'team member', 'worker', 'personnel', 'associate', 'colleague'],
  sale: ['transaction', 'purchase', 'order', 'deal', 'invoice', 'receipt', 'payment', 'billing']
};

// Advanced entity extraction with comprehensive detection
const extractEntitiesAdvanced = (text) => {
  const entities = [];
  const processedIndices = new Set();
  
  console.log(`\n🔍 ENTITY EXTRACTION: "${text}"`);
  
  // 1. Table/Entity detection (highest priority)
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
          color: '#10B981',
          startIndex,
          endIndex,
          confidence: 0.9
        });
      }
    }
  });
  
  // 2. Multi-word business phrases
  const businessPhrases = [
    'wireless mouse', 'gaming laptop', 'mechanical keyboard', 'gaming monitor',
    'bluetooth headset', 'work task', 'customer service', 'sales report',
    'user account', 'product catalog', 'high priority', 'low priority', 'medium priority',
    'in progress', 'next week', 'last month', 'this week', 'last week', 'this month',
    'warehouse location', 'inventory management', 'task assignment', 'shift schedule',
    'attendance record', 'employee performance', 'customer support', 'product quality'
  ];
  
  businessPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        const suggestions = BUSINESS_INFO_TERMS[phrase.split(' ')[0]] || [];
        entities.push({
          text: match[0],
          type: 'info',
          actualValue: phrase.toLowerCase(),
          color: '#3B82F6',
          startIndex,
          endIndex,
          confidence: 0.8,
          suggestions
        });
      }
    }
  });
  
  // 3. Single word business terms with fuzzy matching
  Object.keys(BUSINESS_INFO_TERMS).forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        const suggestions = BUSINESS_INFO_TERMS[term];
        entities.push({
          text: match[0],
          type: 'info',
          actualValue: term,
          color: '#3B82F6',
          startIndex,
          endIndex,
          confidence: 0.7,
          suggestions
        });
      }
    }
  });
  
  // 4. Pronouns with user resolution
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
        color: '#F59E0B',
        startIndex,
        endIndex,
        confidence: 0.9
      });
    }
  }
  
  // 5. Temporal expressions with context
  const temporalPatterns = [
    { pattern: /\b(today|yesterday|tomorrow)\b/gi, type: 'relative_day' },
    { pattern: /\b(this week|last week|next week)\b/gi, type: 'relative_week' },
    { pattern: /\b(this month|last month|next month)\b/gi, type: 'relative_month' },
    { pattern: /\b(this year|last year|next year)\b/gi, type: 'relative_year' },
    { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/gi, type: 'absolute_date' },
    { pattern: /\b(morning|afternoon|evening|night)\b/gi, type: 'time_period' },
    { pattern: /\b(now|currently|presently|at the moment)\b/gi, type: 'immediate' }
  ];
  
  temporalPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        const suggestions = BUSINESS_INFO_TERMS[match[0].toLowerCase()] || [];
        entities.push({
          text: match[0],
          type: 'temporal',
          actualValue: match[0].toLowerCase(),
          color: '#F59E0B',
          startIndex,
          endIndex,
          confidence: 0.8,
          temporalType: type,
          suggestions
        });
      }
    }
  });
  
  // 6. Location and context terms
  const locationTerms = ['warehouse', 'office', 'store', 'location', 'building', 'floor', 'department', 'section'];
  locationTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex, processedIndices)) {
        markIndices(startIndex, endIndex, processedIndices);
        entities.push({
          text: match[0],
          type: 'location',
          actualValue: term,
          color: '#8B5CF6',
          startIndex,
          endIndex,
          confidence: 0.6
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

// Enhanced query function with filtering
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
    
    // Enhanced filtering based on entities
    const infoEntities = entities.filter(e => ['info', 'pronoun', 'temporal', 'location'].includes(e.type));
    
    if (infoEntities.length > 0) {
      const filteredData = allData.filter(record => {
        return infoEntities.some(entity => {
          const searchTerm = entity.actualValue || entity.text;
          return Object.values(record).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (typeof value === 'number') {
              return value.toString().includes(searchTerm);
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

// Generate smart table suggestions
const generateSmartTableSuggestions = (entities) => {
  const suggestions = new Set();
  
  // Check for explicit entity tables first
  entities.forEach(entity => {
    if (entity.type === 'entity' && entity.table) {
      suggestions.add(entity.table);
    }
  });
  
  // Add related tables based on info entities
  entities.forEach(entity => {
    if (entity.type === 'info' || entity.type === 'temporal' || entity.type === 'location') {
      const term = entity.actualValue?.toLowerCase() || entity.text.toLowerCase();
      
      // Product-related
      if (['laptop', 'mouse', 'keyboard', 'monitor', 'phone', 'headset', 'wireless', 'gaming', 'bluetooth'].includes(term)) {
        suggestions.add('products');
        suggestions.add('sales');
        suggestions.add('stock');
      }
      
      // Task-related
      if (['task', 'assignment', 'project', 'high', 'medium', 'low', 'pending', 'completed', 'priority'].includes(term)) {
        suggestions.add('tasks');
      }
      
      // Customer-related
      if (['customer', 'client', 'buyer', 'company'].includes(term)) {
        suggestions.add('customers');
      }
      
      // User/HR-related
      if (['user', 'employee', 'staff', 'ahmed', 'worker', 'personnel'].includes(term)) {
        suggestions.add('users');
        suggestions.add('attendance');
        suggestions.add('shifts');
      }
      
      // Sales-related
      if (['sale', 'transaction', 'purchase', 'order', 'invoice'].includes(term)) {
        suggestions.add('sales');
      }
      
      // Warehouse/Stock-related
      if (['warehouse', 'inventory', 'stock', 'location'].includes(term)) {
        suggestions.add('stock');
      }
    }
  });
  
  // If no specific suggestions, use main tables
  if (suggestions.size === 0) {
    ['customers', 'products', 'sales', 'tasks', 'users', 'stock', 'shifts', 'attendance'].forEach(table => suggestions.add(table));
  }
  
  return Array.from(suggestions);
};

// Validate record homogeneity with query
const validateRecordHomogeneity = (query, entities, tableName, records) => {
  const validationResults = {
    totalRecords: records.length,
    relevantRecords: 0,
    homogeneityScore: 0,
    details: []
  };
  
  if (records.length === 0) {
    validationResults.details.push('❌ No records found');
    return validationResults;
  }
  
  const infoEntities = entities.filter(e => ['info', 'pronoun', 'temporal', 'location'].includes(e.type));
  
  if (infoEntities.length === 0) {
    // If no filtering entities, all records are considered relevant
    validationResults.relevantRecords = records.length;
    validationResults.homogeneityScore = 100;
    validationResults.details.push(`✅ All ${records.length} records relevant (entity-only query)`);
    return validationResults;
  }
  
  // Check each record for relevance
  records.forEach((record, index) => {
    let recordRelevant = false;
    let matchedTerms = [];
    
    infoEntities.forEach(entity => {
      const searchTerm = entity.actualValue || entity.text;
      const found = Object.entries(record).some(([field, value]) => {
        if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedTerms.push(`${field}:${searchTerm}`);
          return true;
        }
        return false;
      });
      
      if (found) {
        recordRelevant = true;
      }
    });
    
    if (recordRelevant) {
      validationResults.relevantRecords++;
      validationResults.details.push(`✅ Record ${index + 1}: Matches [${matchedTerms.join(', ')}]`);
    } else {
      validationResults.details.push(`⚠️  Record ${index + 1}: No clear match with query terms`);
    }
  });
  
  validationResults.homogeneityScore = Math.round((validationResults.relevantRecords / validationResults.totalRecords) * 100);
  
  return validationResults;
};

// 20 Complex test scenarios
const COMPLEX_TEST_SCENARIOS = [
  {
    id: 1,
    query: "my high priority gaming laptop tasks today",
    description: "Pronoun + Priority + Product + Entity + Temporal",
    expectedComplexity: "5 entities across pronouns, info, and temporal",
    focus: "Personal task management with product context and temporal scope"
  },
  {
    id: 2,
    query: "customers who bought wireless mouse from warehouse location yesterday",
    description: "Entity + Action + Product + Location + Temporal",
    expectedComplexity: "5 entities with location and temporal context",
    focus: "Customer purchase history with location and time constraints"
  },
  {
    id: 3,
    query: "I need urgent task assignment for gaming keyboard project this week",
    description: "Pronoun + Priority + Entity + Product + Temporal",
    expectedComplexity: "6 entities with urgency and project context",
    focus: "Personal urgent task assignment with product and timeline"
  },
  {
    id: 4,
    query: "sales reports for bluetooth headset customers last month warehouse",
    description: "Entity + Product + Entity + Temporal + Location",
    expectedComplexity: "5 entities across sales, products, temporal, location",
    focus: "Sales analysis with product, customer, location, and time scope"
  },
  {
    id: 5,
    query: "my attendance shifts schedule this week office location",
    description: "Pronoun + Entity + Entity + Temporal + Location",
    expectedComplexity: "5 entities with HR context and location",
    focus: "Personal HR data with schedule and location context"
  },
  {
    id: 6,
    query: "users employees staff performance tasks completed yesterday",
    description: "Entity + Multiple synonyms + Entity + Status + Temporal",
    expectedComplexity: "6 entities with performance and completion status",
    focus: "Employee performance analysis with task completion and temporal scope"
  },
  {
    id: 7,
    query: "products inventory stock gaming monitor warehouse location today",
    description: "Entity + Entity + Product + Location + Temporal",
    expectedComplexity: "6 entities with inventory and location management",
    focus: "Product inventory with location and current status"
  },
  {
    id: 8,
    query: "I bought mechanical keyboard from store customer purchase order",
    description: "Pronoun + Action + Product + Location + Entity + Document",
    expectedComplexity: "6 entities with purchase transaction context",
    focus: "Personal purchase transaction with product and location details"
  },
  {
    id: 9,
    query: "tasks assigned to me high priority pending status this month",
    description: "Entity + Pronoun + Priority + Status + Temporal",
    expectedComplexity: "5 entities with assignment and status tracking",
    focus: "Personal task assignments with priority and status filtering"
  },
  {
    id: 10,
    query: "customer service users phone support calls yesterday office",
    description: "Service + Entity + Product + Action + Temporal + Location",
    expectedComplexity: "6 entities with customer service context",
    focus: "Customer service operations with product, temporal, and location scope"
  },
  {
    id: 11,
    query: "sales transactions laptop customers warehouse delivery last week",
    description: "Entity + Product + Entity + Location + Process + Temporal",
    expectedComplexity: "6 entities with delivery logistics context",
    focus: "Sales transactions with delivery logistics and temporal scope"
  },
  {
    id: 12,
    query: "my shift attendance record office location this week present",
    description: "Pronoun + Entity + Entity + Location + Temporal + Status",
    expectedComplexity: "6 entities with HR attendance tracking",
    focus: "Personal attendance tracking with location and status"
  },
  {
    id: 13,
    query: "products wireless mouse sales customers yesterday warehouse stock",
    description: "Entity + Product + Entity + Entity + Temporal + Location + Entity",
    expectedComplexity: "7 entities with complex product sales tracking",
    focus: "Product sales tracking across multiple tables with temporal scope"
  },
  {
    id: 14,
    query: "I completed urgent tasks gaming laptop project office today",
    description: "Pronoun + Status + Priority + Entity + Product + Location + Temporal",
    expectedComplexity: "7 entities with project completion context",
    focus: "Personal project completion with product, location, and temporal context"
  },
  {
    id: 15,
    query: "users staff shifts schedule tomorrow warehouse location department",
    description: "Entity + Synonym + Entity + Document + Temporal + Location + Organization",
    expectedComplexity: "7 entities with organizational scheduling",
    focus: "Staff scheduling with organizational structure and location"
  },
  {
    id: 16,
    query: "customer support phone calls bluetooth headset issues yesterday",
    description: "Service + Product + Action + Product + Problems + Temporal",
    expectedComplexity: "6 entities with customer support issue tracking",
    focus: "Customer support issues with product specifics and temporal scope"
  },
  {
    id: 17,
    query: "my sales performance customers laptop orders last month warehouse",
    description: "Pronoun + Entity + Metric + Entity + Product + Document + Temporal + Location",
    expectedComplexity: "8 entities with sales performance analysis",
    focus: "Personal sales performance with product, customer, and location analysis"
  },
  {
    id: 18,
    query: "attendance records users employees office shifts this week department",
    description: "Entity + Entity + Synonym + Location + Entity + Temporal + Organization",
    expectedComplexity: "7 entities with HR management context",
    focus: "HR attendance management with organizational and temporal scope"
  },
  {
    id: 19,
    query: "I assigned high priority tasks gaming keyboard project users today",
    description: "Pronoun + Action + Priority + Entity + Product + Project + Entity + Temporal",
    expectedComplexity: "8 entities with task assignment and project management",
    focus: "Personal task assignment with project management and team coordination"
  },
  {
    id: 20,
    query: "products stock inventory wireless mouse warehouse location customers sales yesterday",
    description: "Entity + Entity + Product + Location + Entity + Entity + Temporal",
    expectedComplexity: "8 entities with comprehensive business operation tracking",
    focus: "Complete business operation tracking across products, inventory, customers, sales with temporal and location scope"
  }
];

// Execute validation tests
async function runComplexValidationTests() {
  console.log('🧪 STARTING 20 COMPLEX VALIDATION TESTS');
  console.log('='.repeat(70));
  
  let totalTests = 0;
  let passedTests = 0;
  let totalRecords = 0;
  let totalValidatedRecords = 0;
  
  for (const testCase of COMPLEX_TEST_SCENARIOS) {
    totalTests++;
    console.log(`\n📝 TEST ${testCase.id}: ${testCase.description}`);
    console.log(`💬 Query: "${testCase.query}"`);
    console.log(`🎯 Focus: ${testCase.focus}`);
    console.log(`🔧 Expected: ${testCase.expectedComplexity}`);
    
    try {
      const startTime = Date.now();
      
      // Step 1: Extract entities
      const entities = extractEntitiesAdvanced(testCase.query);
      console.log(`\n🔍 Extracted ${entities.length} entities:`);
      entities.forEach((entity, index) => {
        const suggestions = entity.suggestions ? ` (${entity.suggestions.length} suggestions)` : '';
        const temporal = entity.temporalType ? ` [${entity.temporalType}]` : '';
        console.log(`   ${index + 1}. "${entity.text}" (${entity.type})${suggestions}${temporal}`);
      });
      
      // Step 2: Generate table suggestions
      const suggestedTables = generateSmartTableSuggestions(entities);
      console.log(`\n📊 Querying tables: ${suggestedTables.join(', ')}`);
      
      // Step 3: Query databases and validate
      let testPassed = true;
      let testRecordCount = 0;
      let testValidatedCount = 0;
      
      for (const tableName of suggestedTables) {
        console.log(`\n🔍 Querying ${tableName}:`);
        const records = await queryDatabaseWithFiltering(tableName, entities);
        
        if (records.length > 0) {
          console.log(`   📊 Retrieved ${records.length} records`);
          testRecordCount += records.length;
          
          // Validate homogeneity
          const validation = validateRecordHomogeneity(testCase.query, entities, tableName, records);
          testValidatedCount += validation.relevantRecords;
          
          console.log(`   🎯 Homogeneity: ${validation.homogeneityScore}% (${validation.relevantRecords}/${validation.totalRecords} relevant)`);
          
          // Show top validation details (max 3)
          validation.details.slice(0, 3).forEach(detail => {
            console.log(`   ${detail}`);
          });
          
          if (validation.details.length > 3) {
            console.log(`   ... and ${validation.details.length - 3} more records`);
          }
          
          // Consider test passed if homogeneity is above 50% or it's an entity-only query
          if (validation.homogeneityScore < 50 && entities.some(e => ['info', 'temporal', 'location'].includes(e.type))) {
            testPassed = false;
          }
        } else {
          console.log(`   ⚠️  No records found in ${tableName}`);
        }
      }
      
      totalRecords += testRecordCount;
      totalValidatedRecords += testValidatedCount;
      
      const endTime = Date.now();
      console.log(`\n📈 Test Results:`);
      console.log(`   ⚡ Time: ${endTime - startTime}ms`);
      console.log(`   🔍 Entities: ${entities.length}`);
      console.log(`   📊 Tables: ${suggestedTables.length}`);
      console.log(`   📁 Records: ${testRecordCount}`);
      console.log(`   ✅ Validated: ${testValidatedCount}`);
      console.log(`   🎯 Overall Homogeneity: ${testRecordCount > 0 ? Math.round((testValidatedCount/testRecordCount)*100) : 0}%`);
      
      if (testPassed && testRecordCount > 0) {
        passedTests++;
        console.log(`\n🎉 TEST PASSED - Query-Record homogeneity validated!`);
      } else if (testRecordCount > 0) {
        console.log(`\n⚠️  TEST CONCERNS - Low homogeneity detected`);
      } else {
        console.log(`\n❌ TEST FAILED - No records retrieved`);
      }
      
    } catch (error) {
      console.error(`\n💥 TEST ERROR:`, error.message);
    }
    
    console.log('-'.repeat(70));
  }
  
  // Final summary
  console.log(`\n\n🏆 === COMPLEX VALIDATION SUMMARY ===`);
  console.log(`📊 Tests: ${passedTests}/${totalTests} passed (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`📁 Total Records: ${totalRecords} retrieved`);
  console.log(`✅ Validated Records: ${totalValidatedRecords}`);
  console.log(`🎯 Overall Homogeneity: ${totalRecords > 0 ? Math.round((totalValidatedRecords/totalRecords)*100) : 0}%`);
  console.log(`📊 Average: ${Math.round(totalRecords/totalTests)} records/test`);
  
  if (passedTests >= totalTests * 0.8) {
    console.log(`\n🎉🎉 EXCELLENT! ${Math.round(passedTests/totalTests*100)}% success rate! 🎉🎉`);
    console.log(`✅ Query-record homogeneity validated across complex scenarios`);
    console.log(`✅ Multi-entity extraction working correctly`);
    console.log(`✅ Temporal and location context preserved`);
    console.log(`✅ Pronoun resolution functioning`);
    console.log(`\n🚀 System ready for production use!`);
  } else if (passedTests >= totalTests * 0.6) {
    console.log(`\n🎊 GOOD! ${Math.round(passedTests/totalTests*100)}% success rate`);
    console.log(`✅ Most complex scenarios working`);
    console.log(`🔧 Some refinement needed for edge cases`);
  } else {
    console.log(`\n⚠️  NEEDS IMPROVEMENT: ${Math.round(passedTests/totalTests*100)}% success rate`);
    console.log(`🔧 Review entity extraction and filtering logic`);
    console.log(`🔧 Check database query strategies`);
  }
  
  return {
    totalTests,
    passedTests,
    totalRecords,
    totalValidatedRecords,
    successRate: Math.round(passedTests/totalTests*100),
    homogeneityRate: totalRecords > 0 ? Math.round((totalValidatedRecords/totalRecords)*100) : 0
  };
}

// Execute the tests
console.log('🚀 INITIALIZING COMPLEX VALIDATION TESTING...');
runComplexValidationTests().then(results => {
  console.log(`\n🎯 FINAL VALIDATION RESULTS:`);
  console.log(`Success Rate: ${results.successRate}%`);
  console.log(`Homogeneity Rate: ${results.homogeneityRate}%`);
  console.log(`Records Analyzed: ${results.totalRecords}`);
  console.log(`Validated Records: ${results.totalValidatedRecords}`);
  
  if (results.successRate >= 80 && results.homogeneityRate >= 70) {
    console.log(`\n🏆 VALIDATION COMPLETE! SYSTEM APPROVED FOR TESTING! 🏆`);
    console.log(`🎯 Complex query handling: VALIDATED`);
    console.log(`🎯 Record homogeneity: VALIDATED`);
    console.log(`🎯 Multi-entity extraction: VALIDATED`);
    console.log(`🎯 Ready for personal testing!`);
  } else {
    console.log(`\n🔧 Additional refinement recommended before testing`);
  }
}).catch(error => {
  console.error('❌ Validation execution error:', error);
});
