import React, { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import './DynamicQueryInterface.css';

// Icons
const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);

interface EntityMatch {
  text: string;
  type: 'entity' | 'info' | 'temporal' | 'pronoun' | 'user_filter' | 'product_filter' | 'status_filter' | 'location_filter' | 'numeric_filter';
  table?: string;
  actualValue?: string;
  value?: string;
  color: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
  hoverText?: string;
  isFilter?: boolean;
  suggestions?: string[];
  field?: string;
  filterType?: string;
  metadata?: any;
}

interface QueryResult {
  response: string;
  responseEntities: EntityMatch[];
  data: any[];
}

export const DynamicQueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<EntityMatch[]>([]);
  const [hoveredEntity, setHoveredEntity] = useState<EntityMatch | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState<EntityMatch | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableName, setTableName] = useState<string>('');
  const [recordCount, setRecordCount] = useState(0);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [joinTables, setJoinTables] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  
  // History management for undo/redo
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Test queries for different SQL relationship patterns
  const testQueries = [
    'sales of laptop',           // JOIN sales + products
    'ahmed tasks',              // JOIN customers/users + tasks  
    'laptop stock in paris',    // JOIN products + stock + locations
    'pending tasks for ahmed',  // JOIN tasks + users + status filter
    'sales last month by product', // JOIN sales + products + temporal filter
    'wireless mouse sales',     // Product + sales relationship
    'my tasks pending',         // User context + status filter
    'customers in london',      // Customer + location filter
    'ahmed laptop orders',      // Customer + product + sales
    'stock below 10'           // Stock + threshold filter
  ];

  // History management functions
  const addToHistory = useCallback((newQuery: string) => {
    if (newQuery !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newQuery);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setQuery(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setQuery(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Enhanced query change handler with history
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    addToHistory(value);
  }, [addToHistory]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'a':
          e.preventDefault();
          if (inputRef.current) {
            inputRef.current.select();
          }
          break;
        case 'c':
          // Default copy behavior will work
          break;
        case 'v':
          // Default paste behavior will work
          break;
        case 'x':
          // Default cut behavior will work
          break;
      }
    }
  }, [undo, redo]);

  // Enhanced debounced entity extraction with immediate feedback
  
  // Enhanced entity hover with comprehensive information
  const handleEntityHover = (entity: EntityMatch, event: React.MouseEvent) => {
    console.log('🚀 ENHANCED HOVER EVENT:', {
      text: entity.text,
      type: entity.type,
      table: entity.table,
      actualValue: entity.actualValue,
      hoverText: entity.hoverText,
      suggestions: entity.suggestions?.length || 0,
      metadata: entity.metadata
    });
    setHoveredEntity(entity);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    });
  };

  // Handle entity click for suggestions
  const handleEntityClick = (entity: EntityMatch, event: React.MouseEvent) => {
    console.log('🖱️ ENTITY CLICK:', entity.text, 'Suggestions:', entity.suggestions?.length || 0);
    if (entity.suggestions && entity.suggestions.length > 0) {
      event.preventDefault();
      setShowSuggestions(entity);
      setSuggestionPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string, originalEntity: EntityMatch) => {
    console.log('📋 SUGGESTION SELECTED:', suggestion, 'for entity:', originalEntity.text);
    const customerName = suggestion.split(' (ID:')[0];
    const newQuery = query.replace(originalEntity.text, customerName);
    setQuery(newQuery);
    setShowSuggestions(null);
  };

  // Quick test query buttons
  const handleTestQuery = (testQuery: string) => {
    console.log('🧪 TESTING QUERY:', testQuery);
    setQuery(testQuery);
  };

  // Get entity color based on type
  const getEntityColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'entity': '#2563EB',        // Blue - Primary entities
      'info': '#059669',          // Green - Info/operations  
      'temporal': '#7C3AED',      // Purple - Time-based
      'pronoun': '#DC2626',       // Red - User context
      'user_filter': '#DC2626',   // Red - User filters
      'product_filter': '#059669', // Green - Product filters
      'status_filter': '#EA580C', // Orange - Status filters
      'location_filter': '#0891B2' // Cyan - Location filters
    };
    return colors[type] || '#6B7280';
  };

  // Enhanced debounced query processing with comprehensive SQL tracking
  const debouncedProcess = useCallback(
    debounce(async (queryText: string) => {
      if (!queryText.trim() || queryText.length < 2) {
        setEntities([]);
        setTableData([]);
        setTableName('');
        setRecordCount(0);
        setSqlQuery('');
        setJoinTables([]);
        return;
      }

      setIsLoading(true);
      
      try {
        console.log('🔍 Processing enhanced query with production backend:', queryText);
        
        const response = await fetch('http://localhost:3001/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: queryText,
            userName: 'Ahmed Hassan'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: QueryResult & {
          sqlQuery?: string;
          filters?: any;
          recordCount?: number;
          primaryTable?: string;
          joinTables?: string[];
          filtersApplied?: number;
          queryInfo?: any;
          currentUser?: string;
          currentDate?: string;
          entities?: any[];
          query?: { sql?: string };
          summary?: { primaryTable?: string; joinTables?: string[] };
        } = await response.json();
        
        console.log('🔍 Full API Response:', result);
        console.log('🔍 Response keys:', Object.keys(result));
        console.log('🔍 result.data type:', typeof result.data, 'length:', result.data?.length);
        console.log('🔍 result.entities type:', typeof result.entities, 'length:', result.entities?.length);
        console.log('🔍 result.query:', result.query);
        
        console.log('✅ Enhanced result with comprehensive SQL analysis:', {
          entities: result.entities?.length || 0,
          dataRecords: result.data?.length || 0,
          actualSQL: result.query?.sql?.substring(0, 100) || 'None',
          primaryTable: result.summary?.primaryTable,
          filtersApplied: result.filtersApplied || 0
        });
        
        // Set all the enhanced data from the production backend
        setEntities(result.entities || []);
        setTableData(result.data || []);
        setRecordCount(result.recordCount || result.data?.length || 0);
        setTableName(result.summary?.primaryTable || 'results');
        setJoinTables(result.summary?.joinTables || []);
        
        // Debug SQL query issue
        console.log('🔍 SQL Debug - result.query:', result.query);
        console.log('🔍 SQL Debug - result.query?.sql:', result.query?.sql);
        console.log('🔍 SQL Debug - About to set sqlQuery to:', result.query?.sql || '');
        console.log('🔍 Table Data Debug - result.data:', result.data);
        console.log('🔍 Table Data Debug - result.data.length:', result.data?.length);
        
        setTableData(result.data || []);
        setRecordCount(result.recordCount || result.data?.length || 0);
        
        console.log('🔍 After setTableData - tableData should now have:', result.data?.length || 0, 'records');
        
        setSqlQuery(result.query?.sql || '');
        
        // Update entity hover text with current user and date information
        if (result.entities) {
          const enhancedEntities = result.entities.map(entity => {
            if (entity.type === 'pronoun' && result.currentUser) {
              return {
                ...entity,
                hoverText: `User: ${entity.text} → ${result.currentUser} (Current User)`
              };
            } else if (entity.type === 'temporal' && result.currentDate) {
              return {
                ...entity,
                hoverText: `Date: ${entity.text} → ${entity.actualValue || entity.value} (Today: ${result.currentDate})`
              };
            }
            return entity;
          });
          setEntities(enhancedEntities);
        }
        
      } catch (error) {
        console.error('❌ Enhanced query error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setEntities([]);
        setTableData([]);
        setTableName('');
        setRecordCount(0);
        setSqlQuery('ERROR: ' + errorMessage);
        setJoinTables([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Process query as user types
  useEffect(() => {
    debouncedProcess(query);
  }, [query, debouncedProcess]);

  // Render highlighted text with entities
  const renderHighlightedQuery = () => {
    if (!entities || entities.length === 0) return query;

    let result = [];
    let lastIndex = 0;

    entities
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach((entity, index) => {
        if (lastIndex < entity.startIndex) {
          result.push(query.slice(lastIndex, entity.startIndex));
        }

        const displayText = (entity.type.endsWith('_filter') || entity.type === 'temporal') && entity.actualValue && entity.actualValue !== entity.text 
          ? `${entity.text} (${entity.actualValue})`
          : entity.text;
          
        // Enhanced styling based on entity type
        const entityStyle = {
          backgroundColor: `${getEntityColor(entity.type)}20`,
          color: getEntityColor(entity.type),
          border: `2px solid ${getEntityColor(entity.type)}`,
          borderRadius: '6px',
          padding: '3px 6px',
          margin: '0 2px',
          fontWeight: 'bold',
          position: 'relative' as const,
          display: 'inline-block',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: `0 2px 4px ${getEntityColor(entity.type)}40`
        };
          
        result.push(
          <span
            key={index}
            className="entity-highlight"
            style={entityStyle}
            onMouseEnter={(e) => handleEntityHover(entity, e)}
            onMouseLeave={() => setHoveredEntity(null)}
            onClick={(e) => handleEntityClick(entity, e)}
          >
            {/* Entity type indicator */}
            <span style={{ 
              fontSize: '10px', 
              marginRight: '4px',
              opacity: 0.8
            }}>
              {entity.type === 'temporal' ? '📅' :
               entity.type === 'pronoun' ? '👤' :
               entity.type === 'numeric_filter' ? '🔢' :
               entity.type === 'location_filter' ? '📍' :
               entity.type === 'status_filter' ? '🔖' :
               entity.table === 'products' ? '🛍️' :
               entity.table === 'customers' ? '👥' :
               entity.table === 'sales' ? '💰' :
               entity.table === 'tasks' ? '📝' :
               entity.table === 'stock' ? '📦' :
               entity.table === 'users' ? '👤' : '🔍'}
            </span>
            {displayText}
            {entity.suggestions && entity.suggestions.length > 0 && (
              <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.7 }}>▼</span>
            )}
            {/* Confidence indicator for high-confidence entities */}
            {entity.confidence && entity.confidence >= 0.9 && (
              <span style={{ 
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                fontSize: '8px',
                background: getEntityColor(entity.type),
                color: 'white',
                borderRadius: '50%',
                width: '12px',
                height: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ✓
              </span>
            )}
          </span>
        );

        lastIndex = entity.endIndex;
      });

    if (lastIndex < query.length) {
      result.push(query.slice(lastIndex));
    }

    return result;
  };

  // Render dynamic data table with SQL relationship info
  const renderDynamicTable = () => {
    console.log('🔍 renderDynamicTable - tableData:', tableData);
    console.log('🔍 renderDynamicTable - tableData.length:', tableData?.length);
    console.log('🔍 renderDynamicTable - isLoading:', isLoading);
    console.log('🔍 renderDynamicTable - query.length:', query.length);
    
    if (!tableData || tableData.length === 0) {
      if (isLoading) {
        return (
          <div className="loading-table">
            <div className="loading-spinner"></div>
            <p>Searching data with SQL relationships...</p>
          </div>
        );
      }
      
      if (query.trim().length >= 2) {
        return (
          <div className="no-results">
            <DatabaseIcon />
            <p>No results found for "{query}"</p>
            <span>Try different keywords or test queries below</span>
          </div>
        );
      }
      
      return (
        <div className="welcome-state">
          <DatabaseIcon />
          <h3>Start typing to search with SQL relationships</h3>
          <p>Search customers, products, sales, tasks, users, stock, shifts, or attendance</p>
          <div style={{ marginTop: '20px' }}>
            <strong style={{ fontSize: '16px', color: '#1e40af' }}>🧪 Test SQL Relationship Patterns:</strong>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '12px', 
              marginTop: '15px' 
            }}>
              {testQueries.map((testQuery, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log('🧪 TESTING QUERY BUTTON CLICKED:', testQuery);
                    handleTestQuery(testQuery);
                  }}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: '2px solid #2563eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>{testQuery}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {testQuery.includes('laptop') && testQuery.includes('sales') ? 'JOIN sales + products' :
                     testQuery.includes('ahmed') && testQuery.includes('tasks') ? 'JOIN customers + tasks' :
                     testQuery.includes('stock') && testQuery.includes('paris') ? 'JOIN products + stock + locations' :
                     testQuery.includes('pending') ? 'JOIN tasks + users + status filter' :
                     'Table relationship test'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);
    console.log('🗄️ Table columns:', columns);
    console.log('🗄️ First row data:', tableData[0]);
    console.log('🗄️ Table data length:', tableData.length);
    
    return (
      <div className="dynamic-table-container">
        <div className="table-header">
          <div className="table-title" style={{ 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <TableIcon />
            <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              {tableName.toUpperCase()} - {recordCount} records
            </span>
            {joinTables.length > 1 && (
              <span style={{ 
                marginLeft: '15px', 
                fontSize: '14px', 
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                🔗 JOINED: {joinTables.join(' + ')}
              </span>
            )}
          </div>
          
          {/* SQL Query Debug Panel */}
          {sqlQuery && (
            <div style={{ 
              marginTop: '15px', 
              marginBottom: '15px',
              padding: '16px',
              background: sqlQuery.startsWith('ERROR') ? '#FEF2F2' : '#f0fdf4',
              border: sqlQuery.startsWith('ERROR') ? '2px solid #DC2626' : '2px solid #059669',
              borderRadius: '10px',
              boxShadow: sqlQuery.startsWith('ERROR') ? '0 4px 12px rgba(220, 38, 38, 0.2)' : '0 4px 12px rgba(5, 150, 105, 0.2)',
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: sqlQuery.startsWith('ERROR') ? '#DC2626' : '#059669'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🗄️ {sqlQuery.startsWith('ERROR') ? 'SQL ERROR' : 'SQL Query'}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  background: sqlQuery.startsWith('ERROR') ? '#DC2626' : '#059669',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {recordCount} record{recordCount !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* SQL Code Display */}
              <div style={{ 
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#374151',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {sqlQuery}
              </div>
              
              {/* Query Stats */}
              {!sqlQuery.startsWith('ERROR') && entities.length > 0 && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151'
                }}>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <span><strong>Primary Table:</strong> {tableName}</span>
                    {joinTables.length > 1 && (
                      <span><strong>Joined Tables:</strong> {joinTables.slice(1).join(', ')}</span>
                    )}
                    <span><strong>Entities:</strong> {entities.length}</span>
                    <span><strong>Filters:</strong> {entities.filter(e => ['numeric_filter', 'status_filter', 'location_filter', 'temporal'].includes(e.type)).length}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {entities.length > 0 && (
            <div className="applied-filters" style={{ marginTop: '10px' }}>
              <strong style={{ marginRight: '10px' }}>🔍 Active Filters:</strong>
              {entities.filter(e => e.isFilter).map((filter, index) => (
                <span 
                  key={index} 
                  className="filter-badge"
                  style={{ 
                    backgroundColor: filter.color,
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    margin: '3px',
                    fontWeight: 'bold',
                    boxShadow: `0 2px 4px ${filter.color}40`
                  }}
                >
                  {filter.type.replace('_filter', '')}: {filter.value}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="table-wrapper">
          <table className="dynamic-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column}>
                    {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className="table-row">
                  {columns.map(column => (
                    <td key={column} title={String(row[column] || '')}>
                      {String(row[column] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {tableData.length > 0 && (
          <div className="table-footer" style={{ 
            background: '#f8fafc',
            padding: '1rem',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
            fontWeight: '600'
          }}>
            Showing all {tableData.length} record{tableData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dynamic-query-container">
      {/* Header */}
      <div className="query-header">
        <div className="header-content">
          <div className="header-icon">
            <DatabaseIcon />
          </div>
          <div className="header-text">
            <h1>Intelligent Data Search with SQL Relationships</h1>
            <p>Real-time search with entity recognition and table joins</p>
          </div>
        </div>
      </div>

      {/* Enhanced DEBUG PANEL with Real-time Updates */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#000',
        color: '#00ff00',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '13px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: '450px',
        border: entities.length > 0 ? '2px solid #00ff00' : '2px solid #ff0000',
        maxHeight: showDebugPanel ? '80vh' : '40px',
        overflowY: 'auto',
        boxShadow: entities.length > 0 ? '0 0 10px #00ff00' : '0 0 10px #ff0000',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer'
        }} onClick={() => setShowDebugPanel(!showDebugPanel)}>
          <strong>🔍 REAL-TIME ENTITY DEBUG PANEL</strong>
          <span style={{ fontSize: '16px' }}>
            {showDebugPanel ? '🔼' : '🔽'}
          </span>
        </div>
        {showDebugPanel && (
          <div>
            <div>Query: "{query}" (Length: {query.length})</div>
            <div>Entities Detected: {entities.length}</div>
            <div style={{ 
              background: entities.length > 0 ? '#004400' : '#440000', 
              padding: '5px',  
          margin: '5px 0',
          border: entities.length > 0 ? '1px solid #00ff00' : '1px solid #ff0000'
        }}>
          STATUS: {entities.length > 0 ? '✅ ENTITIES DETECTED' : '❌ NO ENTITIES FOUND'}
        </div>
        
        {/* Connection Status */}
        <div style={{ 
          background: '#000044', 
          padding: '5px', 
          margin: '5px 0',
          border: '1px solid #0088ff'
        }}>
          🌐 BACKEND: Connected to localhost:3001
        </div>
        
        {joinTables.length > 0 && (
          <div style={{ background: '#000044', padding: '5px', margin: '5px 0' }}>
            🔗 JOINED TABLES: {joinTables.join(', ')}
          </div>
        )}
        {sqlQuery && (
          <div style={{ background: '#440044', padding: '5px', margin: '5px 0', fontSize: '11px' }}>
            🗄️ SQL: {sqlQuery.length > 100 ? sqlQuery.substring(0, 100) + '...' : sqlQuery}
          </div>
        )}
        
        {/* Full SQL Query Display */}
        {sqlQuery && sqlQuery.length > 100 && (
          <div style={{ 
            background: '#001122', 
            padding: '8px', 
            margin: '5px 0', 
            fontSize: '10px',
            fontFamily: 'monospace',
            border: '1px solid #0088ff',
            borderRadius: '4px',
            maxHeight: '120px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            <div style={{ color: '#00aaff', fontWeight: 'bold', marginBottom: '4px' }}>
              📋 FULL SQL STATEMENT:
            </div>
            {sqlQuery}
          </div>
        )}
        
        {/* Table Data Info */}
        {tableData.length > 0 && (
          <div style={{ background: '#440044', padding: '5px', margin: '5px 0' }}>
            📊 DATA: {tableData.length} records in {tableName}
          </div>
        )}
        
        {entities.map((entity, i) => (
          <div key={i} style={{ 
            marginTop: '8px', 
            padding: '5px', 
            background: '#333', 
            borderRadius: '4px',
            border: `1px solid ${entity.color}`
          }}>
            <div style={{ color: entity.color, fontWeight: 'bold' }}>
              Entity {i + 1}: "{entity.text}" ({entity.type})
            </div>
            <div>Position: {entity.startIndex}-{entity.endIndex}</div>
            <div>Table: {entity.table || 'N/A'}</div>
            <div>Detected Value: {entity.value || entity.actualValue || 'N/A'}</div>
            {entity.actualValue && entity.actualValue !== entity.value && (
              <div style={{ color: '#00ff88' }}>Actual Value: {entity.actualValue}</div>
            )}
            {entity.confidence && (
              <div>Confidence: {Math.round(entity.confidence * 100)}%</div>
            )}
            {entity.suggestions && (
              <div>Suggestions: {entity.suggestions.length}</div>
            )}
            {entity.hoverText && (
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Hover: {entity.hoverText}</div>
            )}
            {entity.type === 'temporal' && (
              <div style={{ color: '#ff8800', fontSize: '11px' }}>
                ⚠️ Should show actual date range in SQL
              </div>
            )}
            {entity.type === 'pronoun' && (
              <div style={{ color: '#ff8800', fontSize: '11px' }}>
                ⚠️ Should resolve to actual user ID in SQL
              </div>
            )}
          </div>
        ))}
        
        {/* Live Testing Section */}
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          background: '#001100', 
          borderRadius: '4px',
          border: '1px solid #00aa00'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🧪 QUICK TESTS:</div>
          <div style={{ fontSize: '11px' }}>
            Hover effects: {hoveredEntity ? '✅ Active' : '❌ None'}<br/>
            Suggestions: {showSuggestions ? '✅ Showing' : '❌ Hidden'}<br/>
            Loading: {isLoading ? '🔄 Processing' : '✅ Ready'}
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper" style={{
            position: 'relative',
            border: entities.length > 0 ? '3px solid #10B981' : '2px solid #e5e7eb',
            backgroundColor: entities.length > 0 ? '#f0fdf4' : 'white',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search: sales of laptop, ahmed tasks, laptop stock in paris..."
              className="search-input"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '16px'
              }}
            />
            
            {isLoading && <div className="search-spinner"></div>}
          </div>
          
          {/* Query Preview with Entity Highlighting */}
          {query && (
            <div className="query-preview">
              <span className="preview-label">Query with Entities:</span>
              <div className="highlighted-query" style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px', marginTop: '5px' }}>
                {renderHighlightedQuery()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Results Table */}
      <div className="results-section">
        {renderDynamicTable()}
      </div>

      {/* Compact Entity Tooltip */}
      {hoveredEntity && (
        <div 
          className="entity-tooltip"
          style={{
            position: 'fixed',
            left: Math.max(10, Math.min(tooltipPosition.x - 120, window.innerWidth - 260)),
            top: Math.max(10, tooltipPosition.y - 80),
            zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '240px',
            minWidth: Math.max(100, hoveredEntity.text.length * 8),
            boxShadow: `0 8px 20px rgba(0,0,0,0.4), 0 0 0 2px ${hoveredEntity.color}`,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${hoveredEntity.color}`
          }}
        >
          {/* Compact Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: hoveredEntity.color,
            fontWeight: 'bold',
            marginBottom: '8px',
            fontSize: '13px',
            borderBottom: `1px solid ${hoveredEntity.color}40`,
            paddingBottom: '6px'
          }}>
            <span style={{ marginRight: '6px', fontSize: '14px' }}>
              {hoveredEntity.type === 'temporal' ? '📅' :
               hoveredEntity.type === 'pronoun' ? '👤' :
               hoveredEntity.type === 'numeric_filter' ? '🔢' :
               hoveredEntity.type === 'location_filter' ? '📍' :
               hoveredEntity.type === 'status_filter' ? '🔖' :
               hoveredEntity.table === 'products' ? '🛍️' :
               hoveredEntity.table === 'customers' ? '👥' :
               hoveredEntity.table === 'sales' ? '💰' :
               hoveredEntity.table === 'tasks' ? '📝' :
               hoveredEntity.table === 'stock' ? '📦' :
               hoveredEntity.table === 'shifts' ? '⏰' :
               hoveredEntity.table === 'attendance' ? '✅' :
               hoveredEntity.table === 'audit_trail' ? '📋' :
               hoveredEntity.table === 'date_dimension' ? '📊' :
               hoveredEntity.table === 'users' ? '👤' : '🔍'}
            </span>
            <span style={{ fontSize: '11px' }}>{hoveredEntity.type.replace('_', ' ').toUpperCase()}</span>
          </div>
          
          {/* Compact Main Information */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#E5E7EB', fontSize: '11px' }}>Text:</strong> 
              <span style={{ marginLeft: '6px', color: hoveredEntity.color, fontWeight: 'bold', fontSize: '11px' }}>
                "{hoveredEntity.text}"
              </span>
            </div>
            
            {hoveredEntity.actualValue && hoveredEntity.actualValue !== hoveredEntity.text && (
              <div style={{ marginBottom: '4px' }}>
                <strong style={{ color: '#E5E7EB', fontSize: '11px' }}>→</strong> 
                <span style={{ marginLeft: '6px', color: '#10B981', fontSize: '11px' }}>
                  {hoveredEntity.actualValue}
                </span>
              </div>
            )}
            
            {hoveredEntity.table && (
              <div style={{ marginBottom: '4px' }}>
                <strong style={{ color: '#E5E7EB', fontSize: '11px' }}>Table:</strong> 
                <span style={{ marginLeft: '6px', color: '#3B82F6', fontSize: '11px' }}>
                  {hoveredEntity.table}
                </span>
                {hoveredEntity.field && (
                  <span style={{ color: '#9CA3AF', fontSize: '10px' }}>
                    .{hoveredEntity.field}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Compact Query Impact */}
          {hoveredEntity.hoverText && (
            <div style={{ 
              background: 'rgba(255,255,255,0.1)',
              padding: '6px',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#D1D5DB',
              borderLeft: `2px solid ${hoveredEntity.color}`,
              marginTop: '6px'
            }}>
              {hoveredEntity.hoverText.length > 80 ? 
                `${hoveredEntity.hoverText.substring(0, 80)}...` : 
                hoveredEntity.hoverText}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestions && showSuggestions.suggestions && showSuggestions.suggestions.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            left: suggestionPosition.x,
            top: suggestionPosition.y + 20,
            zIndex: 10001,
            background: 'white',
            border: `3px solid ${showSuggestions.color}`,
            borderRadius: '8px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            minWidth: '280px',
            maxWidth: '450px'
          }}
        >
          <div style={{
            padding: '12px',
            borderBottom: `2px solid ${showSuggestions.color}`,
            color: showSuggestions.color,
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            🔍 Multiple matches for "{showSuggestions.text}"
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {showSuggestions.suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionSelect(suggestion, showSuggestions)}
                style={{ 
                  padding: '12px 16px',
                  borderLeft: `4px solid ${showSuggestions.color}`,
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: index < showSuggestions.suggestions!.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderLeftWidth = '6px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeftWidth = '4px';
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
          <div style={{
            padding: '10px 16px',
            borderTop: '2px solid #f0f0f0',
            textAlign: 'center' as const
          }}>
            <button 
              onClick={() => setShowSuggestions(null)}
              style={{
                background: 'transparent',
                border: `2px solid ${showSuggestions.color}`,
                color: showSuggestions.color,
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside handler for suggestions */}
      {showSuggestions && (
        <div 
          onClick={() => setShowSuggestions(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000
          }}
        />
      )}
    </div>
  );
};

export default DynamicQueryInterface;