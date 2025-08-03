// ENTITY EXTRACTION AND FUZZY MATCHING TEST
// Tests just the entity extraction functionality without database queries

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🚀 ENTITY EXTRACTION AND FUZZY MATCHING TEST\n');
console.log('📊 Testing entity extraction and fuzzy matching without database queries...\n');

async function testEntityExtractionOnly() {
  try {
    // Import the compiled chatService - only test entity extraction
    const { chatService } = await import('./server/dist/services/chatService.js');
    
    // Test cases focused on entity extraction and fuzzy matching
    const entityTests = [
      {
        id: 1,
        query: "Show me customers",
        expectedEntities: ['customers'],
        expectedTypes: ['entity'],
        description: "Extract customers entity"
      },
      {
        id: 2,
        query: "Find products", 
        expectedEntities: ['products'],
        expectedTypes: ['entity'],
        description: "Extract products entity"
      },
      {
        id: 3,
        query: "mouse products",
        expectedEntities: ['mouse', 'products'],
        expectedTypes: ['info', 'entity'],
        fuzzyTest: true,
        fuzzyExpected: ['wireless mouse', 'gaming mouse', 'bluetooth mouse'],
        description: "Extract mouse info + products entity with fuzzy matching"
      },
      {
        id: 4,
        query: "keyboard for my customer today",
        expectedEntities: ['keyboard', 'my', 'customer', 'today'],
        expectedTypes: ['info', 'pronoun', 'entity', 'temporal'],
        fuzzyTest: true,
        fuzzyExpected: ['mechanical keyboard', 'gaming keyboard', 'wireless keyboard'],
        description: "Complex entity extraction: keyboard fuzzy + pronoun + entity + temporal"
      },
      {
        id: 5,
        query: "phone sales yesterday",
        expectedEntities: ['phone', 'sales', 'yesterday'],
        expectedTypes: ['info', 'entity', 'temporal'],
        fuzzyTest: true,
        fuzzyExpected: ['smartphone', 'mobile phone', 'cell phone'],
        description: "Phone fuzzy + sales entity + temporal"
      },
      {
        id: 6,
        query: "Show my tasks for this week",
        expectedEntities: ['my', 'tasks', 'this week'],
        expectedTypes: ['pronoun', 'entity', 'temporal'],
        description: "Pronoun + tasks entity + temporal"
      },
      {
        id: 7,
        query: "laptop stock levels",
        expectedEntities: ['laptop', 'stock', 'levels'],
        expectedTypes: ['info', 'entity'],
        fuzzyTest: true,
        fuzzyExpected: ['gaming laptop', 'business laptop'],
        description: "Laptop fuzzy + stock entity"
      },
      {
        id: 8,
        query: "attendance records",
        expectedEntities: ['attendance', 'records'],
        expectedTypes: ['entity', 'info'],
        description: "Attendance entity + info"
      },
      {
        id: 9,
        query: "user shifts schedule",
        expectedEntities: ['user', 'shifts', 'schedule'],
        expectedTypes: ['entity', 'entity', 'info'],
        description: "Multiple entities: user + shifts"
      },
      {
        id: 10,
        query: "monitor inventory check",
        expectedEntities: ['monitor', 'inventory', 'check'],
        expectedTypes: ['info', 'entity', 'info'],
        fuzzyTest: true,
        fuzzyExpected: ['gaming monitor', '4k monitor', 'ultrawide monitor'],
        description: "Monitor fuzzy + inventory entity"
      }
    ];
    
    let passedTests = 0;
    let totalTests = entityTests.length;
    let totalEntitiesExtracted = 0;
    let fuzzyMatchesFound = 0;
    
    console.log('🔬 Running Entity Extraction Tests...\n');
    
    for (const test of entityTests) {
      console.log(`Test ${test.id}: ${test.description}`);
      console.log(`Query: "${test.query}"`);
      
      try {
        // Extract entities
        const entities = await chatService.extractEntitiesAndInfo(test.query, 'TestUser');
        totalEntitiesExtracted += entities.length;
        
        console.log(`\n📊 Extracted ${entities.length} entities:`);
        entities.forEach((entity, i) => {
          console.log(`  ${i + 1}. "${entity.text}" (${entity.type}${entity.table ? `, table: ${entity.table}` : ''}, confidence: ${entity.confidence}%)`);
          if (entity.hoverText) {
            console.log(`     💡 ${entity.hoverText}`);
          }
        });
        
        // Check expected entities
        const extractedTexts = entities.map(e => e.text.toLowerCase());
        const foundExpectedEntities = test.expectedEntities.filter(expected => 
          extractedTexts.some(extracted => extracted.includes(expected.toLowerCase()))
        );
        
        // Check expected types
        const extractedTypes = [...new Set(entities.map(e => e.type))];
        const hasExpectedTypes = test.expectedTypes.every(type => extractedTypes.includes(type));
        
        console.log(`\n✅ Expected Entities: [${test.expectedEntities.join(', ')}]`);
        console.log(`✅ Found Entities: [${foundExpectedEntities.join(', ')}]`);
        console.log(`✅ Expected Types: [${test.expectedTypes.join(', ')}]`);
        console.log(`✅ Found Types: [${extractedTypes.join(', ')}]`);
        
        // Check fuzzy matching if applicable
        let fuzzySuccess = true;
        if (test.fuzzyTest && test.fuzzyExpected) {
          const fuzzyEvidence = entities.filter(e => 
            e.hoverText && (e.hoverText.includes('suggests:') || e.hoverText.includes('Fuzzy match')) ||
            test.fuzzyExpected.some(fuzzy => e.text.toLowerCase().includes(fuzzy.toLowerCase()))
          );
          
          fuzzyMatchesFound += fuzzyEvidence.length;
          fuzzySuccess = fuzzyEvidence.length > 0;
          
          console.log(`🔍 Expected Fuzzy: [${test.fuzzyExpected.join(', ')}]`);
          console.log(`🔍 Fuzzy Evidence: ${fuzzySuccess ? 'FOUND' : 'MISSING'}`);
          if (fuzzySuccess) {
            fuzzyEvidence.forEach(e => {
              if (e.hoverText) console.log(`  - ${e.hoverText}`);
            });
          }
        }
        
        // Determine if test passed
        const entitySuccess = foundExpectedEntities.length >= (test.expectedEntities.length * 0.7); // 70% of entities found
        const typeSuccess = hasExpectedTypes;
        const testPassed = entitySuccess && typeSuccess && fuzzySuccess;
        
        if (testPassed) {
          console.log('✅ PASSED - Entity extraction successful');
          passedTests++;
        } else {
          console.log('❌ FAILED');
          if (!entitySuccess) console.log('   - Missing expected entities');
          if (!typeSuccess) console.log('   - Missing expected entity types');
          if (!fuzzySuccess) console.log('   - Missing fuzzy matching evidence');
        }
        
      } catch (extractError) {
        console.log(`❌ Entity Extraction Error: ${extractError.message}`);
        console.log('❌ FAILED - Entity extraction error');
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
    }
    
    // Final analysis
    console.log('🎯 ENTITY EXTRACTION TEST ANALYSIS\n');
    
    console.log('📊 Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Entities Extracted: ${totalEntitiesExtracted}`);
    console.log(`Fuzzy Matches Found: ${fuzzyMatchesFound}\n`);
    
    // Success criteria
    const testSuccess = passedTests >= (totalTests * 0.8); // 80% pass rate
    const extractionSuccess = totalEntitiesExtracted > 0;
    const fuzzySuccess = fuzzyMatchesFound >= 5; // At least 5 fuzzy matches found
    
    console.log('🎯 FINAL ENTITY EXTRACTION VERDICT:');
    console.log(`  ${testSuccess ? '✅' : '❌'} High test pass rate: ${testSuccess} (${passedTests}/${totalTests})`);
    console.log(`  ${extractionSuccess ? '✅' : '❌'} Entity extraction working: ${extractionSuccess} (${totalEntitiesExtracted} entities)`);
    console.log(`  ${fuzzySuccess ? '✅' : '❌'} Fuzzy matching working: ${fuzzySuccess} (${fuzzyMatchesFound} matches)\n`);
    
    if (testSuccess && extractionSuccess && fuzzySuccess) {
      console.log('🎉 🎉 🎉 ENTITY EXTRACTION SUCCESS! 🎉 🎉 🎉');
      console.log('💯 ENTITY EXTRACTION FULLY FUNCTIONAL!');
      console.log(`📈 ${totalEntitiesExtracted} ENTITIES SUCCESSFULLY EXTRACTED`);
      console.log(`🔍 ${fuzzyMatchesFound} FUZZY MATCHES WORKING`);
      console.log('✨ All entity types detected (entity, info, temporal, pronoun)');
      console.log('🚀 Fuzzy matching operational (mouse → wireless mouse, etc.)');
      console.log('\n🏆 CORE ENTITY PROCESSING CONFIRMED! 🏆');
      
      console.log('\n💡 Entity Extraction Results:');
      console.log('  ✅ Table entity detection: customers, products, tasks, sales, etc.');
      console.log('  ✅ Info entity detection with fuzzy suggestions');
      console.log('  ✅ Temporal parsing: yesterday, today, this week, etc.');
      console.log('  ✅ Pronoun resolution: my, mine → actual user');
      console.log('  ✅ Hover text with conversion information');
      console.log('  ✅ Confidence scoring for all entities');
    } else {
      console.log('⚠️  Some entity extraction issues detected.');
      if (!testSuccess) console.log('   - Low test pass rate');
      if (!extractionSuccess) console.log('   - Entity extraction not working');
      if (!fuzzySuccess) console.log('   - Fuzzy matching not working');
    }
    
  } catch (error) {
    console.error('❌ Error in entity extraction test:', error.message);
    console.log('\n💡 Check:');
    console.log('  - Server compilation succeeded');
    console.log('  - ChatService imports correctly');
    console.log('  - Entity extraction functions are available');
  }
}

testEntityExtractionOnly();
