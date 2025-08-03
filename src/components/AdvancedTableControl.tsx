import React, { useState } from 'react';
import { ResultTable } from './ResultTable';
import './AdvancedTableControl.css';

interface TableFilters {
  entityType: string;
  searchQuery: string;
  searchMode: 'advanced' | 'intelligent' | 'basic';
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  limit: number;
}

interface SearchResult {
  data: any[];
  tables_searched?: string[];
  total_results?: number;
  search_query?: string;
  execution_time?: number;
}

interface AdvancedTableControlProps {
  className?: string;
}

const ENTITY_TYPES = [
  { value: 'customers', label: 'Customers', icon: '👥' },
  { value: 'products', label: 'Products', icon: '📦' },
  { value: 'users', label: 'Users', icon: '👤' },
  { value: 'tasks', label: 'Tasks', icon: '📋' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'stock', label: 'Stock', icon: '📊' },
  { value: 'shifts', label: 'Shifts', icon: '⏰' },
  { value: 'attendance', label: 'Attendance', icon: '✅' }
];

const SEARCH_MODES = [
  { value: 'advanced', label: 'Advanced Search', desc: 'Complex queries across multiple tables' },
  { value: 'intelligent', label: 'Intelligent SQL', desc: 'AI-powered SQL generation' },
  { value: 'basic', label: 'Basic Suggestions', desc: 'Simple text-based search' }
];

const QUICK_QUERIES = {
  customers: [
    'customers in New York',
    'customers from this month', 
    'show all customers',
    'active customers'
  ],
  products: [
    'products with price above 100',
    'products in category electronics',
    'find products',
    'bestselling products'
  ],
  users: [
    'users with role admin',
    'list users',
    'active users',
    'users by department'
  ],
  tasks: [
    'pending tasks',
    'tasks due this week',
    'high priority tasks',
    'completed tasks'
  ],
  sales: [
    'sales from last quarter',
    'high value sales',
    'sales by region',
    'recent sales'
  ],
  stock: [
    'stock levels',
    'low stock items',
    'stock by warehouse',
    'inventory reports'
  ],
  shifts: [
    'work shifts',
    'shifts this week',
    'overtime shifts',
    'shift schedule'
  ],
  attendance: [
    'attendance records',
    'attendance this month',
    'attendance patterns',
    'late arrivals'
  ]
};

export const AdvancedTableControl: React.FC<AdvancedTableControlProps> = ({ className }) => {
  const [filters, setFilters] = useState<TableFilters>({
    entityType: 'customers',
    searchQuery: '',
    searchMode: 'advanced',
    limit: 50
  });

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const executeSearch = async (query: string = filters.searchQuery) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response: Response;
      
      if (filters.searchMode === 'advanced') {
        response = await fetch('http://localhost:3001/api/advanced-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            limit: filters.limit
          })
        });
      } else if (filters.searchMode === 'intelligent') {
        response = await fetch('http://localhost:3001/api/suggestions/intelligent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: query,
            entityTypes: [filters.entityType]
          })
        });
      } else {
        // Basic suggestions
        const params = new URLSearchParams({
          text: query,
          position: '0',
          entityTypes: filters.entityType
        });
        response = await fetch(`http://localhost:3001/api/suggestions?${params}`);
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalize response format
      const normalizedResults: SearchResult = {
        data: data.data || data.entities || data.suggestions || [],
        tables_searched: data.tables_searched || [filters.entityType],
        total_results: (data.data || data.entities || data.suggestions || []).length,
        search_query: query,
        execution_time: data.execution_time
      };

      setResults(normalizedResults);
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    executeSearch(query);
  };

  const handleSearchModeChange = (mode: 'advanced' | 'intelligent' | 'basic') => {
    setFilters(prev => ({ ...prev, searchMode: mode }));
    if (filters.searchQuery) {
      // Re-execute search with new mode
      setTimeout(() => executeSearch(), 100);
    }
  };

  return (
    <div className={`advanced-table-control ${className}`}>
      {/* Header Controls */}
      <div className="control-panel">
        <div className="panel-header">
          <h2>🔍 Advanced Table Explorer</h2>
          <div className="search-stats">
            {results && (
              <span className="stats-badge">
                {results.total_results} results in {results.execution_time || '—'}ms
              </span>
            )}
          </div>
        </div>

        {/* Entity Type Selector */}
        <div className="control-section">
          <label className="section-label">📊 Table Type</label>
          <div className="entity-selector">
            {ENTITY_TYPES.map(type => (
              <button
                key={type.value}
                className={`entity-btn ${filters.entityType === type.value ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, entityType: type.value }))}
              >
                <span className="entity-icon">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Mode Selector */}
        <div className="control-section">
          <label className="section-label">🎯 Search Mode</label>
          <div className="mode-selector">
            {SEARCH_MODES.map(mode => (
              <div key={mode.value} className="mode-option">
                <input
                  type="radio"
                  id={mode.value}
                  name="searchMode"
                  checked={filters.searchMode === mode.value}
                  onChange={() => handleSearchModeChange(mode.value as any)}
                />
                <label htmlFor={mode.value} className="mode-label">
                  <strong>{mode.label}</strong>
                  <small>{mode.desc}</small>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="control-section">
          <label className="section-label">🔍 Search Query</label>
          <div className="search-input-group">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder={`Search ${filters.entityType} using ${filters.searchMode} mode...`}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
            />
            <button 
              onClick={() => executeSearch()}
              disabled={loading || !filters.searchQuery.trim()}
              className="search-btn"
            >
              {loading ? '🔄' : '🔍'} Search
            </button>
          </div>
        </div>

        {/* Quick Query Buttons */}
        <div className="control-section">
          <label className="section-label">⚡ Quick Queries</label>
          <div className="quick-queries">
            {QUICK_QUERIES[filters.entityType as keyof typeof QUICK_QUERIES]?.map((query, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuery(query)}
                className="quick-query-btn"
                disabled={loading}
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="control-section">
            <label className="section-label">📚 Recent Searches</label>
            <div className="search-history">
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuery(query)}
                  className="history-btn"
                  disabled={loading}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Searching {filters.entityType} using {filters.searchMode} mode...</span>
        </div>
      )}

      {/* Results Table */}
      {results && results.data.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h3>🎯 Search Results</h3>
            <div className="results-meta">
              <span className="result-count">{results.total_results} records found</span>
              {results.tables_searched && results.tables_searched.length > 1 && (
                <span className="tables-searched">
                  Searched: {results.tables_searched.join(', ')}
                </span>
              )}
            </div>
          </div>
          
          <ResultTable 
            data={results.data}
            entityType={filters.entityType}
            title={`${filters.entityType.charAt(0).toUpperCase() + filters.entityType.slice(1)} Results`}
            className="search-results-table"
          />
        </div>
      )}

      {/* No Results State */}
      {results && results.data.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>No {filters.entityType} match your search query "{results.search_query}"</p>
          <div className="no-results-suggestions">
            <p>Try:</p>
            <ul>
              <li>Using different search terms</li>
              <li>Switching to a different search mode</li>
              <li>Selecting a different table type</li>
              <li>Using one of the quick query suggestions above</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
