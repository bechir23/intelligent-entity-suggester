import axios from 'axios';

async function testHoverFunctionality() {
  console.log('🧪 Testing Hover Functionality for "sales of ahmed"');
  
  try {
    // Test backend entity extraction
    console.log('\n1. Testing Backend Entity Extraction...');
    const response = await axios.post('http://localhost:3001/api/chat/extract', {
      message: 'sales of ahmed'
    });
    
    console.log('✅ Backend Response Status:', response.status);
    console.log('✅ Backend Response Data:', JSON.stringify(response.data, null, 2));
    
    const entities = response.data.entities || [];
    console.log(`\n2. Found ${entities.length} entities:`);
    
    entities.forEach((entity, i) => {
      console.log(`\n   Entity ${i + 1}: "${entity.text}"`);
      console.log(`   - Type: ${entity.type}`);
      console.log(`   - Position: ${entity.startIndex}-${entity.endIndex}`);
      console.log(`   - Color: ${entity.color}`);
      console.log(`   - Hover Text: ${entity.hoverText || 'MISSING'}`);
      console.log(`   - Has Suggestions: ${entity.suggestions ? 'YES (' + entity.suggestions.length + ')' : 'NO'}`);
      if (entity.suggestions) {
        entity.suggestions.forEach((suggestion, j) => {
          console.log(`     Suggestion ${j + 1}: ${suggestion}`);
        });
      }
    });
    
    // Test if entities have proper hover data
    console.log('\n3. Hover Data Validation:');
    const entitiesWithHover = entities.filter(e => e.hoverText);
    console.log(`   - Entities with hover text: ${entitiesWithHover.length}/${entities.length}`);
    
    const entitiesWithSuggestions = entities.filter(e => e.suggestions && e.suggestions.length > 0);
    console.log(`   - Entities with suggestions: ${entitiesWithSuggestions.length}/${entities.length}`);
    
    // Test positioning
    console.log('\n4. Position Validation:');
    const text = 'sales of ahmed';
    entities.forEach((entity, i) => {
      const extractedText = text.slice(entity.startIndex, entity.endIndex);
      const matches = extractedText === entity.text;
      console.log(`   Entity ${i + 1}: "${entity.text}" -> "${extractedText}" (${matches ? 'CORRECT' : 'WRONG'})`);
    });
    
    console.log('\n✅ Hover functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing hover functionality:', error.message);
    if (error.response) {
      console.error('   Response Status:', error.response.status);
      console.error('   Response Data:', error.response.data);
    }
  }
}

testHoverFunctionality();
