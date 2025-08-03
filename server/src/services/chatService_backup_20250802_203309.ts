import { SupabaseService } from './supabase.js';

// Initialize Supabase service
const supabaseService = new SupabaseService();

export interface EntityMatch {
  text: string;
  type: 'entity' | 'info' | 'temporal' | 'pronoun' | 'user_filter' | 'product_filter' | 'customer_filter' | 'status_filter' | 'location_filter';
  table?: string;
  actualValue?: string;
  color: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  hoverText?: string;
  suggestions?: string[];
  value?: string;
  isFilter?: boolean;
}

interface QueryResult {
  response: string;
  responseEntities: EntityMatch[];
  data: any[];
}

// RELATIONAL: Database cache for dynamic info detection
let productCache: { [key: string]: string[] } = {};
let userCache: { [key: string]: string[] } = {};
let customerCache: { [key: string]: string[] } = {};
let cacheInitialized = false;

// RELATIONAL: Enhanced field-value mapping with dynamic database loading
const FIELD_VALUE_PATTERNS: { [key: string]: { [key: string]: string[] } } = {
  status_values: {
    'pending': ['pending', 'waiting', 'queued', 'in queue', 'on hold'],
    'completed': ['completed', 'finished', 'done', 'closed', 'resolved', 'fulfilled'],
    'in_progress': ['in_progress', 'in progress', 'active', 'ongoing', 'working', 'processing'],
    'cancelled': ['cancelled', 'canceled', 'aborted', 'terminated', 'stopped']
  },
  priority_values: {
    'high': ['high', 'urgent', 'critical', 'important', 'priority', 'rush', 'immediate'],
    'medium': ['medium', 'normal', 'standard', 'regular', 'moderate', 'average'],
    'low': ['low', 'minor', 'optional', 'nice to have', 'later', 'future']
  },
  location_values: {
    'office': ['office', 'main office', 'security office', 'head office', 'corporate'],
    'warehouse': ['warehouse', 'main warehouse', 'storage', 'depot', 'facility'],
    'remote': ['remote', 'home', 'wfh', 'work from home', 'virtual']
  },
  // DYNAMIC: Will be populated from database
  product_values: {},
  user_values: {},
  customer_values: {},
  temporal_values: {
    'today': ['today', 'now', 'current day', 'this day'],
    'yesterday': ['yesterday', 'last day', 'previous day', 'day before'],
    'tomorrow': ['tomorrow', 'next day', 'following day', 'day after'],
    'this week': ['this week', 'current week', 'present week'],
    'last week': ['last week', 'previous week', 'past week'],
    'next week': ['next week', 'following week', 'upcoming week'],
    'this month': ['this month', 'current month', 'present month'],
    'last month': ['last month', 'previous month', 'past month'],
    'next month': ['next month', 'following month', 'upcoming month'],
    'this year': ['this year', 'current year', 'present year'],
    'last year': ['last year', 'previous year', 'past year']
  }
};

