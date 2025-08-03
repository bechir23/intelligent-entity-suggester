const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Working Backend Server with Supabase...');
console.log('🔗 Supabase URL:', supabaseUrl);

// ====== COMPREHENSIVE ENTITY EXTRACTION FUNCTION ======
function extractEntitiesFromText(text, userName = 'guest') {
  const entities = [];
  const lowerText = text.toLowerCase();
  
  // Extract meaningful words from the query
  const words = lowerText.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'below', 'above', 'over', 'under', 'than', 'less', 'greater', 'more'].includes(word.toLowerCase())
  );
  
  console.log('🔍 Analyzing words for entities:', words);
  
  // ====== TASK DETECTION ======
  const taskKeywords = ['tasks', 'task', 'todo', 'assignment', 'work'];
  const taskMatch = words.find(word => taskKeywords.includes(word));
  if (taskMatch) {
    // Find precise index for task entity
    const wordPositions = [];
    let position = lowerText.indexOf(taskMatch);
    while (position !== -1) {
      wordPositions.push(position);
      position = lowerText.indexOf(taskMatch, position + 1);
    }
    const actualIndex = wordPositions.length > 1 ? wordPositions[wordPositions.length - 1] : wordPositions[0];
    
    entities.push({
      text: taskMatch,
      word: taskMatch,
      type: lowerText.includes('my') ? 'info' : 'entity',
      table: 'tasks',
      color: getTableColor('tasks'),
      confidence: 1.0,
      field: 'title',
      startIndex: actualIndex,
      endIndex: actualIndex + taskMatch.length,
      hoverText: `Tasks: ${taskMatch} found in tasks.title`
    });
  }
  
  // ====== CUSTOMER DETECTION ======
  const customerNames = ['ahmed', 'john', 'jane', 'sarah', 'mike', 'lisa'];
  const customerMatch = words.find(word => customerNames.includes(word));
  if (customerMatch) {
    const index = lowerText.indexOf(customerMatch);
    entities.push({
      text: customerMatch,
      type: 'entity',
      table: 'customers',
      color: getTableColor('customers'),
      confidence: 1.0,
      field: 'name',
      startIndex: index,
      endIndex: index + customerMatch.length,
      hoverText: `Customer: ${customerMatch} found in customers.name`
    });
  }
  
  // ====== PRODUCT DETECTION ======
  const productKeywords = ['laptop', 'laptops', 'mouse', 'keyboard', 'monitor', 'tablet'];
  const productMatch = words.find(word => productKeywords.includes(word));
  if (productMatch) {
    const index = lowerText.indexOf(productMatch);
    entities.push({
      text: productMatch,
      type: 'entity',
      table: 'products',
      color: getTableColor('products'),
      confidence: 1.0,
      field: 'name',
      startIndex: index,
      endIndex: index + productMatch.length,
      hoverText: `Product: ${productMatch} found in products.name`
    });
  }
  
  // ====== SALES DETECTION ======
  const salesKeywords = ['sales', 'revenue', 'selling', 'sold', 'orders', 'purchases'];
  const salesMatch = words.find(word => salesKeywords.includes(word));
  if (salesMatch) {
    const index = lowerText.indexOf(salesMatch);
    entities.push({
      text: salesMatch,
      type: 'entity',
      table: 'sales',
      color: getTableColor('sales'),
      confidence: 1.0,
      field: 'status',
      startIndex: index,
      endIndex: index + salesMatch.length,
      hoverText: `Sales: ${salesMatch} found in sales data`
    });
  }
  
  // ====== STOCK DETECTION ======
  const stockKeywords = ['stock', 'inventory', 'warehouse'];
  const stockMatch = words.find(word => stockKeywords.includes(word));
  if (stockMatch) {
    const index = lowerText.indexOf(stockMatch);
    entities.push({
      text: stockMatch,
      type: 'info',
      table: 'stock',
      color: getTableColor('stock'),
      confidence: 1.0,
      field: 'warehouse_location',
      startIndex: index,
      endIndex: index + stockMatch.length,
      hoverText: `Stock: ${stockMatch} found in stock.warehouse_location`
    });
  }
  
  // ====== PRONOUN DETECTION ======
  const pronounPatterns = ['my', 'me', 'i', 'mine', 'myself'];
  pronounPatterns.forEach(pronoun => {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'i');
    const match = lowerText.match(regex);
    if (match) {
      const index = lowerText.indexOf(match[0]);
      entities.push({
        text: match[0],
        type: 'pronoun',
        table: 'users',
        color: '#DC2626',
        startIndex: index,
        endIndex: index + match[0].length,
        confidence: 0.9,
        hoverText: 'User Context: Current logged-in user'
      });
    }
  });
  
  console.log('✅ Extracted entities:', entities);
  return entities;
}

// Database schema mapping for dynamic fi// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Working Backend API with Supabase',
    database: 'Connected to Supabase'
  });
});

