// Enhanced Test Examples for Chat System
// These examples should test all tables and entity recognition

const testExamples = [
  // Customer-related queries
  {
    category: "Customers",
    examples: [
      "show me Acme Corporation",
      "Ahmed Trading LLC information",
      "customers from Dubai", 
      "show me Global Tech Solutions",
      "European Enterprises details",
      "customers in New York",
      "find customer Ahmed",
      "Acme contact information"
    ]
  },
  
  // Product-related queries
  {
    category: "Products", 
    examples: [
      "show me laptop inventory",
      "Wireless Headphones Pro stock",
      "Ahmed Special Coffee details",
      "Smart Watch Series X price",
      "Office Desk Organizer availability",
      "TechBrand products",
      "headphones information",
      "electronics category products"
    ]
  },
  
  // Sales-related queries
  {
    category: "Sales",
    examples: [
      "show me sales of laptop",
      "Acme Corporation sales",
      "sales from last week",
      "headphones sales today",
      "Ahmed Special Coffee sales",
      "Global Tech purchases",
      "recent sales data",
      "sales performance this month"
    ]
  },
  
  // User/Staff-related queries
  {
    category: "Users",
    examples: [
      "show me Ahmed Ali",
      "Sarah Johnson tasks",
      "Mike Chen information",
      "Lisa Rodriguez profile",
      "my profile information",
      "sales team members",
      "admin users",
      "management department staff"
    ]
  },
  
  // Task-related queries
  {
    category: "Tasks",
    examples: [
      "my tasks this week",
      "Ahmed tasks pending",
      "high priority tasks",
      "review Acme account task",
      "Sarah's assignments",
      "overdue tasks",
      "tasks due today",
      "completed tasks"
    ]
  },
  
  // Stock/Inventory-related queries
  {
    category: "Stock",
    examples: [
      "headphones stock levels",
      "Smart Watch inventory",
      "low stock products",
      "warehouse inventory",
      "Ahmed Special Coffee stock",
      "reorder level alerts",
      "out of stock items",
      "inventory summary"
    ]
  },
  
  // Attendance-related queries
  {
    category: "Attendance", 
    examples: [
      "Ahmed attendance today",
      "my attendance this week",
      "Sarah clock in time",
      "absent employees today",
      "attendance summary",
      "late arrivals yesterday",
      "Mike attendance record",
      "who is present today"
    ]
  },
  
  // Shifts-related queries
  {
    category: "Shifts",
    examples: [
      "my shift today",
      "Ahmed shift schedule",
      "night shifts this week",
      "Sarah shift times",
      "weekend shifts",
      "shift coverage tomorrow",
      "morning shift staff",
      "shift patterns this month"
    ]
  },
  
  // Complex multi-entity queries
  {
    category: "Complex Queries",
    examples: [
      "Ahmed sales of headphones last month",
      "Acme Corporation laptop purchases today",
      "Sarah tasks for Global Tech customer",
      "my attendance and tasks this week", 
      "Ahmed Special Coffee inventory and sales",
      "Lisa tasks for European Enterprises",
      "Smart Watch sales by Sarah yesterday",
      "headphones stock and Acme orders"
    ]
  },
  
  // Temporal/Date-related queries
  {
    category: "Temporal Queries",
    examples: [
      "sales from today",
      "tasks due tomorrow",
      "attendance last week",
      "yesterday's performance",
      "next month's shifts",
      "last quarter sales",
      "this week's tasks",
      "recent customer activity"
    ]
  }
];

// Instructions for testing:
console.log("🎯 COMPREHENSIVE CHAT SYSTEM TESTING");
console.log("=====================================");
console.log("Test each example in the chat interface and verify:");
console.log("1. ✅ Entities are properly highlighted with colors");
console.log("2. ✅ Hover tooltips show entity details and confidence");
console.log("3. ✅ Relevant data table appears dynamically");
console.log("4. ✅ Response is natural and informative");
console.log("5. ✅ Entity matching works with fuzzy/partial names");
console.log("");

testExamples.forEach((category, index) => {
  console.log(`${index + 1}. ${category.category.toUpperCase()} (${category.examples.length} tests)`);
  category.examples.forEach((example, i) => {
    console.log(`   ${i + 1}. "${example}"`);
  });
  console.log("");
});

console.log("💡 Expected Behavior:");
console.log("- Customer names should be highlighted in BLUE");
console.log("- Product names should be highlighted in GREEN");
console.log("- User names should be highlighted in YELLOW");
console.log("- Task terms should be highlighted in RED");
console.log("- Sales terms should be highlighted in PURPLE");
console.log("- Stock terms should be highlighted in CYAN");
console.log("- Attendance terms should be highlighted in LIME");
console.log("- Shift terms should be highlighted in ORANGE");
console.log("- Temporal expressions should be highlighted in INDIGO");
console.log("- Pronouns (me, my) should be highlighted in PINK");

export { testExamples };
