import { SupabaseService } from './src/services/supabase.ts';

const supabase = new SupabaseService();

async function inspectAllTables() {
  const tables = ['customers', 'products', 'sales', 'stock', 'tasks', 'shifts', 'attendance', 'users'];
  
  console.log('=== DATABASE INSPECTION FOR COMPREHENSIVE TESTING ===\n');
  
  for (const table of tables) {
    console.log(`\n=== ${table.toUpperCase()} TABLE ===`);
    try {
      const { data, error } = await supabase.supabase.from(table).select('*').limit(3);
      if (error) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(`Sample data (first 3 rows):`);
        if (data && data.length > 0) {
          console.log(JSON.stringify(data[0], null, 2));
          console.log(`\nTotal available fields: ${Object.keys(data[0]).join(', ')}`);
          
          // Count total records
          const { count } = await supabase.supabase.from(table).select('*', { count: 'exact', head: true });
          console.log(`Total records in table: ${count || 0}`);
        } else {
          console.log('No data found');
        }
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
  
  console.log('\n=== INSPECTION COMPLETE ===');
}

inspectAllTables().catch(console.error);
