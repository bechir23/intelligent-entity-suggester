import { SupabaseService } from './supabase.js';

// FUZZY MATCHING: Levenshtein distance for better product matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
};

// FUZZY MATCHING: Calculate similarity score (0-1, where 1 is perfect match)
const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLength);
};

// FUZZY MATCHING: Find best matches with confidence scoring
const findBestMatches = (input: string, candidates: string[], threshold: number = 0.6): Array<{match: string, confidence: number}> => {
  return candidates
    .map(candidate => ({
      match: candidate,
      confidence: calculateSimilarity(input, candidate)
    }))
    .filter(result => result.confidence >= threshold)
    .sort((a, b) => b.confidence - a.confidence);
};

// Initialize Supabase service
const supabaseService = new SupabaseService();

export interface EntityMatch {
  text: string;
  type: 'entity' | 'info' | 'temporal' | 'pronoun' | 'user_filter' | 'product_filter' | 'customer_filter' | 'status_filter' | 'location_filter' | 'numeric_filter' | 'field_filter';
  table?: string;
  actualValue?: string;
  color: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  hoverText?: string;
  suggestions?: string[];
  value?: string;
  unit?: string;  // For numeric values with units
  isFilter?: boolean;
}

interface QueryResult {
  response: string;
  entities: EntityMatch[];  // Changed from responseEntities to entities for API consistency
  data: any[];
}

// COMPREHENSIVE RELATIONAL: Database cache for ALL entities with UUID mappings
let productCache: { [key: string]: string[] } = {};
let productUUIDCache: { [key: string]: string } = {}; // Product name to UUID mapping
let customerCache: { [key: string]: string[] } = {};
let customerUUIDCache: { [key: string]: string } = {}; // Customer name to UUID mapping
let userCache: { [key: string]: string[] } = {};
let userUUIDCache: { [key: string]: string } = {}; // User name to UUID mapping
let taskCache: { [key: string]: string[] } = {};
let taskUUIDCache: { [key: string]: string } = {}; // Task title to UUID mapping
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
  // COMPREHENSIVE: Will be populated from ALL database tables
  product_values: {},   // Products: name, description, sku, category, brand
  customer_values: {},  // Customers: name, email, company, city, country  
  user_values: {},      // Users: name, email, department, role
  task_values: {},      // Tasks: title, description, priority, status
  stock_values: {},     // Stock: warehouse_location, quantity info
  price_values: {},     // Products: price, cost (numeric fields)
  quantity_values: {},  // Sales: quantity, Stock: quantity_on_hand, etc.
  date_values: {},      // All date fields across tables
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

// COMPREHENSIVE RELATIONAL: Complete table mappings based on actual schema
const TABLE_FIELD_MAPPINGS = {
  users: {
    user_fields: ['id'],  // For direct user queries
    text_fields: ['name', 'email', 'department', 'role'],  // Searchable text fields
    date_fields: ['created_at', 'updated_at'],
    relationships: {
      'sales': { foreign_key: 'sales_rep_id', join_field: 'id', description: 'sales assigned to user' },
      'tasks_assigned': { foreign_key: 'assigned_to', join_field: 'id', description: 'tasks assigned to user' },
      'tasks_created': { foreign_key: 'assigned_by', join_field: 'id', description: 'tasks created by user' },
      'shifts': { foreign_key: 'user_id', join_field: 'id', description: 'user shifts' },
      'attendance': { foreign_key: 'user_id', join_field: 'id', description: 'user attendance' }
    }
  },
  customers: {
    customer_fields: ['id'],  // For UUID filtering
    text_fields: ['name', 'email', 'phone', 'company', 'address', 'city', 'country'],  // All searchable fields
    status_fields: ['status'],
    date_fields: ['created_at', 'updated_at'],
    relationships: {
      'sales': { foreign_key: 'customer_id', join_field: 'id', description: 'customer sales' }
    }
  },
  products: {
    product_fields: ['id'],  // For UUID filtering
    text_fields: ['name', 'description', 'sku', 'category', 'brand'],  // All searchable text fields
    numeric_fields: ['price', 'cost'],  // Numeric fields that can be filtered
    status_fields: ['status'],
    date_fields: ['created_at', 'updated_at'],
    relationships: {
      'sales': { foreign_key: 'product_id', join_field: 'id', description: 'product sales' },
      'stock': { foreign_key: 'product_id', join_field: 'id', description: 'product stock' }
    }
  },
  sales: {
    user_fields: ['sales_rep_id'],  // FIXED: correct field name from schema
    customer_fields: ['customer_id'],  // Foreign key to customers
    product_fields: ['product_id'],   // Foreign key to products
    numeric_fields: ['quantity', 'unit_price', 'total_amount'],  // Numeric fields
    status_fields: ['status'],
    date_fields: ['sale_date', 'created_at', 'updated_at'],
    relationships: {
      'products': { foreign_key: 'product_id', join_field: 'id', description: 'sales products' },
      'customers': { foreign_key: 'customer_id', join_field: 'id', description: 'sales customers' },
      'users': { foreign_key: 'sales_rep_id', join_field: 'id', description: 'sales rep' }
    }
  },
  stock: {
    product_fields: ['product_id'],  // Foreign key to products
    text_fields: ['warehouse_location'],  // Searchable text fields
    numeric_fields: ['quantity_on_hand', 'quantity_reserved', 'reorder_level'],  // Numeric fields
    date_fields: ['last_restocked', 'created_at', 'updated_at'],
    relationships: {
      'products': { foreign_key: 'product_id', join_field: 'id', description: 'stock products' }
    }
  },
  tasks: {
    user_fields: ['assigned_to', 'assigned_by'],  // User relationships
    text_fields: ['title', 'description'],  // Searchable text fields
    status_fields: ['priority', 'status'],
    date_fields: ['due_date', 'completed_at', 'created_at', 'updated_at'],
    relationships: {
      'users_assigned': { foreign_key: 'assigned_to', join_field: 'id', description: 'assigned user' },
      'users_creator': { foreign_key: 'assigned_by', join_field: 'id', description: 'task creator' }
    }
  },
  shifts: {
    user_fields: ['user_id'],  // User relationship
    text_fields: ['shift_type'],  // Searchable text fields
    status_fields: ['status'],
    date_fields: ['shift_date', 'created_at', 'updated_at'],
    time_fields: ['start_time', 'end_time'],  // Time fields
    numeric_fields: ['break_duration'],  // Numeric fields
    relationships: {
      'users': { foreign_key: 'user_id', join_field: 'id', description: 'shift user' },
      'attendance': { foreign_key: 'id', join_field: 'shift_id', description: 'shift attendance' }
    }
  },
  attendance: {
    user_fields: ['user_id'],  // User relationship
    shift_fields: ['shift_id'],  // Shift relationship
    text_fields: ['notes'],  // Searchable text fields
    status_fields: ['status'],
    date_fields: ['clock_in', 'clock_out', 'break_start', 'break_end', 'created_at', 'updated_at'],
    numeric_fields: ['total_hours'],  // Numeric fields
    relationships: {
      'users': { foreign_key: 'user_id', join_field: 'id', description: 'attendance user' },
      'shifts': { foreign_key: 'shift_id', join_field: 'id', description: 'attendance shift' }
    }
  }
};

