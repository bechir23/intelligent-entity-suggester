import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import './DynamicQueryInterface.css';

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

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
  type: 'entity' | 'info' | 'temporal' | 'pronoun' | 'user_filter' | 'product_filter' | 'status_filter' | 'location_filter';
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

  // Real-time entity extraction with enhanced debugging
  const extractEntitiesFromInput = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 2) {
      setEntities([]);
      return;
    }

    try {
      console.log('🔍 DynamicQuery: Extracting entities for:', text);
      const response = await fetch('http://localhost:3001/api/chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ DynamicQuery: Received entities:', result.entities);
      
      // Enhanced entity validation
      const validEntities = (result.entities || []).filter((entity: any) => {
        const isValid = entity.text && entity.type && entity.color && 
                       typeof entity.startIndex === 'number' && 
                       typeof entity.endIndex === 'number';
        if (!isValid) {
          console.warn('⚠️ Invalid entity detected:', entity);
        }
        return isValid;
      });

      setEntities(validEntities);
      
      // Extract table relationships
      const tables = validEntities.map((e: EntityMatch) => e.table).filter((table: string | undefined): table is string => Boolean(table));
      setJoinTables(Array.from(new Set(tables)));
      
    } catch (error) {
      console.error('❌ DynamicQuery: Error extracting entities:', error);
      setEntities([]);
      setJoinTables([]);
    }
  }, []);

  // Enhanced debounced entity extraction with immediate feedback
  useEffect(() => {
    console.log('🔄 DynamicQuery: useEffect triggered for query:', query);
    
    // Immediate update for debug panel visibility
    if (query.trim().length === 0) {
      setEntities([]);
      setJoinTables([]);
    }
    
    const timeoutId = setTimeout(() => {
      console.log('⏰ DynamicQuery: Debounce timeout triggered');
      extractEntitiesFromInput(query);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, extractEntitiesFromInput]);
  
  // Handle entity hover with enhanced debugging
  const handleEntityHover = (entity: EntityMatch, event: React.MouseEvent) => {
    console.log('🚀 HOVER EVENT TRIGGERED:', {
      text: entity.text,
      type: entity.type,
      table: entity.table,
      hoverText: entity.hoverText,
      suggestions: entity.suggestions?.length || 0
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

  // Debounced dynamic query processing with SQL relationship tracking
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
        console.log('🔍 Processing dynamic query with SQL tracking:', queryText);
        
        const response = await fetch('http://localhost:3001/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: queryText,
            userName: 'Ahmed Hassan'
          })
        });

        const result: QueryResult = await response.json();
        
        console.log('✅ Dynamic result with SQL analysis:', {
          entities: result.responseEntities?.length || 0,
          dataRecords: result.data?.length || 0,
          tables: result.responseEntities?.map(e => e.table).filter(Boolean) || []
        });
        
        setEntities(result.responseEntities || []);
        setTableData(result.data || []);
        setRecordCount(result.data?.length || 0);
        
        // Enhanced table relationship detection
        if (result.responseEntities && result.responseEntities.length > 0) {
          const entityTables = result.responseEntities.map(e => e.table).filter((table): table is string => Boolean(table));
          setJoinTables(Array.from(new Set(entityTables)));
          
          const primaryTable = result.responseEntities.find(e => e.table)?.table;
          if (primaryTable) {
            setTableName(primaryTable);
          } else if (result.data && result.data.length > 0) {
            const firstRecord = result.data[0];
            if (firstRecord.task_id) setTableName('tasks');
            else if (firstRecord.product_id) setTableName('products');
            else if (firstRecord.customer_id || firstRecord.sale_id) setTableName('sales');
            else if (firstRecord.user_id) setTableName('users');
            else if (firstRecord.stock_id) setTableName('stock');
            else setTableName('results');
          }
          
          // Generate SQL query representation
          const sqlParts = [];
          const tables = [...new Set(entityTables)];
          if (tables.length > 1) {
            sqlParts.push(`SELECT * FROM ${tables.join(' JOIN ')}`);
            sqlParts.push(`WHERE ${result.responseEntities.map(e => 
              e.type.includes('filter') ? `${e.table}.${e.type.replace('_filter', '')} = '${e.value}'` : 
              `${e.table}.name LIKE '%${e.text}%'`
            ).join(' AND ')}`);
          } else if (tables.length === 1) {
            sqlParts.push(`SELECT * FROM ${tables[0]}`);
            sqlParts.push(`WHERE ${result.responseEntities.map(e => 
              `name LIKE '%${e.text}%'`
            ).join(' AND ')}`);
          }
          setSqlQuery(sqlParts.join(' '));
        }
        
      } catch (error) {
        console.error('❌ Dynamic query error:', error);
        setEntities([]);
        setTableData([]);
        setTableName('');
        setRecordCount(0);
        setSqlQuery('');
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

        const displayText = (entity.type.endsWith('_filter') || entity.type === 'temporal') && entity.value && entity.value !== entity.text 
          ? `${entity.text} (${entity.value})`
          : entity.text;
          
        result.push(
          <span
            key={index}
            className="entity-highlight"
            style={{
              backgroundColor: `${getEntityColor(entity.type)}20`,
              color: getEntityColor(entity.type),
              border: `2px solid ${getEntityColor(entity.type)}`,
              borderRadius: '4px',
              padding: '2px 4px',
              margin: '0 1px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => handleEntityHover(entity, e)}
            onMouseLeave={() => setHoveredEntity(null)}
            onClick={(e) => handleEntityClick(entity, e)}
          >
            {displayText}
            {entity.suggestions && entity.suggestions.length > 0 && (
              <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
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
          
          {sqlQuery && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '13px', 
              fontFamily: 'monospace', 
              color: '#059669',
              background: '#f0fdf4',
              padding: '8px',
              borderRadius: '4px',
              border: '2px solid #059669'
            }}>
              📊 SQL: {sqlQuery}
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
                  <th key={column}>{column.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 50).map((row, index) => (
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
        
        {tableData.length > 50 && (
          <div className="table-footer">
            Showing 50 of {tableData.length} records
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
          <div style={{ background: '#004400', padding: '5px', margin: '5px 0', fontSize: '11px' }}>
            🗄️ SQL: {sqlQuery}
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
            <div>Value: {entity.value || entity.actualValue || 'N/A'}</div>
            {entity.confidence && (
              <div>Confidence: {Math.round(entity.confidence * 100)}%</div>
            )}
            {entity.suggestions && (
              <div>Suggestions: {entity.suggestions.length}</div>
            )}
            {entity.hoverText && (
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Hover: {entity.hoverText}</div>
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
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search: sales of laptop, ahmed tasks, laptop stock in paris..."
              className="search-input"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '16px',
                marginLeft: '10px'
              }}
            />
            
            {/* Enhanced Entity overlays with better visibility */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '42px',
              right: '12px',
              bottom: '12px',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              {entities.map((entity, index) => (
                <span
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${(entity.startIndex / Math.max(query.length, 1)) * 100}%`,
                    width: `${((entity.endIndex - entity.startIndex) / Math.max(query.length, 1)) * 100}%`,
                    backgroundColor: `${entity.color}60`,
                    borderColor: entity.color,
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    borderRadius: '6px',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: 'help',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 0 8px ${entity.color}40`
                  }}
                  title={entity.hoverText || `${entity.type}: ${entity.text} (Table: ${entity.table || 'N/A'})`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${entity.color}80`;
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 15px ${entity.color}80`;
                    handleEntityHover(entity, e);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${entity.color}60`;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 0 8px ${entity.color}40`;
                    setHoveredEntity(null);
                  }}
                  onClick={(e) => handleEntityClick(entity, e)}
                >
                  <span style={{
                    fontSize: '12px',
                    color: entity.color,
                    fontWeight: 'bold',
                    textShadow: '0 0 3px white',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>
                    {entity.type.substring(0, 1).toUpperCase()}
                  </span>
                  {entity.suggestions && entity.suggestions.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      right: '2px',
                      top: '-2px',
                      fontSize: '10px',
                      color: entity.color,
                      fontWeight: 'bold',
                      background: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      ▼
                    </span>
                  )}
                </span>
              ))}
            </div>
            
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

      {/* Enhanced Entity Tooltip */}
      {hoveredEntity && (
        <div 
          className="entity-tooltip"
          style={{
            position: 'fixed',
            left: Math.max(10, Math.min(tooltipPosition.x - 150, window.innerWidth - 320)),
            top: Math.max(10, tooltipPosition.y - 100),
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '320px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            border: `3px solid ${hoveredEntity.color}`
          }}
        >
          <div style={{
            color: hoveredEntity.color,
            fontWeight: 'bold',
            marginBottom: '8px',
            fontSize: '16px'
          }}>
            {hoveredEntity.type.replace('_', ' ').toUpperCase()}
            {hoveredEntity.confidence && (
              <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '14px' }}>
                {Math.round(hoveredEntity.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="tooltip-content" style={{ marginBottom: '8px' }}>
            <strong>Value:</strong> {hoveredEntity.hoverText || hoveredEntity.actualValue || hoveredEntity.value || hoveredEntity.text}
          </div>
          {hoveredEntity.table && (
            <div style={{ marginBottom: '8px', fontSize: '12px', opacity: 0.9 }}>
              <span style={{ marginRight: '4px' }}>🗄️</span>
              <strong>Table:</strong> {hoveredEntity.table}
            </div>
          )}
          {hoveredEntity.suggestions && hoveredEntity.suggestions.length > 0 && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
              💡 Click for {hoveredEntity.suggestions.length} suggestions
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
            textAlign: 'center'
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