// RELATIONAL: Table mappings with relationship definitions for joins
const TABLE_FIELD_MAPPINGS = {
  users: {
    user_fields: ['id', 'full_name', 'email', 'name', 'username'],
    status_fields: ['status', 'account_status', 'user_status'],
    location_fields: ['location', 'office_location', 'address'],
    date_fields: ['created_at', 'updated_at', 'last_login'],
    relationships: {
      'products': { via: 'sales', foreign_key: 'customer_id', join_field: 'id' },
      'sales': { foreign_key: 'customer_id', join_field: 'id' },
      'tasks': { foreign_key: 'assigned_to', join_field: 'id' },
      'attendance': { foreign_key: 'employee_id', join_field: 'id' },
      'shifts': { foreign_key: 'employee_id', join_field: 'id' }
    }
  },
  tasks: {
    user_fields: ['assigned_to', 'created_by', 'assignee'],
    status_fields: ['status', 'task_status'],
    priority_fields: ['priority', 'task_priority'],
    date_fields: ['due_date', 'created_at', 'updated_at', 'completed_at', 'start_date'],
    relationships: {
      'users': { foreign_key: 'assigned_to', join_field: 'id' }
    }
  },
  sales: {
    user_fields: ['customer_id', 'sales_rep', 'created_by'],
    product_fields: ['product_id', 'item_name', 'product_name'],
    customer_fields: ['customer_id', 'customer_name'],
    status_fields: ['status', 'order_status', 'payment_status'],
    date_fields: ['sale_date', 'created_at', 'updated_at', 'delivery_date'],
    relationships: {
      'products': { foreign_key: 'product_id', join_field: 'id' },
      'customers': { foreign_key: 'customer_id', join_field: 'id' },
      'users': { foreign_key: 'sales_rep', join_field: 'id' }
    }
  },
  products: {
    product_fields: ['id', 'name', 'description', 'category', 'brand', 'model'],
    status_fields: ['status', 'availability_status'],
    date_fields: ['created_at', 'updated_at', 'release_date'],
    relationships: {
      'sales': { foreign_key: 'product_id', join_field: 'id' },
      'stock': { foreign_key: 'product_id', join_field: 'id' }
    }
  },
  stock: {
    product_fields: ['product_id', 'item_name', 'product_name'],
    location_fields: ['location', 'warehouse_location', 'storage_location'],
    date_fields: ['created_at', 'updated_at', 'last_restocked'],
    relationships: {
      'products': { foreign_key: 'product_id', join_field: 'id' }
    }
  },
  customers: {
    user_fields: ['name', 'email', 'contact_person', 'company_name'],
    location_fields: ['address', 'city', 'location', 'country'],
    date_fields: ['created_at', 'updated_at', 'last_order_date'],
    relationships: {
      'sales': { foreign_key: 'customer_id', join_field: 'id' },
      'products': { via: 'sales', foreign_key: 'customer_id', join_field: 'id' }
    }
  },
  shifts: {
    user_fields: ['employee_id', 'assigned_to'],
    location_fields: ['location', 'work_location'],
    status_fields: ['status', 'shift_status'],
    date_fields: ['shift_date', 'start_time', 'end_time', 'created_at'],
    relationships: {
      'users': { foreign_key: 'employee_id', join_field: 'id' }
    }
  },
  attendance: {
    user_fields: ['employee_id', 'user_id'],
    status_fields: ['status', 'attendance_status'],
    date_fields: ['check_in_time', 'check_out_time', 'date', 'created_at'],
    relationships: {
      'users': { foreign_key: 'employee_id', join_field: 'id' }
    }
  }
};

// RELATIONAL: Initialize database cache for fuzzy matching
const initializeCache = async () => {
  if (cacheInitialized) return;
  
  try {
    const client = supabaseService.getClient();
    
    // Load products with comprehensive fuzzy matching variations
    const { data: products } = await client.from('products').select('id, name, description, category').limit(100);
    if (products) {
      console.log(`✅ Loaded ${products.length} products into cache`);
      // Show product names for debugging
      if (products.length > 0) {
        console.log('📦 Product names in cache:', products.map(p => p.name).filter(Boolean).slice(0, 10));
      }
      
      products.forEach(product => {
        const variations = [
          product.name?.toLowerCase(),
          product.description?.toLowerCase(),
          product.category?.toLowerCase(),
          product.id?.toLowerCase()
        ].filter(Boolean);
        
        if (product.name) {
          productCache[product.name.toLowerCase()] = variations;
          FIELD_VALUE_PATTERNS.product_values[product.name.toLowerCase()] = variations;
        }
      });
      console.log(`✅ Loaded ${Object.keys(productCache).length} products into cache`);
    }
    
    // Load users with comprehensive fuzzy matching variations
    const { data: users } = await client.from('users').select('id, full_name, email, name').limit(100);
    if (users) {
      users.forEach(user => {
        const variations = [
          user.full_name?.toLowerCase(),
          user.name?.toLowerCase(),
          user.email?.toLowerCase(),
          user.id?.toLowerCase()
        ].filter(Boolean);
        
        if (user.full_name) {
          userCache[user.full_name.toLowerCase()] = variations;
          FIELD_VALUE_PATTERNS.user_values[user.full_name.toLowerCase()] = variations;
        }
        if (user.name && user.name !== user.full_name) {
          userCache[user.name.toLowerCase()] = variations;
          FIELD_VALUE_PATTERNS.user_values[user.name.toLowerCase()] = variations;
        }
      });
      console.log(`✅ Loaded ${Object.keys(userCache).length} users into cache`);
    }
    
    // Load customers with comprehensive fuzzy matching variations
    const { data: customers } = await client.from('customers').select('id, name, email, contact_person').limit(100);
    if (customers) {
      customers.forEach(customer => {
        const variations = [
          customer.name?.toLowerCase(),
          customer.email?.toLowerCase(),
          customer.contact_person?.toLowerCase(),
          customer.id?.toLowerCase()
        ].filter(Boolean);
        
        if (customer.name) {
          customerCache[customer.name.toLowerCase()] = variations;
          FIELD_VALUE_PATTERNS.customer_values[customer.name.toLowerCase()] = variations;
        }
      });
      console.log(`✅ Loaded ${Object.keys(customerCache).length} customers into cache`);
    }
    
    cacheInitialized = true;
    console.log(`🚀 RELATIONAL Cache initialized successfully`);
    
  } catch (error) {
    console.error('❌ Failed to initialize cache:', error);
  }
};