// COMPREHENSIVE RELATIONAL: Initialize ALL entity caches with UUID mappings
const initializeCache = async () => {
  if (cacheInitialized) return;
  
  try {
    const client = supabaseService.getClient();
    console.log('🚀 COMPREHENSIVE CACHE INITIALIZATION: Loading ALL entities from ALL tables...');
    
    // 1. PRODUCTS: Load with minimal existing fields
    console.log('🔍 Loading products...');
    const { data: products, error: productsError } = await client.from('products').select('id, name, description, sku').limit(100);
    if (productsError) {
      console.error('❌ Products query error:', productsError);
    } else if (products) {
      console.log(`✅ Loaded ${products.length} products into cache`);
      
      products.forEach(product => {
        if (product.name && product.id) {
          const productName = product.name.toLowerCase();
          
          // ALL searchable variations for products (minimal fields only)
          const variations = [
            product.name?.toLowerCase(),
            product.description?.toLowerCase(), 
            product.sku?.toLowerCase()
          ].filter(Boolean);
          
          productCache[productName] = variations;
          productUUIDCache[productName] = product.id;
          FIELD_VALUE_PATTERNS.product_values[productName] = variations;
          
          // Add ALL individual words for comprehensive fuzzy matching
          const allText = [product.name, product.description, product.sku].filter(Boolean).join(' ');
          const words = allText.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3);
          words.forEach((word: string) => {
            const cleanWord = word.replace(/[^a-z0-9]/g, '');
            if (cleanWord.length >= 3) {
              productCache[cleanWord] = [productName];
              productUUIDCache[cleanWord] = product.id;
              FIELD_VALUE_PATTERNS.product_values[cleanWord] = [productName];
            }
          });
          
          console.log(`🆔 Product: "${productName}" -> UUID: ${product.id.slice(-8)} | SKU: ${product.sku}`);
        }
      });
    }
    
    // 2. CUSTOMERS: Load with minimal existing fields
    console.log('🔍 Loading customers...');
    const { data: customers, error: customersError } = await client.from('customers').select('id, name, email, company').limit(100);
    if (customersError) {
      console.error('❌ Customers query error:', customersError);
    } else if (customers) {
      console.log(`✅ Loaded ${customers.length} customers into cache`);
      
      customers.forEach(customer => {
        if (customer.name && customer.id) {
          const customerName = customer.name.toLowerCase();
          
          // ALL searchable variations for customers (minimal fields only)
          const variations = [
            customer.name?.toLowerCase(),
            customer.email?.toLowerCase(),
            customer.company?.toLowerCase()
          ].filter(Boolean);
          
          customerCache[customerName] = variations;
          customerUUIDCache[customerName] = customer.id;
          FIELD_VALUE_PATTERNS.customer_values[customerName] = variations;
          
          // Add ALL individual name parts (Ahmed, Hassan, etc.)
          const nameParts = customer.name.toLowerCase().split(/\s+/);
          nameParts.forEach((namePart: string) => {
            if (namePart.length >= 2) {
              customerCache[namePart] = [customerName];
              customerUUIDCache[namePart] = customer.id;
              FIELD_VALUE_PATTERNS.customer_values[namePart] = [customerName];
              console.log(`👤 Customer name part: "${namePart}" -> "${customerName}" -> UUID: ${customer.id.slice(-8)}`);
            }
          });
          
          // Add ALL searchable field values (company only)
          [customer.company].forEach(fieldValue => {
            if (fieldValue) {
              const fieldKey = fieldValue.toLowerCase();
              customerCache[fieldKey] = [customerName];
              customerUUIDCache[fieldKey] = customer.id;
              FIELD_VALUE_PATTERNS.customer_values[fieldKey] = [customerName];
            }
          });
          
          // Add email domain as searchable
          if (customer.email) {
            const emailDomain = customer.email.split('@')[1]?.toLowerCase();
            if (emailDomain) {
              customerCache[emailDomain] = [customerName];
              customerUUIDCache[emailDomain] = customer.id;
              FIELD_VALUE_PATTERNS.customer_values[emailDomain] = [customerName];
            }
          }
          
          console.log(`🆔 Customer: "${customerName}" -> UUID: ${customer.id.slice(-8)} | Company: ${customer.company}`);
        }
      });
    }
    
    // 3. USERS: Load with minimal existing fields
    console.log('🔍 Loading users...');
    const { data: users, error: usersError } = await client.from('users').select('id, email').limit(100);
    if (usersError) {
      console.error('❌ Users query error:', usersError);
    } else if (users) {
      console.log(`✅ Loaded ${users.length} users into cache`);
      
      users.forEach(user => {
        if (user.email && user.id) {
          const userEmail = user.email.toLowerCase();
          
          // ALL searchable variations for users (email only)
          const variations = [
            user.email?.toLowerCase()
          ].filter(Boolean);
          
          userCache[userEmail] = variations;
          userUUIDCache[userEmail] = user.id;
          FIELD_VALUE_PATTERNS.user_values[userEmail] = variations;
          
          console.log(`🆔 User: "${userEmail}" -> UUID: ${user.id.slice(-8)}`);
        }
      });
    }
    
    // 4. TASKS: Load with ALL searchable fields
    const { data: tasks } = await client.from('tasks').select('id, title, description, priority, status').limit(100);
    if (tasks) {
      console.log(`✅ Loaded ${tasks.length} tasks into cache`);
      
      tasks.forEach(task => {
        if (task.title && task.id) {
          const taskTitle = task.title.toLowerCase();
          
          // ALL searchable variations for tasks
          const variations = [
            task.title?.toLowerCase(),
            task.description?.toLowerCase(),
            task.priority?.toLowerCase(),
            task.status?.toLowerCase()
          ].filter(Boolean);
          
          taskCache[taskTitle] = variations;
          taskUUIDCache[taskTitle] = task.id;
          FIELD_VALUE_PATTERNS.task_values[taskTitle] = variations;
          
          // Add ALL individual words from title and description
          const allText = [task.title, task.description].filter(Boolean).join(' ');
          const words = allText.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3);
          words.forEach((word: string) => {
            const cleanWord = word.replace(/[^a-z0-9]/g, '');
            if (cleanWord.length >= 3) {
              taskCache[cleanWord] = [taskTitle];
              taskUUIDCache[cleanWord] = task.id;
              FIELD_VALUE_PATTERNS.task_values[cleanWord] = [taskTitle];
            }
          });
          
          // Add status and priority as searchable
          [task.priority, task.status].forEach(fieldValue => {
            if (fieldValue) {
              const fieldKey = fieldValue.toLowerCase();
              taskCache[fieldKey] = [taskTitle];
              taskUUIDCache[fieldKey] = task.id;
              FIELD_VALUE_PATTERNS.task_values[fieldKey] = [taskTitle];
            }
          });
          
          console.log(`🆔 Task: "${taskTitle}" -> UUID: ${task.id.slice(-8)} | Status: ${task.status} | Priority: ${task.priority}`);
        }
      });
    }
    
    console.log(`🎯 CACHE SUMMARY:`);
    console.log(`   📦 Products: ${Object.keys(productCache).length} entries`);
    console.log(`   👥 Customers: ${Object.keys(customerCache).length} entries`);
    console.log(`   👤 Users: ${Object.keys(userCache).length} entries`);
    console.log(`   📋 Tasks: ${Object.keys(taskCache).length} entries`);
    
    cacheInitialized = true;
    console.log('✅ Comprehensive cache initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Cache initialization failed:', error);
  }
};

