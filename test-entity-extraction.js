// Quick test for entity extraction function
const testCases = [
  'ahmed tasks',
  'my tasks', 
  'tasks pending',
  'laptop sales',
  'ahmed laptop',
  'stock inventory'
];

console.log('🧪 Testing Entity Extraction Function...\n');

// Simulated extraction function test
function testEntityExtraction(text) {
  console.log(`🔍 Testing: "${text}"`);
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(' ').filter(w => w.length > 2);
  const entities = [];
  
  // Task detection
  if (words.some(w => ['tasks', 'task'].includes(w))) {
    const taskWord = words.find(w => ['tasks', 'task'].includes(w));
    const index = lowerText.indexOf(taskWord);
    entities.push({
      text: taskWord,
      type: lowerText.includes('my') ? 'info' : 'entity',
      table: 'tasks',
      startIndex: index,
      endIndex: index + taskWord.length,
      hoverText: `Tasks: ${taskWord} found in tasks.title`
    });
  }
  
  // Customer detection
  if (words.some(w => ['ahmed', 'john', 'jane'].includes(w))) {
    const customerWord = words.find(w => ['ahmed', 'john', 'jane'].includes(w));
    const index = lowerText.indexOf(customerWord);
    entities.push({
      text: customerWord,
      type: 'entity',
      table: 'customers',
      startIndex: index,
      endIndex: index + customerWord.length,
      hoverText: `Customer: ${customerWord} found in customers.name`
    });
  }
  
  // Product detection
  if (words.some(w => ['laptop', 'mouse', 'keyboard'].includes(w))) {
    const productWord = words.find(w => ['laptop', 'mouse', 'keyboard'].includes(w));
    const index = lowerText.indexOf(productWord);
    entities.push({
      text: productWord,
      type: 'entity',
      table: 'products',
      startIndex: index,
      endIndex: index + productWord.length,
      hoverText: `Product: ${productWord} found in products.name`
    });
  }
  
  // Pronoun detection
  if (lowerText.includes('my')) {
    const index = lowerText.indexOf('my');
    entities.push({
      text: 'my',
      type: 'pronoun',
      table: 'users',
      startIndex: index,
      endIndex: index + 2,
      hoverText: 'User Context: Current logged-in user'
    });
  }
  
  console.log(`✅ Found ${entities.length} entities:`, entities.map(e => `${e.text} (${e.table})`));
  console.log('');
  
  return entities;
}

// Run tests
testCases.forEach(testEntityExtraction);

console.log('✅ Entity extraction test completed!');
console.log('🚀 Start the backend and test with "ahmed tasks" - should find 2 entities: ahmed (customers) + tasks (tasks)');