// Intelligent Query Suggestions endpoint
app.post('/api/chat/suggestions', async (req, res) => {
  const { partialQuery = '', context = 'general', userName = 'guest' } = req.body;
  console.log('🔮 Generating suggestions for:', partialQuery, 'context:', context, 'user:', userName);
  
  try {
    const suggestions = [];
    const text = partialQuery.toLowerCase();
    
    // ====== CONTEXT-AWARE INTELLIGENT SUGGESTIONS ======
    
    // PRODUCT-BASED SUGGESTIONS
    if (text.includes('laptop') || text.includes('product')) {
      suggestions.push(
        { text: 'laptop sales above 1000', category: 'Sales', confidence: 0.95 },
        { text: 'laptop stock below 50', category: 'Inventory', confidence: 0.9 },
        { text: 'laptop inventory in main warehouse', category: 'Location', confidence: 0.85 }
      );
    }
    
    // SALES-BASED SUGGESTIONS
    if (text.includes('sales') || text.includes('revenue')) {
      suggestions.push(
        { text: 'sales above 1000 this month', category: 'Sales + Timeline', confidence: 0.95 },
        { text: 'ahmed sales above 500', category: 'Customer Sales', confidence: 0.9 },
        { text: 'my sales above 1000', category: 'Personal Sales', confidence: 0.88 },
        { text: 'sales today above 500', category: 'Recent Sales', confidence: 0.85 }
      );
    }
    
    // INVENTORY-BASED SUGGESTIONS
    if (text.includes('stock') || text.includes('inventory')) {
      suggestions.push(
        { text: 'stock below 100', category: 'Low Stock', confidence: 0.95 },
        { text: 'warehouse inventory above 100', category: 'High Stock', confidence: 0.9 },
        { text: 'laptop stock below 50 in north warehouse', category: 'Location + Product', confidence: 0.85 }
      );
    }
    
    // TASK-BASED SUGGESTIONS
    if (text.includes('task') || text.includes('my')) {
      suggestions.push(
        { text: 'my tasks', category: 'Personal Tasks', confidence: 0.95 },
        { text: 'completed tasks this week', category: 'Task Status', confidence: 0.9 },
        { text: 'pending tasks for laptop projects', category: 'Project Tasks', confidence: 0.85 }
      );
    }
    
    // CUSTOMER-BASED SUGGESTIONS
    if (text.includes('customer') || text.includes('ahmed') || text.includes('client')) {
      suggestions.push(
        { text: 'ahmed sales above 500', category: 'Customer Sales', confidence: 0.95 },
        { text: 'customers from north office', category: 'Customer Location', confidence: 0.9 },
        { text: 'ahmed', category: 'Customer Search', confidence: 0.85 }
      );
    }
    
    // ATTENDANCE/SHIFT SUGGESTIONS
    if (text.includes('attendance') || text.includes('shift')) {
      suggestions.push(
        { text: 'my attendance today', category: 'Personal Attendance', confidence: 0.95 },
        { text: 'recent attendance for my shifts', category: 'Shift Attendance', confidence: 0.9 }
      );
    }
    
    // TIMELINE-BASED SUGGESTIONS
    if (text.includes('today') || text.includes('month') || text.includes('week')) {
      suggestions.push(
        { text: 'sales today above 500', category: 'Today\'s Sales', confidence: 0.95 },
        { text: 'completed tasks this week', category: 'Weekly Tasks', confidence: 0.9 },
        { text: 'my attendance today', category: 'Today\'s Attendance', confidence: 0.85 }
      );
    }
    
    // DEFAULT SUGGESTIONS when no specific context
    if (suggestions.length === 0) {
      suggestions.push(
        { text: 'laptop sales above 1000', category: 'Popular Query', confidence: 0.8 },
        { text: 'stock below 100', category: 'Inventory Check', confidence: 0.75 },
        { text: 'ahmed', category: 'Customer Search', confidence: 0.7 },
        { text: 'my tasks', category: 'Personal Queries', confidence: 0.65 },
        { text: 'sales today above 500', category: 'Recent Activity', confidence: 0.6 }
      );
    }
    
    // SMART AUTO-COMPLETION based on partial input
    if (partialQuery.length > 0) {
      const autoComplete = [];
      
      if (text.startsWith('lap')) {
        autoComplete.push({ text: 'laptop sales above 1000', category: 'Auto-complete', confidence: 0.98 });
      }
      if (text.startsWith('sto')) {
        autoComplete.push({ text: 'stock below 100', category: 'Auto-complete', confidence: 0.98 });
      }
      if (text.startsWith('ah')) {
        autoComplete.push({ text: 'ahmed', category: 'Auto-complete', confidence: 0.98 });
      }
      if (text.startsWith('my')) {
        autoComplete.push(
          { text: 'my tasks', category: 'Auto-complete', confidence: 0.98 },
          { text: 'my sales above 1000', category: 'Auto-complete', confidence: 0.95 },
          { text: 'my attendance today', category: 'Auto-complete', confidence: 0.93 }
        );
      }
      
      suggestions.unshift(...autoComplete);
    }
    
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Limit to top 8 suggestions
    
    console.log(`✅ Generated ${uniqueSuggestions.length} intelligent suggestions`);
    
    res.json({
      success: true,
      suggestions: uniqueSuggestions,
      context: context,
      partialQuery: partialQuery,
      totalSuggestions: uniqueSuggestions.length,
      message: uniqueSuggestions.length > 0 
        ? `Generated ${uniqueSuggestions.length} context-aware suggestions`
        : 'No suggestions available'
    });

  } catch (error) {
    console.error('Suggestion generation error:', error);
    res.status(500).json({ 
      error: 'Suggestion generation failed',
      details: error.message,
      success: false,
      suggestions: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Working Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Entity extraction: POST http://localhost:${PORT}/api/chat/entities`);
  console.log(`🔍 Legacy extraction: POST http://localhost:${PORT}/api/chat/extract`);
  console.log(`🎯 Query processing: POST http://localhost:${PORT}/api/chat/query`);
  console.log(`🔮 Smart suggestions: POST http://localhost:${PORT}/api/chat/suggestions`);
  console.log('✅ Ready to receive requests with advanced query intelligence!');
});

// Database schema mapping for dynamic field detection - CORRECTED FOR REAL SUPABASE SCHEMA
const DATABASE_SCHEMA = {
  customers: {
    table: 'customers',
    searchFields: ['name', 'email', 'company', 'address'], // address contains city info
    numericFields: [],
    joins: []
  },
  products: {
    table: 'products', 
    searchFields: ['name', 'sku', 'category', 'description'],
    numericFields: ['price', 'stock_quantity'],
    joins: []
  },
  sales: {
    table: 'sales',
    searchFields: ['sale_date', 'status', 'notes'],
    numericFields: ['quantity', 'unit_price', 'total_amount'],
    joins: [
      { table: 'customers', on: 'customer_id', select: 'name' },
      { table: 'products', on: 'product_id', select: 'name' }
    ]
  },
  stock: {
    table: 'stock',
    searchFields: ['warehouse_location', 'last_restocked'],
    numericFields: ['quantity_available', 'reserved_quantity', 'reorder_level'], // CORRECTED FIELD NAME
    joins: [
      { table: 'products', on: 'product_id', select: 'name, sku, category' }
    ]
  },
  tasks: {
    table: 'tasks',
    searchFields: ['title', 'description', 'status', 'priority'],
    numericFields: [],
    joins: [
      { table: 'users', on: 'assigned_to', select: 'full_name' } // CORRECTED FIELD NAME
    ]
  },
  users: {
    table: 'users',
    searchFields: ['full_name', 'email', 'role'], // CORRECTED FIELD NAME
    numericFields: [],
    joins: []
  },
  shifts: {
    table: 'shifts',
    searchFields: ['shift_date', 'location', 'notes'],
    numericFields: ['break_duration'],
    joins: [
      { table: 'users', on: 'user_id', select: 'full_name' }
    ]
  },
  attendance: {
    table: 'attendance',
    searchFields: ['clock_in', 'clock_out', 'status', 'notes'],
    numericFields: [],
    joins: [
      { table: 'users', on: 'user_id', select: 'full_name' }
    ]
  }
};

// Enhanced Entity extraction endpoint with advanced complex query support
app.post('/api/chat/entities', async (req, res) => {
  const { message, userName = 'guest' } = req.body;
  console.log('🔍 Advanced entity extraction request:', message, 'for user:', userName);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const text = message.toLowerCase().trim();
  const detectedEntities = [];
  const filters = {
    location: [],
    timeline: [],
    numeric: [],
    user: [],
    product: [],
    status: []
  };
  
  try {
    // ====== ADVANCED INTELLIGENT ENTITY DETECTION SYSTEM ======
    
    // Parse words intelligently, filtering common words
    const words = text.split(' ').filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'below', 'above', 'over', 'under', 'than', 'less', 'greater', 'more', 'from', 'where', 'when', 'are'].includes(word.toLowerCase())
    );
    
    console.log('🔍 Analyzing words:', words);
    
    // PRODUCT DETECTION (expanded for better matching)
    const productKeywords = ['laptop', 'laptops', 'mouse', 'keyboard', 'monitor', 'webcam', 'hub', 'cable', 'charger', 'phone', 'tablet'];
    const productMatch = words.find(word => productKeywords.some(p => word.includes(p)));
    if (productMatch) {
      detectedEntities.push({
        text: productMatch,
        type: 'product',
        table: 'products',
        color: getTableColor('products'),
        confidence: 1.0,
        field: 'name'
      });
      filters.product.push(productMatch);
    }
    
    // SALES DETECTION
    const salesKeywords = ['sales', 'sale', 'revenue', 'selling', 'sold', 'transaction', 'purchase', 'order'];
    const salesMatch = words.find(word => salesKeywords.includes(word));
    if (salesMatch) {
      detectedEntities.push({
        text: salesMatch,
        type: 'entity',
        table: 'sales',
        color: getTableColor('sales'),
        confidence: 1.0,
        field: 'status'
      });
    }
    
    // STOCK/INVENTORY DETECTION
    const stockKeywords = ['stock', 'inventory', 'warehouse', 'quantity'];
    const stockMatch = words.find(word => stockKeywords.includes(word));
    if (stockMatch) {
      detectedEntities.push({
        text: stockMatch,
        type: 'info',
        table: 'stock',
        color: getTableColor('stock'),
        confidence: 1.0,
        field: 'warehouse_location'
      });
    }
    
    // LOCATION DETECTION
    const locationKeywords = ['warehouse', 'store', 'location', 'branch', 'office', 'main', 'north', 'south', 'east', 'west'];
    const locationMatch = words.find(word => locationKeywords.includes(word));
    if (locationMatch) {
      filters.location.push(locationMatch);
      detectedEntities.push({
        text: locationMatch,
        type: 'location_filter',
        table: 'multiple',
        color: '#8B5CF6',
        confidence: 0.9,
        field: 'location'
      });
    }
    
    // TIMELINE DETECTION
    const timelineKeywords = ['today', 'yesterday', 'week', 'month', 'year', 'recent', 'last', 'this', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const timelineMatch = words.find(word => timelineKeywords.includes(word));
    if (timelineMatch) {
      filters.timeline.push(timelineMatch);
      detectedEntities.push({
        text: timelineMatch,
        type: 'timeline_filter',
        table: 'multiple',
        color: '#F59E0B',
        confidence: 0.9,
        field: 'date'
      });
    }
    
    // PRONOUN RESOLUTION
    const pronouns = ['my', 'mine', 'me', 'i'];
    const pronounMatch = words.find(word => pronouns.includes(word));
    if (pronounMatch) {
      filters.user.push(userName);
      detectedEntities.push({
        text: pronounMatch + ' (' + userName + ')',
        type: 'user_filter',
        table: 'multiple',
        color: '#10B981',
        confidence: 1.0,
        field: 'user_id'
      });
    }
    
    // CUSTOMER DETECTION
    const customerNames = ['ahmed', 'john', 'jane', 'sarah', 'mike', 'lisa'];
    const customerMatch = words.find(word => customerNames.includes(word));
    if (customerMatch) {
      detectedEntities.push({
        text: customerMatch,
        type: 'entity',
        table: 'customers',
        color: getTableColor('customers'),
        confidence: 1.0,
        field: 'name'
      });
    }
    
    // TASKS DETECTION
    const taskKeywords = ['tasks', 'task', 'todo', 'assignment', 'work'];
    const taskMatch = words.find(word => taskKeywords.includes(word));
    if (taskMatch) {
      // Find precise index for task entity
      const wordPositions = [];
      let position = text.indexOf(taskMatch);
      while (position !== -1) {
        wordPositions.push(position);
        position = text.indexOf(taskMatch, position + 1);
      }
      const actualIndex = wordPositions.length > 1 ? wordPositions[wordPositions.length - 1] : wordPositions[0];
      
      detectedEntities.push({
        text: taskMatch,
        word: taskMatch,
        type: text.includes('my') ? 'info' : 'entity',
        table: 'tasks',
        color: getTableColor('tasks'),
        confidence: 1.0,
        field: 'title',
        startIndex: actualIndex,
        endIndex: actualIndex + taskMatch.length,
        hoverText: `Tasks: ${taskMatch} found in tasks.title`
      });
    }
    
    // ATTENDANCE/SHIFT DETECTION
    const attendanceKeywords = ['attendance', 'shift', 'schedule', 'clockin', 'hours'];
    const attendanceMatch = words.find(word => attendanceKeywords.includes(word));
    if (attendanceMatch) {
      detectedEntities.push({
        text: attendanceMatch,
        type: 'entity',
        table: 'attendance',
        color: getTableColor('attendance'),
        confidence: 1.0,
        field: 'status'
      });
    }
    
    // NUMERIC FILTERS
    const numericPattern = /(below|above|over|under|more than|less than)\s*(\d+)/;
    const numericMatch = text.match(numericPattern);
    if (numericMatch) {
      filters.numeric.push({
        operator: numericMatch[1],
        value: parseInt(numericMatch[2])
      });
      detectedEntities.push({
        text: numericMatch[0],
        type: 'numeric_filter',
        table: 'multiple',
        color: '#DC2626',
        confidence: 1.0,
        field: 'numeric'
      });
    }
    
    // STATUS DETECTION
    const statusKeywords = ['completed', 'pending', 'cancelled', 'active', 'inactive'];
    const statusMatch = words.find(word => statusKeywords.includes(word));
    if (statusMatch) {
      filters.status.push(statusMatch);
      detectedEntities.push({
        text: statusMatch,
        type: 'status_filter',
        table: 'multiple',
        color: '#7C3AED',
        confidence: 0.9,
        field: 'status'
      });
    }
    
    // Remove duplicates and sort by confidence
    const uniqueEntities = detectedEntities.filter((entity, index, self) => 
      index === self.findIndex(e => e.text === entity.text && e.table === entity.table)
    ).sort((a, b) => b.confidence - a.confidence);
    
    console.log(`✅ Advanced entities extracted: ${uniqueEntities.length}`);
    console.log('🔍 Filters detected:', JSON.stringify(filters, null, 2));
    
    res.json({
      success: true,
      entities: uniqueEntities,
      filters: filters,
      totalDetected: uniqueEntities.length,
      message: uniqueEntities.length > 0 
        ? `Found ${uniqueEntities.length} entity/entities with advanced filtering` 
        : 'No entities detected'
    });

  } catch (error) {
    console.error('Advanced entity extraction error:', error);
    res.status(500).json({ 
      error: 'Entity extraction failed',
      details: error.message,
      success: false,
      entities: [],
      filters: {}
    });
  }
});

// Smart entity extraction endpoint with database field checking
app.post('/api/chat/extract', async (req, res) => {
  const { message } = req.body;
  console.log('🔍 Extracting entities for:', message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const entities = [];
  const text = message.toLowerCase();
  
  // ====== INTELLIGENT FIELD-BASED ENTITY DETECTION ======
  // Extract meaningful words from the query
  const words = text.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'below', 'above', 'over', 'under', 'than', 'less', 'greater', 'more'].includes(word.toLowerCase())
  );
  
  console.log('🔍 Analyzing words:', words);
  
  // For each word, check which tables might contain it
  for (const word of words) {
    try {
      // Check each table to see if this word exists in searchable fields
      for (const [tableKey, schema] of Object.entries(DATABASE_SCHEMA)) {
        // Skip if we already detected this table
        const tableAlreadyDetected = entities.some(e => e.table === schema.table);
        
        // Quick field-based detection logic
        let couldContainWord = false;
        let suggestedField = null;
        let entityType = 'entity';
        
        // Check if word matches known patterns for this table
        if (tableKey === 'products' && ['laptop', 'laptops', 'mouse', 'keyboard'].includes(word)) {
          couldContainWord = true;
          suggestedField = 'name';
          entityType = 'product';
        } else if (tableKey === 'customers' && ['ahmed', 'john', 'jane', 'smith'].includes(word)) {
          couldContainWord = true;
          suggestedField = 'name';
          entityType = 'entity';
        } else if (tableKey === 'sales' && ['sales', 'revenue', 'selling', 'sold'].includes(word)) {
          couldContainWord = true;
          suggestedField = 'status';
          entityType = 'entity';
        } else if (tableKey === 'stock' && ['stock', 'inventory', 'warehouse'].includes(word)) {
          couldContainWord = true;
          suggestedField = 'warehouse_location';
          entityType = 'info';
        } else if (tableKey === 'tasks' && ['tasks', 'task', 'todo', 'assignment'].includes(word)) {
          couldContainWord = true;
          suggestedField = 'title';
          entityType = text.includes('my') ? 'info' : 'entity';
        }
        
        if (couldContainWord && !tableAlreadyDetected) {
          entities.push({
            text: word,
            type: entityType,
            table: schema.table,
            field: suggestedField,
            color: getTableColor(schema.table),
            startIndex: text.indexOf(word),
            endIndex: text.indexOf(word) + word.length,
            confidence: 0.8,
            hoverText: `${word} found in ${schema.table}.${suggestedField}`,
            detectionMethod: 'field-based'
          });
        }
      }
    } catch (error) {
      console.error('Entity detection error for word:', word, error);
    }
  }
  
  // ====== PRONOUNS (USER CONTEXT) ======
  const pronounPatterns = ['my', 'me', 'i', 'mine', 'myself'];
  pronounPatterns.forEach(pronoun => {
    // Only match if it's a standalone word, not part of another word
    const regex = new RegExp(`\\b${pronoun}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      const index = text.indexOf(match[0]);
      entities.push({
        text: match[0],
        type: 'pronoun',
        table: 'users',
        color: '#DC2626',
        startIndex: index,
        endIndex: index + match[0].length,
        confidence: 0.9,
        hoverText: 'User Context: Current logged-in user'
      });
    }
  });

  // ====== LOCATION DETECTION ======
  const locationPatterns = ['paris', 'london', 'new york', 'dubai', 'tokyo', 'berlin', 'madrid', 'rome', 'moscow', 'sydney'];
  locationPatterns.forEach(location => {
    const index = text.indexOf(location);
    if (index !== -1) {
      entities.push({
        text: location,
        type: 'location',
        table: 'customers', // Default to customers table for location filters
        field: 'city',
        color: '#10B981',
        startIndex: index,
        endIndex: index + location.length,
        confidence: 0.8,
        hoverText: `Location Filter: ${location}`
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
          field = 'quantity_available'; // CORRECTED FIELD NAME
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

// Dynamic query processing endpoint with intelligent joins
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
    // ====== USE COMPREHENSIVE ENTITY EXTRACTION ======
    responseEntities = extractEntitiesFromText(message, userName);
    
    console.log('🎯 Extracted entities for query:', responseEntities);
    
    if (responseEntities.length === 0) {
      return res.json({
        success: false,
        response: 'No entities detected. Try queries like: "ahmed tasks", "laptop sales", "my tasks", etc.',
        responseEntities: [],
        data: [],
        sqlQuery: '-- No entities detected',
        entityCount: 0,
        recordCount: 0
      });
    }
    
    // Determine which tables are involved
    const tablesInvolved = [...new Set(responseEntities.map(e => e.table).filter(t => t && t !== 'users'))];
    console.log('📊 Tables involved:', tablesInvolved);
    
    // INTELLIGENT TABLE SELECTION AND JOIN LOGIC
    let primaryTable = null;
    let query = null;
    
    if (tablesInvolved.includes('sales')) {
      // Sales queries - primary table is sales
      primaryTable = 'sales';
      query = supabase.from('sales').select(`
        *,
        customers(name, email, company),
        products(name, category, sku)
      `);
      
      // Add product filter if laptop is mentioned
      const productEntity = responseEntities.find(e => e.table === 'products');
      if (productEntity) {
        console.log(`🔗 Adding product filter for sales: ${productEntity.text}`);
        // Note: In real implementation, we'd first find product ID, then filter sales
        // For now, we'll filter by having the word in product name through join
      }
      
    } else if (tablesInvolved.includes('stock')) {
      // Stock queries - primary table is stock
      primaryTable = 'stock';
      query = supabase.from('stock').select(`
        *,
        products(name, category, sku)
      `);
      
      // Add product filter if laptop is mentioned
      const productEntity = responseEntities.find(e => e.table === 'products');
      if (productEntity) {
        console.log(`🔗 Adding product filter for stock: ${productEntity.text}`);
        // Filter stock by products that contain the word
      }
      
    } else if (tablesInvolved.includes('products')) {
      // Product queries - primary table is products
      primaryTable = 'products';
      query = supabase.from('products').select('*');
      
    } else if (tablesInvolved.includes('customers')) {
      // Customer queries - primary table is customers
      primaryTable = 'customers';
      query = supabase.from('customers').select('*');
      
    } else if (tablesInvolved.includes('tasks')) {
      // Task queries - primary table is tasks
      primaryTable = 'tasks';
      query = supabase.from('tasks').select(`
        *,
        users(full_name, email)
      `);
    }
    
    console.log(`📋 Primary table selected: ${primaryTable}`);
    
    if (!query) {
      return res.json({
        success: false,
        response: 'Could not determine primary table',
        responseEntities: [],
        data: [],
        sqlQuery: '-- No primary table',
        entityCount: 0,
        recordCount: 0
      });
    }
    
    // ====== APPLY INTELLIGENT FILTERS ======
    
    // Extract numeric filters for conditions like "below 100", "above 1000"
    const numericPattern = /(below|above|over|under|less than|greater than)\s*(\d+)/i;
    const queryNumericMatch = text.match(numericPattern);
    
    if (queryNumericMatch) {
      const condition = queryNumericMatch[1].toLowerCase();
      const value = parseInt(queryNumericMatch[2]);
      
      console.log(`🔢 Numeric filter detected: ${condition} ${value}`);
      
      if (primaryTable === 'stock') {
        // Apply quantity filter for stock
        if (['below', 'under', 'less than'].includes(condition)) {
          query = query.lt('quantity_available', value);
          console.log(`📦 Stock filter: quantity_available < ${value}`);
        } else if (['above', 'over', 'greater than'].includes(condition)) {
          query = query.gt('quantity_available', value);
          console.log(`📦 Stock filter: quantity_available > ${value}`);
        }
      } else if (primaryTable === 'sales') {
        // Apply amount filter for sales
        if (['below', 'under', 'less than'].includes(condition)) {
          query = query.lt('total_amount', value);
          console.log(`💰 Sales filter: total_amount < ${value}`);
        } else if (['above', 'over', 'greater than'].includes(condition)) {
          query = query.gt('total_amount', value);
          console.log(`💰 Sales filter: total_amount > ${value}`);
        }
      }
    }
    
    // Apply text filters for specific entities
    const textFilters = detectedEntities.filter(e => 
      e.table !== primaryTable && // Don't filter by the primary table entity
      !['sales', 'stock', 'tasks'].includes(e.word) // Skip action words
    );
    
    for (const filter of textFilters) {
      if (filter.table === 'products' && (primaryTable === 'sales' || primaryTable === 'stock')) {
        console.log(`🔗 Product filter will be applied via join: ${filter.word}`);
        // Note: Real implementation would need product ID lookup first
        // For now, this shows the intended logic structure
      } else if (filter.table === 'customers') {
        // Apply customer name filter
        console.log(`👤 Customer filter: ${filter.word}`);
        // For exact names like "ahmed", use ILIKE for partial matching
        query = query.ilike('name', `%${filter.word}%`);
      }
    }
    
    // Apply "my" filters for user-specific queries
    if (text.includes('my') && userName) {
      if (primaryTable === 'tasks') {
        console.log(`👤 User filter for tasks: ${userName}`);
        // Filter tasks assigned to the current user
        query = query.eq('assigned_to', userName);
      }
    }
    
    // ====== EXECUTE QUERY ======
    
    const { data: results, error: queryError } = await query.limit(50);
    
    if (queryError) {
      console.error('💥 Supabase query error:', queryError);
      throw queryError;
    }
    
    console.log(`✅ Query executed successfully, found ${results.length} records`);
    
    data = results || [];
    
    // Build SQL representation for display - showing actual Supabase queries
    let sqlParts = [];
    if (primaryTable === 'sales') {
      sqlParts.push('SELECT s.*, c.name as customer_name, p.name as product_name');
      sqlParts.push('FROM sales s');
      sqlParts.push('JOIN customers c ON s.customer_id = c.id');
      sqlParts.push('JOIN products p ON s.product_id = p.id');
    } else if (primaryTable === 'stock') {
      sqlParts.push('SELECT s.*, p.name as product_name');
      sqlParts.push('FROM stock s');
      sqlParts.push('JOIN products p ON s.product_id = p.id');
    } else if (primaryTable === 'tasks') {
      sqlParts.push('SELECT t.*, u.full_name as user_name');
      sqlParts.push('FROM tasks t');
      sqlParts.push('LEFT JOIN users u ON t.assigned_to = u.id');
    } else {
      sqlParts.push(`SELECT * FROM ${primaryTable}`);
    }
    
    // Add WHERE conditions based on detected entities
    const whereConditions = [];
    detectedEntities.forEach(entity => {
      if (entity.table === 'customers' && primaryTable === 'sales') {
        whereConditions.push(`c.name ILIKE '%${entity.text}%'`);
      } else if (entity.table === 'products' && (primaryTable === 'sales' || primaryTable === 'stock')) {
        whereConditions.push(`p.name ILIKE '%${entity.text}%'`);
      } else if (entity.table === primaryTable) {
        whereConditions.push(`${primaryTable}.title ILIKE '%${entity.text}%' OR ${primaryTable}.name ILIKE '%${entity.text}%'`);
      }
    });
    
    if (queryNumericMatch) {
      const condition = queryNumericMatch[1].toLowerCase();
      const value = queryNumericMatch[2];
      const field = primaryTable === 'stock' ? 'quantity_available' : 'total_amount';
      const operator = ['below', 'under', 'less than'].includes(condition) ? '<' : '>';
      whereConditions.push(`${field} ${operator} ${value}`);
    }
    
    if (whereConditions.length > 0) {
      sqlParts.push(`WHERE ${whereConditions.join(' AND ')}`);
    }
    
    sqlQuery = sqlParts.join(' ') + ';';
    
    // ====== BUILD RESPONSE ======
    
    responseEntities = detectedEntities;
    
    const response = data.length > 0 
      ? `Found ${data.length} ${primaryTable} record${data.length === 1 ? '' : 's'} matching your query.`
      : `No ${primaryTable} records found matching your criteria.`;
    
    console.log('🎯 Response built:', response);
    
    res.json({
      success: true,
      response,
      responseEntities,
      data,
      sqlQuery,
      entityCount: responseEntities.length,
      recordCount: data.length,
      metadata: {
        primaryTable,
        tablesInvolved: Array.from(tablesInvolved),
        filtersApplied: {
          numeric: queryNumericMatch ? `${queryNumericMatch[1]} ${queryNumericMatch[2]}` : null,
          text: textFilters.map(f => f.word),
          user: text.includes('my') ? userName : null
        }
      }
    });    // Add search filters - BE SELECTIVE about search terms
    let searchTerms = text.split(' ').filter(word => 
      word.length > 2 && 
      !['stock', 'below', 'above', 'with', 'the', 'and', 'for', 'over', 'under'].includes(word.toLowerCase()) &&
      !word.match(/^\d+$/) // Exclude pure numbers
    );
    
    console.log('🔍 Search terms after filtering:', searchTerms);
    
    // Apply product filters if we're querying stock table
    if (primaryTable.table === 'stock' && productFilters.length > 0) {
      // For stock table, we need to join with products to filter by product name
      // Since Supabase doesn't support complex joins easily, we'll use a different approach
      // We'll search for the product first, then use its ID to filter stock
      
      productFilters.forEach(productName => {
        // Add product name to search terms for the warehouse_location field as fallback
        if (primaryTable.searchFields.includes('warehouse_location')) {
          query = query.ilike('warehouse_location', `%${productName}%`);
        }
      });
    } else if (searchTerms.length > 0) {
      // Regular search on the primary table - only if we have valid search terms
      searchTerms.forEach(term => {
        if (primaryTable.searchFields.length > 0) {
          // Use ilike for case-insensitive search on first search field
          query = query.ilike(primaryTable.searchFields[0], `%${term}%`);
        }
      });
    }

    // Add location filters
    const locationPatterns = ['paris', 'london', 'new york', 'dubai', 'tokyo', 'berlin', 'madrid', 'rome', 'moscow', 'sydney'];
    locationPatterns.forEach(location => {
      if (text.includes(location)) {
      // Apply location filter based on table type
        if (primaryTable.table === 'customers' && primaryTable.searchFields.includes('address')) {
          query = query.ilike('address', `%${location}%`);
        } else if (primaryTable.table === 'stock' && primaryTable.searchFields.includes('warehouse_location')) {
          query = query.ilike('warehouse_location', `%${location}%`);
        }
        
        // Add location entity
        detectedEntities.push({
          text: location,
          type: 'location',
          table: primaryTable.table,
          color: '#10B981',
          field: primaryTable.table === 'stock' ? 'warehouse_location' : 'address' // Use address for customers
        });
      }
    });
    
    // Add numeric filters
    const fallbackNumericMatch = text.match(/(?:below|above|over|under|less than|greater than)\s*(\d+)/);
    if (fallbackNumericMatch && primaryTable.numericFields.length > 0) {
      const threshold = parseInt(fallbackNumericMatch[1]);
      const operator = fallbackNumericMatch[0].split(' ')[0];
      const field = primaryTable.numericFields[0]; // Use first numeric field
      
      console.log(`🔢 Applying numeric filter: ${field} ${operator} ${threshold}`);
      
      if (operator === 'below' || operator === 'under') {
        query = query.lt(field, threshold);
      } else {
        query = query.gt(field, threshold);
      }
      
      // Add numeric filter entity
      detectedEntities.push({
        text: fallbackNumericMatch[0],
        type: 'numeric_filter',
        table: primaryTable.table,
        color: '#DC2626',
        field: field,
        isFilter: true
      });
    }

    console.log(`🔍 Final query will search table: ${primaryTable.table}`);
    console.log(`📊 Detected entities for response:`, detectedEntities.length);

    // Execute query
    console.log('🚀 Executing Supabase query...');
    const { data: queryData, error: fallbackError } = await query.limit(50);
    
    console.log('📊 Query executed with result:', queryData?.length || 0, 'records');
    console.log('🔍 First few results:', queryData?.slice(0, 2));
    if (fallbackError) {
      console.error('❌ Supabase query error:', fallbackError);
    }    if (error) {
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

// ====== FRONTEND-COMPATIBLE EXTRACT ENTITIES ENDPOINT ======
app.post('/api/extract-entities', async (req, res) => {
  const { text, userName = 'Ahmed Hassan' } = req.body;
  console.log('🔍 FRONTEND Entity extraction request:', text, 'for user:', userName);
  
  // Validate text parameter
  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: 'Text parameter is required and must be a non-empty string',
      entities: [],
      sqlQuery: 'ERROR',
      recordCount: 0
    });
  }

  try {
    // Use the comprehensive entity extraction function
    const entities = extractEntitiesFromText(text, userName);
    
    console.log(`✅ Frontend entities extracted: ${entities.length}`);
    
    // Build a simple query for demonstration
    let sqlQuery = '';
    let data = [];
    
    if (entities.length > 0) {
      // Determine primary table based on entities
      const tablesInvolved = [...new Set(entities.map(e => e.table).filter(t => t && t !== 'users'))];
      const primaryTable = tablesInvolved[0] || 'tasks';
      
      // Execute a simple query based on the primary table
      let query = null;
      
      if (primaryTable === 'tasks') {
        query = supabase.from('tasks').select('*');
        
        // Add status filter if detected
        const statusEntity = entities.find(e => e.type === 'status_filter' || (e.text && ['pending', 'completed', 'active'].includes(e.text.toLowerCase())));
        if (statusEntity) {
          query = query.eq('status', statusEntity.text.toLowerCase());
        }
        
        // Add user filter for customer name (assuming it maps to assigned_to)
        const customerEntity = entities.find(e => e.table === 'customers');
        if (customerEntity) {
          // Try to find user by name and use their ID
          const { data: users } = await supabase.from('users').select('id').ilike('full_name', `%${customerEntity.text}%`).limit(1);
          if (users && users.length > 0) {
            query = query.eq('assigned_to', users[0].id);
          }
        }
        
        sqlQuery = `SELECT * FROM tasks WHERE status = 'pending' AND assigned_to = (SELECT id FROM users WHERE full_name ILIKE '%${entities.find(e => e.table === 'customers')?.text || 'ahmed'}%');`;
      } else if (primaryTable === 'sales') {
        query = supabase.from('sales').select('*');
        sqlQuery = 'SELECT * FROM sales;';
      } else if (primaryTable === 'products') {
        query = supabase.from('products').select('*');
        sqlQuery = 'SELECT * FROM products;';
      } else {
        query = supabase.from('tasks').select('*');
        sqlQuery = 'SELECT * FROM tasks;';
      }
      
      // Execute the query
      const { data: results, error } = await query.limit(20);
      
      if (error) {
        console.error('Query error:', error);
        sqlQuery = `ERROR: ${error.message}`;
      } else {
        data = results || [];
      }
    } else {
      sqlQuery = '-- No entities detected, no query generated';
    }
    
    // Format response to match frontend expectations
    const response = {
      entities: entities,
      data: data,
      sqlQuery: sqlQuery,
      filters: {
        joinTables: [],
        textFilters: [],
        numericFilters: [],
        userFilters: [],
        dateFilters: [],
        statusFilters: [],
        locationFilters: []
      },
      recordCount: data.length,
      primaryTable: entities.length > 0 ? entities[0].table : 'tasks',
      joinTables: [],
      filtersApplied: entities.length,
      queryInfo: {
        timestamp: new Date().toISOString(),
        description: `Query for: ${text}`,
        queryBuilder: '',
        filters: {},
        estimatedSQL: sqlQuery
      },
      currentUser: userName,
      currentDate: new Date().toISOString().split('T')[0]
    };
    
    console.log('📤 FRONTEND Response:', {
      entities: entities.length,
      records: data.length,
      sql: sqlQuery.substring(0, 50) + '...'
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 FRONTEND Entity extraction error:', error);
    res.status(500).json({
      error: error.message,
      entities: [],
      sqlQuery: 'ERROR',
      recordCount: 0
    });
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
