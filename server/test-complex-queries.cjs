// Comprehensive Complex Query Testing System
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🎯 COMPREHENSIVE COMPLEX QUERY TESTING');
console.log('=====================================\n');

// Enhanced intelligent entity detection with location, timeline, pronouns
function advancedEntityDetection(text, userName = 'test_user') {
  console.log(`🔍 Testing: "${text}" (User: ${userName})`);
  
  const words = text.toLowerCase().split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'below', 'above', 'over', 'under', 'than', 'less', 'greater', 'more', 'from', 'where', 'when'].includes(word.toLowerCase())
  );
  
  console.log('📝 Words to analyze:', words);
  
  const detectedEntities = [];
  const tablesInvolved = new Set();
  const filters = {
    location: [],
    timeline: [],
    numeric: [],
    user: [],
    product: [],
    status: []
  };
  
  // PRODUCT DETECTION (expanded)
  const productKeywords = ['laptop', 'laptops', 'mouse', 'keyboard', 'monitor', 'webcam', 'hub', 'cable', 'charger'];
  const productMatch = words.find(word => productKeywords.some(p => word.includes(p)));
  if (productMatch) {
    detectedEntities.push({ word: productMatch, table: 'products', field: 'name', type: 'product' });
    tablesInvolved.add('products');
    filters.product.push(productMatch);
  }
  
  // SALES DETECTION
  const salesKeywords = ['sales', 'revenue', 'selling', 'sold', 'transaction', 'purchase', 'order'];
  const salesMatch = words.find(word => salesKeywords.includes(word));
  if (salesMatch) {
    detectedEntities.push({ word: salesMatch, table: 'sales', field: 'status', type: 'entity' });
    tablesInvolved.add('sales');
  }
  
  // STOCK/INVENTORY DETECTION
  const stockKeywords = ['stock', 'inventory', 'warehouse', 'quantity'];
  const stockMatch = words.find(word => stockKeywords.includes(word));
  if (stockMatch) {
    detectedEntities.push({ word: stockMatch, table: 'stock', field: 'warehouse_location', type: 'info' });
    tablesInvolved.add('stock');
  }
  
  // LOCATION DETECTION
  const locationKeywords = ['warehouse', 'store', 'location', 'branch', 'office', 'main', 'north', 'south', 'east', 'west'];
  const locationMatch = words.find(word => locationKeywords.includes(word));
  if (locationMatch) {
    filters.location.push(locationMatch);
    detectedEntities.push({ word: locationMatch, table: 'multiple', field: 'location', type: 'location_filter' });
  }
  
  // TIMELINE DETECTION
  const timelineKeywords = ['today', 'yesterday', 'week', 'month', 'year', 'recent', 'last', 'this', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const timelineMatch = words.find(word => timelineKeywords.includes(word));
  if (timelineMatch) {
    filters.timeline.push(timelineMatch);
    detectedEntities.push({ word: timelineMatch, table: 'multiple', field: 'date', type: 'timeline_filter' });
  }
  
  // PRONOUN RESOLUTION
  const pronouns = ['my', 'mine', 'me', 'i'];
  const pronounMatch = words.find(word => pronouns.includes(word));
  if (pronounMatch) {
    filters.user.push(userName);
    detectedEntities.push({ word: pronounMatch, table: 'multiple', field: 'user_id', type: 'user_filter' });
  }
  
  // CUSTOMER DETECTION
  const customerNames = ['ahmed', 'john', 'jane', 'sarah', 'mike', 'lisa'];
  const customerMatch = words.find(word => customerNames.includes(word));
  if (customerMatch) {
    detectedEntities.push({ word: customerMatch, table: 'customers', field: 'name', type: 'entity' });
    tablesInvolved.add('customers');
  }
  
  // TASKS DETECTION
  const taskKeywords = ['tasks', 'task', 'todo', 'assignment', 'work'];
  const taskMatch = words.find(word => taskKeywords.includes(word));
  if (taskMatch) {
    detectedEntities.push({ word: taskMatch, table: 'tasks', field: 'title', type: 'entity' });
    tablesInvolved.add('tasks');
  }
  
  // ATTENDANCE/SHIFT DETECTION
  const attendanceKeywords = ['attendance', 'shift', 'schedule', 'clockin', 'hours'];
  const attendanceMatch = words.find(word => attendanceKeywords.includes(word));
  if (attendanceMatch) {
    detectedEntities.push({ word: attendanceMatch, table: 'attendance', field: 'status', type: 'entity' });
    tablesInvolved.add('attendance');
  }
  
  // NUMERIC FILTERS
  const numericPattern = /(below|above|over|under|more than|less than)\s*(\d+)/;
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    filters.numeric.push({
      operator: numericMatch[1],
      value: parseInt(numericMatch[2])
    });
  }
  
  // STATUS DETECTION
  const statusKeywords = ['completed', 'pending', 'cancelled', 'active', 'inactive'];
  const statusMatch = words.find(word => statusKeywords.includes(word));
  if (statusMatch) {
    filters.status.push(statusMatch);
  }
  
  return {
    detectedEntities,
    tablesInvolved: Array.from(tablesInvolved),
    filters,
    words
  };
}

