import React, { useState } from 'react';
import UnifiedIntelligentEditor from './UnifiedIntelligentEditor';
import './TestPage.css';

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    query: string;
    mode: string;
    results: any[];
    success: boolean;
    responseTime: number;
    description?: string;
  }>>([]);

  const testQueries = [
    // Basic suggestions (1 word)
    { query: "john", expectedMode: "basic_suggestions", description: "Should show John-related suggestions" },
    { query: "alice", expectedMode: "basic_suggestions", description: "Should show Alice-related suggestions" },
    { query: "laptop", expectedMode: "basic_suggestions", description: "Should show laptop-related suggestions" },
    { query: "task", expectedMode: "basic_suggestions", description: "Should show task-related suggestions" },
    
    // Intelligent SQL (2 words)
    { query: "show products", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM products" },
    { query: "list users", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM users" },
    { query: "get customers", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM customers" },
    { query: "find tasks", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM tasks" },
    { query: "show sales", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM sales" },
    { query: "display inventory", expectedMode: "intelligent_sql", description: "Should trigger SQL: SELECT * FROM stock" },
    
    // Advanced search (3+ words)
    { query: "find customer john doe", expectedMode: "advanced_search", description: "Complex search with fuzzy matching" },
    { query: "show all active users", expectedMode: "advanced_search", description: "Advanced search with filters" },
    { query: "get high priority tasks", expectedMode: "advanced_search", description: "Search with priority filters" },
    { query: "find products under electronics", expectedMode: "advanced_search", description: "Category-based search" },
    { query: "customers with active status", expectedMode: "advanced_search", description: "Multi-field search" }
  ];

  const runAllTests = async () => {
    setTestResults([]);
    const results = [];

    for (const test of testQueries) {
      try {
        console.log(`🧪 Testing: "${test.query}"`);
        const startTime = Date.now();
        
        // Determine the appropriate endpoint based on word count
        const wordCount = test.query.trim().split(/\s+/).length;
        let endpoint = '';
        
        if (wordCount === 1) {
          endpoint = 'http://localhost:3001/api/suggestions';
        } else if (wordCount === 2) {
          endpoint = 'http://localhost:3001/api/suggestions/intelligent';
        } else {
          // Use WebSocket simulation for advanced search
          endpoint = 'http://localhost:3001/api/advanced-search';
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: test.query,
            query: test.query,
            position: test.query.length,
            fuzzyThreshold: 0.7,
            limit: 20
          })
        });
        
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        const success = response.ok && (data.suggestions?.length > 0 || data.data?.length > 0);
        
        results.push({
          query: test.query,
          mode: data.mode || test.expectedMode,
          results: data.suggestions || data.data || [],
          success,
          responseTime,
          description: test.description
        });
        
        console.log(`✅ Test "${test.query}": ${success ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
        
      } catch (error) {
        console.error(`❌ Test "${test.query}" failed:`, error);
        results.push({
          query: test.query,
          mode: 'error',
          results: [],
          success: false,
          responseTime: 0,
          description: test.description
        });
      }
    }
    
    setTestResults(results);
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <h1>🧪 Unified Intelligent Search - Test Suite</h1>
        <p>Comprehensive testing of all search modes and functionality</p>
        <button onClick={runAllTests} className="run-tests-button">
          🚀 Run All Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="test-results">
          <h2>Test Results</h2>
          <div className="results-summary">
            <div className="summary-card">
              <span className="summary-label">Total Tests:</span>
              <span className="summary-value">{testResults.length}</span>
            </div>
            <div className="summary-card success">
              <span className="summary-label">Passed:</span>
              <span className="summary-value">{testResults.filter(r => r.success).length}</span>
            </div>
            <div className="summary-card failed">
              <span className="summary-label">Failed:</span>
              <span className="summary-value">{testResults.filter(r => !r.success).length}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Avg Response:</span>
              <span className="summary-value">
                {Math.round(testResults.reduce((acc, r) => acc + r.responseTime, 0) / testResults.length)}ms
              </span>
            </div>
          </div>
          
          <div className="test-list">
            {testResults.map((result, index) => (
              <div key={index} className={`test-item ${result.success ? 'success' : 'failed'}`}>
                <div className="test-header-item">
                  <span className="test-status">{result.success ? '✅' : '❌'}</span>
                  <span className="test-query">"{result.query}"</span>
                  <span className="test-mode">{result.mode}</span>
                  <span className="test-time">{result.responseTime}ms</span>
                </div>
                <div className="test-description">{result.description}</div>
                <div className="test-results-count">
                  Results: {result.results.length} items
                </div>
                {result.results.length > 0 && (
                  <div className="test-sample-results">
                    <strong>Sample results:</strong>
                    <ul>
                      {result.results.slice(0, 3).map((item: any, i: number) => (
                        <li key={i}>
                          {item.display_label || item.name || item.full_name || item.title || 'Unknown'} 
                          ({item.entity_type || item._table || 'unknown'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="live-demo">
        <h2>🎭 Live Demo</h2>
        <p>Test the unified intelligent editor with real-time suggestions:</p>
        <UnifiedIntelligentEditor
          userId="test-user"
          documentId="test-document"
          placeholder="Try typing: 'john', 'show products', or 'find customer john doe'..."
        />
      </div>
    </div>
  );
};

export default TestPage;
