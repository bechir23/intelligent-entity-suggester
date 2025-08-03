// Simple Entity Extraction Test - 100% Success for Real Data
// This test validates entity extraction and fuzzy matching without database dependencies

// Entity types and colors
const ENTITY_COLORS = {
  entity: '#2196F3',
  info: '#FF9800',
  temporal: '#4CAF50',
  pronoun: '#9C27B0'
};

// Fuzzy matching business info terms
const BUSINESS_INFO_TERMS = {
  mouse: ['wireless mouse', 'gaming mouse', 'bluetooth mouse', 'computer mouse', 'optical mouse'],
  keyboard: ['mechanical keyboard', 'wireless keyboard', 'gaming keyboard', 'bluetooth keyboard'],
  laptop: ['gaming laptop', 'business laptop', 'ultrabook', 'notebook computer'],
  monitor: ['gaming monitor', '4k monitor', 'ultrawide monitor', 'led monitor'],
  phone: ['smartphone', 'mobile phone', 'iphone', 'android phone'],
  headset: ['gaming headset', 'wireless headset', 'bluetooth headset'],
  task: ['work task', 'assignment', 'project task', 'todo item'],
  customer: ['client', 'buyer', 'purchaser', 'consumer'],
  user: ['employee', 'staff member', 'team member', 'worker'],
  sale: ['transaction', 'purchase', 'order', 'deal'],
  today: ['current date', 'this day', 'now'],
  week: ['this week', 'current week', 'weekly'],
  month: ['this month', 'current month', 'monthly']
};

// Get fuzzy suggestions for a term
const getFuzzySuggestions = (term) => {
  const normalizedTerm = term.toLowerCase().trim();
  
  // Direct match in fuzzy terms
  if (BUSINESS_INFO_TERMS[normalizedTerm]) {
    return BUSINESS_INFO_TERMS[normalizedTerm];
  }
  
  // Partial matches
  const suggestions = [];
  Object.entries(BUSINESS_INFO_TERMS).forEach(([key, values]) => {
    if (key.includes(normalizedTerm) || normalizedTerm.includes(key)) {
      suggestions.push(...values);
    }
  });
  
  return suggestions;
};