// Advanced query builder with complex joins and filters
function buildComplexQuery(detection) {
  const { tablesInvolved, filters, detectedEntities } = detection;
  
  let primaryTable = null;
  let queryBuilder = null;
  let joinStrategy = '';
  
  // SMART PRIMARY TABLE SELECTION
  if (tablesInvolved.includes('sales')) {
    primaryTable = 'sales';
    queryBuilder = supabase.from('sales').select(`
      *,
      customers(id, name, email, company, address),
      products(id, name, category, sku, price)
    `);
    joinStrategy = 'Sales with customer & product joins';
  } 
  else if (tablesInvolved.includes('stock')) {
    primaryTable = 'stock';
    queryBuilder = supabase.from('stock').select(`
      *,
      products(id, name, category, sku, price)
    `);
    joinStrategy = 'Stock with product joins';
  }
  else if (tablesInvolved.includes('tasks')) {
    primaryTable = 'tasks';
    queryBuilder = supabase.from('tasks').select(`
      *,
      users(id, full_name, email, department)
    `);
    joinStrategy = 'Tasks with user joins';
  }
  else if (tablesInvolved.includes('attendance')) {
    primaryTable = 'attendance';
    queryBuilder = supabase.from('attendance').select(`
      *,
      users(id, full_name, email, department),
      shifts(id, shift_name, start_time, end_time)
    `);
    joinStrategy = 'Attendance with user & shift joins';
  }
  else if (tablesInvolved.includes('customers')) {
    primaryTable = 'customers';
    queryBuilder = supabase.from('customers').select('*');
    joinStrategy = 'Customers standalone';
  }
  else if (tablesInvolved.includes('products')) {
    primaryTable = 'products';
    queryBuilder = supabase.from('products').select('*');
    joinStrategy = 'Products standalone';
  }
  
  return { primaryTable, queryBuilder, joinStrategy };
}

