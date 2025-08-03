const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Working Backend Server with Supabase...');

// Database schema mapping for dynamic field detection
const DATABASE_SCHEMA = {
  customers: {
    table: 'customers',
    searchFields: ['name', 'email', 'company', 'city'],
    numericFields: ['total_orders', 'credit_limit'],
    joins: []
  },
  products: {
    table: 'products', 
    searchFields: ['name', 'sku', 'category', 'brand'],
    numericFields: ['price', 'cost'],
    joins: []
  },
  sales: {
    table: 'sales',
    searchFields: ['sale_date'],
    numericFields: ['quantity', 'unit_price', 'total_amount'],
    joins: [
      { table: 'customers', on: 'customer_id', select: 'name as customer_name' },
      { table: 'products', on: 'product_id', select: 'name as product_name' }
    ]
  },
  stock: {
    table: 'stock',
    searchFields: ['warehouse_location', 'last_restocked'],
    numericFields: ['quantity_on_hand', 'quantity_reserved', 'reorder_level'],
    joins: [
      { table: 'products', on: 'product_id', select: 'name as product_name' }
    ]
  },
  tasks: {
    table: 'tasks',
    searchFields: ['title', 'description', 'status', 'priority'],
    numericFields: ['priority_level'],
    joins: [
      { table: 'users', on: 'assigned_to', select: 'name as assigned_to_name' }
    ]
  },
  users: {
    table: 'users',
    searchFields: ['name', 'email', 'role', 'department'],
    numericFields: [],
    joins: []
  },
  shifts: {
    table: 'shifts',
    searchFields: ['shift_date', 'shift_type'],
    numericFields: ['duration_hours'],
    joins: [
      { table: 'users', on: 'user_id', select: 'name as user_name' }
    ]
  },
  attendance: {
    table: 'attendance',
    searchFields: ['clock_in', 'clock_out', 'date'],
    numericFields: ['hours_worked'],
    joins: [
      { table: 'users', on: 'user_id', select: 'name as user_name' }
    ]
  }
};