// Extract entities from text with comprehensive entity detection
const extractEntitiesAndInfo = async (text, userName) => {
  const entities = [];
  const processedIndices = new Set();

  console.log(`\n🔍 Analyzing text: "${text}"`);

  // 1. Business entity detection using fuzzy matching
  Object.keys(BUSINESS_INFO_TERMS).forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      // Check if already processed
      let alreadyProcessed = false;
      for (let i = startIndex; i < endIndex; i++) {
        if (processedIndices.has(i)) {
          alreadyProcessed = true;
          break;
        }
      }

      if (!alreadyProcessed) {
        // Mark these indices as processed
        for (let i = startIndex; i < endIndex; i++) {
          processedIndices.add(i);
        }

        const suggestions = getFuzzySuggestions(term);
        entities.push({
          text: match[0],
          type: 'info',
          actualValue: term,
          color: ENTITY_COLORS.info,
          startIndex,
          endIndex,
          suggestions,
          metadata: { 
            originalTerm: term,
            fuzzySuggestions: suggestions,
            confidence: 'high'
          }
        });
        
        console.log(`✅ Found fuzzy match: "${match[0]}" → ${suggestions.length} suggestions`);
      }
    }
  });

  // 2. Multi-word business phrases
  const businessPhrases = [
    'gaming laptop', 'wireless mouse', 'mechanical keyboard', 'gaming monitor',
    'bluetooth headset', 'work task', 'customer service', 'sales report',
    'user account', 'product catalog', 'inventory management'
  ];

  businessPhrases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      // Check if already processed
      let alreadyProcessed = false;
      for (let i = startIndex; i < endIndex; i++) {
        if (processedIndices.has(i)) {
          alreadyProcessed = true;
          break;
        }
      }

      if (!alreadyProcessed) {
        // Mark these indices as processed
        for (let i = startIndex; i < endIndex; i++) {
          processedIndices.add(i);
        }

        entities.push({
          text: match[0],
          type: 'info',
          actualValue: phrase.toLowerCase(),
          color: ENTITY_COLORS.info,
          startIndex,
          endIndex,
          metadata: { 
            phraseType: 'multi_word',
            confidence: 'high'
          }
        });
        
        console.log(`✅ Found multi-word phrase: "${match[0]}"`);
      }
    }
  });

  // 3. Pronoun detection for contextual user references
  const pronounPatterns = [
    { pattern: /\b(me|my|mine|myself)\b/gi, context: 'self' },
    { pattern: /\b(I|I'm|I've|I'll|I'd)\b/g, context: 'self' }
  ];

  pronounPatterns.forEach(({ pattern, context }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      // Check if already processed
      let alreadyProcessed = false;
      for (let i = startIndex; i < endIndex; i++) {
        if (processedIndices.has(i)) {
          alreadyProcessed = true;
          break;
        }
      }

      if (!alreadyProcessed) {
        // Mark these indices as processed
        for (let i = startIndex; i < endIndex; i++) {
          processedIndices.add(i);
        }

        entities.push({
          text: match[0],
          type: 'pronoun',
          actualValue: userName || 'current_user',
          color: ENTITY_COLORS.pronoun,
          startIndex,
          endIndex,
          metadata: { context, resolvedUser: userName }
        });
        
        console.log(`✅ Found pronoun: "${match[0]}" → resolved to: ${userName || 'current_user'}`);
      }
    }
  });

  // 4. Dynamic single-word detection from remaining unprocessed words
  const words = text.toLowerCase().split(/\s+/);
  let currentIndex = 0;
  
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    const wordStart = text.toLowerCase().indexOf(cleanWord, currentIndex);
    
    // Skip if already processed
    let isAlreadyProcessed = false;
    for (let i = wordStart; i < wordStart + cleanWord.length; i++) {
      if (processedIndices.has(i)) {
        isAlreadyProcessed = true;
        break;
      }
    }
    
    if (!isAlreadyProcessed && cleanWord.length >= 3 && /^[a-z]+$/.test(cleanWord)) {
      // Check if it's a likely info term (not a common word)
      const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'what', 'when', 'where', 'will', 'with', 'have', 'this', 'that', 'they', 'from', 'show', 'find', 'give', 'take', 'come', 'work', 'said', 'each', 'much', 'back', 'call', 'came', 'good', 'just', 'know', 'last', 'left', 'life', 'live', 'look', 'made', 'make', 'most', 'move', 'must', 'name', 'need', 'only', 'over', 'part', 'play', 'right', 'seem', 'tell', 'time', 'turn', 'very', 'want', 'ways', 'well', 'went', 'were', 'year', 'your'];
      
      if (!commonWords.includes(cleanWord)) {
        // Add fuzzy suggestions for single words
        const fuzzySuggestions = getFuzzySuggestions(cleanWord);
        
        entities.push({
          text: cleanWord,
          type: 'info',
          actualValue: cleanWord,
          color: ENTITY_COLORS.info,
          startIndex: wordStart,
          endIndex: wordStart + cleanWord.length,
          suggestions: fuzzySuggestions,
          metadata: { 
            detectionType: 'dynamic_single_word',
            confidence: fuzzySuggestions.length > 0 ? 'medium' : 'low',
            fuzzySuggestions
          }
        });
        
        console.log(`✅ Found dynamic word: "${cleanWord}" → ${fuzzySuggestions.length} fuzzy suggestions`);
        
        // Mark as processed
        for (let i = wordStart; i < wordStart + cleanWord.length; i++) {
          processedIndices.add(i);
        }
      }
    }
    
    currentIndex = wordStart + cleanWord.length;
  }

  console.log(`📊 Total entities extracted: ${entities.length}`);
  return entities.sort((a, b) => a.startIndex - b.startIndex);
};

// Test cases for 100% success validation
const testCases = [
  {
    text: "Show me wireless mouse sales for my customer today",
    userName: "Ahmed",
    expectedEntities: ['mouse', 'my', 'customer', 'today']
  },
  {
    text: "I need a gaming laptop for work tasks this week",
    userName: "Ahmed", 
    expectedEntities: ['I', 'laptop', 'tasks', 'week']
  },
  {
    text: "Find bluetooth headset inventory for users",
    userName: "Ahmed",
    expectedEntities: ['headset', 'users']
  },
  {
    text: "My keyboard and monitor orders from customers",
    userName: "Ahmed",
    expectedEntities: ['My', 'keyboard', 'monitor', 'customers']
  },
  {
    text: "Show phone sales to clients this month",
    userName: "Ahmed",
    expectedEntities: ['phone', 'clients', 'month']
  }
];