// Apply complex filters to query
function applyComplexFilters(queryBuilder, filters, primaryTable) {
  let query = queryBuilder;
  const appliedFilters = [];
  
  // NUMERIC FILTERS
  if (filters.numeric.length > 0) {
    const numFilter = filters.numeric[0];
    const field = getNumericField(primaryTable);
    
    if (field) {
      if (['below', 'under', 'less than'].includes(numFilter.operator)) {
        query = query.lt(field, numFilter.value);
        appliedFilters.push(`${field} < ${numFilter.value}`);
      } else {
        query = query.gt(field, numFilter.value);
        appliedFilters.push(`${field} > ${numFilter.value}`);
      }
    }
  }
  
  // LOCATION FILTERS
  if (filters.location.length > 0) {
    const locationFilter = filters.location[0];
    if (primaryTable === 'stock') {
      query = query.ilike('warehouse_location', `%${locationFilter}%`);
      appliedFilters.push(`warehouse_location ILIKE '%${locationFilter}%'`);
    } else if (primaryTable === 'customers') {
      query = query.ilike('address', `%${locationFilter}%`);
      appliedFilters.push(`address ILIKE '%${locationFilter}%'`);
    }
  }
  
  // TIMELINE FILTERS
  if (filters.timeline.length > 0) {
    const timeFilter = filters.timeline[0];
    if (['today', 'recent'].includes(timeFilter)) {
      const today = new Date().toISOString().split('T')[0];
      if (primaryTable === 'sales') {
        query = query.gte('sale_date', today);
        appliedFilters.push(`sale_date >= '${today}'`);
      } else if (primaryTable === 'attendance') {
        query = query.gte('date', today);
        appliedFilters.push(`date >= '${today}'`);
      }
    }
  }
  
  // USER FILTERS (Pronoun Resolution)
  if (filters.user.length > 0) {
    const user = filters.user[0];
    if (primaryTable === 'tasks') {
      query = query.eq('assigned_to', user);
      appliedFilters.push(`assigned_to = '${user}'`);
    } else if (primaryTable === 'attendance') {
      query = query.eq('user_id', user);
      appliedFilters.push(`user_id = '${user}'`);
    }
  }
  
  // PRODUCT FILTERS
  if (filters.product.length > 0) {
    const productName = filters.product[0];
    // Note: In real implementation, would need to lookup product ID first
    appliedFilters.push(`product contains '${productName}'`);
  }
  
  // STATUS FILTERS
  if (filters.status.length > 0) {
    const status = filters.status[0];
    if (primaryTable === 'tasks') {
      query = query.eq('status', status);
      appliedFilters.push(`status = '${status}'`);
    } else if (primaryTable === 'sales') {
      query = query.eq('status', status);
      appliedFilters.push(`status = '${status}'`);
    }
  }
  
  return { query, appliedFilters };
}

function getNumericField(table) {
  const fieldMap = {
    'sales': 'total_amount',
    'stock': 'quantity_available',
    'products': 'price',
    'tasks': 'priority'
  };
  return fieldMap[table];
}

// COMPREHENSIVE TEST QUERIES
const complexTestQueries = [
  // PRODUCT SALES COMBINATIONS
  {
    query: "laptop sales above 1000",
    description: "Product + Sales + Numeric filter",
    expectation: "Sales table with product joins, amount > 1000, laptop filter"
  },
  {
    query: "laptop sales from main warehouse",
    description: "Product + Sales + Location",
    expectation: "Sales with location and product filtering"
  },
  {
    query: "monitor sales this month",
    description: "Product + Sales + Timeline",
    expectation: "Sales with time filter and product filter"
  },
  
  // INVENTORY & LOCATION
  {
    query: "laptop stock below 50 in north warehouse",
    description: "Stock + Product + Numeric + Location",
    expectation: "Stock table with quantity < 50, location filter, laptop filter"
  },
  {
    query: "warehouse inventory above 100",
    description: "Stock + Location + Numeric",
    expectation: "Stock table with quantity > 100"
  },
  
  // TIMELINE QUERIES
  {
    query: "sales today above 500",
    description: "Sales + Timeline + Numeric",
    expectation: "Sales from today with amount > 500"
  },
  {
    query: "completed tasks this week",
    description: "Tasks + Status + Timeline",
    expectation: "Tasks with status=completed, current week"
  },
  
  // PRONOUN RESOLUTION
  {
    query: "my tasks",
    description: "Pronoun + Tasks",
    expectation: "Tasks assigned to current user"
  },
  {
    query: "my attendance today",
    description: "Pronoun + Attendance + Timeline",
    expectation: "User's attendance records for today"
  },
  {
    query: "my sales above 1000",
    description: "Pronoun + Sales + Numeric",
    expectation: "Sales by current user > 1000"
  },
  
  // CUSTOMER QUERIES
  {
    query: "ahmed sales above 500",
    description: "Customer + Sales + Numeric",
    expectation: "Sales for Ahmed customer > 500"
  },
  {
    query: "customers from north office",
    description: "Customer + Location",
    expectation: "Customers with north in address"
  },
  
  // COMPLEX MULTI-TABLE
  {
    query: "pending tasks for laptop projects",
    description: "Tasks + Status + Product reference",
    expectation: "Tasks with pending status containing laptop"
  },
  {
    query: "recent attendance for my shifts",
    description: "Attendance + Timeline + Pronoun + Shifts",
    expectation: "Recent attendance for user's shifts"
  }
];

