import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import './RealTimeEntityInterface.css';

// SVG Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
  </svg>
);

interface EntityMatch {
  text: string;
  type: 'entity' | 'info' | 'temporal' | 'pronoun';
  table?: string;
  actualValue?: string;
  color: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
}

interface TableData {
  tableName: string;
  data: any[];
  totalCount: number;
}

interface RealTimeEntityInterfaceProps {
  user?: { id: string; name: string; email: string } | null;
}

export const RealTimeEntityInterface: React.FC<RealTimeEntityInterfaceProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<EntityMatch[]>([]);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<EntityMatch | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Debounced entity extraction and data fetching
  const debouncedProcess = useCallback(
    debounce(async (text: string) => {
      if (!text.trim() || text.length < 2) {
        setEntities([]);
        setTableData(null);
        return;
      }

      setIsLoading(true);
      
      try {
        // Step 1: Extract entities
        const entitiesResponse = await fetch('http://localhost:3001/api/chat/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            userId: user?.id,
            userName: user?.name
          })
        });

        const entitiesData = await entitiesResponse.json();
        const extractedEntities = entitiesData.entities || [];
        setEntities(extractedEntities);

        // Step 2: If entities found, get data
        if (extractedEntities.length > 0) {
          const queryResponse = await fetch('http://localhost:3001/api/chat/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              entities: extractedEntities,
              userId: user?.id,
              userName: user?.name
            })
          });

          const queryData = await queryResponse.json();
          
          if (queryData.data && queryData.data.length > 0) {
            // Determine primary table from entities
            const primaryTable = determinePrimaryTable(extractedEntities, text);
            
            setTableData({
              tableName: primaryTable,
              data: queryData.data,
              totalCount: queryData.data.length
            });
          } else {
            setTableData(null);
          }
        } else {
          setTableData(null);
        }
      } catch (error) {
        console.error('Processing error:', error);
        setEntities([]);
        setTableData(null);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [user?.id, user?.name]
  );

  // Process query when it changes
  useEffect(() => {
    debouncedProcess(query);
    return () => {
      debouncedProcess.cancel();
    };
  }, [query, debouncedProcess]);

  // Determine primary table from entities and context
  const determinePrimaryTable = (entities: EntityMatch[], text: string): string => {
    const textLower = text.toLowerCase();
    
    // Priority based on keywords and entities
    if (textLower.includes('sales') || textLower.includes('sold') || textLower.includes('purchase')) return 'sales';
    if (textLower.includes('stock') || textLower.includes('inventory')) return 'stock';
    if (textLower.includes('task') || textLower.includes('assignment')) return 'tasks';
    if (textLower.includes('attendance') || textLower.includes('present')) return 'attendance';
    if (textLower.includes('shift') || textLower.includes('schedule')) return 'shifts';
    
    // Based on entity tables
    const entityTables = entities.filter(e => e.table).map(e => e.table!);
    if (entityTables.includes('products')) return 'products';
    if (entityTables.includes('customers')) return 'customers';
    if (entityTables.includes('users')) return 'users';
    
    // Default
    return entityTables[0] || 'customers';
  };

  // Render query with entity highlighting
  const renderQueryWithEntities = () => {
    if (!entities.length || !query) return query;

    const sortedEntities = [...entities].sort((a, b) => a.startIndex - b.startIndex);
    let result = [];
    let lastIndex = 0;

    sortedEntities.forEach((entity, i) => {
      // Text before entity
      if (entity.startIndex > lastIndex) {
        result.push(
          <span key={`text-${i}`}>
            {query.slice(lastIndex, entity.startIndex)}
          </span>
        );
      }

      // Highlighted entity
      result.push(
        <span
          key={`entity-${i}`}
          className="entity-highlight"
          style={{
            backgroundColor: `${entity.color}20`,
            color: entity.color,
            borderColor: entity.color
          }}
          onMouseEnter={(e) => handleEntityHover(e, entity)}
          onMouseLeave={() => setHoveredEntity(null)}
        >
          {entity.text}
        </span>
      );

      lastIndex = entity.endIndex;
    });

    // Remaining text
    if (lastIndex < query.length) {
      result.push(
        <span key="text-end">
          {query.slice(lastIndex)}
        </span>
      );
    }

    return result;
  };

  // Handle entity hover
  const handleEntityHover = (e: React.MouseEvent, entity: EntityMatch) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredEntity(entity);
  };

  // Render data table
  const renderDataTable = () => {
    if (!tableData || !tableData.data.length) return null;

    const columns = getTableColumns(tableData.data[0]);
    
    return (
      <div className="data-table-container">
        <div className="table-header">
          <div className="table-title">
            <TableIcon />
            <span>{formatTableName(tableData.tableName)}</span>
            <span className="table-count">{tableData.totalCount} results</span>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.data.map((row, index) => (
                <tr key={index} className="table-row">
                  {columns.map(col => (
                    <td key={col.key} className="table-cell">
                      {formatCellValue(row[col.key], col.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Get appropriate columns for each table
  const getTableColumns = (sampleRow: any) => {
    const baseColumns = Object.keys(sampleRow)
      .filter(key => !key.includes('id') && !key.includes('created_at') && !key.includes('updated_at'))
      .slice(0, 6);

    return baseColumns.map(key => ({
      key,
      label: formatColumnName(key),
      type: getColumnType(key, sampleRow[key])
    }));
  };

  const formatColumnName = (key: string) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getColumnType = (key: string, value: any) => {
    if (key.includes('date') || key.includes('time')) return 'date';
    if (key.includes('price') || key.includes('amount') || key.includes('cost')) return 'currency';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  const formatCellValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.charAt(0).toUpperCase() + tableName.slice(1);
  };

  return (
    <div className="realtime-entity-interface">
      {/* Header */}
      <div className="interface-header">
        <h1>Data Intelligence Search</h1>
        <p>Start typing to see live entity detection and data results</p>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <SearchIcon />
          <div className="search-input-display">
            {renderQueryWithEntities()}
            {!query && <span className="placeholder">Type your query... (e.g., "Ahmed sales", "headphones stock", "customers from Dubai")</span>}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input-hidden"
            placeholder=""
            autoFocus
          />
          {isLoading && <div className="loading-spinner" />}
        </div>
        
        {/* Entity Legend */}
        {entities.length > 0 && (
          <div className="entity-legend">
            <span>Detected entities:</span>
            {entities.map((entity, i) => (
              <span
                key={i}
                className="legend-entity"
                style={{ color: entity.color }}
              >
                {entity.type} ({entity.table || 'info'})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Entity Tooltip */}
      {hoveredEntity && (
        <div
          className="entity-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-type" style={{ color: hoveredEntity.color }}>
              {hoveredEntity.type.toUpperCase()}
            </span>
            {hoveredEntity.confidence && (
              <span className="tooltip-confidence">
                {Math.round(hoveredEntity.confidence)}%
              </span>
            )}
          </div>
          <div className="tooltip-content">
            <div><strong>Text:</strong> "{hoveredEntity.text}"</div>
            {hoveredEntity.actualValue && (
              <div><strong>Matched:</strong> "{hoveredEntity.actualValue}"</div>
            )}
            {hoveredEntity.table && (
              <div><strong>Table:</strong> {hoveredEntity.table}</div>
            )}
          </div>
        </div>
      )}

      {/* Results Table */}
      {renderDataTable()}

      {/* No Results */}
      {query && !isLoading && !tableData && entities.length === 0 && (
        <div className="no-results">
          <p>No entities detected. Try searching for:</p>
          <ul>
            <li>Customer names (e.g., "Acme Corporation", "Ahmed Trading")</li>
            <li>Product names (e.g., "headphones", "laptop", "Ahmed Special Coffee")</li>
            <li>User names (e.g., "Ahmed Ali", "Sarah Johnson")</li>
            <li>Business terms (e.g., "sales", "inventory", "tasks")</li>
          </ul>
        </div>
      )}
    </div>
  );
};
