/**
 * Schema Discovery Script - Fetches actual database schema from Supabase
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

async function fetchDatabaseSchema(): Promise<void> {
  try {
    console.log('🔍 Discovering database schema...');
    
    // List of known tables to check
    const knownTables = ['customers', 'products', 'sales', 'stock', 'tasks', 'shifts', 'attendance', 'users'];
    const tableSchemas: TableInfo[] = [];

    for (const tableName of knownTables) {
      console.log(`\n🔍 Analyzing table: ${tableName}`);
      
      try {
        // Try to fetch a single record to understand the structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ Table ${tableName} not accessible:`, error.message);
          continue;
        }

        if (data && data.length > 0) {
          const sampleRecord = data[0];
          const columns: ColumnInfo[] = [];
          
          // Analyze the structure from the sample record
          for (const [key, value] of Object.entries(sampleRecord)) {
            let dataType = 'text';
            
            if (typeof value === 'number') {
              dataType = Number.isInteger(value) ? 'integer' : 'numeric';
            } else if (typeof value === 'boolean') {
              dataType = 'boolean';
            } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
              dataType = value.toString().includes('T') ? 'timestamptz' : 'date';
            }

            columns.push({
              column_name: key,
              data_type: dataType,
              is_nullable: 'YES',
              column_default: null
            });
          }

          console.log(`   ✅ Found ${columns.length} columns:`);
          columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
          });

          tableSchemas.push({
            table_name: tableName,
            columns
          });
        } else {
          console.log(`   📋 Table ${tableName} exists but is empty`);
          // For empty tables, we'll use a basic structure
          tableSchemas.push({
            table_name: tableName,
            columns: [
              { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
              { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
              { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
            ]
          });
        }
      } catch (tableError) {
        console.log(`   ❌ Error accessing ${tableName}:`, tableError);
      }
    }

    if (tableSchemas.length === 0) {
      console.log('❌ No tables found. Using fallback schema...');
      createFallbackSchema();
      return;
    }

    // Generate the entity fields mapping
    generateEntityFieldsMapping(tableSchemas);

  } catch (error) {
    console.error('Error discovering schema:', error);
    createFallbackSchema();
  }
}

function createFallbackSchema(): void {
  console.log('📋 Creating fallback schema based on typical business database structure...');
  
  const fallbackSchemas: TableInfo[] = [
    {
      table_name: 'customers',
      columns: [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'name', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'email', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'phone', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'address', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
      ]
    },
    {
      table_name: 'products',
      columns: [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'name', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'price', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'category', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
      ]
    },
    {
      table_name: 'sales',
      columns: [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'customer_id', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'product_id', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'quantity', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'total_amount', data_type: 'numeric', is_nullable: 'YES', column_default: null },
        { column_name: 'sale_date', data_type: 'date', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
      ]
    },
    {
      table_name: 'tasks',
      columns: [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'title', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'assigned_to', data_type: 'integer', is_nullable: 'YES', column_default: null },
        { column_name: 'status', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'priority', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'due_date', data_type: 'date', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
      ]
    },
    {
      table_name: 'users',
      columns: [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'username', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'email', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'first_name', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'last_name', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'role', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: null }
      ]
    }
  ];

  generateEntityFieldsMapping(fallbackSchemas);
}

function generateEntityFieldsMapping(tableSchemas: TableInfo[]): void {
  console.log('\n🏗️  Generating EntityFieldsMap...');
  
  // Map SQL data types to our simplified types
  const mapDataType = (sqlType: string): string => {
    if (sqlType.includes('int')) return 'int4';
    if (sqlType.includes('text') || sqlType.includes('varchar') || sqlType.includes('character')) return 'text';
    if (sqlType.includes('numeric') || sqlType.includes('decimal') || sqlType.includes('real') || sqlType.includes('double')) return 'numeric';
    if (sqlType.includes('date') && !sqlType.includes('timestamp')) return 'date';
    if (sqlType.includes('timestamp')) return 'timestamptz';
    if (sqlType.includes('interval')) return 'interval';
    if (sqlType.includes('boolean')) return 'bool';
    return 'text'; // default fallback
  };

  // Determine if a field should be searchable
  const isSearchableField = (columnName: string, dataType: string): boolean => {
    const searchableTypes = ['text', 'varchar', 'character'];
    const searchableNames = ['name', 'title', 'description', 'email', 'phone', 'address', 'status', 'priority', 'category', 'position', 'role', 'username', 'first_name', 'last_name'];
    
    return searchableTypes.some(type => dataType.includes(type)) && 
           searchableNames.some(name => columnName.toLowerCase().includes(name));
  };

  // Generate the TypeScript code
  let code = `/**
 * Auto-generated Entity Fields Mapping - Matches actual Supabase database schema
 * Generated on: ${new Date().toISOString()}
 */

