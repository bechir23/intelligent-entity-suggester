import React from 'react';

interface ExampleCategory {
  title: string;
  description: string;
  examples: string[];
}

const TestExamplesGuide: React.FC = () => {
  const exampleCategories: ExampleCategory[] = [
    {
      title: 'Customer Entity Suggestions',
      description: 'Search and suggest customer names, emails, and contact information',
      examples: [
        'Contact John Doe',
        'Email sarah.johnson@example.com',
        'Call Mike Smith',
        'Meet with customer Ahmed Ali',
        'Follow up with jane.doe@example.com',
        'Customer feedback from emily.brown@example.com'
      ]
    },
    {
      title: 'Product Entity Suggestions',
      description: 'Suggest products, SKUs, categories, and inventory items',
      examples: [
        'Order laptop',
        'Check smartphone inventory',
        'Tablet pricing update',
        'Headphones stock level',
        'Monitor replacement needed',
        'Keyboard warranty info',
        'SKU PROD001 availability'
      ]
    },
    {
      title: 'Sales Entity Suggestions',
      description: 'Reference sales records, transactions, and revenue data',
      examples: [
        'Sales report for last quarter',
        'Transaction amount $500',
        'Revenue from sales ID 1',
        'Customer purchase history',
        'Monthly sales performance',
        'Top selling products analysis'
      ]
    },
    {
      title: 'Task Management Suggestions',
      description: 'Suggest tasks, assignments, and project activities',
      examples: [
        'Complete inventory audit task',
        'Assign customer support task',
        'Update database maintenance',
        'Schedule team meeting task',
        'Review quarterly report task',
        'Task priority: high importance'
      ]
    },
    {
      title: 'User and Staff Suggestions',
      description: 'Reference team members, roles, and staff assignments',
      examples: [
        'Assign to user John Admin',
        'Contact staff member Jane Manager',
        'User Bob Support availability',
        'Team lead Alice Supervisor',
        'Schedule with Mike Analyst',
        'Staff role: administrator'
      ]
    },
    {
      title: 'Stock and Inventory Suggestions',
      description: 'Track stock levels, warehouse data, and inventory management',
      examples: [
        'Check laptop stock: 50 units',
        'Smartphone inventory: 30 pieces',
        'Tablet warehouse location',
        'Headphones reorder level: 10',
        'Monitor stock threshold',
        'Keyboard inventory update needed'
      ]
    },
    {
      title: 'Shift and Schedule Suggestions',
      description: 'Manage work shifts, schedules, and time tracking',
      examples: [
        'Morning shift 9 AM to 5 PM',
        'Evening shift assignment',
        'Night shift coverage needed',
        'Weekend shift schedule',
        'Overtime shift approval',
        'Shift swap request'
      ]
    },
    {
      title: 'Attendance Tracking Suggestions',
      description: 'Monitor attendance, check-ins, and time records',
      examples: [
        'Check attendance for John',
        'Morning check-in 9:00 AM',
        'Attendance record update',
        'Late arrival notification',
        'Early departure request',
        'Attendance report monthly'
      ]
    },
    {
      title: 'Date and Time Suggestions',
      description: 'Natural language date parsing and temporal references',
      examples: [
        'Schedule for tomorrow',
        'Meeting next week',
        'Report due last month',
        'Deadline in 3 days',
        'Follow up next Friday',
        'Review scheduled for December 2024',
        'Quarterly meeting Q1 2024'
      ]
    },
    {
      title: 'Audit Trail Suggestions',
      description: 'Track changes, modifications, and system activities',
      examples: [
        'Audit customer data changes',
        'Track product updates',
        'Monitor sales modifications',
        'Review system activities',
        'Check modification history',
        'Audit trail for last week'
      ]
    },
    {
      title: 'Cross-Table Relationship Queries',
      description: 'Complex queries spanning multiple related entities',
      examples: [
        'Customer John Doe sales history',
        'Product laptop sold to customers',
        'User tasks assigned this week',
        'Stock levels for products sold',
        'Attendance for shift workers',
        'Sales by customer and product',
        'Tasks completed by team members'
      ]
    },
    {
      title: 'Business Intelligence Queries',
      description: 'Analytics and reporting across all business entities',
      examples: [
        'Top customers by sales revenue',
        'Product performance analysis',
        'Staff productivity metrics',
        'Inventory turnover report',
        'Customer satisfaction trends',
        'Sales forecast next quarter',
        'Resource utilization analysis'
      ]
    },
    {
      title: 'Real-Time Operational Queries',
      description: 'Current status and live operational data',
      examples: [
        'Current stock levels critical',
        'Today\'s attendance summary',
        'Active tasks in progress',
        'Recent sales transactions',
        'Current shift assignments',
        'Latest customer interactions',
        'System activity monitoring'
      ]
    }
  ];

  return (
    <div className="test-examples-guide p-6 bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Intelligent Entity Suggester - Testing Examples
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          How to Test Entity Suggestions
        </h3>
        <p className="text-blue-700">
          Type any of the examples below in the rich text editor to test entity suggestions. 
          The system will suggest relevant entities from our comprehensive database including 
          customers, products, sales, tasks, users, stock, shifts, attendance, dates, and audit trails.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exampleCategories.map((category, index) => (
          <div key={index} className="bg-white p-5 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              {category.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {category.description}
            </p>
            <div className="space-y-2">
              {category.examples.map((example, exampleIndex) => (
                <div
                  key={exampleIndex}
                  className="p-2 bg-gray-50 rounded text-sm font-mono cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigator.clipboard.writeText(example)}
                  title="Click to copy to clipboard"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 rounded">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Testing Database Coverage
        </h3>
        <div className="text-green-700">
          <p className="mb-2">Our system covers all 10 database tables:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <span className="px-2 py-1 bg-green-100 rounded">Customers (6)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Products (6)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Sales (5)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Tasks (5)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Users (5)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Stock (6)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Shifts (5)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Attendance (4)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Dates (91)</span>
            <span className="px-2 py-1 bg-green-100 rounded">Audit (4)</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Performance Testing Notes
        </h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Real-time suggestions: Target &lt; 150ms response time</li>
          <li>• WebSocket-based live updates with debouncing</li>
          <li>• Full-text search with trigram indexes</li>
          <li>• Natural language date parsing support</li>
          <li>• Pronoun resolution ("me" → current user)</li>
          <li>• Comprehensive audit trail for all changes</li>
        </ul>
      </div>
    </div>
  );
};

export default TestExamplesGuide;