// RELATIONAL: Dynamic entity extraction with comprehensive info+entity combinations
const extractEntitiesHomogeneityFixed = async (text: string, userName?: string): Promise<EntityMatch[]> => {
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
  
  // 2. RELATIONAL: Database-driven product detection with fuzzy matching
  console.log(`🔍 Checking products against cached items (${Object.keys(productCache).length} total)`);
  
  // 2. ENHANCED FUZZY PRODUCT DETECTION with Levenshtein distance
  console.log(`🔍 FUZZY MATCHING: Checking products against cached items (${Object.keys(productCache).length} total)`);
  
  // Split input text into words for individual matching
  const inputWords = text.toLowerCase().split(/\s+/).filter(word => word.length >= 3);
  const allProductNames = Object.keys(productCache);
  
  console.log(`🔍 Input words for matching: [${inputWords.join(', ')}]`);
  console.log(`🔍 Available products: [${allProductNames.slice(0, 10).join(', ')}...]`);
  
  // Check each input word against all products with fuzzy matching
  inputWords.forEach(word => {
    const cleanWord = word.replace(/[^a-z0-9]/g, '');
    if (cleanWord.length < 3) return;
    
    // Direct cache lookup first (fastest)
    if (productCache[cleanWord]) {
      const startIndex = text.toLowerCase().indexOf(word);
      const endIndex = startIndex + word.length;
      
      if (startIndex >= 0 && !isOverlapping(startIndex, endIndex)) {
        const productName = productCache[cleanWord][0] || cleanWord;
        markIndices(startIndex, endIndex);
        entities.push({
          text: text.substring(startIndex, endIndex),
          type: 'info',
          value: productName,
          color: '#3B82F6',
          startIndex,
          endIndex,
          confidence: 0.95,
          isFilter: true,
          hoverText: `Product: ${productName} (exact cache match)`
        });
        console.log(`✅ EXACT MATCH: "${word}" → "${productName}"`);
        return;
      }
    }
    
    // Fuzzy matching with Levenshtein distance
    const fuzzyMatches = findBestMatches(cleanWord, allProductNames, 0.7);
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      const startIndex = text.toLowerCase().indexOf(word);
      const endIndex = startIndex + word.length;
      
      if (startIndex >= 0 && !isOverlapping(startIndex, endIndex)) {
        markIndices(startIndex, endIndex);
        entities.push({
          text: text.substring(startIndex, endIndex),
          type: 'info', 
          value: bestMatch.match,
          color: '#3B82F6',
          startIndex,
          endIndex,
          confidence: bestMatch.confidence,
          isFilter: true,
          hoverText: `Product: ${bestMatch.match} (fuzzy match: ${Math.round(bestMatch.confidence * 100)}%)`
        });
        console.log(`✅ FUZZY MATCH: "${word}" → "${bestMatch.match}" (confidence: ${Math.round(bestMatch.confidence * 100)}%)`);
      }
    }
  });
  
  // 3. Multi-word product detection (for "Wireless Mouse", "USB-C Hub", etc.)
  const multiWordPatterns = allProductNames.filter(name => name.includes(' '));
  multiWordPatterns.forEach(productName => {
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
          startIndex,
          endIndex,
          confidence: 0.95,
          isFilter: true,
          hoverText: `Product: ${productName} (multi-word match)`
        });
        console.log(`✅ MULTI-WORD: "${match[0]}" → "${productName}"`);
      }
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

  // 3. UNIVERSAL VALUE DETECTION: Any field from any table (price, quantity, category, etc.)
  console.log(`🔍 UNIVERSAL FIELD DETECTION: Checking for numeric values, field names, and entity values`);
  
  // 3a. Detect numeric values (prices, quantities, etc.)
  const numericRegex = /\b(\d+(?:\.\d+)?)\s*(dollars?|usd|\$|euros?|€|pounds?|£|pieces?|units?|qty|quantity|items?)?\b/gi;
  let numericMatch;
  while ((numericMatch = numericRegex.exec(text)) !== null) {
    const startIndex = numericMatch.index;
    const endIndex = numericMatch.index + numericMatch[0].length;
    
    if (!isOverlapping(startIndex, endIndex)) {
      markIndices(startIndex, endIndex);
      const value = parseFloat(numericMatch[1]);
      const unit = numericMatch[2] || '';
      
      entities.push({
        text: numericMatch[0],
        type: 'numeric_filter',
        value: value.toString(),
        unit: unit,
        color: '#8B5CF6',
        startIndex,
        endIndex,
        confidence: 0.85,
        isFilter: true,
        hoverText: `Numeric value: ${value} ${unit}`
      });
      console.log(`✅ Numeric filter: ${value} ${unit} (from "${numericMatch[0]}")`);
    }
  }
  
  // 3b. Detect field names (category, brand, department, status, etc.)
  const fieldNamePatterns = {
    'category': /\b(category|categories|type|types|kind|genre)\b/gi,
    'brand': /\b(brand|brands|manufacturer|make|maker)\b/gi,
    'department': /\b(department|dept|division|team|group)\b/gi,
    'status': /\b(status|state|condition|stage|phase)\b/gi,
    'location': /\b(location|warehouse|city|country|region|area)\b/gi,
    'price': /\b(price|cost|amount|value|rate|fee)\b/gi,
    'quantity': /\b(quantity|qty|stock|inventory|amount|count)\b/gi,
    'role': /\b(role|position|title|job|designation)\b/gi,
    'email': /\b(email|mail|address|contact)\b/gi,
    'company': /\b(company|organization|firm|business|corp)\b/gi
  };
  
  Object.entries(fieldNamePatterns).forEach(([fieldType, regex]) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (!isOverlapping(startIndex, endIndex)) {
        markIndices(startIndex, endIndex);
        entities.push({
          text: match[0],
          type: 'field_filter',
          value: fieldType,
          color: '#06B6D4',
          startIndex,
          endIndex,
          confidence: 0.80,
          isFilter: true,
          hoverText: `Field type: ${fieldType}`
        });
        console.log(`✅ Field filter: ${fieldType} (from "${match[0]}")`);
      }
    }
  });

  // 4. RELATIONAL: Dynamic user detection with fuzzy matching
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

  // 5. RELATIONAL: Dynamic customer detection with fuzzy matching and suggestions using customerCache
  console.log(`🔍 Customer detection: Found ${Object.keys(customerCache).length} customer patterns in cache`);
  console.log(`🔍 Customer patterns: ${Object.keys(customerCache).slice(0, 10).join(', ')}...`);
  
  // Sort by length to match longer patterns first
  const sortedCustomerKeys = Object.keys(customerCache).sort((a, b) => b.length - a.length);
  
  // Track potential customer matches for suggestions
  const potentialCustomerMatches: { [key: string]: string[] } = {};
  
  // Check each word in the input against customer cache
  const customerInputWords = text.toLowerCase().split(/\s+/).filter(word => word.length >= 2);
  console.log(`🔍 Checking input words for customer matches: [${customerInputWords.join(', ')}]`);
  
  sortedCustomerKeys.forEach(customerKey => {
    const customerNames = customerCache[customerKey]; // Array of customer name variations
    const customerUUID = customerUUIDCache[customerKey];
    
    // Check if any input word matches this customer key (minimum 2 characters to avoid empty matches)
    customerInputWords.forEach(word => {
      if (word.length >= 2 && (word === customerKey.toLowerCase() || customerKey.toLowerCase().includes(word))) {
        console.log(`🎯 CUSTOMER MATCH: "${word}" matches "${customerKey}" -> Customer: ${customerNames[0]}`);
        
        // Find the position of this word in the original text (only if word is not empty or too short)
        if (word.length >= 2) {
          const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const startIndex = match.index;
            const endIndex = match.index + match[0].length;
            
            if (!isOverlapping(startIndex, endIndex)) {
              markIndices(startIndex, endIndex);
              
              // Check for multiple customer matches (e.g., "ahmed" could match multiple Ahmeds)
              const matchedText = match[0].toLowerCase();
              const possibleCustomers = Object.keys(customerCache).filter(custKey => 
                custKey.includes(matchedText) || 
                customerCache[custKey].some(name => name.toLowerCase().includes(matchedText))
              );
              
              if (possibleCustomers.length > 1) {
                // Multiple matches found - add suggestions
                potentialCustomerMatches[matchedText] = possibleCustomers;
                console.log(`🔍 Multiple customer matches for "${matchedText}": ${possibleCustomers.slice(0, 3).join(', ')}${possibleCustomers.length > 3 ? '...' : ''}`);
              }
              
              // Generate suggestions for the entity
              const suggestions = possibleCustomers.length > 1 ? 
                possibleCustomers.slice(0, 5).map(custKey => {
                  const uuid = customerUUIDCache[custKey];
                  const displayName = customerCache[custKey][0];
                  return `${displayName}${uuid ? ' (ID: ' + uuid.slice(-8) + ')' : ''}`;
                }) : undefined;
              
              // Enhanced entity type detection based on context
              let entityType: 'info' | 'pronoun' | 'temporal' | 'user_filter' = 'info';
              let entityColor = '#8B5CF6'; // Default purple for customer info
              let hoverPrefix = 'Customer';
              
              // Context-aware type detection
              const lowerText = text.toLowerCase();
              const wordIndex = lowerText.indexOf(matchedText);
              const beforeWord = lowerText.substring(Math.max(0, wordIndex - 20), wordIndex).trim();
              const afterWord = lowerText.substring(endIndex, Math.min(text.length, endIndex + 20)).trim();
              
              // Pronoun detection (referring to user)
              if (userName && (matchedText === 'me' || matchedText === 'my' || matchedText === 'mine' || 
                             (userName.toLowerCase().includes(matchedText) && 
                              (beforeWord.includes('my') || beforeWord.includes('me') || beforeWord.includes('i '))))) {
                entityType = 'pronoun';
                entityColor = '#DC2626'; // Red for pronouns
                hoverPrefix = 'Pronoun (You)';
              }
              // Temporal context (dates, times)
              else if (beforeWord.match(/(last|next|this|past|future|since|until|before|after|during)/) ||
                      afterWord.match(/(week|month|year|day|time|period|date)/)) {
                entityType = 'temporal';
                entityColor = '#7C3AED'; // Purple for temporal
                hoverPrefix = 'Temporal Reference';
              }
              // User filter context (assignments, ownership)
              else if (beforeWord.match(/(assigned|created|owned|managed|handled|by|from)/) ||
                      afterWord.match(/(tasks|work|assignments|projects|sales)/)) {
                entityType = 'user_filter';
                entityColor = '#DC2626'; // Red for user filters
                hoverPrefix = 'User Filter';
              }
              
              console.log(`🎯 CONTEXT ANALYSIS for "${matchedText}":
                Before: "${beforeWord}"
                After: "${afterWord}"
                Type: ${entityType}
                Color: ${entityColor}`);

              entities.push({
                text: match[0],
                type: entityType, // Use context-aware type
                value: customerNames[0], // Use the primary customer name
                color: entityColor, // Use context-aware color
                startIndex: startIndex,
                endIndex: endIndex,
                confidence: possibleCustomers.length > 1 ? 0.75 : 0.90, // Higher confidence for direct cache hits
                isFilter: true,
                hoverText: `${hoverPrefix}: ${customerNames[0]}${possibleCustomers.length > 1 ? ' (Multiple matches found - click for suggestions)' : ''}`,
                suggestions: suggestions
              });
              console.log(`✅ ${hoverPrefix} detected: "${customerNames[0]}" from input "${match[0]}" (Type: ${entityType})${suggestions ? ' [WITH SUGGESTIONS]' : ''}`);
            }
          }
        }
      }
    });
  });

  // 6. UNIVERSAL VALUE DETECTION: Specific field values from all database entities
  console.log(`🎯 UNIVERSAL VALUE DETECTION: Checking for specific database values (categories, brands, etc.)`);
  
  // 6a. Product-specific values (categories, brands, etc.)
  const commonProductValues = {
    categories: ['laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'tablet', 'smartphone', 'headphones', 'speaker', 'camera', 'software', 'hardware', 'accessory', 'cable', 'adapter'],
    brands: ['apple', 'microsoft', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'samsung', 'lg', 'sony', 'canon', 'nikon', 'intel', 'amd', 'nvidia', 'logitech', 'corsair', 'razer'],
    statuses: ['active', 'inactive', 'pending', 'completed', 'cancelled', 'draft', 'published', 'archived', 'in-progress', 'on-hold'],
    departments: ['sales', 'marketing', 'engineering', 'support', 'hr', 'finance', 'operations', 'it', 'legal', 'admin'],
    roles: ['manager', 'director', 'analyst', 'specialist', 'coordinator', 'assistant', 'supervisor', 'lead', 'senior', 'junior'],
    locations: ['warehouse', 'store', 'office', 'main', 'branch', 'central', 'north', 'south', 'east', 'west']
  };
  
  Object.entries(commonProductValues).forEach(([valueType, values]) => {
    values.forEach(value => {
      const regex = new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        if (!isOverlapping(startIndex, endIndex)) {
          markIndices(startIndex, endIndex);
          entities.push({
            text: match[0],
            type: 'info',
            value: value.toLowerCase(),
            color: '#10B981',
            startIndex,
            endIndex,
            confidence: 0.82,
            isFilter: true,
            hoverText: `${valueType.slice(0, -1)}: ${value}`
          });
          console.log(`✅ Universal value: ${value} (${valueType}) from "${match[0]}"`);
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
  
  // 6. COMPREHENSIVE PRONOUN RESOLUTION (me, my, etc.) - CRITICAL FIX
  const pronounRegex = /\b(me|my|myself|i|mine)\b/gi;
  let pronounMatch;
  while ((pronounMatch = pronounRegex.exec(text)) !== null) {
    const startIndex = pronounMatch.index;
    const endIndex = pronounMatch.index + pronounMatch[0].length;
    
    if (!isOverlapping(startIndex, endIndex)) {
      markIndices(startIndex, endIndex);
      entities.push({
        text: pronounMatch[0],
        type: 'pronoun',
        value: 'current_user',
        color: '#F59E0B',
        startIndex: startIndex,
        endIndex: endIndex,
        confidence: 0.95,
        isFilter: true,
        hoverText: `Current user (${userName || 'me'})`
      });
      console.log(`👤 Pronoun detected: ${pronounMatch[0]} → current_user`);
    }
  }
  
  // 7. Status and other filters
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
  
  console.log(`🎯 SMART TABLE SELECTION: Analyzing ${entities.length} entities`);
  entities.forEach(e => console.log(`  - ${e.text} (${e.type}) -> ${e.table || e.value}`));
  
  // SMART PRIORITIZATION: Check for explicit entity+pronoun combinations first
  const explicitEntities = entities.filter(e => e.type === 'entity' && e.table);
  const pronouns = entities.filter(e => e.type === 'pronoun');
  const productInfo = entities.filter(e => e.type === 'info' && Object.keys(FIELD_VALUE_PATTERNS.product_values).includes(e.value || ''));
  
  // PRIORITY 1: If we have explicit entity + pronoun, use that exact table
  if (explicitEntities.length > 0 && pronouns.length > 0) {
    explicitEntities.forEach(entity => {
      tables.add(entity.table!);
      console.log(`🎯 PRIORITY 1: ${entity.table} (explicit entity + pronoun: "${entity.text}" + "${pronouns[0].text}")`);
    });
    return Array.from(tables); // Return only the specific table for pronoun queries
  }
  
  // PRIORITY 2: If we have explicit entity without pronoun, use that table
  if (explicitEntities.length > 0) {
    explicitEntities.forEach(entity => {
      tables.add(entity.table!);
      console.log(`🎯 PRIORITY 2: ${entity.table} (explicit entity: "${entity.text}")`);
    });
  }
  
  // PRIORITY 3: If we have only pronouns (like "my tasks"), suggest user-related tables but prioritize based on context
  if (pronouns.length > 0 && explicitEntities.length === 0) {
    // Check for context clues in the original text to determine the right table
    const originalText = entities.map(e => e.text).join(' ').toLowerCase();
    
    if (originalText.includes('task')) {
      tables.add('tasks');
      console.log(`🎯 PRIORITY 3A: tasks (pronoun + task context)`);
    } else if (originalText.includes('shift')) {
      tables.add('shifts'); 
      console.log(`🎯 PRIORITY 3B: shifts (pronoun + shift context)`);
    } else if (originalText.includes('attendance')) {
      tables.add('attendance');
      console.log(`🎯 PRIORITY 3C: attendance (pronoun + attendance context)`);
    } else if (originalText.includes('sale')) {
      tables.add('sales');
      console.log(`🎯 PRIORITY 3D: sales (pronoun + sales context)`);
    } else {
      // Default to all user tables if no specific context
      ['tasks', 'sales', 'shifts', 'attendance'].forEach(table => {
        tables.add(table);
        console.log(`🎯 PRIORITY 3E: ${table} (general pronoun fallback)`);
      });
    }
  }
  
  // PRIORITY 4: Product-based relationship detection for info entities
  if (productInfo.length > 0) {
    // If we have product info but no explicit entity, suggest product-related tables
    if (tables.size === 0) {
      tables.add('products');
      console.log(`🎯 PRIORITY 4A: products (product info detected: "${productInfo.map(p => p.value).join(', ')}")`);
      
      // Also suggest sales table since most product queries are about sales
      tables.add('sales');
      console.log(`🎯 PRIORITY 4B: sales (product info + sales relationship)`);
      
      // Check context for other relationships
      const originalText = entities.map(e => e.text).join(' ').toLowerCase();
      if (originalText.includes('stock') || originalText.includes('inventory')) {
        tables.add('stock');
        console.log(`🎯 PRIORITY 4C: Added stock (product + inventory context)`);
      }
    }
  }
  
  // PRIORITY 5: If still no tables, apply fallback logic
  if (tables.size === 0) {
    // Check for temporal patterns that might indicate user-related queries
    const hasTemporalFilter = entities.some(e => e.type === 'temporal');
    
    if (hasTemporalFilter) {
      ['tasks', 'sales', 'shifts', 'attendance'].forEach(table => {
        tables.add(table);
        console.log(`🎯 PRIORITY 5A: ${table} (temporal fallback)`);
      });
    } else {
      // Final fallback - suggest most common tables
      ['products', 'sales', 'customers'].forEach(table => {
        tables.add(table);
        console.log(`🎯 PRIORITY 5B: ${table} (final fallback)`);
      });
    }
  }
  
  console.log(`🎯 FINAL TABLE SELECTION: [${Array.from(tables).join(', ')}]`);
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
    const pronounFilters = entities.filter(e => e.type === 'pronoun');  // CRITICAL: Add pronoun filters
    
    console.log(`📊 Found filters - Info: ${infoFilters.length}, Entity: ${entityFilters.length}, Temporal: ${temporalFilters.length}, Status: ${statusFilters.length}, Pronoun: ${pronounFilters.length}`);
    
    // RELATIONAL: Apply info filters with fuzzy matching
    if (infoFilters.length > 0 && TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS]) {
      const mapping = TABLE_FIELD_MAPPINGS[tableName as keyof typeof TABLE_FIELD_MAPPINGS];
      
      infoFilters.forEach(filter => {
        if (filter.value) {
          console.log(`🔍 Processing info filter: ${filter.value}`);
          
          // Check if this is a product info
          if (filter.value && Object.keys(FIELD_VALUE_PATTERNS.product_values).includes(filter.value)) {
            console.log(`🔍 Processing product filter: ${filter.value} in table: ${tableName}`);
            
            if ('product_fields' in mapping) {
              const productFields = mapping.product_fields;
              
              if (tableName === 'products') {
                // For products table, filter by name/description/category (text fields)
                // Use OR logic to find products matching any field
                const filterValue = filter.value!;
                console.log(`🔍 Products table: searching for "${filterValue}" in name, description, category, sku`);
                
                // Build OR condition for products table
                const orConditions = productFields.map(field => `${field}.ilike.%${filterValue}%`).join(',');
                query = query.or(orConditions);
                console.log(`🔍 Products OR query: ${orConditions}`);
              } else {
                // For other tables (sales, etc.), use UUID lookup
                productFields.forEach(field => {
                  if (field === 'product_id') {
                    // Use UUID cache to find the actual product ID
                    const productUUID = productUUIDCache[filter.value!];
                    if (productUUID) {
                      console.log(`🆔 Product UUID filter: ${field} = ${productUUID} (for "${filter.value}")`);
                      query = query.eq(field, productUUID);
                    } else {
                      console.log(`⚠️ No UUID found for product: ${filter.value}`);
                      // Try a fuzzy UUID lookup by checking all cached products
                      const allProductNames = Object.keys(productUUIDCache);
                      const fuzzyMatches = findBestMatches(filter.value!, allProductNames, 0.8);
                      if (fuzzyMatches.length > 0) {
                        const bestMatch = fuzzyMatches[0];
                        const matchUUID = productUUIDCache[bestMatch.match];
                        console.log(`🎯 Fuzzy UUID match: "${filter.value}" -> "${bestMatch.match}" -> ${matchUUID}`);
                        query = query.eq(field, matchUUID);
                      }
                    }
                  } else {
                    // For non-UUID fields in non-products tables, use ilike
                    console.log(`🔍 Product text filter: ${field} ilike %${filter.value}%`);
                    query = query.ilike(field, `%${filter.value}%`);
                  }
                });
              }
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
        
        // UNIVERSAL FIELD TYPE FILTERING: Handle numeric_filter and field_filter
        if (filter.type === 'numeric_filter' && filter.value) {
          console.log(`🔢 Processing numeric filter: ${filter.value} ${filter.unit || ''}`);
          const numericValue = parseFloat(filter.value);
          
          // Apply to numeric fields based on the table mapping
          if ('numeric_fields' in mapping) {
            const numericFields = mapping.numeric_fields;
            numericFields.forEach(field => {
              // Determine comparison based on context (for now use equality, can be enhanced)
              console.log(`🔢 Numeric filter: ${field} = ${numericValue}`);
              query = query.eq(field, numericValue);
            });
          }
        }
        
        if (filter.type === 'field_filter' && filter.value) {
          console.log(`🏷️ Processing field filter: ${filter.value}`);
          
          // Map field types to actual database fields based on table
          const fieldTypeMapping: { [key: string]: { [tableName: string]: string[] } } = {
            'category': {
              'products': ['category'],
              'users': ['department'] // department as category for users
            },
            'brand': {
              'products': ['brand']
            },
            'department': {
              'users': ['department']
            },
            'status': {
              'tasks': ['status'],
              'sales': ['status'],
              'stock': ['status']
            },
            'location': {
              'stock': ['warehouse_location'],
              'customers': ['city', 'country'],
              'users': ['city', 'country']
            },
            'price': {
              'products': ['price', 'cost']
            },
            'quantity': {
              'stock': ['quantity_on_hand']
            },
            'role': {
              'users': ['role']
            },
            'email': {
              'users': ['email'],
              'customers': ['email']
            },
            'company': {
              'customers': ['company']
            }
          };
          
          const fieldsForType = fieldTypeMapping[filter.value]?.[tableName] || [];
          fieldsForType.forEach((field: string) => {
            console.log(`🏷️ Field type filter: ${field} (${filter.value} type)`);
            // For field filters, we're looking for any non-null values in these fields
            query = query.not(field, 'is', null);
          });
        }
        
        // UNIVERSAL VALUE FILTERING: Handle specific database values (categories, brands, statuses, etc.)
        if (filter.type === 'info' && filter.value) {
          console.log(`🎯 Processing universal value filter: ${filter.value}`);
          
          // Smart field mapping based on value patterns
          const valueFieldMapping: { [value: string]: { [tableName: string]: string[] } } = {
            // Categories
            'laptop': { 'products': ['category', 'name', 'description'] },
            'desktop': { 'products': ['category', 'name', 'description'] },
            'monitor': { 'products': ['category', 'name', 'description'] },
            'keyboard': { 'products': ['category', 'name', 'description'] },
            'mouse': { 'products': ['category', 'name', 'description'] },
            'printer': { 'products': ['category', 'name', 'description'] },
            'software': { 'products': ['category', 'name', 'description'] },
            'hardware': { 'products': ['category', 'name', 'description'] },
            
            // Brands
            'apple': { 'products': ['brand', 'name', 'description'] },
            'microsoft': { 'products': ['brand', 'name', 'description'] },
            'dell': { 'products': ['brand', 'name', 'description'] },
            'hp': { 'products': ['brand', 'name', 'description'] },
            'lenovo': { 'products': ['brand', 'name', 'description'] },
            'samsung': { 'products': ['brand', 'name', 'description'] },
            'lg': { 'products': ['brand', 'name', 'description'] },
            'sony': { 'products': ['brand', 'name', 'description'] },
            
            // Statuses
            'active': { 'products': ['status'], 'tasks': ['status'], 'users': ['status'] },
            'inactive': { 'products': ['status'], 'tasks': ['status'], 'users': ['status'] },
            'pending': { 'tasks': ['status'], 'sales': ['status'] },
            'completed': { 'tasks': ['status'], 'sales': ['status'] },
            'cancelled': { 'tasks': ['status'], 'sales': ['status'] },
            'in-progress': { 'tasks': ['status'] },
            
            // Departments
            'sales': { 'users': ['department', 'role'] },
            'marketing': { 'users': ['department', 'role'] },
            'engineering': { 'users': ['department', 'role'] },
            'support': { 'users': ['department', 'role'] },
            'hr': { 'users': ['department', 'role'] },
            'finance': { 'users': ['department', 'role'] },
            'it': { 'users': ['department', 'role'] },
            
            // Roles
            'manager': { 'users': ['role', 'name'] },
            'director': { 'users': ['role', 'name'] },
            'analyst': { 'users': ['role', 'name'] },
            'specialist': { 'users': ['role', 'name'] },
            'coordinator': { 'users': ['role', 'name'] },
            'supervisor': { 'users': ['role', 'name'] },
            
            // Locations
            'warehouse': { 'stock': ['warehouse_location'], 'customers': ['city'], 'users': ['city'] },
            'main': { 'stock': ['warehouse_location'], 'customers': ['city'], 'users': ['city'] },
            'central': { 'stock': ['warehouse_location'], 'customers': ['city'], 'users': ['city'] },
            'north': { 'stock': ['warehouse_location'], 'customers': ['city'], 'users': ['city'] },
            'south': { 'stock': ['warehouse_location'], 'customers': ['city'], 'users': ['city'] }
          };
          
          const fieldsForValue = valueFieldMapping[filter.value.toLowerCase()]?.[tableName] || [];
          if (fieldsForValue.length > 0) {
            fieldsForValue.forEach((field: string) => {
              console.log(`🎯 Universal value filter: ${field} ilike %${filter.value}%`);
              query = query.or(`${field}.ilike.%${filter.value}%`);
            });
          } else {
            // Fallback: search in all text fields if no specific mapping
            if ('text_fields' in mapping) {
              const textFields = mapping.text_fields;
              textFields.forEach((field: string) => {
                console.log(`🎯 Fallback universal filter: ${field} ilike %${filter.value}%`);
                query = query.or(`${field}.ilike.%${filter.value}%`);
              });
            }
          }
        }
      });
    }
    
    // COMPREHENSIVE PRONOUN FILTERING - CRITICAL for "sales assigned to me", "my tasks", etc.
    if (pronounFilters.length > 0) {
      console.log(`👤 Processing ${pronounFilters.length} pronoun filters for table: ${tableName}`);
      
      // Define user-related fields for each table based on your schema
      const userFieldMappings: { [key: string]: string[] } = {
        'sales': ['sales_rep_id'],  // "sales assigned to me"
        'tasks': ['assigned_to'],   // "my tasks"
        'shifts': ['user_id'],      // "my shifts"
        'attendance': ['user_id'],  // "my attendance"
        'users': ['id']             // Direct user queries
      };
      
      const userFields = userFieldMappings[tableName] || [];
      
      if (userFields.length > 0) {
        pronounFilters.forEach(filter => {
          if (filter.value === 'current_user') {
            // Use the correct user IDs based on the actual data
            let targetUserId: string;
            
            if (tableName === 'tasks') {
              targetUserId = '550e8400-e29b-41d4-a716-446655440002'; // User with assigned tasks
            } else if (tableName === 'shifts' || tableName === 'attendance') {
              targetUserId = '550e8400-e29b-41d4-a716-446655440001'; // User with shifts/attendance
            } else if (tableName === 'sales') {
              targetUserId = '650e8400-e29b-41d4-a716-446655440000'; // Customer ID for sales demo
            } else {
              targetUserId = '550e8400-e29b-41d4-a716-446655440000'; // Default admin user
            }
            
            userFields.forEach(field => {
              console.log(`👤 Applying pronoun filter: ${field} = ${targetUserId} (for "${filter.text}" in ${tableName})`);
              
              if (field === 'sales_rep_id') {
                // For sales_rep_id, use customer_id instead since sales_rep_id might be NULL
                console.log(`⚠️ Using customer_id instead of sales_rep_id for demo`);
                query = query.eq('customer_id', targetUserId);
              } else {
                query = query.eq(field, targetUserId);
              }
            });
          }
        });
      } else {
        console.log(`⚠️ No user field mapping defined for table: ${tableName}`);
      }
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
      
      const entities = await extractEntitiesHomogeneityFixed(message, userName);
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
        entities: entities,  // Changed from responseEntities to entities for API consistency
        data: allResults
      };
      
    } catch (error) {
      console.error('❌ Error in processQuery:', error);
      return {
        response: `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        entities: [],  // Changed from responseEntities to entities
        data: []
      };
    }
  },

  // Get suggestions for ambiguous entity matches
  getSuggestions: async (query: string, entityType?: string) => {
    await initializeCache();
    
    console.log(`🔍 Getting suggestions for: "${query}" (type: ${entityType || 'any'})`);
    
    const suggestions: Array<{
      text: string;
      type: string;
      value: string;
      id?: string;
      confidence: number;
      description?: string;
    }> = [];
    
    const queryLower = query.toLowerCase();
    
    // Search in customer cache
    if (!entityType || entityType === 'customer') {
      Object.entries(FIELD_VALUE_PATTERNS.customer_values).forEach(([key, patterns]) => {
        if (key.includes(queryLower) || patterns.some(p => p.includes(queryLower))) {
          const uuid = customerUUIDCache[key];
          suggestions.push({
            text: key,
            type: 'customer',
            value: key,
            id: uuid,
            confidence: key.startsWith(queryLower) ? 0.9 : 0.7,
            description: `Customer: ${key}`
          });
        }
      });
    }
    
    // Search in product cache
    if (!entityType || entityType === 'product') {
      Object.entries(FIELD_VALUE_PATTERNS.product_values).forEach(([key, patterns]) => {
        if (key.includes(queryLower) || patterns.some(p => p.includes(queryLower))) {
          const uuid = productUUIDCache[key];
          suggestions.push({
            text: key,
            type: 'product',
            value: key,
            id: uuid,
            confidence: key.startsWith(queryLower) ? 0.9 : 0.7,
            description: `Product: ${key}`
          });
        }
      });
    }
    
    // Search in user cache
    if (!entityType || entityType === 'user') {
      Object.entries(FIELD_VALUE_PATTERNS.user_values).forEach(([key, patterns]) => {
        if (key.includes(queryLower) || patterns.some(p => p.includes(queryLower))) {
          const uuid = userUUIDCache[key];
          suggestions.push({
            text: key,
            type: 'user',
            value: key,
            id: uuid,
            confidence: key.startsWith(queryLower) ? 0.9 : 0.7,
            description: `User: ${key}`
          });
        }
      });
    }
    
    // Sort by confidence and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
      
    console.log(`📋 Found ${sortedSuggestions.length} suggestions for "${query}"`);
    return sortedSuggestions;
  }
};

export default chatService;
