// Simple API test to verify backend functionality
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock entity extraction endpoint
app.post('/api/chat/extract', (req, res) => {
  const { message } = req.body;
  console.log('🔍 Extracting entities for:', message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Mock entity response
  const entities = [];
  
  // Simple keyword detection for testing
  if (message.toLowerCase().includes('laptop')) {
    entities.push({
      text: 'laptop',
      type: 'entity',
      table: 'products',
      color: '#2563EB',
      startIndex: message.toLowerCase().indexOf('laptop'),
      endIndex: message.toLowerCase().indexOf('laptop') + 6,
      confidence: 0.9,
      hoverText: 'Product: Laptop computers',
      suggestions: ['Wireless Headphones Pro', 'Smart Watch Series X']
    });
  }
  
  if (message.toLowerCase().includes('ahmed')) {
    entities.push({
      text: 'ahmed',
      type: 'entity',
      table: 'customers',
      color: '#059669',
      startIndex: message.toLowerCase().indexOf('ahmed'),
      endIndex: message.toLowerCase().indexOf('ahmed') + 5,
      confidence: 0.95,
      hoverText: 'Customer: Ahmed Ali',
      suggestions: ['Ahmed Ali (ID: 1)', 'Ahmed Trading LLC (ID: 2)']
    });
  }
  
  if (message.toLowerCase().includes('sales')) {
    entities.push({
      text: 'sales',
      type: 'info',
      table: 'sales',
      color: '#7C3AED',
      startIndex: message.toLowerCase().indexOf('sales'),
      endIndex: message.toLowerCase().indexOf('sales') + 5,
      confidence: 0.8,
      hoverText: 'Operation: Sales data retrieval'
    });
  }
  
  if (message.toLowerCase().includes('pending')) {
    entities.push({
      text: 'pending',
      type: 'status_filter',
      table: 'tasks',
      color: '#EA580C',
      value: 'pending',
      startIndex: message.toLowerCase().indexOf('pending'),
      endIndex: message.toLowerCase().indexOf('pending') + 7,
      confidence: 0.85,
      hoverText: 'Status Filter: Pending tasks',
      isFilter: true
    });
  }
  
  console.log('✅ Returning entities:', entities);
  res.json({ entities });
});

// Mock query processing endpoint
app.post('/api/chat/query', (req, res) => {
  const { message, userName } = req.body;
  console.log('🔍 Processing query:', message, 'for user:', userName);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Mock response data based on query
  let mockData = [];
  let responseEntities = [];
  
  if (message.toLowerCase().includes('laptop') && message.toLowerCase().includes('sales')) {
    mockData = [
      { sale_id: 1, product_name: 'Wireless Headphones Pro', customer_name: 'Acme Corporation', quantity: 2, total_amount: 599.98, sale_date: '2024-01-15' },
      { sale_id: 2, product_name: 'Smart Watch Series X', customer_name: 'Global Tech Solutions', quantity: 1, total_amount: 449.99, sale_date: '2024-01-16' }
    ];
    
    responseEntities = [
      {
        text: 'laptop',
        type: 'entity',
        table: 'products',
        color: '#2563EB',
        startIndex: message.toLowerCase().indexOf('laptop'),
        endIndex: message.toLowerCase().indexOf('laptop') + 6,
        confidence: 0.9,
        hoverText: 'Product: Laptop computers'
      },
      {
        text: 'sales',
        type: 'info',
        table: 'sales',
        color: '#7C3AED',
        startIndex: message.toLowerCase().indexOf('sales'),
        endIndex: message.toLowerCase().indexOf('sales') + 5,
        confidence: 0.8,
        hoverText: 'Operation: Sales data retrieval'
      }
    ];
  } else if (message.toLowerCase().includes('ahmed') && message.toLowerCase().includes('tasks')) {
    mockData = [
      { task_id: 1, title: 'Review Ahmed account', assigned_to: 'Ahmed Ali', status: 'pending', priority: 'high', due_date: '2024-01-20' },
      { task_id: 2, title: 'Customer follow-up for Ahmed Trading', assigned_to: 'Sarah Johnson', status: 'in_progress', priority: 'medium', due_date: '2024-01-18' }
    ];
    
    responseEntities = [
      {
        text: 'ahmed',
        type: 'entity',
        table: 'customers',
        color: '#059669',
        startIndex: message.toLowerCase().indexOf('ahmed'),
        endIndex: message.toLowerCase().indexOf('ahmed') + 5,
        confidence: 0.95,
        hoverText: 'Customer: Ahmed Ali',
        suggestions: ['Ahmed Ali (ID: 1)', 'Ahmed Trading LLC (ID: 2)']
      },
      {
        text: 'tasks',
        type: 'info',
        table: 'tasks',
        color: '#7C3AED',
        startIndex: message.toLowerCase().indexOf('tasks'),
        endIndex: message.toLowerCase().indexOf('tasks') + 5,
        confidence: 0.8,
        hoverText: 'Operation: Task data retrieval'
      }
    ];
  } else {
    // Generic response
    mockData = [
      { id: 1, name: 'Sample Record', type: 'test', status: 'active' }
    ];
    
    responseEntities = [
      {
        text: message.split(' ')[0],
        type: 'entity',
        table: 'general',
        color: '#6B7280',
        startIndex: 0,
        endIndex: message.split(' ')[0].length,
        confidence: 0.5,
        hoverText: 'Generic entity detected'
      }
    ];
  }
  
  console.log('✅ Returning query result with', mockData.length, 'records and', responseEntities.length, 'entities');
  
  res.json({
    response: `Found ${mockData.length} results for "${message}"`,
    responseEntities,
    data: mockData
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Simple Test API'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Test API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Entity extraction: POST http://localhost:${PORT}/api/chat/extract`);
  console.log(`🔍 Query processing: POST http://localhost:${PORT}/api/chat/query`);
});
