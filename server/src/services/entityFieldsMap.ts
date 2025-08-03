/**
 * Auto-generated Entity Fields Mapping - Matches actual Supabase database schema
 * Generated on: 2025-08-02 based on live database inspection
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

export const ENTITY_FIELDS_MAP: Record<string, EntitySchema> = {
  customers: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'name', type: 'text', searchable: true },
      { name: 'email', type: 'text', searchable: true },
      { name: 'phone', type: 'text', searchable: true },
      { name: 'company', type: 'text', searchable: true },
      { name: 'address', type: 'text', searchable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'name'
  },
  products: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'name', type: 'text', searchable: true },
      { name: 'description', type: 'text', searchable: true },
      { name: 'price', type: 'numeric' },
      { name: 'sku', type: 'text', searchable: true },
      { name: 'category', type: 'text', searchable: true },
      { name: 'stock_quantity', type: 'int4' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'name'
  },
  sales: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'customer_id', type: 'text' },
      { name: 'product_id', type: 'text' },
      { name: 'quantity', type: 'int4' },
      { name: 'unit_price', type: 'numeric' },
      { name: 'total_amount', type: 'numeric' },
      { name: 'sale_date', type: 'timestamptz' },
      { name: 'status', type: 'text', searchable: true },
      { name: 'notes', type: 'text', searchable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'id'
  },
  stock: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'product_id', type: 'text' },
      { name: 'warehouse_location', type: 'text', searchable: true },
      { name: 'quantity_available', type: 'int4' },
      { name: 'reserved_quantity', type: 'int4' },
      { name: 'reorder_level', type: 'int4' },
      { name: 'last_restocked', type: 'timestamptz' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'id'
  },
  tasks: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text', searchable: true },
      { name: 'description', type: 'text', searchable: true },
      { name: 'assigned_to', type: 'text' },
      { name: 'status', type: 'text', searchable: true },
      { name: 'priority', type: 'text', searchable: true },
      { name: 'due_date', type: 'timestamptz' },
      { name: 'completed_at', type: 'text' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'title'
  },
  shifts: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'user_id', type: 'text' },
      { name: 'shift_date', type: 'date' },
      { name: 'start_time', type: 'text' },
      { name: 'end_time', type: 'text' },
      { name: 'break_duration', type: 'int4' },
      { name: 'location', type: 'text', searchable: true },
      { name: 'notes', type: 'text', searchable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'id'
  },
  attendance: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'user_id', type: 'text' },
      { name: 'shift_id', type: 'text' },
      { name: 'clock_in', type: 'timestamptz' },
      { name: 'clock_out', type: 'timestamptz' },
      { name: 'break_start', type: 'timestamptz' },
      { name: 'break_end', type: 'timestamptz' },
      { name: 'status', type: 'text', searchable: true },
      { name: 'notes', type: 'text', searchable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'search_vector', type: 'text' }
    ],
    primaryKey: 'id',
    displayField: 'id'
  },
  users: {
    fields: [
      { name: 'id', type: 'text' },
      { name: 'email', type: 'text', searchable: true },
      { name: 'full_name', type: 'text', searchable: true },
      { name: 'role', type: 'text', searchable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' }
    ],
    primaryKey: 'id',
    displayField: 'full_name'
  }
};

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
