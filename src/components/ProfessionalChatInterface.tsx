import React, { useState, useEffect, useCallback } from 'react';
import './ProfessionalChatInterface.css';

// Professional Icons
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12l10-10 10 10-10 10-10-10z"/>
    <path d="M12 2v20"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
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
  suggestions?: string[]; // Array of alternative suggestions for ambiguous matches
}

interface QueryResult {
  response: string;
  responseEntities: EntityMatch[];
  data: any[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'system';
  content: string;
  entities?: EntityMatch[];
  tableData?: any[];
  timestamp: Date;
}

export const ProfessionalChatInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<EntityMatch | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState<EntityMatch | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [currentEntities, setCurrentEntities] = useState<EntityMatch[]>([]);
  const [apiTestResult, setApiTestResult] = useState<string>('Not tested');
  const [apiTestStatus, setApiTestStatus] = useState<'success' | 'error' | 'testing' | 'idle'>('idle');
  const debugMode = true; // Debug mode to see entities

  // API Connection Test Function
  const testApiConnection = async () => {
    setApiTestStatus('testing');
    setApiTestResult('Testing connection...');
    
    try {
      console.log('🧪 Testing API connection to http://localhost:3001/api/chat/extract');
      
      // Test 1: Health check
      const healthResponse = await fetch('http://localhost:3001/health');
      console.log('🏥 Health check status:', healthResponse.status);
      
      // Test 2: Extract endpoint
      const extractResponse = await fetch('http://localhost:3001/api/chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'laptop test' })
      });
      
      console.log('🧪 Extract API status:', extractResponse.status);
      
      if (!extractResponse.ok) {
        throw new Error(`HTTP ${extractResponse.status}: ${extractResponse.statusText}`);
      }
      
      const result = await extractResponse.json();
      console.log('🧪 Extract API result:', result);
      
      if (result.entities && result.entities.length > 0) {
        setApiTestStatus('success');
        setApiTestResult(`✅ SUCCESS: Found ${result.entities.length} entities. API routes working correctly!`);
        setCurrentEntities(result.entities); // Set the entities to test display
      } else {
        setApiTestStatus('error');
        setApiTestResult('⚠️ API works but no entities found');
      }
      
    } catch (error) {
      console.error('❌ API test failed:', error);
      setApiTestStatus('error');
      setApiTestResult(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'system',
      content: 'Welcome! I\'m your intelligent data assistant. Ask me about customers, products, sales, tasks, users, stock, shifts, or attendance.',
      timestamp: new Date()
    }]);
  }, []);

  // Get entity color based on type
  const getEntityColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'entity': '#10B981',        // Green for table entities
      'info': '#8B5CF6',          // Purple for customer info
      'temporal': '#7C3AED',      // Deep purple for temporal references
      'pronoun': '#DC2626',       // Red for pronouns (me, my, I)
      'user_filter': '#DC2626',   // Red for user filters
      'product_filter': '#059669', // Green for product filters
      'status_filter': '#EA580C', // Orange for status filters
      'location_filter': '#0891B2', // Cyan for location filters
      'numeric_filter': '#7C3AED', // Purple for numeric values
      'field_filter': '#6366F1'   // Indigo for field names
    };
    return colors[type] || '#6B7280';
  };

  // Extract entities from input text in real-time
  const extractEntitiesFromInput = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 2) {
      setCurrentEntities([]);
      return;
    }

    try {
      console.log('🔍 Frontend: Extracting entities for:', text);
      const response = await fetch('http://localhost:3001/api/chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Frontend: Raw API response:', result);
      console.log('✅ Frontend: Received entities:', result.entities);
      console.log('🎯 Frontend: Setting currentEntities to:', result.entities?.length || 0, 'entities');
      
      // Additional debugging for each entity
      if (result.entities && result.entities.length > 0) {
        result.entities.forEach((entity: EntityMatch, index: number) => {
          console.log(`🎯 Entity ${index + 1}:`, {
            text: entity.text,
            type: entity.type,
            startIndex: entity.startIndex,
            endIndex: entity.endIndex,
            color: entity.color,
            value: entity.value
          });
        });
      }
      
      setCurrentEntities(result.entities || []);
    } catch (error) {
      console.error('❌ Frontend: Error extracting entities:', error);
      setCurrentEntities([]);
    }
  }, []);

  // Debounced entity extraction
  useEffect(() => {
    console.log('🔄 Frontend: useEffect triggered for query:', query, 'Length:', query.length);
    const timeoutId = setTimeout(() => {
      console.log('⏰ Frontend: Debounce timeout triggered, calling extractEntitiesFromInput');
      extractEntitiesFromInput(query);
    }, 300); // 300ms debounce

    return () => {
      console.log('🧹 Frontend: Cleaning up timeout');
      clearTimeout(timeoutId);
    };
  }, [query, extractEntitiesFromInput]);

  // Process query and get results
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          userName: 'Ahmed Hassan'
        })
      });

      const result: QueryResult = await response.json();

      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: result.response,
        entities: result.responseEntities,
        tableData: result.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(query);
  };

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
    
    // Auto-submit the new query
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }, 100);
  };

  // Render highlighted text with entities
  const renderHighlightedText = (text: string, entities: EntityMatch[]) => {
    if (!entities || entities.length === 0) return text;

    let result = [];
    let lastIndex = 0;

    entities
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach((entity, index) => {
        // Add text before entity
        if (lastIndex < entity.startIndex) {
          result.push(text.slice(lastIndex, entity.startIndex));
        }

        // Add highlighted entity
        result.push(
          <span
            key={index}
            className={`entity-highlight ${entity.suggestions && entity.suggestions.length > 0 ? 'clickable-entity' : ''}`}
            style={{
              backgroundColor: `${getEntityColor(entity.type)}20`,
              color: getEntityColor(entity.type),
              borderColor: getEntityColor(entity.type),
              cursor: entity.suggestions && entity.suggestions.length > 0 ? 'pointer' : 'default'
            }}
            onMouseEnter={(e) => handleEntityHover(entity, e)}
            onMouseLeave={() => setHoveredEntity(null)}
            onClick={(e) => handleEntityClick(entity, e)}
            title={entity.suggestions && entity.suggestions.length > 0 ? 'Click to see suggestions' : entity.hoverText}
          >
            {entity.text}
            {entity.suggestions && entity.suggestions.length > 0 && (
              <span className="suggestion-indicator" style={{ marginLeft: '2px', fontSize: '10px' }}>▼</span>
            )}
          </span>
        );

        lastIndex = entity.endIndex;
      });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  // Render data table
  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="data-table-container">
        <div className="table-header">
          <DatabaseIcon />
          <span>Query Results ({data.length} records)</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column}>{column.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, index) => (
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
          {data.length > 10 && (
            <div className="table-footer">
              Showing 10 of {data.length} records
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="professional-chat-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-icon">
            <DatabaseIcon />
          </div>
          <div className="header-text">
            <h1>Intelligent Data Assistant</h1>
            <p>Ask questions about your business data</p>
          </div>
        </div>
      </div>

      {/* API CONNECTION TEST PANEL - PROMINENT DISPLAY */}
      <div style={{
        background: apiTestStatus === 'success' ? '#10B981' : 
                   apiTestStatus === 'error' ? '#EF4444' : 
                   apiTestStatus === 'testing' ? '#F59E0B' : '#6B7280',
        color: 'white',
        padding: '1rem',
        margin: '1rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        <button
          onClick={testApiConnection}
          disabled={apiTestStatus === 'testing'}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid white',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: apiTestStatus === 'testing' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {apiTestStatus === 'testing' ? '🔄 Testing...' : '🧪 Test API Routes'}
        </button>
        <div style={{ flex: 1 }}>
          {apiTestResult}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Backend: {apiTestStatus === 'success' ? '✅ Connected' : 
                   apiTestStatus === 'error' ? '❌ Failed' : 
                   apiTestStatus === 'testing' ? '🔄 Testing' : '⚪ Unknown'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">
                {message.type === 'user' ? (
                  message.content
                ) : (
                  renderHighlightedText(message.content, message.entities || [])
                )}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.tableData && renderDataTable(message.tableData)}
          </div>
        ))}
        
        {isLoading && (
          <div className="message system">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        {/* MASSIVE DEBUG PANEL */}
        {debugMode && (
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
            <div>Entities Found: {currentEntities.length}</div>
            <div style={{ background: currentEntities.length > 0 ? '#004400' : '#440000', padding: '5px', margin: '5px 0' }}>
              STATUS: {currentEntities.length > 0 ? '✅ ENTITIES DETECTED' : '❌ NO ENTITIES'}
            </div>
            {currentEntities.map((entity, i) => (
              <div key={i} style={{ marginTop: '5px', padding: '3px', background: '#333' }}>
                <div>Entity {i + 1}: "{entity.text}" (Type: {entity.type})</div>
                <div>Position: {entity.startIndex}-{entity.endIndex}</div>
                <div>Color: {entity.color}</div>
                <div>Suggestions: {entity.suggestions?.length || 0}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="input-container">
          <SearchIcon />
          
          {/* Debug Panel */}
          {debugMode && (
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50px',
              background: '#1e40af',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              Entities: {currentEntities.length} | Query: "{query}" | Status: {query.length < 2 ? 'Too short' : 'Active'}
            </div>
          )}
          
          <div className="enhanced-input-wrapper" style={{
            border: currentEntities.length > 0 ? '3px solid #10B981' : '2px solid #e5e7eb',
            backgroundColor: currentEntities.length > 0 ? '#f0fdf4' : 'white'
          }}>
            {/* Actual input field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about customers, products, sales, tasks..."
              className="chat-input enhanced-input"
              disabled={isLoading}
            />
            {/* Entity overlay for interactions */}
            <div className="entity-overlay">
              {(() => {
                console.log('🎨 Frontend: Rendering entity overlay. Entities:', currentEntities.length);
                if (currentEntities.length > 0) {
                  console.log('🎨 Frontend: Rendering entities overlay:', currentEntities);
                  console.log('🎨 Frontend: Query length:', query.length);
                  currentEntities.forEach((entity, i) => {
                    console.log(`🎨 Entity ${i + 1} rendering:`, {
                      text: entity.text,
                      left: `${(entity.startIndex / Math.max(query.length, 1)) * 100}%`,
                      width: `${((entity.endIndex - entity.startIndex) / Math.max(query.length, 1)) * 100}%`,
                      color: entity.color
                    });
                  });
                }
                return null;
              })()}
              {currentEntities.map((entity, index) => (
                <span
                  key={index}
                  className={`entity-overlay-item ${entity.suggestions && entity.suggestions.length > 0 ? 'clickable-entity' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${(entity.startIndex / Math.max(query.length, 1)) * 100}%`,
                    width: `${((entity.endIndex - entity.startIndex) / Math.max(query.length, 1)) * 100}%`,
                    backgroundColor: `${entity.color}80`, // Semi-transparent but more visible
                    borderColor: entity.color,
                    borderWidth: '3px', // Thicker border
                    borderStyle: 'solid',
                    borderRadius: '3px',
                    height: '100%',
                    cursor: entity.suggestions && entity.suggestions.length > 0 ? 'pointer' : 'help',
                    zIndex: 20,
                    pointerEvents: 'auto',
                    display: 'block',
                    minHeight: '30px', // Minimum height to ensure visibility
                    minWidth: '20px'   // Minimum width to ensure visibility
                  }}
                  onMouseEnter={(e) => {
                    console.log('🔥 HOVER ENTER:', entity.text, entity.hoverText);
                    handleEntityHover(entity, e);
                  }}
                  onMouseLeave={() => {
                    console.log('🔥 HOVER LEAVE');
                    setHoveredEntity(null);
                  }}
                  onClick={(e) => {
                    console.log('🔥 CLICK:', entity.text, entity.suggestions?.length || 0);
                    handleEntityClick(entity, e);
                  }}
                  title={entity.hoverText || `${entity.type}: ${entity.text}`}
                >
                  {entity.suggestions && entity.suggestions.length > 0 && (
                    <span 
                      className="suggestion-indicator" 
                      style={{
                        position: 'absolute',
                        right: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '10px',
                        color: entity.color,
                        fontWeight: 'bold',
                        pointerEvents: 'none'
                      }}
                    >
                      ▼
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          
          {/* API Test Button */}
          <button 
            type="button"
            onClick={testApiConnection}
            disabled={apiTestStatus === 'testing'}
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: apiTestStatus === 'success' ? '#10B981' : 
                         apiTestStatus === 'error' ? '#EF4444' : '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: apiTestStatus === 'testing' ? 'not-allowed' : 'pointer',
              zIndex: 10
            }}
          >
            {apiTestStatus === 'testing' ? '🔄' : '🧪'} API
          </button>
          
          <button 
            type="submit" 
            className="send-button"
            disabled={isLoading || !query.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </form>

      {/* Entity Tooltip */}
      {hoveredEntity && (
        <div 
          className="entity-tooltip"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 140, window.innerWidth - 290)),
            top: Math.max(10, tooltipPosition.y - 80),
            zIndex: 10000
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-type" style={{ color: getEntityColor(hoveredEntity.type) }}>
              {hoveredEntity.type.replace('_', ' ').toUpperCase()}
            </span>
            {hoveredEntity.confidence && (
              <span className="tooltip-confidence">
                {Math.round(hoveredEntity.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="tooltip-content">
            {hoveredEntity.hoverText || hoveredEntity.actualValue || hoveredEntity.value || hoveredEntity.text}
          </div>
          {hoveredEntity.table && (
            <div className="tooltip-table">
              <TableIcon />
              Table: {hoveredEntity.table}
            </div>
          )}
          {hoveredEntity.suggestions && hoveredEntity.suggestions.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
              Click for {hoveredEntity.suggestions.length} suggestions
            </div>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && showSuggestions.suggestions && showSuggestions.suggestions.length > 0 && (
        <div 
          className="suggestions-dropdown"
          style={{
            left: suggestionPosition.x,
            top: suggestionPosition.y + 20
          }}
        >
          <div className="suggestions-header">
            <span style={{ color: getEntityColor(showSuggestions.type) }}>
              Multiple matches for "{showSuggestions.text}"
            </span>
          </div>
          <div className="suggestions-list">
            {showSuggestions.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionSelect(suggestion, showSuggestions)}
                style={{ 
                  borderLeft: `3px solid ${getEntityColor(showSuggestions.type)}`,
                  cursor: 'pointer'
                }}
              >
                <span className="suggestion-text">{suggestion}</span>
              </div>
            ))}
          </div>
          <div className="suggestions-footer">
            <button 
              className="close-suggestions"
              onClick={() => setShowSuggestions(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside handler for suggestions */}
      {showSuggestions && (
        <div 
          className="suggestions-overlay"
          onClick={() => setShowSuggestions(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalChatInterface;
