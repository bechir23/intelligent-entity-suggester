/**
 * Quick Data Inspection Script - See what data actually exists
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectData(): Promise<void> {
  console.log('🔍 QUICK DATA INSPECTION');
  console.log('========================\n');

  const tables = ['customers', 'products', 'sales', 'tasks', 'users', 'attendance', 'shifts'];

  for (const table of tables) {
    console.log(`📊 ${table.toUpperCase()}`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`   ✅ ${data.length} records found`);
        console.log(`   📝 Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
        
        // Show field names
        console.log(`   🏷️  Fields: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`   📋 Table exists but is empty`);
      }
    } catch (err) {
      console.log(`   ❌ Cannot access: ${err}`);
    }
    console.log('');
  }
}

inspectData().then(() => {
  console.log('✅ Data inspection complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