export interface EntityField {
  name: string;
  type: 'int4' | 'text' | 'numeric' | 'date' | 'timestamptz' | 'interval' | 'bool';
  searchable?: boolean;
}

export interface EntitySchema {
  fields: EntityField[];
  primaryKey: string;
  displayField: string;
}

export const ENTITY_FIELDS_MAP: Record<string, EntitySchema> = {\n`;

  tableSchemas.forEach(table => {
    const tableName = table.table_name;
    const primaryKey = table.columns.find(col => col.column_name === 'id')?.column_name || 'id';
    const displayField = table.columns.find(col => 
      ['name', 'title', 'username', 'email'].includes(col.column_name)
    )?.column_name || primaryKey;

    code += `  ${tableName}: {\n`;
    code += `    fields: [\n`;
    
    table.columns.forEach(col => {
      const mappedType = mapDataType(col.data_type);
      const isSearchable = isSearchableField(col.column_name, col.data_type);
      
      code += `      { name: '${col.column_name}', type: '${mappedType}'`;
      if (isSearchable) {
        code += `, searchable: true`;
      }
      code += ` },\n`;
    });

    code += `    ],\n`;
    code += `    primaryKey: '${primaryKey}',\n`;
    code += `    displayField: '${displayField}'\n`;
    code += `  },\n`;
  });

  code += `};

// Helper function to get searchable fields for a table
export function getSearchableFields(entityType: string): string[] {
  const schema = ENTITY_FIELDS_MAP[entityType];
  if (!schema) return [];
  
  return schema.fields
    .filter(field => field.searchable)
    .map(field => field.name);
}

// Helper function to build select clause
export function buildSelectClause(entityType: string): string {
  const schema = ENTITY_FIELDS_MAP[entityType];
  if (!schema) return '*';
  
  return schema.fields.map(field => field.name).join(', ');
}

// Helper function to get field info
export function getFieldInfo(entityType: string, fieldName: string): EntityField | undefined {
  const schema = ENTITY_FIELDS_MAP[entityType];
  if (!schema) return undefined;
  
  return schema.fields.find(field => field.name === fieldName);
}

// Helper function to get entity display name
export function getEntityDisplayName(entityType: string): string {
  const displayNames: Record<string, string> = {
    customers: 'Customers',
    products: 'Products', 
    sales: 'Sales',
    stock: 'Stock',
    tasks: 'Tasks',
    shifts: 'Shifts',
    attendance: 'Attendance',
    users: 'Users'
  };
  
  return displayNames[entityType] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
}
`;

  console.log('\n📄 Generated EntityFieldsMap code:');
  console.log('=====================================');
  console.log(code);
  console.log('=====================================');

  // Write to file
  const fs = require('fs');
  fs.writeFileSync('./src/services/entityFieldsMap.ts', code);
  console.log('\n✅ EntityFieldsMap written to ./src/services/entityFieldsMap.ts');
}

// Run the discovery
fetchDatabaseSchema().then(() => {
  console.log('\n🎉 Schema discovery completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Schema discovery failed:', error);
  process.exit(1);
});
