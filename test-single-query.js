// Quick test for "sales last month by product" to verify product detection

const queryText = "sales last month by product";
console.log(`🔍 Testing query: "${queryText}"`);

// Test the simple word detection logic locally
const words = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 1);
console.log('📝 Words detected:', words);

// Test product keyword detection
const productKeywords = ['laptop', 'laptops', 'mouse', 'keyboard', 'monitor', 'webcam', 'hub', 'cable', 'charger', 'phone', 'tablet', 'product', 'products', 'item', 'items'];
const productMatch = words.find(word => productKeywords.some(p => word.includes(p)));
console.log('🛍️ Product match:', productMatch);

// Test sales keyword detection
const salesKeywords = ['sales', 'sale', 'revenue', 'selling', 'sold', 'transaction', 'purchase', 'order'];
const salesMatch = words.find(word => salesKeywords.includes(word));
console.log('💰 Sales match:', salesMatch);

// Test temporal detection
const temporalPatterns = ['last month', 'this month', 'past month', 'previous month', 'last week', 'this week'];
const temporalMatch = temporalPatterns.find(pattern => queryText.includes(pattern));
console.log('📅 Temporal match:', temporalMatch);

console.log('\n✅ Expected entities:');
console.log('  - sales (entity, table: sales)');
console.log('  - product (entity, table: products)');
console.log('  - last month (temporal filter)');
console.log('  - Should trigger: sales JOIN products query');