// RELATIONAL: Dynamic entity extraction with comprehensive info+entity combinations
const extractEntitiesHomogeneityFixed = async (text: string): Promise<EntityMatch[]> => {
  // Initialize cache if not done
  await initializeCache();
  
  const entities: EntityMatch[] = [];
  const processedIndices = new Set<number>();
  
  console.log(`🔍 RELATIONAL Entity Extraction: "${text}"`);
  
  // Helper functions
  const isOverlapping = (start: number, end: number) => {
    for (let i = start; i < end; i++) {
      if (processedIndices.has(i)) return true;
    }
    return false;
  };
  
  const markIndices = (start: number, end: number) => {
    for (let i = start; i < end; i++) {
      processedIndices.add(i);
    }
  };
  
  // 1. Table/Entity detection (highest priority)
  const tableTerms = ['customers', 'products', 'users', 'tasks', 'sales', 'stock', 'shifts', 'attendance'];
  tableTerms.forEach(table => {
    const regex = new RegExp(`\\b${table}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex)) {
        markIndices(startIndex, endIndex);
        entities.push({
          text: match[0],
          type: 'entity',
          table: table,
          actualValue: table,
          color: '#10B981',
          startIndex,
          endIndex,
          confidence: 0.95,
          hoverText: `Table: ${table}`
        });
        console.log(`✅ Entity: ${match[0]} → ${table}`);
      }
    }
  });
  
  // 2. RELATIONAL: Dynamic product detection with database cache
  console.log(`🔍 Checking products against cached items (${Object.keys(productCache).length} total)`);
  
  // First check direct product name matches
  Object.keys(productCache).forEach(productName => {
    const regex = new RegExp(`\\b${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex)) {
        markIndices(startIndex, endIndex);
        entities.push({
          text: match[0],
          type: 'info',
          value: productName,
          color: '#3B82F6',
          startIndex: startIndex,
          endIndex: endIndex,
          confidence: 0.95,
          isFilter: true,
          hoverText: `Product: ${productName}`
        });
        console.log(`✅ Product info: ${productName} (exact match from "${match[0]}")`);
      }
    }
  });
  
  // Then check fuzzy matches (partial words)
  const queryWords = text.toLowerCase().split(/\s+/);
  queryWords.forEach(word => {
    if (word.length >= 3) { // Only check words with 3+ characters
      Object.keys(productCache).forEach(productName => {
        if (productName.includes(word) || word.includes(productName.substring(0, Math.min(word.length, productName.length)))) {
          // Find the word position in the original text
          const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const startIndex = match.index;
            const endIndex = match.index + match[0].length;
            
            if (!isOverlapping(startIndex, endIndex)) {
              markIndices(startIndex, endIndex);
              entities.push({
                text: match[0],
                type: 'info',
                value: productName,
                color: '#3B82F6',
                startIndex: startIndex,
                endIndex: endIndex,
                confidence: 0.80,
                isFilter: true,
                hoverText: `Product: ${productName} (fuzzy match)`
              });
              console.log(`✅ Product info: ${productName} (fuzzy match from "${match[0]}")`);
            }
          }
        }
      });
    }
  });
  
  // Fallback: Static patterns for products not in cache
  const productPatterns = FIELD_VALUE_PATTERNS.product_values;
  const sortedProducts = Object.entries(productPatterns).sort((a, b) => b[0].length - a[0].length);
  
  sortedProducts.forEach(([product, patterns]) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        if (!isOverlapping(startIndex, endIndex)) {
          markIndices(startIndex, endIndex);
          entities.push({
            text: match[0],
            type: 'info',
            value: product,
            color: '#3B82F6',
            startIndex: startIndex,
            endIndex: endIndex,
            confidence: 0.70,
            isFilter: true,
            hoverText: `Product: ${product} (static pattern)`
          });
          console.log(`✅ Product info: ${product} (static pattern from "${match[0]}")`);
        }
      }
    });
  });

  // 3. RELATIONAL: Dynamic user detection with fuzzy matching
  const userPatterns = FIELD_VALUE_PATTERNS.user_values;
  const sortedUsers = Object.entries(userPatterns).sort((a, b) => b[0].length - a[0].length);
  
  sortedUsers.forEach(([user, patterns]) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        if (!isOverlapping(startIndex, endIndex)) {
          markIndices(startIndex, endIndex);
          entities.push({
            text: match[0],
            type: 'info',
            value: user,
            color: '#F59E0B',
            startIndex: startIndex,
            endIndex: endIndex,
            confidence: 0.85,
            isFilter: true,
            hoverText: `User: ${user}`
          });
          console.log(`✅ User info: ${user} (from "${match[0]}")`);
        }
      }
    });
  });

  // 4. RELATIONAL: Dynamic customer detection with fuzzy matching
  const customerPatterns = FIELD_VALUE_PATTERNS.customer_values;
  const sortedCustomers = Object.entries(customerPatterns).sort((a, b) => b[0].length - a[0].length);
  
  sortedCustomers.forEach(([customer, patterns]) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        if (!isOverlapping(startIndex, endIndex)) {
          markIndices(startIndex, endIndex);
          entities.push({
            text: match[0],
            type: 'info',
            value: customer,
            color: '#8B5CF6',
            startIndex: startIndex,
            endIndex: endIndex,
            confidence: 0.85,
            isFilter: true,
            hoverText: `Customer: ${customer}`
          });
          console.log(`✅ Customer info: ${customer} (from "${match[0]}")`);
        }
      }
    });
  });

  // 5. Temporal detection with comprehensive patterns
  const temporalPatterns = FIELD_VALUE_PATTERNS.temporal_values;
  Object.entries(temporalPatterns).forEach(([temporal, patterns]) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        if (!isOverlapping(startIndex, endIndex)) {
          markIndices(startIndex, endIndex);
          entities.push({
            text: match[0],
            type: 'temporal',
            value: temporal,
            color: '#7C3AED',
            startIndex: startIndex,
            endIndex: endIndex,
            confidence: 0.9,
            isFilter: true,
            hoverText: `Time: ${temporal}`
          });
          console.log(`✅ Temporal filter: ${temporal} (from "${match[0]}")`);
        }
      }
    });
  });
  
  // 6. Status and other filters
  const statusTerms = {
    'pending': /\bpending\b/i,
    'completed': /\bcompleted\b/i,
    'high': /\bhigh\b/i,
    'urgent': /\burgent\b/i
  };
  
  Object.entries(statusTerms).forEach(([status, regex]) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex)) {
        markIndices(startIndex, endIndex);
        entities.push({
          text: match[0],
          type: 'status_filter',
          value: status,
          color: '#EF4444',
          startIndex: startIndex,
          endIndex: endIndex,
          confidence: 0.8,
          isFilter: true,
          hoverText: `Status: ${status}`
        });
        console.log(`✅ Status filter: ${status} (from "${match[0]}")`);
      }
    }
  });
  
  console.log(`📊 Total entities extracted: ${entities.length}`);
  return entities;
};

