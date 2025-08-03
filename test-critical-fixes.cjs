const backend = require('./server/comprehensive-entity-backend.cjs');

console.log('\n=== TESTING CRITICAL FIXES ===');

const queries = [
  'What product specifications are available?',
  'Find inventory of laptops and monitors in main warehouse', 
  'warehouse',
  'Show me attendance records for Ahmed with shift and user details'
];

queries.forEach(q => {
  const result = backend.processQuery(q);
  console.log(`\nQuery: ${q}`);
  console.log(`Table: ${result.filters.primaryTable}`);
  console.log(`Entities: ${result.entities.length}`);
});
