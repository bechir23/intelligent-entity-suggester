console.log('Testing simple query...');

// Instead of using fetch, let's test the frontend directly
const testQuery = 'sales of laptop';
console.log('Query:', testQuery);

// Expected:
// - Should detect "sales" -> sales table
// - Should detect "laptop" -> products table  
// - Should generate JOIN between sales and products
// - SQL should be: SELECT s.*, p.name FROM sales s JOIN products p ON s.product_id = p.id WHERE p.name LIKE '%laptop%'

console.log('Expected SQL: SELECT s.*, p.name FROM sales s JOIN products p ON s.product_id = p.id WHERE p.name LIKE \'%laptop%\'');
console.log('Expected tables: [sales, products]');
console.log('Expected entities: [sales -> sales table, laptop -> products table]');
