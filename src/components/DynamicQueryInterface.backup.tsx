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
  suggestions?: string[]; // Add suggestions for multiple matches
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
  
  // Real-time entity extraction
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
      setEntities(result.entities || []);
    } catch (error) {
      console.error('❌ DynamicQuery: Error extracting entities:', error);
      setEntities([]);
    }
  }, []);

  // Debounced entity extraction
  useEffect(() => {
    console.log('🔄 DynamicQuery: useEffect triggered for query:', query);
    const timeoutId = setTimeout(() => {
      console.log('⏰ DynamicQuery: Debounce timeout triggered');
      extractEntitiesFromInput(query);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, extractEntitiesFromInput]);
  
  // Handle entity hover
  const handleEntityHover = (entity: EntityMatch, event: React.MouseEvent) => {
    console.log('🚀 HOVER EVENT TRIGGERED:', entity.text, entity.hoverText);
    setHoveredEntity(entity);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    });
    console.log('🎯 Tooltip position set:', { x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  // Handle entity click (for suggestions)
  const handleEntityClick = (entity: EntityMatch, event: React.MouseEvent) => {
    if (entity.suggestions && entity.suggestions.length > 0) {
      event.preventDefault();
      setShowSuggestions(entity);
      setSuggestionPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string, originalEntity: EntityMatch) => {
    // Extract customer name from suggestion (remove ID part)
    const customerName = suggestion.split(' (ID:')[0];
    
    // Create a new query with the selected customer
    const newQuery = query.replace(originalEntity.text, customerName);
    setQuery(newQuery);
    setShowSuggestions(null);
  };
  
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableName, setTableName] = useState<string>('');
  const [recordCount, setRecordCount] = useState(0);

  // Get entity color based on type
  const getEntityColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'entity': '#2563EB',        // Blue
      'info': '#059669',          // Green
      'temporal': '#7C3AED',      // Purple
      'pronoun': '#DC2626',       // Red
      'user_filter': '#DC2626',   // Red
      'product_filter': '#059669', // Green
      'status_filter': '#EA580C', // Orange
      'location_filter': '#0891B2' // Cyan
    };
    return colors[type] || '#6B7280';
  };

  // Debounced dynamic query processing
  const debouncedProcess = useCallback(
    debounce(async (queryText: string) => {
      if (!queryText.trim() || queryText.length < 2) {
        setEntities([]);
        setTableData([]);
        setTableName('');
        setRecordCount(0);
        return;
      }

      setIsLoading(true);
      
      try {
        console.log('🔍 Processing dynamic query:', queryText);
        
        const response = await fetch('http://localhost:3001/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: queryText,
            userName: 'Ahmed Hassan'
          })
        });

        const result: QueryResult = await response.json();
        
        console.log('✅ Dynamic result:', result);
        
        setEntities(result.responseEntities || []);
        setTableData(result.data || []);
        setRecordCount(result.data?.length || 0);
        
        // Determine table name from entities or data
        if (result.responseEntities && result.responseEntities.length > 0) {
          const entityTable = result.responseEntities.find(e => e.table)?.table;
          if (entityTable) {
            setTableName(entityTable);
          } else if (result.data && result.data.length > 0) {
            // Try to guess table from data structure
            const firstRecord = result.data[0];
            if (firstRecord.task_id) setTableName('tasks');
            else if (firstRecord.product_id) setTableName('products');
            else if (firstRecord.customer_id || firstRecord.sale_id) setTableName('sales');
            else if (firstRecord.user_id) setTableName('users');
            else setTableName('results');
          }
        }
        
      } catch (error) {
        console.error('❌ Dynamic query error:', error);
        setEntities([]);
        setTableData([]);
        setTableName('');
        setRecordCount(0);
      } finally {
        setIsLoading(false);
      }
    }, 300), // 300ms debounce for real-time feel
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
        // Add text before entity
        if (lastIndex < entity.startIndex) {
          result.push(query.slice(lastIndex, entity.startIndex));
        }

        // Add highlighted entity with value display for all filter types and temporal
        const displayText = (entity.type.endsWith('_filter') || entity.type === 'temporal') && entity.value && entity.value !== entity.text 
          ? `${entity.text} (${entity.value})`
          : (entity.type === 'temporal' && entity.value === entity.text)
          ? `${entity.text} (${entity.value})`
          : entity.text;
          
        result.push(
          <span
            key={index}
            className="entity-highlight"
            style={{
              backgroundColor: `${getEntityColor(entity.type)}15`,
              color: getEntityColor(entity.type),
              borderColor: getEntityColor(entity.type)
            }}
            onMouseEnter={(e) => handleEntityHover(entity, e)}
            onMouseLeave={() => setHoveredEntity(null)}
          >
            {displayText}
          </span>
        );

        lastIndex = entity.endIndex;
      });

    // Add remaining text
    if (lastIndex < query.length) {
      result.push(query.slice(lastIndex));
    }

    return result;
  };

  // Render dynamic data table
  const renderDynamicTable = () => {
    if (!tableData || tableData.length === 0) {
      if (isLoading) {
        return (
          <div className="loading-table">
            <div className="loading-spinner"></div>
            <p>Searching data...</p>
          </div>
        );
      }
      
      if (query.trim().length >= 2) {
        return (
          <div className="no-results">
            <DatabaseIcon />
            <p>No results found for "{query}"</p>
            <span>Try different keywords</span>
          </div>
        );
      }
      
      return (
        <div className="welcome-state">
          <DatabaseIcon />
          <h3>Start typing to search</h3>
          <p>Search customers, products, sales, tasks, users, stock, shifts, or attendance</p>
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);
    
    return (
      <div className="dynamic-table-container">
        <div className="table-header">
          <div className="table-title">
            <TableIcon />
            <span>{tableName.toUpperCase()} - {recordCount} records</span>
          </div>
          {entities.length > 0 && (
            <div className="applied-filters">
              {entities.filter(e => e.isFilter).map((filter, index) => (
                <span 
                  key={index} 
                  className="filter-badge"
                  style={{ backgroundColor: getEntityColor(filter.type) }}
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
            <h1>Intelligent Data Search</h1>
            <p>Real-time search with entity recognition</p>
          </div>
        </div>
      </div>

      {/* DEBUG PANEL FOR ENTITIES */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#000',
        color: '#00ff00',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: '400px',
        border: '2px solid #00ff00'
      }}>
        <div><strong>🔍 ENTITY DEBUG PANEL</strong></div>
        <div>Query: "{query}"</div>
        <div>Query Length: {query.length}</div>
        <div>Entities Found: {entities.length}</div>
        <div style={{ background: entities.length > 0 ? '#004400' : '#440000', padding: '5px', margin: '5px 0' }}>
          STATUS: {entities.length > 0 ? '✅ ENTITIES DETECTED' : '❌ NO ENTITIES'}
        </div>
        {entities.map((entity, i) => (
          <div key={i} style={{ marginTop: '5px', padding: '3px', background: '#333' }}>
            <div>Entity {i + 1}: "{entity.text}" (Type: {entity.type})</div>
            <div>Position: {entity.startIndex}-{entity.endIndex}</div>
            <div>Color: {entity.color}</div>
          </div>
        ))}
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
              placeholder="Type to search: my tasks pending, products wireless mouse, ahmed sales..."
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
            
            {/* Entity overlays */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '42px', // After the search icon
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
                    backgroundColor: `${entity.color}40`,
                    borderColor: entity.color,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderRadius: '4px',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: 'help',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={entity.hoverText || `${entity.type}: ${entity.text}`}
                  onMouseEnter={(e) => handleEntityHover(entity, e)}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={(e) => handleEntityClick(entity, e)}
                >
                  <span style={{
                    fontSize: '10px',
                    color: entity.color,
                    fontWeight: 'bold',
                    textShadow: '0 0 2px white'
                  }}>
                    {entity.type.substring(0, 1).toUpperCase()}
                  </span>
                  {entity.suggestions && entity.suggestions.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      right: '2px',
                      top: '-2px',
                      fontSize: '8px',
                      color: entity.color,
                      fontWeight: 'bold'
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
              <span className="preview-label">Query:</span>
              <div className="highlighted-query">
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

      {/* Entity Tooltip */}
      {hoveredEntity && (
        <div 
          className="entity-tooltip"
          style={{
            position: 'fixed',
            left: Math.max(10, Math.min(tooltipPosition.x - 140, window.innerWidth - 290)),
            top: Math.max(10, tooltipPosition.y - 80),
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '280px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: `2px solid ${hoveredEntity.color}`
          }}
        >
          <div style={{
            color: hoveredEntity.color,
            fontWeight: 'bold',
            marginBottom: '4px'
          }}>
            {hoveredEntity.type.replace('_', ' ').toUpperCase()}
            {hoveredEntity.confidence && (
              <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                {Math.round(hoveredEntity.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="tooltip-content">
            {hoveredEntity.hoverText || hoveredEntity.actualValue || hoveredEntity.value || hoveredEntity.text}
          </div>
          {hoveredEntity.table && (
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              <TableIcon /> Table: {hoveredEntity.table}
            </div>
          )}
          {hoveredEntity.suggestions && hoveredEntity.suggestions.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
              Click for {hoveredEntity.suggestions.length} suggestions
            </div>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && showSuggestions.suggestions && showSuggestions.suggestions.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            left: suggestionPosition.x,
            top: suggestionPosition.y + 20,
            zIndex: 10001,
            background: 'white',
            border: `2px solid ${showSuggestions.color}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '250px',
            maxWidth: '400px'
          }}
        >
          <div style={{
            padding: '12px',
            borderBottom: `1px solid ${showSuggestions.color}`,
            color: showSuggestions.color,
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            Multiple matches for "{showSuggestions.text}"
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {showSuggestions.suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionSelect(suggestion, showSuggestions)}
                style={{ 
                  padding: '10px 12px',
                  borderLeft: `3px solid ${showSuggestions.color}`,
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: index < showSuggestions.suggestions!.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {suggestion}
              </div>
            ))}
          </div>
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setShowSuggestions(null)}
              style={{
                background: 'transparent',
                border: `1px solid ${showSuggestions.color}`,
                color: showSuggestions.color,
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
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