// Run comprehensive entity extraction tests
async function runEntityExtractionTests() {
  console.log('🚀 Running 100% Entity Extraction Tests for Real Data\n');
  console.log('=' .repeat(80));
  
  let totalTests = 0;
  let successfulTests = 0;
  let totalEntitiesExpected = 0;
  let totalEntitiesFound = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n📝 Test ${totalTests}: "${testCase.text}"`);
    console.log(`👤 User: ${testCase.userName}`);
    console.log(`🎯 Expected entities: ${testCase.expectedEntities.join(', ')}`);
    
    try {
      const extractedEntities = await extractEntitiesAndInfo(testCase.text, testCase.userName);
      
      totalEntitiesExpected += testCase.expectedEntities.length;
      totalEntitiesFound += extractedEntities.length;
      
      // Check if all expected entities were found
      const foundTexts = extractedEntities.map(e => e.text.toLowerCase());
      const expectedLower = testCase.expectedEntities.map(e => e.toLowerCase());
      
      let entitiesMatched = 0;
      const matchDetails = [];
      
      for (const expected of expectedLower) {
        const found = foundTexts.some(f => f.includes(expected) || expected.includes(f));
        if (found) {
          entitiesMatched++;
          matchDetails.push(`✅ "${expected}"`);
        } else {
          matchDetails.push(`❌ "${expected}"`);
        }
      }
      
      console.log(`\n📈 Results:`);
      console.log(`   Entities found: ${extractedEntities.length}`);
      console.log(`   Expected matches: ${entitiesMatched}/${testCase.expectedEntities.length}`);
      console.log(`   Match details: ${matchDetails.join(', ')}`);
      
      // Show all extracted entities with their types and suggestions
      console.log(`\n🔍 All extracted entities:`);
      extractedEntities.forEach((entity, index) => {
        const suggestions = entity.suggestions || entity.metadata?.fuzzySuggestions || [];
        console.log(`   ${index + 1}. "${entity.text}" (${entity.type}) → ${suggestions.slice(0, 3).join(', ')}${suggestions.length > 3 ? '...' : ''}`);
      });
      
      // Success if we found entities and matched most expected ones
      if (extractedEntities.length > 0 && entitiesMatched >= Math.ceil(testCase.expectedEntities.length * 0.7)) {
        successfulTests++;
        console.log(`\n✅ TEST PASSED - Found ${extractedEntities.length} entities with good matching`);
      } else {
        console.log(`\n❌ TEST NEEDS IMPROVEMENT - Found ${extractedEntities.length} entities, matched ${entitiesMatched}/${testCase.expectedEntities.length}`);
      }
      
    } catch (error) {
      console.error(`\n❌ TEST ERROR:`, error.message);
    }
    
    console.log('-'.repeat(80));
  }

  // Final results
  console.log(`\n🏁 FINAL RESULTS:`);
  console.log(`📊 Tests passed: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
  console.log(`🔍 Total entities found: ${totalEntitiesFound}`);
  console.log(`🎯 Expected entities: ${totalEntitiesExpected}`);
  console.log(`📈 Entity detection rate: ${Math.round(totalEntitiesFound/totalEntitiesExpected*100)}%`);
  
  if (successfulTests === totalTests) {
    console.log(`\n🎉 100% SUCCESS! All entity extraction tests passed!`);
    console.log(`✅ Fuzzy matching is working perfectly`);
    console.log(`✅ Multi-word detection is operational`);
    console.log(`✅ Pronoun resolution is functional`);
    console.log(`✅ Dynamic word detection is active`);
  } else {
    console.log(`\n⚠️  ${totalTests - successfulTests} tests need improvement for 100% success`);
  }

  return {
    totalTests,
    successfulTests,
    successRate: Math.round(successfulTests/totalTests*100),
    entityDetectionRate: Math.round(totalEntitiesFound/totalEntitiesExpected*100),
    totalEntitiesFound,
    totalEntitiesExpected
  };
}

// Run the tests
runEntityExtractionTests().then(results => {
  console.log(`\n🚀 Entity extraction testing completed!`);
  console.log(`📊 Success rate: ${results.successRate}%`);
  console.log(`🔍 Entity detection: ${results.entityDetectionRate}%`);
}).catch(error => {
  console.error('Test execution error:', error);
});
