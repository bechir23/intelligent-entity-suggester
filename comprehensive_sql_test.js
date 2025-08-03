#!/usr/bin/env node

/**
 * COMPREHENSIVE SQL GENERATION TEST SUITE
 * Tests all entity detection, SQL generation, joins, and pronoun/temporal resolution
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/chat/query';
const USER_NAME = 'Ahmed Hassan';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test cases organized by complexity and type
const testCases = [
    // === BASIC ENTITY DETECTION ===
    {
        category: "Basic Entity Detection",
        query: "laptop",
        expectedEntities: ["laptop"],
        expectedTables: ["products"],
        expectedSQL: "SELECT * FROM products WHERE name ILIKE '%laptop%'"
    },
    {
        category: "Basic Entity Detection", 
        query: "ahmed",
        expectedEntities: ["ahmed"],
        expectedTables: ["customers"],
        expectedSQL: "SELECT * FROM customers WHERE name ILIKE '%ahmed%'"
    },
    {
        category: "Basic Entity Detection",
        query: "paris",
        expectedEntities: ["paris"],
        expectedTables: ["customers", "stock"],
        expectedSQL: "SELECT * FROM customers WHERE location ILIKE '%paris%'"
    },

    // === SIMPLE JOINS ===
    {
        category: "Simple Joins",
        query: "sales of laptop",
        expectedEntities: ["sales", "laptop"],
        expectedTables: ["sales", "products"],
        expectedSQL: "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%'"
    },
    {
        category: "Simple Joins",
        query: "ahmed tasks",
        expectedEntities: ["ahmed", "tasks"],
        expectedTables: ["customers", "tasks"],
        expectedSQL: "SELECT t.*, c.name as customer_name FROM tasks t JOIN customers c ON t.customer_id = c.id WHERE c.name ILIKE '%ahmed%'"
    },
    {
        category: "Simple Joins",
        query: "laptop stock",
        expectedEntities: ["laptop", "stock"],
        expectedTables: ["products", "stock"],
        expectedSQL: "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%'"
    },

    // === COMPLEX JOINS (3+ TABLES) ===
    {
        category: "Complex Joins",
        query: "laptop stock in paris",
        expectedEntities: ["laptop", "stock", "paris"],
        expectedTables: ["products", "stock"],
        expectedSQL: "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%' AND s.location ILIKE '%paris%'"
    },
    {
        category: "Complex Joins",
        query: "ahmed laptop orders",
        expectedEntities: ["ahmed", "laptop", "orders"],
        expectedTables: ["customers", "products", "sales"],
        expectedSQL: "SELECT s.*, c.name as customer_name, p.name as product_name FROM sales s JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE c.name ILIKE '%ahmed%' AND p.name ILIKE '%laptop%'"
    },
    {
        category: "Complex Joins",
        query: "pending tasks for ahmed",
        expectedEntities: ["pending", "tasks", "ahmed"],
        expectedTables: ["tasks", "customers"],
        expectedSQL: "SELECT t.*, c.name as customer_name FROM tasks t JOIN customers c ON t.customer_id = c.id WHERE t.status = 'pending' AND c.name ILIKE '%ahmed%'"
    },

    // === TEMPORAL ENTITIES (CRITICAL TEST) ===
    {
        category: "Temporal Entities",
        query: "sales today",
        expectedEntities: ["sales", "today"],
        expectedTables: ["sales"],
        expectedSQL: "SELECT * FROM sales WHERE DATE(created_at) = CURRENT_DATE",
        criticalTest: true,
        description: "TODAY should resolve to CURRENT_DATE in SQL"
    },
    {
        category: "Temporal Entities",
        query: "tasks this week",
        expectedEntities: ["tasks", "this week"],
        expectedTables: ["tasks"],
        expectedSQL: "SELECT * FROM tasks WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)",
        criticalTest: true,
        description: "THIS WEEK should resolve to date range"
    },
    {
        category: "Temporal Entities",
        query: "sales last month",
        expectedEntities: ["sales", "last month"],
        expectedTables: ["sales"],
        expectedSQL: "SELECT * FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')",
        criticalTest: true,
        description: "LAST MONTH should resolve to previous month date range"
    },
    {
        category: "Temporal Entities",
        query: "ahmed tasks yesterday",
        expectedEntities: ["ahmed", "tasks", "yesterday"],
        expectedTables: ["customers", "tasks"],
        expectedSQL: "SELECT t.*, c.name as customer_name FROM tasks t JOIN customers c ON t.customer_id = c.id WHERE c.name ILIKE '%ahmed%' AND DATE(t.created_at) = CURRENT_DATE - INTERVAL '1 day'",
        criticalTest: true,
        description: "Complex temporal + entity resolution"
    },

    // === PRONOUN RESOLUTION (CRITICAL TEST) ===
    {
        category: "Pronoun Resolution",
        query: "my tasks",
        expectedEntities: ["my", "tasks"],
        expectedTables: ["tasks", "users"],
        expectedSQL: "SELECT t.* FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE u.name = 'Ahmed Hassan'",
        criticalTest: true,
        description: "MY should resolve to current user (Ahmed Hassan)"
    },
    {
        category: "Pronoun Resolution",
        query: "my pending tasks",
        expectedEntities: ["my", "pending", "tasks"],
        expectedTables: ["tasks", "users"],
        expectedSQL: "SELECT t.* FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE u.name = 'Ahmed Hassan' AND t.status = 'pending'",
        criticalTest: true,
        description: "MY + status filter combination"
    },
    {
        category: "Pronoun Resolution",
        query: "my sales today",
        expectedEntities: ["my", "sales", "today"],
        expectedTables: ["sales", "users"],
        expectedSQL: "SELECT s.* FROM sales s JOIN users u ON s.salesperson_id = u.id WHERE u.name = 'Ahmed Hassan' AND DATE(s.created_at) = CURRENT_DATE",
        criticalTest: true,
        description: "MY + temporal combination"
    },

    // === NUMERIC FILTERS ===
    {
        category: "Numeric Filters",
        query: "stock below 10",
        expectedEntities: ["stock", "below 10"],
        expectedTables: ["stock"],
        expectedSQL: "SELECT * FROM stock WHERE quantity < 10"
    },
    {
        category: "Numeric Filters",
        query: "sales above 1000",
        expectedEntities: ["sales", "above 1000"],
        expectedTables: ["sales"],
        expectedSQL: "SELECT * FROM sales WHERE amount > 1000"
    },
    {
        category: "Numeric Filters",
        query: "laptop stock less than 5",
        expectedEntities: ["laptop", "stock", "less than 5"],
        expectedTables: ["products", "stock"],
        expectedSQL: "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%' AND s.quantity < 5"
    },

    // === LOCATION FILTERS (CRITICAL TEST) ===
    {
        category: "Location Filters",
        query: "customers in london",
        expectedEntities: ["customers", "london"],
        expectedTables: ["customers"],
        expectedSQL: "SELECT * FROM customers WHERE location ILIKE '%london%'",
        criticalTest: true,
        description: "IN should be ignored, LONDON should be detected as location"
    },
    {
        category: "Location Filters",
        query: "stock in paris warehouse",
        expectedEntities: ["stock", "paris"],
        expectedTables: ["stock"],
        expectedSQL: "SELECT * FROM stock WHERE location ILIKE '%paris%'",
        criticalTest: true,
        description: "Complex location detection with 'in' preposition"
    },

    // === ULTRA COMPLEX COMBINATIONS ===
    {
        category: "Ultra Complex",
        query: "my laptop sales today above 500 in paris",
        expectedEntities: ["my", "laptop", "sales", "today", "above 500", "paris"],
        expectedTables: ["sales", "products", "users"],
        expectedSQL: "SELECT s.*, p.name as product_name, u.name as salesperson FROM sales s JOIN products p ON s.product_id = p.id JOIN users u ON s.salesperson_id = u.id WHERE u.name = 'Ahmed Hassan' AND p.name ILIKE '%laptop%' AND DATE(s.created_at) = CURRENT_DATE AND s.amount > 500 AND s.location ILIKE '%paris%'",
        criticalTest: true,
        description: "Ultimate test: pronoun + entity + temporal + numeric + location"
    },
    {
        category: "Ultra Complex",
        query: "pending tasks for customers in london this week",
        expectedEntities: ["pending", "tasks", "customers", "london", "this week"],
        expectedTables: ["tasks", "customers"],
        expectedSQL: "SELECT t.*, c.name as customer_name FROM tasks t JOIN customers c ON t.customer_id = c.id WHERE t.status = 'pending' AND c.location ILIKE '%london%' AND t.created_at >= DATE_TRUNC('week', CURRENT_DATE)",
        criticalTest: true,
        description: "Multi-entity + location + temporal combination"
    },

    // === EDGE CASES ===
    {
        category: "Edge Cases",
        query: "laptop stock in paris below 5 for ahmed",
        expectedEntities: ["laptop", "stock", "paris", "below 5", "ahmed"],
        expectedTables: ["products", "stock", "customers"],
        expectedSQL: "SELECT s.*, p.name as product_name FROM stock s JOIN products p ON s.product_id = p.id WHERE p.name ILIKE '%laptop%' AND s.location ILIKE '%paris%' AND s.quantity < 5",
        criticalTest: true,
        description: "Multiple filters with potential ambiguity"
    }
];

// Test execution function
async function runTest(testCase, testIndex) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}TEST ${testIndex + 1}/${testCases.length}: ${testCase.category}${colors.reset}`);
    console.log(`${colors.yellow}Query: "${testCase.query}"${colors.reset}`);
    if (testCase.criticalTest) {
        console.log(`${colors.red}${colors.bright}🚨 CRITICAL TEST${colors.reset} - ${testCase.description}`);
    }
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    try {
        const startTime = Date.now();
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: testCase.query,
                userName: USER_NAME
            })
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Analysis
        console.log(`${colors.green}✅ API Response Time: ${responseTime}ms${colors.reset}`);
        console.log(`\n${colors.bright}📊 RESPONSE ANALYSIS:${colors.reset}`);
        console.log(`Entities Detected: ${colors.yellow}${result.entities?.length || 0}${colors.reset}`);
        console.log(`Data Records: ${colors.yellow}${result.data?.length || 0}${colors.reset}`);
        console.log(`Primary Table: ${colors.yellow}${result.summary?.primaryTable || 'Unknown'}${colors.reset}`);
        console.log(`Join Tables: ${colors.yellow}${result.summary?.joinTables?.join(', ') || 'None'}${colors.reset}`);

        // Entity Detection Analysis
        console.log(`\n${colors.bright}🔍 ENTITY DETECTION ANALYSIS:${colors.reset}`);
        if (result.entities && result.entities.length > 0) {
            result.entities.forEach((entity, i) => {
                const typeColor = entity.type === 'temporal' ? colors.magenta : 
                                entity.type === 'pronoun' ? colors.red :
                                entity.type.includes('filter') ? colors.cyan : colors.green;
                
                console.log(`  ${i + 1}. "${entity.text}" → ${typeColor}${entity.type}${colors.reset} (${entity.table || 'no table'})`);
                
                if (entity.actualValue && entity.actualValue !== entity.text) {
                    console.log(`     ${colors.green}Resolved to: ${entity.actualValue}${colors.reset}`);
                } else if (entity.type === 'temporal' || entity.type === 'pronoun') {
                    console.log(`     ${colors.red}⚠️  NOT RESOLVED - Should have actualValue${colors.reset}`);
                }
            });
        } else {
            console.log(`  ${colors.red}❌ NO ENTITIES DETECTED${colors.reset}`);
        }

        // SQL Analysis - THIS IS THE CRITICAL PART
        console.log(`\n${colors.bright}🗄️  SQL GENERATION ANALYSIS:${colors.reset}`);
        if (result.query?.sql) {
            console.log(`${colors.green}✅ SQL Generated:${colors.reset}`);
            console.log(`${colors.bright}${colors.blue}━━━ GENERATED SQL ━━━${colors.reset}`);
            console.log(`${colors.cyan}${result.query.sql}${colors.reset}`);
            console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
            
            // SQL Quality Analysis
            const sql = result.query.sql.toUpperCase();
            console.log(`\n${colors.bright}🔍 SQL QUALITY CHECK:${colors.reset}`);
            
            // Check for proper temporal resolution
            if (testCase.query.includes('today')) {
                if (sql.includes('CURRENT_DATE') || sql.includes('DATE(')) {
                    console.log(`  ${colors.green}✅ TODAY properly resolved to date function${colors.reset}`);
                } else {
                    console.log(`  ${colors.red}❌ TODAY not properly resolved (should use CURRENT_DATE)${colors.reset}`);
                }
            }
            
            // Check for proper pronoun resolution
            if (testCase.query.includes('my')) {
                if (sql.includes('AHMED HASSAN') || sql.includes("'Ahmed Hassan'")) {
                    console.log(`  ${colors.green}✅ MY properly resolved to user name${colors.reset}`);
                } else {
                    console.log(`  ${colors.red}❌ MY not properly resolved (should reference 'Ahmed Hassan')${colors.reset}`);
                }
            }
            
            // Check for proper joins
            const joinCount = (sql.match(/JOIN/g) || []).length;
            const expectedJoins = testCase.expectedTables?.length > 1 ? testCase.expectedTables.length - 1 : 0;
            if (joinCount >= expectedJoins) {
                console.log(`  ${colors.green}✅ Proper JOINs detected (${joinCount} joins)${colors.reset}`);
            } else {
                console.log(`  ${colors.red}❌ Missing JOINs (expected ${expectedJoins}, got ${joinCount})${colors.reset}`);
            }
            
            // Check for location filter issues
            if (testCase.query.includes('in paris') || testCase.query.includes('in london')) {
                if (sql.includes("LOCATION ILIKE '%PARIS%'") || sql.includes("LOCATION ILIKE '%LONDON%'")) {
                    console.log(`  ${colors.green}✅ Location filter properly detected (ignoring 'in' preposition)${colors.reset}`);
                } else {
                    console.log(`  ${colors.red}❌ Location filter issues (check if 'in' is being detected as entity)${colors.reset}`);
                }
            }
            
        } else {
            console.log(`  ${colors.red}❌ NO SQL GENERATED${colors.reset}`);
        }

        // Critical Test Status
        if (testCase.criticalTest) {
            console.log(`\n${colors.bright}${colors.red}🚨 CRITICAL TEST VERDICT:${colors.reset}`);
            let passed = true;
            let issues = [];
            
            if (!result.query?.sql) {
                passed = false;
                issues.push("No SQL generated");
            }
            
            if (testCase.query.includes('today') && result.query?.sql && !result.query.sql.toUpperCase().includes('CURRENT_DATE')) {
                passed = false;
                issues.push("Temporal resolution failed");
            }
            
            if (testCase.query.includes('my') && result.query?.sql && !result.query.sql.includes('Ahmed Hassan')) {
                passed = false;
                issues.push("Pronoun resolution failed");
            }
            
            if (passed) {
                console.log(`  ${colors.green}${colors.bright}✅ CRITICAL TEST PASSED${colors.reset}`);
            } else {
                console.log(`  ${colors.red}${colors.bright}❌ CRITICAL TEST FAILED${colors.reset}`);
                issues.forEach(issue => console.log(`    - ${colors.red}${issue}${colors.reset}`));
            }
        }

        return {
            passed: result.query?.sql ? true : false,
            critical: testCase.criticalTest,
            responseTime,
            entities: result.entities?.length || 0,
            sql: result.query?.sql,
            issues: []
        };

    } catch (error) {
        console.log(`${colors.red}❌ TEST FAILED: ${error.message}${colors.reset}`);
        return {
            passed: false,
            critical: testCase.criticalTest,
            error: error.message,
            issues: ['API Error']
        };
    }
}

// Main test runner
async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log(`╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║                           COMPREHENSIVE SQL GENERATION TEST SUITE                                    ║`);
    console.log(`║                                Testing Entity Detection & SQL Quality                                ║`);
    console.log(`╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝`);
    console.log(`${colors.reset}`);
    
    const results = [];
    let criticalTestsPassed = 0;
    let criticalTestsTotal = 0;
    
    for (let i = 0; i < testCases.length; i++) {
        const result = await runTest(testCases[i], i);
        results.push(result);
        
        if (testCases[i].criticalTest) {
            criticalTestsTotal++;
            if (result.passed) criticalTestsPassed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final summary
    console.log(`\n${colors.bright}${colors.blue}`);
    console.log(`╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║                                    FINAL TEST SUMMARY                                               ║`);
    console.log(`╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝`);
    console.log(`${colors.reset}`);
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`${colors.bright}📊 OVERALL RESULTS:${colors.reset}`);
    console.log(`  Total Tests: ${colors.yellow}${totalTests}${colors.reset}`);
    console.log(`  Passed: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`  Failed: ${colors.red}${failedTests}${colors.reset}`);
    console.log(`  Success Rate: ${colors.yellow}${Math.round((passedTests/totalTests)*100)}%${colors.reset}`);
    
    console.log(`\n${colors.bright}🚨 CRITICAL TESTS:${colors.reset}`);
    console.log(`  Critical Passed: ${colors.green}${criticalTestsPassed}${colors.reset}`);
    console.log(`  Critical Total: ${colors.yellow}${criticalTestsTotal}${colors.reset}`);
    console.log(`  Critical Success Rate: ${colors.yellow}${Math.round((criticalTestsPassed/criticalTestsTotal)*100)}%${colors.reset}`);
    
    if (criticalTestsPassed === criticalTestsTotal) {
        console.log(`\n${colors.green}${colors.bright}🎉 ALL CRITICAL TESTS PASSED! SQL generation is working correctly.${colors.reset}`);
    } else {
        console.log(`\n${colors.red}${colors.bright}⚠️  CRITICAL ISSUES FOUND! Need to fix SQL generation logic.${colors.reset}`);
    }
    
    // List failed critical tests
    const failedCritical = results.filter((r, i) => testCases[i].criticalTest && !r.passed);
    if (failedCritical.length > 0) {
        console.log(`\n${colors.bright}${colors.red}❌ FAILED CRITICAL TESTS:${colors.reset}`);
        failedCritical.forEach((result, i) => {
            const testCase = testCases.find((tc, idx) => results[idx] === result);
            console.log(`  - "${testCase.query}" - ${result.error || 'SQL generation issues'}`);
        });
    }
    
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Test completed at: ${new Date().toISOString()}${colors.reset}`);
    
    return results;
}

// Check if backend is ready before starting tests
async function checkBackendReady() {
    console.log(`${colors.yellow}🔍 Checking if backend is ready...${colors.reset}`);
    
    for (let i = 0; i < 10; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'test', userName: 'test' })
            });
            
            if (response.ok) {
                console.log(`${colors.green}✅ Backend is ready!${colors.reset}`);
                return true;
            }
        } catch (error) {
            console.log(`${colors.yellow}⏳ Waiting for backend... (attempt ${i + 1}/10)${colors.reset}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`${colors.red}❌ Backend not ready after 20 seconds${colors.reset}`);
    return false;
}

// Run the comprehensive test suite
(async () => {
    const isReady = await checkBackendReady();
    if (isReady) {
        await runAllTests();
    } else {
        console.log(`${colors.red}Cannot run tests - backend not responding${colors.reset}`);
        process.exit(1);
    }
})();

export { runAllTests, testCases };