// RELATIONAL: Generate smart table suggestions based on entity-info combinations
const generateRelationalTableSuggestions = (entities: EntityMatch[]): string[] => {
  const tables = new Set<string>();
  
  // Add explicit entity tables
  entities.forEach(entity => {
    if (entity.type === 'entity' && entity.table) {
      tables.add(entity.table);
      console.log(`📊 Table suggestion: ${entity.table} (explicit entity)`);
    }
  });
  
  // RELATIONAL: Add related tables based on info+entity combinations
  const hasProductInfo = entities.some(e => e.type === 'info' && Object.keys(FIELD_VALUE_PATTERNS.product_values).includes(e.value || ''));
  const hasUserInfo = entities.some(e => e.type === 'info' && Object.keys(FIELD_VALUE_PATTERNS.user_values).includes(e.value || ''));
  const hasCustomerInfo = entities.some(e => e.type === 'info' && Object.keys(FIELD_VALUE_PATTERNS.customer_values).includes(e.value || ''));
  
  // For "laptop from sales" - add products table when we have product info + sales entity
  if (hasProductInfo && tables.has('sales')) {
    tables.add('products');
    console.log(`📊 Added products table (product info + sales entity)`);
  }
  
  // For user info + any entity, add related tables
  if (hasUserInfo) {
    if (tables.has('tasks')) tables.add('users');
    if (tables.has('attendance')) tables.add('users');
    if (tables.has('shifts')) tables.add('users');
    console.log(`📊 Added user-related tables`);
  }
  
  // For customer info + any entity, add related tables
  if (hasCustomerInfo) {
    if (tables.has('sales')) tables.add('customers');
    if (tables.has('products')) tables.add('sales'); // Bridge table
    console.log(`📊 Added customer-related tables`);
  }
  
  return Array.from(tables);
};

