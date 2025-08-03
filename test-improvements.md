Test cases for the improved system:

## Issue 1: "product" entity not detected in "sales last month by product"
- Expected: 3 entities (sales, last month, product)
- Fixed: Added "product", "products", "item", "items" to productKeywords array
- Result: Should now detect product as entity with table 'products'

## Issue 2: SQL query not displayed after record count
- Expected: SQL query appears after "{TABLE} - X records found"
- Fixed: Enhanced SQL display with larger font, blue styling, "EXECUTED SQL:" label
- Result: SQL should be prominently displayed

## Issue 3: Hover appears on wrong "ahmed" instance in "ahmed ahmed"
- Problem: text.indexOf() always finds first occurrence
- Fixed: Implemented multiple occurrence detection, uses last occurrence for entities
- Logic: For repeated words, entity detection targets the later occurrence
- Result: In "ahmed ahmed", hover should appear on the second "ahmed"

## Test Queries:
1. "sales last month by product" - should show 3 entities + JOIN SQL
2. "ahmed ahmed" - hover only on second instance  
3. "ahmed tasks pending" - hover on "ahmed" + tasks + pending entities
4. "laptop stock in paris" - should trigger products+stock JOIN

## Expected SQL Patterns:
- Sales + Product: "SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id"
- Stock + Product: "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id = p.id"
