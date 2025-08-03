import React, { useState, useRef } from 'react';
import { useSuggestions } from '../hooks/useSuggestions';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { ResultTable } from './ResultTable';
import type { Suggestion, EntityMetadata, User } from '../types';

// Import CSS
import './UnifiedIntelligentEditor.css';

interface UnifiedIntelligentEditorProps {
  userId?: string;
  documentId?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onMetadataChange?: (metadata: EntityMetadata[]) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  entityTypes?: string[];
  onSave?: (content: string, metadata: EntityMetadata[]) => void;
  className?: string;
  user?: User;
  placeholder?: string;
}

const UnifiedIntelligentEditor: React.FC<UnifiedIntelligentEditorProps> = ({
  userId,
  documentId = 'unified-document',
  initialContent = '',
  onContentChange,
  className = '',
  placeholder = "Start typing or use advanced search to find and insert data..."
}) => {
  // Editor state
  const [content, setContent] = useState(initialContent);
  const [searchMode, setSearchMode] = useState<'writing' | 'searching'>('writing');
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [selectedSuggestionData, setSelectedSuggestionData] = useState<Suggestion[]>([]);
  const [showSuggestionTable, setShowSuggestionTable] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hooks for suggestions (writing mode)
  const {
    suggestions,
    loading: suggestionsLoading,
    mode: suggestionsMode,
    responseTime,
    getSuggestions
  } = useSuggestions({
    userId,
    documentId
  });

  // Hooks for advanced search (searching mode)
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search: performSearch,
    reset: clearResults
  } = useAdvancedSearch();

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const position = e.target.selectionStart;
    
    setContent(newContent);
    setCursorPosition(position);
    onContentChange?.(newContent);
    
    // Get suggestions in writing mode with debouncing
    if (searchMode === 'writing' && getSuggestions && newContent.trim().length > 2) {
      // Debounce suggestions to avoid too many API calls
      setTimeout(() => {
        getSuggestions(newContent, position);
      }, 300);
    }
  };

  // Handle mode switching
  const switchToWritingMode = () => {
    setSearchMode('writing');
    setSearchQuery('');
    if (clearResults) clearResults();
    textareaRef.current?.focus();
  };

  const switchToSearchingMode = () => {
    setSearchMode('searching');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // Handle search in search mode
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2 && performSearch) {
      try {
        await performSearch(query, {
          fuzzyThreshold: 0.7,
          limit: 20
        });
      } catch (error) {
        console.error('Search error:', error);
      }
    } else if (clearResults) {
      clearResults();
    }
  };

  // Handle suggestion selection in writing mode
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (!textareaRef.current) return;
    
    // Show the selected suggestion in table format at the top
    setSelectedSuggestionData([suggestion]);
    setShowSuggestionTable(true);
    
    // Create detailed insert text with entity information
    const entityData = suggestion.entity_data;
    let insertText = suggestion.display_label;
    
    // Add more context based on entity type
    if (entityData && typeof entityData === 'object') {
      switch (suggestion.entity_type) {
        case 'customers':
        case 'customer':
          insertText = `${suggestion.display_label} (${entityData.email || 'No email'})`;
          break;
        case 'users':
        case 'user':
          insertText = `${suggestion.display_label} (${entityData.role || 'No role'})`;
          break;
        case 'products':
        case 'product':
          insertText = `${suggestion.display_label} (${entityData.category || 'No category'})`;
          break;
        case 'tasks':
        case 'task':
          insertText = `${suggestion.display_label} (${entityData.status || 'No status'})`;
          break;
        default:
          insertText = suggestion.display_label;
      }
    }
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert the suggestion at cursor position
    const newContent = content.slice(0, start) + insertText + content.slice(end);
    
    setContent(newContent);
    onContentChange?.(newContent);
    
    // Focus back on textarea and position cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition(newCursorPos);
    }, 10);
  };

  return (
    <div className={`unified-intelligent-editor ${className}`}>
      {/* Header with mode controls */}
      <div className="editor-header">
        <div className="mode-controls">
          <button
            className={`mode-button ${searchMode === 'writing' ? 'active' : ''}`}
            onClick={switchToWritingMode}
          >
            <span className="mode-icon">✍️</span>
            Writing Mode
          </button>
          <button
            className={`mode-button ${searchMode === 'searching' ? 'active' : ''}`}
            onClick={switchToSearchingMode}
          >
            <span className="mode-icon">🔍</span>
            Search Mode
          </button>
          <button
            className={`mode-button examples-button ${showExamples ? 'active' : ''}`}
            onClick={() => setShowExamples(!showExamples)}
          >
            <span className="mode-icon">💡</span>
            Examples
          </button>
        </div>

        {/* Active suggestion mode indicator */}
        {searchMode === 'writing' && suggestionsMode && (
          <div className="suggestion-mode-indicator">
            <span className="mode-label">
              {suggestionsMode === 'intelligent_sql' && (
                <>
                  <span className="mode-icon">🧠</span>
                  Intelligent SQL Active
                </>
              )}
              {suggestionsMode === 'advanced_search' && (
                <>
                  <span className="mode-icon">🔍</span>
                  Advanced Search Active
                </>
              )}
              {suggestionsMode === 'basic_suggestions' && (
                <>
                  <span className="mode-icon">💡</span>
                  Basic Suggestions
                </>
              )}
            </span>
          </div>
        )}

        {searchMode === 'searching' && (
          <div className="search-controls">
            <div className="search-input-container">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search database with natural language..."
                className="search-input"
              />
              {searchLoading && <div className="search-spinner" />}
            </div>
          </div>
        )}

        {/* Examples Panel */}
        {showExamples && (
          <div className="examples-panel">
            <div className="examples-section">
              <h4>🧠 Intelligent SQL Mode (2 words)</h4>
              <div className="example-chips">
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('show products') : setSearchQuery('show products')}>show products</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('list users') : setSearchQuery('list users')}>list users</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('get customers') : setSearchQuery('get customers')}>get customers</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('find tasks') : setSearchQuery('find tasks')}>find tasks</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('show sales') : setSearchQuery('show sales')}>show sales</button>
              </div>
            </div>
            
            <div className="examples-section">
              <h4>🔍 Enhanced Multi-Field Search (Complex Queries)</h4>
              <div className="example-chips">
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('john.doe@example.com') : setSearchQuery('john.doe@example.com')}>john.doe@example.com</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('555-0123') : setSearchQuery('555-0123')}>555-0123</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('warehouse') : setSearchQuery('warehouse')}>warehouse</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('acme corporation') : setSearchQuery('acme corporation')}>acme corporation</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('business avenue') : setSearchQuery('business avenue')}>business avenue</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('manager role') : setSearchQuery('manager role')}>manager role</button>
              </div>
            </div>

            <div className="examples-section">
              <h4>🎯 Advanced Search Mode (3+ words)</h4>
              <div className="example-chips">
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('find customer john doe') : setSearchQuery('find customer john doe')}>find customer john doe</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('show all active users') : setSearchQuery('show all active users')}>show all active users</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('get high priority tasks') : setSearchQuery('get high priority tasks')}>get high priority tasks</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('find products under electronics') : setSearchQuery('find products under electronics')}>find products under electronics</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('customers with email addresses') : setSearchQuery('customers with email addresses')}>customers with email addresses</button>
              </div>
            </div>

            <div className="examples-section">
              <h4>💡 Basic Suggestions (Single Terms)</h4>
              <div className="example-chips">
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('john') : setSearchQuery('john')}>john</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('alice') : setSearchQuery('alice')}>alice</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('laptop') : setSearchQuery('laptop')}>laptop</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('pending') : setSearchQuery('pending')}>pending</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('techcorp') : setSearchQuery('techcorp')}>techcorp</button>
              </div>
            </div>

            <div className="examples-section">
              <h4>🚀 Test Our Enhanced Search</h4>
              <div className="example-chips">
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('jane.smith@techcorp.com') : setSearchQuery('jane.smith@techcorp.com')}>jane.smith@techcorp.com</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('+1-555-0456') : setSearchQuery('+1-555-0456')}>+1-555-0456</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('innovation street') : setSearchQuery('innovation street')}>innovation street</button>
                <button className="example-chip" onClick={() => searchMode === 'writing' ? setContent('inventory audit') : setSearchQuery('inventory audit')}>inventory audit</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="editor-content">
        {/* Results Table - Displayed at top when search results are available */}
        {searchMode === 'searching' && searchResults && searchResults.length > 0 && (
          <div className="top-results-section">
            {(() => {
              // Group results by table name for professional table display
              const groupedResults = searchResults.reduce((acc, result) => {
                const tableName = result.table_name;
                if (!acc[tableName]) {
                  acc[tableName] = [];
                }
                acc[tableName].push({
                  ...result.data,
                  _relevance_score: result.relevance_score,
                  _explanation: result.explanation
                });
                return acc;
              }, {} as Record<string, any[]>);

              return Object.entries(groupedResults).map(([tableName, data]) => (
                <ResultTable
                  key={tableName}
                  data={data}
                  entityType={tableName}
                  title={`${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Results (${data.length} found)`}
                  className="top-result-table"
                />
              ));
            })()}
          </div>
        )}

        {/* Suggestion Table - Displayed at top when suggestion is selected in writing mode */}
        {searchMode === 'writing' && showSuggestionTable && selectedSuggestionData.length > 0 && (
          <div className="top-results-section">
            <div className="suggestion-table-header">
              <h3>📋 Selected Entity Details</h3>
              <button 
                className="close-table-btn"
                onClick={() => setShowSuggestionTable(false)}
                aria-label="Close table"
              >
                ✕
              </button>
            </div>
            {(() => {
              const suggestion = selectedSuggestionData[0];
              const entityType = suggestion.entity_type === 'customer' ? 'customers' : 
                               suggestion.entity_type === 'user' ? 'users' :
                               suggestion.entity_type === 'product' ? 'products' :
                               suggestion.entity_type === 'task' ? 'tasks' :
                               suggestion.entity_type === 'sale' ? 'sales' :
                               suggestion.entity_type;

              return (
                <ResultTable
                  data={[suggestion.entity_data]}
                  entityType={entityType}
                  title={`${suggestion.entity_type.charAt(0).toUpperCase() + suggestion.entity_type.slice(1)} Information`}
                  className="top-result-table"
                />
              );
            })()}
          </div>
        )}

        {/* Text Editor */}
        <div className="editor-wrapper">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={searchMode === 'writing' ? placeholder : 'Click "Writing Mode" to start editing...'}
            className="editor-textarea"
            disabled={searchMode === 'searching'}
            rows={15}
          />
          
          {/* Processing indicator */}
          {suggestionsLoading && (
            <div className="processing-indicator">
              <div className="processing-spinner" />
              <span>Getting suggestions...</span>
            </div>
          )}
        </div>

        {/* Suggestions Panel (Writing Mode) */}
        {searchMode === 'writing' && suggestions && suggestions.length > 0 && (
          <div className={`suggestions-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
            <div className="suggestions-header">
              <h3>✨ Intelligent Suggestions</h3>
              <div className="panel-controls">
                <span className="suggestions-count">{suggestions.length} found</span>
                <button 
                  className="collapse-button"
                  onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {isPanelCollapsed ? '📈' : '📉'}
                </button>
              </div>
            </div>
            {!isPanelCollapsed && (
              <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.entity_type}-${suggestion.entity_id}-${index}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-header">
                    <span className="suggestion-type">{suggestion.entity_type}</span>
                    <span className="suggestion-confidence">{Math.round(suggestion.confidence * 100)}%</span>
                  </div>
                  <div className="suggestion-text">{suggestion.display_label}</div>
                  {suggestion.highlighted_text && (
                    <div className="suggestion-highlight">"{suggestion.highlighted_text}"</div>
                  )}
                  {suggestion.date_info && (
                    <div className="suggestion-metadata">
                      <span className="metadata-tag">
                        📅 {suggestion.date_info.absolute_date}
                      </span>
                    </div>
                  )}
                  {/* Show SQL metadata for intelligent SQL mode */}
                  {suggestionsMode === 'intelligent_sql' && suggestion.metadata?.sql_query && (
                    <div className="suggestion-metadata">
                      <span className="metadata-tag sql-tag">
                        🧠 SQL: {suggestion.metadata.interpretation}
                      </span>
                      <div className="sql-query-preview">
                        {suggestion.metadata.sql_query}
                      </div>
                    </div>
                  )}
                  {/* Show advanced search metadata */}
                  {suggestionsMode === 'advanced_search' && suggestion.metadata?.fuzzy_score && (
                    <div className="suggestion-metadata">
                      <span className="metadata-tag fuzzy-tag">
                        🔍 Fuzzy Score: {Math.round(suggestion.metadata.fuzzy_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* Search Results Summary Panel (Search Mode) */}
        {searchMode === 'searching' && searchResults && searchResults.length > 0 && (
          <div className="search-results-summary">
            <div className="summary-header">
              <h3>� Search Summary</h3>
              <span className="results-count">{searchResults.length} results found</span>
            </div>
            <div className="summary-stats">
              {(() => {
                const tableStats = searchResults.reduce((acc, result) => {
                  const tableName = result.table_name;
                  acc[tableName] = (acc[tableName] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                return Object.entries(tableStats).map(([tableName, count]) => (
                  <div key={tableName} className="table-stat">
                    <span className="table-name">{tableName}</span>
                    <span className="table-count">{count}</span>
                  </div>
                ));
              })()}
            </div>
            <div className="summary-note">
              📋 Detailed results are displayed in the table above
            </div>
          </div>
        )}

        {/* Empty states */}
        {searchMode === 'searching' && searchQuery.length >= 2 && searchResults && searchResults.length === 0 && !searchLoading && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try different keywords or check your spelling</p>
          </div>
        )}

        {searchError && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Search Error</h3>
            <p>{searchError}</p>
          </div>
        )}
        
        {/* Show initial help when nothing is typed */}
        {searchMode === 'writing' && content.length === 0 && (!suggestions || suggestions.length === 0) && !suggestionsLoading && (
          <div className="help-state">
            <div className="help-icon">✍️</div>
            <h3>Start Typing for AI Suggestions</h3>
            <p>Our intelligent system will suggest entities, dates, and relevant data as you write. Try typing "customer", "product", or any business term.</p>
          </div>
        )}
        
        {searchMode === 'searching' && searchQuery.length === 0 && (
          <div className="help-state">
            <div className="help-icon">🔍</div>
            <h3>Smart Database Search</h3>
            <p>Search with natural language! Try: "customers from Paris", "products with low stock", "sales this month", or "recent tasks".</p>
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="editor-footer">
        <div className="footer-left">
          <span className="mode-indicator">
            {searchMode === 'writing' ? '✍️ Writing Mode' : '🔍 Search Mode'}
          </span>
          {suggestionsMode && (
            <span className="suggestion-mode-badge">
              {suggestionsMode === 'intelligent_sql' && '🧠 SQL'}
              {suggestionsMode === 'advanced_search' && '🔍 Advanced'}
              {suggestionsMode === 'basic_suggestions' && '💡 Basic'}
            </span>
          )}
          <span className="char-count">{content.length} chars</span>
        </div>
        <div className="footer-center">
          <span className="status-message">
            {suggestionsLoading ? 'Getting suggestions...' : 
             suggestions && suggestions.length > 0 ? `${suggestions.length} suggestions ready` :
             searchLoading ? 'Searching database...' :
             searchResults && searchResults.length > 0 ? `${searchResults.length} results found` :
             'Ready for input'}
          </span>
        </div>
        <div className="footer-right">
          <span className="cursor-position">Pos: {cursorPosition}</span>
          <span className="response-time">
            {responseTime > 0 && `⚡ ${responseTime}ms`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnifiedIntelligentEditor;