// RELATIONAL: Enhanced database query with join support for info+entity combinations
const queryDatabaseWithRelationalFiltering = async (tableName: string, entities: EntityMatch[]): Promise<any[]> => {
  try {
    const client = supabaseService.getClient();
    let query = client.from(tableName).select('*');
    
    console.log(`🔍 RELATIONAL Querying ${tableName} with join support`);
    
    // Extract different types of filters
    const infoFilters = entities.filter(e => e.type === 'info');
    const entityFilters = entities.filter(e => e.type === 'entity');
    const temporalFilters = entities.filter(e => e.type === 'temporal');
    const statusFilters = entities.filter(e => e.type === 'status_filter');
    
    console.log(`📊 Found filters - Info: ${infoFilters.length}, Entity: ${entityFilters.length}, Temporal: ${temporalFilters.length}, Status: ${statusFilters.length}`);
    
    // RELATIONAL: Apply info filters with fuzzy matching
    if (infoFilters.length > 0 && TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS]) {
      const mapping = TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS];
      
      infoFilters.forEach(filter => {
        if (filter.value) {
          console.log(`🔍 Processing info filter: ${filter.value}`);
          
          // Check if this is a product info
          if (Object.keys(FIELD_VALUE_PATTERNS.product_values).includes(filter.value)) {
            if ('product_fields' in mapping) {
              const productFields = mapping.product_fields;
              productFields.forEach(field => {
                console.log(`🔍 Product filter: ${field} = ${filter.value}`);
                query = query.or(`${field}.ilike.%${filter.value}%`);
              });
            }
          }
          
          // Check if this is a user info
          if (Object.keys(FIELD_VALUE_PATTERNS.user_values).includes(filter.value)) {
            if ('user_fields' in mapping) {
              const userFields = mapping.user_fields;
              userFields.forEach(field => {
                console.log(`🔍 User filter: ${field} = ${filter.value}`);
                query = query.or(`${field}.ilike.%${filter.value}%`);
              });
            }
          }
          
          // Check if this is a customer info
          if (Object.keys(FIELD_VALUE_PATTERNS.customer_values).includes(filter.value)) {
            if ('customer_fields' in mapping) {
              const customerFields = mapping.customer_fields;
              customerFields.forEach(field => {
                console.log(`🔍 Customer filter: ${field} = ${filter.value}`);
                query = query.or(`${field}.ilike.%${filter.value}%`);
              });
            }
          }
        }
      });
    }
    
    // Apply temporal filters with comprehensive date field support
    if (temporalFilters.length > 0 && TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS]) {
      const mapping = TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS];
      
      if ('date_fields' in mapping) {
        const dateFields = mapping.date_fields;
        
        temporalFilters.forEach(filter => {
          if (filter.value) {
            console.log(`🔍 Applying temporal filter: ${filter.value}`);
            
            // Use the most appropriate date field for the table
            const primaryDateField = dateFields[0] || 'created_at';
            
            switch (filter.value) {
              case 'today':
                const today = new Date().toISOString().split('T')[0];
                query = query.gte(primaryDateField, `${today}T00:00:00Z`).lt(primaryDateField, `${today}T23:59:59Z`);
                console.log(`🗓️ Applied 'today' filter: ${primaryDateField} = ${today}`);
                break;
                
              case 'yesterday':
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                query = query.gte(primaryDateField, `${yesterdayStr}T00:00:00Z`).lt(primaryDateField, `${yesterdayStr}T23:59:59Z`);
                console.log(`🗓️ Applied 'yesterday' filter: ${primaryDateField} = ${yesterdayStr}`);
                break;
                
              case 'last week':
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                const lastWeekStr = lastWeek.toISOString().split('T')[0];
                query = query.gte(primaryDateField, `${lastWeekStr}T00:00:00Z`);
                console.log(`🗓️ Applied 'last week' filter: ${primaryDateField} >= ${lastWeekStr}`);
                break;
                
              case 'last month':
                const lastMonth = new Date();
                lastMonth.setDate(lastMonth.getDate() - 30);
                const lastMonthStr = lastMonth.toISOString().split('T')[0];
                query = query.gte(primaryDateField, `${lastMonthStr}T00:00:00Z`);
                console.log(`🗓️ Applied 'last month' filter: ${primaryDateField} >= ${lastMonthStr}`);
                break;
                
              default:
                console.log(`⚠️ Unknown temporal filter: ${filter.value}`);
            }
          }
        });
      }
    }
    
    // Apply status filters
    if (statusFilters.length > 0 && TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS]) {
      const mapping = TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS];
      if ('status_fields' in mapping) {
        const statusFields = mapping.status_fields;
        statusFilters.forEach(filter => {
          if (filter.value) {
            statusFields.forEach(field => {
              console.log(`🔍 Status filter: ${field} = ${filter.value}`);
              query = query.eq(field, filter.value);
            });
          }
        });
      }
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error(`Query error for ${tableName}:`, error);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} records in ${tableName}`);
    return data || [];
  } catch (error) {
    console.error(`Database connection error for ${tableName}:`, error);
    return [];
  }
};

// Main chat service export with RELATIONAL implementation
export const chatService = {
  extractEntitiesAndInfo: extractEntitiesHomogeneityFixed,

  buildDynamicQuery: async (tableName: string, filters: EntityMatch[]) => {
    return queryDatabaseWithRelationalFiltering(tableName, filters);
  },

  getSearchableFieldNames: (entityType: string): string[] => {
    return ['id', 'name', 'email', 'description'];
  },

  getDisplayFieldNames: (entityType: string) => {
    return { id: 'ID', name: 'Name', email: 'Email' };
  },

  generateTableSuggestion: (text: string): string[] => {
    // For compatibility, return empty array for sync calls
    return [];
  },

  generateTableSuggestionAsync: async (text: string): Promise<string[]> => {
    const entities = await extractEntitiesHomogeneityFixed(text);
    return generateRelationalTableSuggestions(entities);
  },

  processQuery: async (message: string, userName?: string): Promise<QueryResult> => {
    try {
      console.log(`🚀 RELATIONAL Query Processing: "${message}"`);
      
      const entities = await extractEntitiesHomogeneityFixed(message);
      const suggestedTables = generateRelationalTableSuggestions(entities);
      
      console.log(`📊 Suggested tables: ${suggestedTables.join(', ')}`);
      
      let allResults: any[] = [];
      const tableResults: { [key: string]: any[] } = {};
      
      for (const tableName of suggestedTables) {
        try {
          const records = await queryDatabaseWithRelationalFiltering(tableName, entities);
          tableResults[tableName] = records;
          allResults = allResults.concat(records);
          console.log(`✅ ${tableName}: ${records.length} records`);
        } catch (error) {
          console.error(`❌ Error querying ${tableName}:`, error);
          tableResults[tableName] = [];
        }
      }
      
      const totalRecords = allResults.length;
      const tablesWithData = Object.keys(tableResults).filter(table => tableResults[table].length > 0);
      
      let response = `🎯 RELATIONAL: Found ${totalRecords} records across ${tablesWithData.length} tables`;
      
      if (totalRecords > 0) {
        response += `\n\nResults:`;
        tablesWithData.forEach(table => {
          const count = tableResults[table].length;
          response += `\n• ${table}: ${count} records`;
        });
        
        // Show applied filters
        const filters = entities.filter((e: EntityMatch) => e.isFilter);
        if (filters.length > 0) {
          response += `\n\nApplied Filters:`;
          filters.forEach((filter: EntityMatch) => {
            response += `\n• ${filter.type}: ${filter.value}`;
          });
        }
      } else {
        response = `❌ No records found with applied filters. Try different keywords.`;
      }
      
      console.log(`✅ Response generated with ${entities.length} entities`);
      
      return {
        response,
        responseEntities: entities,
        data: allResults
      };
      
    } catch (error) {
      console.error('❌ Error in processQuery:', error);
      return {
        response: `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseEntities: [],
        data: []
      };
    }
  }
};

export default chatService;
