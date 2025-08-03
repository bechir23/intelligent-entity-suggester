// Test attendance routing
const { extractAllTableEntities } = require('./comprehensive-entity-backend.cjs');

console.log('🧪 Testing attendance query routing...');

const query = 'Show me attendance records for Ahmed with shift and user details';
console.log('Query:', query);

const entities = extractAllTableEntities(query);
console.log('Detected entities:');
entities.forEach(e => {
  console.log(`  - "${e.text}" → table: ${e.table}, type: ${e.type}`);
});

// Simulate table detection logic
const tableEntities = entities.filter(e => e.table && e.table !== 'multiple');
const explicitTables = tableEntities.map(e => e.table);
const queryLower = query.toLowerCase();

console.log('\nExplicit tables detected:', explicitTables);
console.log('Query contains "attendance":', queryLower.includes('attendance'));

// Test primary table selection logic
let primaryTable = null;

if (queryLower.includes('attendance')) {
  primaryTable = 'attendance';
  console.log('✅ Attendance keyword detected - setting primary table to attendance');
}

console.log('Final primary table:', primaryTable);