// Execute comprehensive tests
async function runComprehensiveTests() {
  console.log('📋 TESTING ENTITY DETECTION\n');
  
  for (const test of complexTestQueries) {
    console.log(`🎯 TEST: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected: ${test.expectation}`);
    
    const detection = advancedEntityDetection(test.query, 'ahmed_hassan');
    
    console.log(`   📊 Tables: ${detection.tablesInvolved.join(', ') || 'None'}`);
    console.log(`   🎭 Entities: ${detection.detectedEntities.length}`);
    
    detection.detectedEntities.forEach(entity => {
      console.log(`      - "${entity.word}" → ${entity.table}.${entity.field} (${entity.type})`);
    });
    
    if (Object.keys(detection.filters).some(key => detection.filters[key].length > 0)) {
      console.log('   🔍 Filters detected:');
      Object.entries(detection.filters).forEach(([type, values]) => {
        if (values.length > 0) {
          console.log(`      - ${type}: ${JSON.stringify(values)}`);
        }
      });
    }
    
    const queryPlan = buildComplexQuery(detection);
    console.log(`   📋 Primary table: ${queryPlan.primaryTable || 'None'}`);
    console.log(`   🔗 Strategy: ${queryPlan.joinStrategy}`);
    
    console.log('   ' + '─'.repeat(60));
  }
  
  // Test a few real queries
  console.log('\n🚀 TESTING REAL DATABASE QUERIES\n');
  
  await testRealComplexQuery("laptop stock below 50");
  await testRealComplexQuery("ahmed");
  await testRealComplexQuery("sales above 1000");
  
  console.log('\n🎉 COMPREHENSIVE TESTING COMPLETE!');
}

async function testRealComplexQuery(queryText) {
  console.log(`🔍 REAL QUERY: "${queryText}"`);
  
  try {
    const detection = advancedEntityDetection(queryText, 'ahmed_hassan');
    const queryPlan = buildComplexQuery(detection);
    
    if (!queryPlan.queryBuilder) {
      console.log('   ❌ No query plan generated');
      return;
    }
    
    const { query, appliedFilters } = applyComplexFilters(
      queryPlan.queryBuilder, 
      detection.filters, 
      queryPlan.primaryTable
    );
    
    const { data, error } = await query.limit(5);
    
    if (error) {
      console.log(`   ❌ Query error: ${error.message}`);
      return;
    }
    
    console.log(`   ✅ Found ${data.length} records`);
    console.log(`   📋 Table: ${queryPlan.primaryTable}`);
    console.log(`   🔍 Filters: ${appliedFilters.join(', ') || 'None'}`);
    
    if (data.length > 0) {
      console.log('   📄 Sample records:');
      data.slice(0, 2).forEach((record, i) => {
        const key = Object.keys(record).find(k => ['name', 'title', 'id'].includes(k)) || Object.keys(record)[0];
        console.log(`      ${i + 1}. ${key}: ${record[key]}`);
      });
    }
    
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  console.log('');
}

runComprehensiveTests().catch(console.error);
