const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

console.log('🚀 Starting Working Backend Server...');

// Mock entity extraction endpoint
app.post('/api/chat/extract', (req, res) => {
  const { message } = req.body;
  console.log('🔍 Extracting entities for:', message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
    const threshold = numericMatch ? parseInt(numericMatch[1]) : 1000;
    const operator = numericMatch ? numericMatch[0].split(' ')[0] : 'above';
    const sqlOperator = operator === 'below' || operator === 'under' ? '<' : '>';
    
    mockData = [
      { sale_id: 'S001', product_name: 'Gaming Laptop Pro', customer_name: 'Acme Corporation', quantity: 2, total_amount: 2999.98, sale_date: '2025-01-15', sales_rep: 'Sarah Johnson' },
      { sale_id: 'S002', product_name: 'Business Laptop Elite', customer_name: 'Global Tech Solutions', quantity: 5, total_amount: 7499.95, sale_date: '2025-01-16', sales_rep: 'Mike Chen' },
      { sale_id: 'S003', product_name: 'Server System Pro', customer_name: 'Enterprise Corp', quantity: 1, total_amount: 15000.00, sale_date: '2025-01-17', sales_rep: 'Lisa Rodriguez' }
    ];
    
    if (text.includes('laptop')) {
      sqlQuery = `SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%' AND s.total_amount ${sqlOperator} ${threshold}`;
    } else {
      sqlQuery = `SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE s.total_amount ${sqlOperator} ${threshold}`;
    }
    
    responseEntities = [];
    if (text.includes('laptop')) {
      responseEntities.push({
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('laptop'),
        endIndex: text.indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Entity: products table'
      });
    }
    responseEntities.push({
      text: text.includes('sales') ? 'sales' : 'sale',
      type: 'entity',
      table: 'sales',
      color: '#7C3AED',
      startIndex: text.indexOf(text.includes('sales') ? 'sales' : 'sale'),
      endIndex: text.indexOf(text.includes('sales') ? 'sales' : 'sale') + (text.includes('sales') ? 5 : 4),
      confidence: 0.8,
      hoverText: 'Entity: sales table'
    });
    responseEntities.push({
      text: numericMatch[0],
      type: 'numeric_filter',
      table: 'sales',
      color: '#DC2626',
      value: threshold,
      operator: operator,
      field: 'total_amount',
      startIndex: text.indexOf(numericMatch[0]),
      endIndex: text.indexOf(numericMatch[0]) + numericMatch[0].length,
      confidence: 0.9,
      hoverText: `Numeric Filter: total_amount ${sqlOperator} ${threshold}`,
      isFilter: true
    });
  }
  
  // Sales of laptop pattern
  else if (text.includes('laptop') && text.includes('sales')) {ror: 'Message is required' });
  }

  const entities = [];
  const text = message.toLowerCase();
  
  // ====== ENTITY DETECTION (TABLES FROM SCHEMA.SQL) ======
  
  // 1. CUSTOMERS table entities
  const customerPatterns = [
    { keywords: ['customer', 'customers', 'client', 'clients'], table: 'customers' },
    { keywords: ['ahmed', 'ahmad'], table: 'customers', hasSuggestions: true },
    { keywords: ['acme', 'global tech', 'trading'], table: 'customers', hasSuggestions: true }
  ];
  
  customerPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        const suggestions = pattern.hasSuggestions ? [
          'Ahmed Ali (ID: C001) - Ahmed Enterprises',
          'Ahmed Hassan (ID: C002) - Hassan Trading', 
          'Ahmad Abdullah (ID: C003) - Ahmad Solutions',
          'Acme Corporation (ID: C004) - Corporate Account',
          'Global Tech Solutions (ID: C005) - Technology'
        ] : undefined;
        
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#059669',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.95,
          hoverText: `Entity: ${pattern.table} table`,
          ...(suggestions && { suggestions })
        });
      }
    });
  });
  
  // 2. PRODUCTS table entities
  const productPatterns = [
    { keywords: ['product', 'products', 'item', 'items'], table: 'products' },
    { keywords: ['laptop', 'laptops', 'computer', 'computers'], table: 'products', hasSuggestions: true },
    { keywords: ['headphones', 'headphone', 'audio'], table: 'products', hasSuggestions: true },
    { keywords: ['watch', 'watches', 'smartwatch'], table: 'products', hasSuggestions: true },
    { keywords: ['mouse', 'mice', 'wireless'], table: 'products', hasSuggestions: true }
  ];
  
  productPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        const suggestions = pattern.hasSuggestions ? [
          'Gaming Laptop Pro (SKU: GLP-001) - $1,499.99',
          'Business Laptop Elite (SKU: BLE-001) - $1,299.99',
          'Wireless Headphones Pro (SKU: WHP-001) - $299.99',
          'Smart Watch Series X (SKU: SWX-001) - $399.99',
          'Wireless Mouse Elite (SKU: WME-001) - $79.99'
        ] : undefined;
        
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#2563EB',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.9,
          hoverText: `Entity: ${pattern.table} table`,
          ...(suggestions && { suggestions })
        });
      }
    });
  });
  
  // 3. SALES table entities
  const salesPatterns = [
    { keywords: ['sale', 'sales', 'selling', 'sold'], table: 'sales' },
    { keywords: ['revenue', 'income', 'earnings'], table: 'sales' },
    { keywords: ['transaction', 'transactions', 'purchase', 'purchases'], table: 'sales' }
  ];
  
  salesPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#7C3AED',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
        });
      }
    });
  });
  
  // 4. STOCK table entities
  const stockPatterns = [
    { keywords: ['stock', 'inventory', 'warehouse'], table: 'stock', type: 'info' },
    { keywords: ['quantity', 'qty', 'amount'], table: 'stock', type: 'info' }
  ];
  
  stockPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: pattern.type || 'entity',
          table: pattern.table,
          color: '#0891B2',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
        });
      }
    });
  });
  
  // 5. TASKS table entities
  const taskPatterns = [
    { keywords: ['task', 'tasks', 'todo', 'assignment'], table: 'tasks' },
    { keywords: ['job', 'jobs', 'work'], table: 'tasks' }
  ];
  
  taskPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#EA580C',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
        });
      }
    });
  });
  
  // 6. USERS table entities
  const userPatterns = [
    { keywords: ['user', 'users', 'employee', 'employees'], table: 'users' },
    { keywords: ['staff', 'team', 'person', 'people'], table: 'users' }
  ];
  
  userPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#DC2626',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
        });
      }
    });
  });
  
  // 7. SHIFTS table entities
  const shiftPatterns = [
    { keywords: ['shift', 'shifts', 'schedule', 'scheduling'], table: 'shifts' },
    { keywords: ['roster', 'timetable', 'worktime'], table: 'shifts' }
  ];
  
  shiftPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#10B981',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
        });
      }
    });
  });
  
  // 8. ATTENDANCE table entities
  const attendancePatterns = [
    { keywords: ['attendance', 'attendance', 'clockin', 'clockout'], table: 'attendance' },
    { keywords: ['timesheet', 'hours', 'worked'], table: 'attendance' }
  ];
  
  attendancePatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'entity',
          table: pattern.table,
          color: '#F59E0B',
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Entity: ${pattern.table} table`
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
  
  // ====== TEMPORAL ENTITIES (TIME-BASED) ======
  const temporalPatterns = [
    { keywords: ['today', 'now', 'current'], value: '2025-01-20', table: 'date_dimension' },
    { keywords: ['yesterday'], value: '2025-01-19', table: 'date_dimension' },
    { keywords: ['tomorrow'], value: '2025-01-21', table: 'date_dimension' },
    { keywords: ['this week'], value: '2025-W03', table: 'date_dimension' },
    { keywords: ['last week'], value: '2025-W02', table: 'date_dimension' },
    { keywords: ['this month'], value: '2025-01', table: 'date_dimension' },
    { keywords: ['last month'], value: '2024-12', table: 'date_dimension' },
    { keywords: ['this year'], value: '2025', table: 'date_dimension' },
    { keywords: ['last year'], value: '2024', table: 'date_dimension' }
  ];
  
  temporalPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'temporal',
          table: pattern.table,
          color: '#7C3AED',
          value: pattern.value,
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.9,
          hoverText: `Time Period: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`
        });
      }
    });
  });
  
  // ====== NUMERIC FILTERS ======
  const numericPattern = /(?:below|above|over|under|less than|greater than|more than|exactly)\s*(\d+)/gi;
  let match;
  while ((match = numericPattern.exec(text)) !== null) {
    const operator = match[0].toLowerCase().replace(/\s*\d+/, '').trim();
    const value = parseInt(match[1]);
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    // Enhanced field detection based on context and entity relationships
    let field = 'quantity_on_hand'; // Default
    let table = 'stock';
    let filterType = 'numeric_filter';
    
    // Context-aware field mapping
    if (text.includes('stock') || text.includes('inventory') || text.includes('warehouse')) {
      field = 'quantity_on_hand';
      table = 'stock';
    } else if (text.includes('sales') || text.includes('revenue') || text.includes('income')) {
      field = 'total_amount';
      table = 'sales';
    } else if (text.includes('price') || text.includes('cost') || text.includes('amount')) {
      field = 'price';
      table = 'products';
    } else if (text.includes('quantity') || text.includes('qty')) {
      if (text.includes('sales') || text.includes('sold')) {
        field = 'quantity';
        table = 'sales';
      } else {
        field = 'quantity_on_hand';
        table = 'stock';
      }
    } else if (text.includes('task') || text.includes('assignment')) {
      field = 'priority_level';
      table = 'tasks';
    } else if (text.includes('customer') || text.includes('client')) {
      field = 'total_orders';
      table = 'customers';
    }
    
    entities.push({
      text: match[0],
      type: filterType,
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
  
  // ====== STATUS FILTERS ======
  const statusPatterns = [
    { keywords: ['pending', 'waiting'], value: 'pending', table: 'tasks' },
    { keywords: ['completed', 'done', 'finished'], value: 'completed', table: 'tasks' },
    { keywords: ['active', 'running', 'ongoing'], value: 'active', table: 'tasks' },
    { keywords: ['cancelled', 'canceled'], value: 'cancelled', table: 'tasks' },
    { keywords: ['in progress', 'progress'], value: 'in_progress', table: 'tasks' }
  ];
  
  statusPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'status_filter',
          table: pattern.table,
          color: '#EA580C',
          value: pattern.value,
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.85,
          hoverText: `Status Filter: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} items`,
          isFilter: true
        });
      }
    });
  });
  
  // ====== LOCATION FILTERS ======
  const locationPatterns = [
    { keywords: ['paris', 'france'], value: 'Paris', table: 'stock' },
    { keywords: ['london', 'uk', 'england'], value: 'London', table: 'stock' },
    { keywords: ['new york', 'ny', 'nyc'], value: 'New York', table: 'stock' },
    { keywords: ['dubai', 'uae'], value: 'Dubai', table: 'customers' },
    { keywords: ['berlin', 'germany'], value: 'Berlin', table: 'stock' }
  ];
  
  locationPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          text: keyword,
          type: 'location_filter',
          table: pattern.table,
          color: '#0891B2',
          value: pattern.value,
          startIndex: index,
          endIndex: index + keyword.length,
          confidence: 0.8,
          hoverText: `Location Filter: ${pattern.value}`,
          isFilter: true
        });
      }
    });
  });

  console.log('✅ Returning', entities.length, 'entities:', entities.map(e => `${e.text}(${e.type}:${e.table})`));
  res.json({ entities });
});

// Mock query processing endpoint with ILIKE case-insensitive matching
app.post('/api/chat/query', (req, res) => {
  const { message, userName } = req.body;
  console.log('🔍 Processing query:', message, 'for user:', userName);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let mockData = [];
  let responseEntities = [];
  let sqlQuery = '';
  const text = message.toLowerCase();
  
  // ====== ENHANCED QUERY PROCESSING WITH ILIKE ======
  
  // 1. CUSTOMERS table queries
  if (text.includes('customer') && !text.includes('sales') && !text.includes('tasks')) {
    mockData = [
      { customer_id: 'C001', name: 'Ahmed Ali', email: 'ahmed.ali@email.com', company: 'Ahmed Enterprises', city: 'Dubai', status: 'active' },
      { customer_id: 'C002', name: 'John Smith', email: 'john@company.com', company: 'Smith Corp', city: 'London', status: 'active' },
      { customer_id: 'C003', name: 'Sarah Johnson', email: 'sarah@business.com', company: 'Johnson LLC', city: 'Paris', status: 'active' }
    ];
    sqlQuery = "SELECT * FROM customers WHERE name ILIKE '%customer%' OR company ILIKE '%customer%'";
    responseEntities = [
      {
        text: 'customer',
        type: 'entity',
        table: 'customers',
        color: '#059669',
        startIndex: text.indexOf('customer'),
        endIndex: text.indexOf('customer') + 8,
        confidence: 0.95,
        hoverText: 'Entity: customers table'
      }
    ];
  }
  
  // 2. PRODUCTS table queries  
  else if (text.includes('product') && !text.includes('sales') && !text.includes('stock')) {
    mockData = [
      { product_id: 'P001', name: 'Gaming Laptop Pro', sku: 'GLP-001', category: 'Electronics', brand: 'TechBrand', price: 1499.99, status: 'active' },
      { product_id: 'P002', name: 'Business Laptop Elite', sku: 'BLE-001', category: 'Electronics', brand: 'ProBrand', price: 1299.99, status: 'active' },
      { product_id: 'P003', name: 'Wireless Headphones', sku: 'WHP-001', category: 'Audio', brand: 'AudioTech', price: 299.99, status: 'active' }
    ];
    sqlQuery = "SELECT * FROM products WHERE name ILIKE '%product%' OR category ILIKE '%product%'";
    responseEntities = [
      {
        text: 'product',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('product'),
        endIndex: text.indexOf('product') + 7,
        confidence: 0.9,
        hoverText: 'Entity: products table'
      }
    ];
  }
  
  // 3. TASKS table queries
  else if (text.includes('task') && !text.includes('ahmed') && !text.includes('pending')) {
    mockData = [
      { task_id: 'T001', title: 'Complete quarterly report', assigned_to: 'John Smith', status: 'pending', priority: 'high', due_date: '2025-01-25' },
      { task_id: 'T002', title: 'Review customer feedback', assigned_to: 'Sarah Johnson', status: 'in_progress', priority: 'medium', due_date: '2025-01-22' },
      { task_id: 'T003', title: 'Update product catalog', assigned_to: 'Mike Chen', status: 'completed', priority: 'low', due_date: '2025-01-20' }
    ];
    sqlQuery = "SELECT * FROM tasks WHERE title ILIKE '%task%' OR description ILIKE '%task%'";
    responseEntities = [
      {
        text: 'task',
        type: 'entity',
        table: 'tasks',
        color: '#EA580C',
        startIndex: text.indexOf('task'),
        endIndex: text.indexOf('task') + 4,
        confidence: 0.8,
        hoverText: 'Entity: tasks table'
      }
    ];
  }
  
  // 4. SALES table queries
  else if (text.includes('sale') && !text.includes('laptop') && !text.includes('ahmed')) {
    mockData = [
      { sale_id: 'S001', customer_name: 'Acme Corporation', product_name: 'Gaming Laptop Pro', quantity: 2, total_amount: 2999.98, sale_date: '2025-01-15' },
      { sale_id: 'S002', customer_name: 'Global Tech Solutions', product_name: 'Business Laptop Elite', quantity: 5, total_amount: 7499.95, sale_date: '2025-01-16' },
      { sale_id: 'S003', customer_name: 'Ahmed Trading LLC', product_name: 'Wireless Headphones', quantity: 3, total_amount: 899.97, sale_date: '2025-01-17' }
    ];
    sqlQuery = "SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id";
    responseEntities = [
      {
        text: 'sale',
        type: 'entity',
        table: 'sales',
        color: '#7C3AED',
        startIndex: text.indexOf('sale'),
        endIndex: text.indexOf('sale') + 4,
        confidence: 0.8,
        hoverText: 'Entity: sales table'
      }
    ];
  }
  
  // 5. STOCK table queries
  else if (text.includes('stock') && !text.includes('laptop') && !text.includes('below')) {
    mockData = [
      { stock_id: 'ST001', product_name: 'Gaming Laptop Pro', warehouse_location: 'Paris Main', quantity_on_hand: 15, quantity_reserved: 3, reorder_level: 5 },
      { stock_id: 'ST002', product_name: 'Business Laptop Elite', warehouse_location: 'London North', quantity_on_hand: 8, quantity_reserved: 2, reorder_level: 5 },
      { stock_id: 'ST003', product_name: 'Wireless Headphones', warehouse_location: 'Berlin South', quantity_on_hand: 22, quantity_reserved: 5, reorder_level: 10 }
    ];
    sqlQuery = "SELECT st.*, p.name as product_name FROM stock st JOIN products p ON st.product_id = p.id WHERE st.warehouse_location ILIKE '%stock%'";
    responseEntities = [
      {
        text: 'stock',
        type: 'entity',
        table: 'stock',
        color: '#0891B2',
        startIndex: text.indexOf('stock'),
        endIndex: text.indexOf('stock') + 5,
        confidence: 0.8,
        hoverText: 'Entity: stock table'
      }
    ];
  }
  
  // 6. USERS table queries
  else if (text.includes('user') || text.includes('employee')) {
    mockData = [
      { user_id: 'U001', name: 'John Smith', email: 'john@company.com', role: 'manager', department: 'Sales', created_at: '2024-01-10' },
      { user_id: 'U002', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'analyst', department: 'Marketing', created_at: '2024-01-12' },
      { user_id: 'U003', name: 'Mike Chen', email: 'mike@company.com', role: 'developer', department: 'IT', created_at: '2024-01-15' }
    ];
    sqlQuery = "SELECT * FROM users WHERE name ILIKE '%user%' OR role ILIKE '%employee%'";
    responseEntities = [
      {
        text: text.includes('user') ? 'user' : 'employee',
        type: 'entity',
        table: 'users',
        color: '#DC2626',
        startIndex: text.indexOf(text.includes('user') ? 'user' : 'employee'),
        endIndex: text.indexOf(text.includes('user') ? 'user' : 'employee') + (text.includes('user') ? 4 : 8),
        confidence: 0.8,
        hoverText: 'Entity: users table'
      }
    ];
  }
  
  // ====== COMPLEX QUERIES WITH MULTIPLE ENTITIES ======
  
  // Sales with amount filters (like "laptop sales above 1000")
  if ((text.includes('sales') || text.includes('sale')) && text.match(/(?:above|below|over|under|greater than|less than)\s*\d+/)) {
    const numericMatch = text.match(/(?:above|below|over|under|greater than|less than)\s*(\d+)/);
    const threshold = numericMatch ? parseInt(numericMatch[1]) : 1000;
    const operator = numericMatch ? numericMatch[0].split(' ')[0] : 'above';
    const sqlOperator = operator === 'below' || operator === 'under' ? '<' : '>';
    
    mockData = [
      { sale_id: 'S001', product_name: 'Gaming Laptop Pro', customer_name: 'Acme Corporation', quantity: 2, total_amount: 2999.98, sale_date: '2025-01-15', sales_rep: 'Sarah Johnson' },
      { sale_id: 'S002', product_name: 'Business Laptop Elite', customer_name: 'Global Tech Solutions', quantity: 5, total_amount: 7499.95, sale_date: '2025-01-16', sales_rep: 'Mike Chen' },
      { sale_id: 'S003', product_name: 'Server System Pro', customer_name: 'Enterprise Corp', quantity: 1, total_amount: 15000.00, sale_date: '2025-01-17', sales_rep: 'Lisa Rodriguez' }
    ];
    
    if (text.includes('laptop')) {
      sqlQuery = `SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%' AND s.total_amount ${sqlOperator} ${threshold}`;
    } else {
      sqlQuery = `SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE s.total_amount ${sqlOperator} ${threshold}`;
    }
    
    responseEntities = [];
    if (text.includes('laptop')) {
      responseEntities.push({
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('laptop'),
        endIndex: text.indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Entity: products table'
      });
    }
    responseEntities.push({
      text: text.includes('sales') ? 'sales' : 'sale',
      type: 'entity',
      table: 'sales',
      color: '#7C3AED',
      startIndex: text.indexOf(text.includes('sales') ? 'sales' : 'sale'),
      endIndex: text.indexOf(text.includes('sales') ? 'sales' : 'sale') + (text.includes('sales') ? 5 : 4),
      confidence: 0.8,
      hoverText: 'Entity: sales table'
    });
    responseEntities.push({
      text: numericMatch[0],
      type: 'numeric_filter',
      table: 'sales',
      color: '#DC2626',
      value: threshold,
      operator: operator,
      field: 'total_amount',
      startIndex: text.indexOf(numericMatch[0]),
      endIndex: text.indexOf(numericMatch[0]) + numericMatch[0].length,
      confidence: 0.9,
      hoverText: `Numeric Filter: total_amount ${sqlOperator} ${threshold}`,
      isFilter: true
    });
  }
  
  // Sales of laptop pattern
  else if (text.includes('laptop') && text.includes('sales')) {
    mockData = [
      { sale_id: 'S001', product_name: 'Gaming Laptop Pro', customer_name: 'Acme Corporation', quantity: 2, total_amount: 2999.98, sale_date: '2025-01-15', sales_rep: 'Sarah Johnson' },
      { sale_id: 'S002', product_name: 'Business Laptop Elite', customer_name: 'Global Tech Solutions', quantity: 5, total_amount: 7499.95, sale_date: '2025-01-16', sales_rep: 'Mike Chen' },
      { sale_id: 'S003', product_name: 'Ultrabook Air', customer_name: 'Ahmed Trading LLC', quantity: 1, total_amount: 1299.99, sale_date: '2025-01-17', sales_rep: 'Lisa Rodriguez' }
    ];
    sqlQuery = "SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%'";
    
    responseEntities = [
      {
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('laptop'),
        endIndex: text.indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Entity: products table'
      },
      {
        text: 'sales',
        type: 'entity',
        table: 'sales',
        color: '#7C3AED',
        startIndex: text.indexOf('sales'),
        endIndex: text.indexOf('sales') + 5,
        confidence: 0.8,
        hoverText: 'Entity: sales table'
      }
    ];
  }
  
  // Ahmed tasks pattern
  else if (text.includes('ahmed') && text.includes('tasks')) {
    mockData = [
      { task_id: 'T001', title: 'Review Ahmed Trading account', assigned_to: 'Ahmed Ali', status: 'pending', priority: 'high', due_date: '2025-01-20', description: 'Quarterly account review' },
      { task_id: 'T002', title: 'Customer follow-up for Ahmed Trading', assigned_to: 'Sarah Johnson', status: 'in_progress', priority: 'medium', due_date: '2025-01-18', description: 'Follow up on recent orders' },
      { task_id: 'T003', title: 'Update Ahmed customer profile', assigned_to: 'Mike Chen', status: 'completed', priority: 'low', due_date: '2025-01-15', description: 'Profile information update' }
    ];
    sqlQuery = "SELECT t.*, u.name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.title ILIKE '%ahmed%' OR t.description ILIKE '%ahmed%'";
    
    responseEntities = [
      {
        text: 'ahmed',
        type: 'entity',
        table: 'customers',
        color: '#059669',
        startIndex: text.indexOf('ahmed'),
        endIndex: text.indexOf('ahmed') + 5,
        confidence: 0.95,
        hoverText: 'Entity: customers table',
        suggestions: ['Ahmed Ali (ID: 1)', 'Ahmed Trading LLC (ID: 2)']
      },
      {
        text: 'tasks',
        type: 'entity',
        table: 'tasks',
        color: '#EA580C',
        startIndex: text.indexOf('tasks'),
        endIndex: text.indexOf('tasks') + 5,
        confidence: 0.8,
        hoverText: 'Entity: tasks table'
      }
    ];
  }
  
  // Laptop stock in paris pattern
  else if (text.includes('laptop') && text.includes('stock') && text.includes('paris')) {
    mockData = [
      { stock_id: 'ST001', product_name: 'Gaming Laptop Pro', warehouse_location: 'Paris Main', quantity_on_hand: 15, quantity_reserved: 3, reorder_level: 5, last_restocked: '2025-01-10' },
      { stock_id: 'ST002', product_name: 'Business Laptop Elite', warehouse_location: 'Paris North', quantity_on_hand: 8, quantity_reserved: 2, reorder_level: 5, last_restocked: '2025-01-12' },
      { stock_id: 'ST003', product_name: 'Ultrabook Air', warehouse_location: 'Paris South', quantity_on_hand: 22, quantity_reserved: 5, reorder_level: 10, last_restocked: '2025-01-08' }
    ];
    sqlQuery = "SELECT st.*, p.name as product_name FROM stock st JOIN products p ON st.product_id = p.id WHERE p.name ILIKE '%laptop%' AND st.warehouse_location ILIKE '%paris%'";
    
    responseEntities = [
      {
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('laptop'),
        endIndex: text.indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Entity: products table'
      },
      {
        text: 'stock',
        type: 'entity',
        table: 'stock',
        color: '#0891B2',
        startIndex: text.indexOf('stock'),
        endIndex: text.indexOf('stock') + 5,
        confidence: 0.8,
        hoverText: 'Entity: stock table'
      },
      {
        text: 'paris',
        type: 'location_filter',
        table: 'stock',
        color: '#0891B2',
        value: 'Paris',
        startIndex: text.indexOf('paris'),
        endIndex: text.indexOf('paris') + 5,
        confidence: 0.8,
        hoverText: 'Location Filter: Paris warehouses',
        isFilter: true
      }
    ];
  }
  
  // Stock below threshold pattern
  else if (text.includes('stock') && (text.includes('below') || text.includes('above') || text.includes('under') || text.includes('over'))) {
    const numericMatch = text.match(/(?:below|above|over|under|less than|greater than)\s*(\d+)/);
    const threshold = numericMatch ? parseInt(numericMatch[1]) : 10;
    const operator = numericMatch ? numericMatch[0].split(' ')[0] : 'below';
    
    mockData = [
      { stock_id: 'ST001', product_name: 'Gaming Mouse Pro', warehouse_location: 'Paris Main', quantity_on_hand: 8, quantity_reserved: 2, reorder_level: 10, last_restocked: '2025-01-10' },
      { stock_id: 'ST002', product_name: 'Wireless Keyboard', warehouse_location: 'London North', quantity_on_hand: 5, quantity_reserved: 1, reorder_level: 15, last_restocked: '2025-01-08' },
      { stock_id: 'ST003', product_name: 'USB Cable Pack', warehouse_location: 'Berlin South', quantity_on_hand: 3, quantity_reserved: 0, reorder_level: 20, last_restocked: '2025-01-05' }
    ];
    
    const sqlOperator = operator === 'below' || operator === 'under' ? '<' : '>';
    sqlQuery = `SELECT st.*, p.name as product_name FROM stock st JOIN products p ON st.product_id = p.id WHERE st.quantity_on_hand ${sqlOperator} ${threshold}`;
    
    responseEntities = [
      {
        text: 'stock',
        type: 'entity',
        table: 'stock',
        color: '#0891B2',
        startIndex: text.indexOf('stock'),
        endIndex: text.indexOf('stock') + 5,
        confidence: 0.8,
        hoverText: 'Entity: stock table'
      },
      {
        text: numericMatch ? numericMatch[0] : 'below 10',
        type: 'numeric_filter',
        table: 'stock',
        color: '#DC2626',
        value: threshold,
        operator: operator,
        field: 'quantity_on_hand',
        startIndex: numericMatch ? text.indexOf(numericMatch[0]) : text.indexOf('below'),
        endIndex: numericMatch ? text.indexOf(numericMatch[0]) + numericMatch[0].length : text.indexOf('below') + 8,
        confidence: 0.9,
        hoverText: `Numeric Filter: quantity_on_hand ${sqlOperator} ${threshold}`,
        isFilter: true
      }
    ];
  }
  
  // Ahmad/Ahmed single entity pattern with suggestions
  else if ((text.includes('ahmed') || text.includes('ahmad')) && !text.includes('tasks') && !text.includes('sales')) {
    mockData = [
      { customer_id: 'C001', name: 'Ahmed Ali', email: 'ahmed.ali@email.com', company: 'Ahmed Enterprises', city: 'Dubai', status: 'active' },
      { customer_id: 'C002', name: 'Ahmed Hassan', email: 'ahmed.hassan@company.com', company: 'Hassan Trading', city: 'Cairo', status: 'active' },
      { customer_id: 'C003', name: 'Ahmad Abdullah', email: 'ahmad@business.ae', company: 'Ahmad Solutions', city: 'Abu Dhabi', status: 'active' }
    ];
    sqlQuery = "SELECT * FROM customers WHERE name ILIKE '%ahmed%' OR name ILIKE '%ahmad%' OR company ILIKE '%ahmed%' OR company ILIKE '%ahmad%'";
    
    responseEntities = [
      {
        text: text.includes('ahmad') ? 'ahmad' : 'ahmed',
        type: 'entity',
        table: 'customers',
        color: '#059669',
        startIndex: text.indexOf(text.includes('ahmad') ? 'ahmad' : 'ahmed'),
        endIndex: text.indexOf(text.includes('ahmad') ? 'ahmad' : 'ahmed') + (text.includes('ahmad') ? 5 : 5),
        confidence: 0.95,
        hoverText: 'Entity: customers table',
        suggestions: [
          'Ahmed Ali (ID: C001) - Ahmed Enterprises',
          'Ahmed Hassan (ID: C002) - Hassan Trading', 
          'Ahmad Abdullah (ID: C003) - Ahmad Solutions',
          'Ahmed Trading LLC (ID: C004) - Corporate Account'
        ]
      }
    ];
  }
  
  // Laptop single entity pattern with suggestions
  else if (text.includes('laptop') && !text.includes('sales') && !text.includes('stock')) {
    mockData = [
      { product_id: 'P001', name: 'Gaming Laptop Pro', sku: 'GLP-001', category: 'Electronics', brand: 'TechBrand', price: 1499.99, status: 'active' },
      { product_id: 'P002', name: 'Business Laptop Elite', sku: 'BLE-001', category: 'Electronics', brand: 'ProBrand', price: 1299.99, status: 'active' },
      { product_id: 'P003', name: 'Ultrabook Air', sku: 'UBA-001', category: 'Electronics', brand: 'AirBrand', price: 999.99, status: 'active' }
    ];
    sqlQuery = "SELECT * FROM products WHERE name ILIKE '%laptop%' OR category ILIKE '%laptop%'";
    
    responseEntities = [
      {
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: text.indexOf('laptop'),
        endIndex: text.indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Entity: products table',
        suggestions: [
          'Gaming Laptop Pro (SKU: GLP-001) - $1,499.99',
          'Business Laptop Elite (SKU: BLE-001) - $1,299.99',
          'Ultrabook Air (SKU: UBA-001) - $999.99'
        ]
      }
    ];
  }
  
  // My tasks pattern with pronoun detection
  else if (text.includes('my') && text.includes('tasks')) {
    mockData = [
      { task_id: 'T010', title: 'Complete quarterly report', assigned_to: 'Current User', status: 'pending', priority: 'high', due_date: '2025-01-25' },
      { task_id: 'T011', title: 'Review customer feedback', assigned_to: 'Current User', status: 'in_progress', priority: 'medium', due_date: '2025-01-22' },
      { task_id: 'T012', title: 'Update product catalog', assigned_to: 'Current User', status: 'pending', priority: 'low', due_date: '2025-01-28' }
    ];
    sqlQuery = "SELECT * FROM tasks WHERE assigned_to = $1"; // $1 would be current user ID
    
    responseEntities = [
      {
        text: 'my',
        type: 'pronoun',
        table: 'users',
        color: '#DC2626',
        startIndex: text.indexOf('my'),
        endIndex: text.indexOf('my') + 2,
        confidence: 0.9,
        hoverText: 'User Context: Current logged-in user'
      },
      {
        text: 'tasks',
        type: 'entity',
        table: 'tasks',
        color: '#EA580C',
        startIndex: text.indexOf('tasks'),
        endIndex: text.indexOf('tasks') + 5,
        confidence: 0.8,
        hoverText: 'Entity: tasks table'
      }
    ];
  }
  
  // ====== FALLBACK FOR UNMATCHED QUERIES ======
  else {
    // Don't default to "general" - try to extract any recognizable entities
    const fallbackEntities = [];
    const words = text.split(' ');
    
    // Check each word against our entity patterns
    words.forEach(word => {
      if (word.length > 2) {
        // Check against table names from schema
        if (['user', 'users', 'customer', 'customers', 'product', 'products', 'sale', 'sales', 
             'task', 'tasks', 'stock', 'shift', 'shifts', 'attendance'].includes(word)) {
          const table = word.endsWith('s') ? word : word + 's'; // Normalize to plural
          fallbackEntities.push({
            text: word,
            type: 'entity',
            table: table,
            color: '#6B7280',
            startIndex: text.indexOf(word),
            endIndex: text.indexOf(word) + word.length,
            confidence: 0.7,
            hoverText: `Entity: ${table} table (fallback detection)`
          });
        }
      }
    });
    
    if (fallbackEntities.length > 0) {
      mockData = [
        { message: `Found potential entities but no specific data pattern matched. Try more specific queries like 'customer ahmed', 'laptop sales', 'my tasks', etc.` }
      ];
      sqlQuery = `-- No specific pattern matched. Detected entities: ${fallbackEntities.map(e => e.table).join(', ')}`;
      responseEntities = fallbackEntities;
    } else {
      mockData = [
        { message: 'No entities detected. Try queries like: "customer", "ahmed", "laptop", "sales", "tasks", "stock", "my tasks", etc.' }
      ];
      sqlQuery = "-- No entities detected in query";
      responseEntities = [];
    }
  }
  
  console.log('✅ Query processed:', message);
  console.log('📊 SQL:', sqlQuery);
  console.log('🔍 Entities:', responseEntities.length, 'found');
  console.log('📋 Records:', mockData.length, 'returned');
  
  res.json({
    success: true,
    response: `Found ${mockData.length} results for "${message}"`,
    responseEntities,
    data: mockData,
    sqlQuery: sqlQuery,
    entityCount: responseEntities.length,
    recordCount: mockData.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Working Test API'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Working Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Entity extraction: POST http://localhost:${PORT}/api/chat/extract`);
  console.log(`🔍 Query processing: POST http://localhost:${PORT}/api/chat/query`);
  console.log('✅ Ready to receive requests!');
});
