const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testSpecificIssues() {
  console.log('🔍 TESTING SPECIFIC USER ISSUES');
  console.log('================================\n');

  // Test 1: "products wireless mouse" - should not show mouse multiple times
  console.log('📝 Test 1: "products wireless mouse" - checking for duplicate "mouse"');
  try {
    const response1 = await axios.post(`${API_BASE}/chat`, {
      message: "products wireless mouse"
    });
    
    console.log('📊 Entity extraction:');
    response1.data.responseEntities.forEach(entity => {
      console.log(`   - ${entity.text} (${entity.type}) = ${entity.value || 'N/A'}`);
    });
    
    const mouseEntities = response1.data.responseEntities.filter(e => 
      e.text.toLowerCase().includes('mouse') || e.value === 'mouse'
    );
    console.log(`🎯 Mouse-related entities found: ${mouseEntities.length}`);
    console.log('✅ Expected: Should prioritize "wireless mouse" over separate "mouse"');
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: "info ahmed mouse laptop" - should get suggestions
  console.log('📝 Test 2: "info ahmed mouse laptop" - checking suggestions');
  try {
    const response2 = await axios.post(`${API_BASE}/chat`, {
      message: "info ahmed mouse laptop"
    });
    
    console.log('📊 Entity extraction:');
    response2.data.responseEntities.forEach(entity => {
      console.log(`   - ${entity.text} (${entity.type}) = ${entity.value || 'N/A'}`);
    });
    
    console.log(`🎯 Total entities found: ${response2.data.responseEntities.length}`);
    console.log(`📊 Data records returned: ${response2.data.data.length}`);
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Temporal entities - "this week tomorrow today"
  console.log('📝 Test 3: "this week tomorrow today" - checking temporal hover');
  try {
    const response3 = await axios.post(`${API_BASE}/chat`, {
      message: "this week tomorrow today"
    });
    
    console.log('📊 Entity extraction:');
    response3.data.responseEntities.forEach(entity => {
      console.log(`   - ${entity.text} (${entity.type}) = ${entity.value || 'N/A'}`);
    });
    
    const temporalEntities = response3.data.responseEntities.filter(e => e.type === 'temporal');
    console.log(`🎯 Temporal entities found: ${temporalEntities.length}`);
    console.log('✅ Expected: Should show temporal entities with hover and parentheses');
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: "my tasks" - should show "my (ahmed_hassan)"
  console.log('📝 Test 4: "my tasks" - checking user identification with parentheses');
  try {
    const response4 = await axios.post(`${API_BASE}/chat`, {
      message: "my tasks"
    });
    
    console.log('📊 Entity extraction:');
    response4.data.responseEntities.forEach(entity => {
      console.log(`   - ${entity.text} (${entity.type}) = ${entity.value || 'N/A'}`);
    });
    
    const userEntities = response4.data.responseEntities.filter(e => e.type === 'user_filter');
    console.log(`🎯 User filter entities: ${userEntities.length}`);
    if (userEntities.length > 0) {
      console.log(`✅ "my" should resolve to: ${userEntities[0].value}`);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('🏁 TESTING COMPLETE');
}

testSpecificIssues().catch(console.error);