// Entity extraction endpoint
app.post('/api/chat/extract', (req, res) => {
  const { message } = req.body;
  console.log('🔍 Extracting entities for:', message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const entities = [];
  const text = message.toLowerCase();
  
  // ====== DYNAMIC ENTITY DETECTION FOR ALL TABLES ======
  
  // Check each table from our schema
  Object.keys(DATABASE_SCHEMA).forEach(tableKey => {
    const schema = DATABASE_SCHEMA[tableKey];
    
    // Check if text contains table name or related keywords
    const tableKeywords = [tableKey, tableKey.slice(0, -1)]; // plural and singular
    
    // Add specific keywords per table
    const additionalKeywords = {
      customers: ['customer', 'client', 'clients', 'ahmed', 'ahmad'],
      products: ['product', 'item', 'items', 'laptop', 'laptops'],
      sales: ['sale', 'selling', 'sold', 'revenue', 'transaction'],
      stock: ['inventory', 'warehouse', 'quantity'],
      tasks: ['task', 'todo', 'assignment', 'job'],
      users: ['user', 'employee', 'staff', 'person'],
      shifts: ['shift', 'schedule', 'roster'],
      attendance: ['attendance', 'clockin', 'timesheet']
    };
    
    const allKeywords = [...tableKeywords, ...(additionalKeywords[tableKey] || [])];
    
    allKeywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        // Determine entity type based on context
        let entityType = 'entity';
        if (tableKey === 'stock' && (keyword === 'stock' || keyword === 'inventory')) {
          entityType = 'info';
        }
        
        entities.push({
          text: keyword,
          type: entityType,
          table: schema.table,
          color: getTableColor(schema.table),
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${schema.table} table`
        });
      }
    });
  });
  
  // ====== PRONOUNS (USER CONTEXT) ======
  const pronounPatterns = ['my', 'me', 'i', 'mine', 'myself'];
  pronounPatterns.forEach(pronoun => {
    const index = text.indexOf(pronoun);
    if (index !== -1) {
      entities.push({
        text: pronoun,
        type: 'pronoun',
        table: 'users',
        color: '#DC2626',
        startIndex: index,
        endIndex: index + pronoun.length,
        confidence: 0.9,
        hoverText: 'User Context: Current logged-in user'
      });
    }
  });
  
  // ====== DYNAMIC NUMERIC FILTERS FOR ALL TABLES ======
  const numericPattern = /(?:below|above|over|under|less than|greater than|more than|exactly)\s*(\d+)/gi;
  let match;
  while ((match = numericPattern.exec(text)) !== null) {
    const operator = match[0].toLowerCase().replace(/\s*\d+/, '').trim();
    const value = parseInt(match[1]);
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    // Dynamic field detection based on context
    let field = 'id';
    let table = 'products';
    
    // Find the most relevant table and field based on context
    Object.keys(DATABASE_SCHEMA).forEach(tableKey => {
      const schema = DATABASE_SCHEMA[tableKey];
      
      // Check if this table is mentioned in the text
      const tableKeywords = [tableKey, tableKey.slice(0, -1)];
      const hasTableContext = tableKeywords.some(keyword => text.includes(keyword));
      
      if (hasTableContext && schema.numericFields.length > 0) {
        table = schema.table;
        field = schema.numericFields[0]; // Use first numeric field as default
        
        // More specific field mapping based on context
        if (schema.table === 'stock' && text.includes('quantity')) {
          field = 'quantity_on_hand';
        } else if (schema.table === 'sales' && (text.includes('amount') || text.includes('revenue'))) {
          field = 'total_amount';
        } else if (schema.table === 'products' && text.includes('price')) {
          field = 'price';
        }
      }
    });
    
    entities.push({
      text: match[0],
      type: 'numeric_filter',
      table: table,
      color: '#DC2626',
      value: value,
      operator: operator,
      field: field,
      startIndex: startIndex,
      endIndex: endIndex,
      confidence: 0.9,
      hoverText: `Numeric Filter: ${field} ${operator} ${value}`,
      isFilter: true
    });
  }
  
  console.log('✅ Returning', entities.length, 'entities:', entities.map(e => `${e.text}(${e.type}:${e.table})`));
  res.json({ entities });
});

// Dynamic query processing endpoint with Supabase
app.post('/api/chat/query', async (req, res) => {
  const { message, userName } = req.body;
  console.log('🔍 Processing query:', message, 'for user:', userName);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const text = message.toLowerCase();
  let responseEntities = [];
  let sqlQuery = '';
  let data = [];
  
  try {
    // ====== DYNAMIC QUERY PROCESSING FOR ALL TABLES ======
    
    // Detect which table(s) are referenced
    let primaryTable = null;
    let detectedEntities = [];
    
    Object.keys(DATABASE_SCHEMA).forEach(tableKey => {
      const schema = DATABASE_SCHEMA[tableKey];
      const tableKeywords = [tableKey, tableKey.slice(0, -1)];
      
      const hasTableMatch = tableKeywords.some(keyword => text.includes(keyword));
      if (hasTableMatch) {
        primaryTable = schema;
        detectedEntities.push({
          text: tableKeywords.find(k => text.includes(k)),
          type: 'entity',
          table: schema.table,
          color: getTableColor(schema.table)
        });
      }
    });
    
    if (!primaryTable) {
      // Fallback to general search
      return res.json({
        success: false,
        response: 'No specific table detected. Try queries like: "customers", "products", "sales", "tasks", etc.',
        responseEntities: [],
        data: [],
        sqlQuery: '-- No table detected',
        entityCount: 0,
        recordCount: 0
      });
    }
    
    // ====== BUILD DYNAMIC SUPABASE QUERY ======
    
    let query = supabase.from(primaryTable.table).select('*');
    
    // Add joins if available
    if (primaryTable.joins && primaryTable.joins.length > 0) {
      const joinSelects = primaryTable.joins.map(join => join.select).join(', ');
      query = supabase.from(primaryTable.table).select(`*, ${joinSelects}`);
    }
    
    // Add search filters
    const searchTerms = text.split(' ').filter(word => word.length > 2);
    searchTerms.forEach(term => {
      if (primaryTable.searchFields.length > 0) {
        // Use ilike for case-insensitive search on first search field
        query = query.ilike(primaryTable.searchFields[0], `%${term}%`);
      }
    });
    
    // Add numeric filters
    const numericMatch = text.match(/(?:below|above|over|under|less than|greater than)\s*(\d+)/);
    if (numericMatch && primaryTable.numericFields.length > 0) {
      const threshold = parseInt(numericMatch[1]);
      const operator = numericMatch[0].split(' ')[0];
      const field = primaryTable.numericFields[0]; // Use first numeric field
      
      if (operator === 'below' || operator === 'under') {
        query = query.lt(field, threshold);
      } else {
        query = query.gt(field, threshold);
      }
      
      // Add numeric filter entity
      detectedEntities.push({
        text: numericMatch[0],
        type: 'numeric_filter',
        table: primaryTable.table,
        color: '#DC2626',
        field: field,
        isFilter: true
      });
    }
    
    // Execute query
    const { data: queryData, error } = await query.limit(50);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database query failed', details: error.message });
    }
    
    data = queryData || [];
    responseEntities = detectedEntities;
    sqlQuery = `-- Supabase query on ${primaryTable.table} table with filters`;
    
    console.log('✅ Query processed:', message);
    console.log('📊 SQL:', sqlQuery);
    console.log('🔍 Entities:', responseEntities.length, 'found');
    console.log('📋 Records:', data.length, 'returned');
    
    res.json({
      success: true,
      response: `Found ${data.length} results for "${message}"`,
      responseEntities,
      data,
      sqlQuery: sqlQuery,
      entityCount: responseEntities.length,
      recordCount: data.length
    });
    
  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ error: 'Query processing failed', details: error.message });
  }
});

// Helper function to get table colors
function getTableColor(table) {
  const colors = {
    customers: '#059669',
    products: '#2563EB', 
    sales: '#7C3AED',
    stock: '#0891B2',
    tasks: '#EA580C',
    users: '#DC2626',
    shifts: '#10B981',
    attendance: '#F59E0B'
  };
  return colors[table] || '#6B7280';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Working Backend API with Supabase',
    database: 'Connected to Supabase'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Working Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Entity extraction: POST http://localhost:${PORT}/api/chat/extract`);
  console.log(`🔍 Query processing: POST http://localhost:${PORT}/api/chat/query`);
  console.log('✅ Ready to receive requests with Supabase integration!');
});
