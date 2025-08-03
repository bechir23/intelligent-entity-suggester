import React, { useState, useEffect } from 'react';
// import AdvancedSearchTable from './AdvancedSearchTable'; // Temporarily disabled
import FilterBuilder from './FilterBuilder';
import useAdvancedSearch from '../hooks/useAdvancedSearch';

// Type mapping for table component (currently unused)
// interface TableSortConfig {
//   key: string;
//   direction: 'asc' | 'desc';
// }

// interface TableFilterConfig {
//   column: string;
//   operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between';
//   value: string | number;
//   value2?: string | number;
// }

// Simple icon components
const MagnifyingGlassIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const AdjustmentsIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

const SparklesIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

interface AdvancedSearchInterfaceProps {
  className?: string;
  onRowSelect?: (row: any) => void;
  placeholder?: string;
  autoSearch?: boolean;
}

const AdvancedSearchInterface: React.FC<AdvancedSearchInterfaceProps> = ({
  className = '',
  // onRowSelect,
  placeholder = "Search across all data with natural language...",
  autoSearch = false
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'fuzzy'>('standard');

  const {
    results,
    loading,
    error,
    query,
    filters,
    sorts,
    totalCount,
    queryTime,
    tablesSearched,
    fuzzyMatches,
    schema,
    search,
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    fuzzySearch,
    loadSchema,
    reset
  } = useAdvancedSearch({
    autoSearch,
    debounceMs: 300,
    defaultFuzzyThreshold: 0.7,
    defaultLimit: 100
  });

  // Generate table columns from schema
  const tableColumns = React.useMemo(() => {
    if (!schema || Object.keys(schema).length === 0) return [];

    const allColumns = new Set<string>();
    const columnTypes: Record<string, string> = {};

    // Collect all unique columns across tables
    Object.values(schema).forEach((tableColumns: any[]) => {
      tableColumns.forEach(col => {
        allColumns.add(col.column_name);
        columnTypes[col.column_name] = col.data_type;
      });
    });

    return Array.from(allColumns).map(columnName => {
      const dataType = columnTypes[columnName] || 'text';
      
      // Determine display type based on column name and data type
      let type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean' = 'text';
      
      if (columnName.includes('email')) type = 'email';
      else if (columnName.includes('phone')) type = 'phone';
      else if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) type = 'currency';
      else if (columnName.includes('date') || columnName.includes('time')) type = 'date';
      else if (dataType.includes('int') || dataType.includes('numeric') || dataType.includes('decimal')) type = 'number';
      else if (dataType.includes('bool')) type = 'boolean';

      return {
        key: columnName,
        label: columnName.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        type,
        sortable: true,
        filterable: true,
        width: type === 'email' ? '200px' : type === 'phone' ? '150px' : undefined
      };
    });
  }, [schema]);

  const availableTables = React.useMemo(() => {
    return Object.keys(schema);
  }, [schema]);

  // Handle search
  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    if (searchMode === 'fuzzy') {
      await fuzzySearch(searchInput);
    } else {
      await search(searchInput);
    }
    setQuery(searchInput);
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle filter changes (placeholder for future client-side filtering)
  // const handleFilterChange = (_newFilters: TableFilterConfig[]) => {
  //   // This is called from the table component for client-side filtering
  //   // The actual server-side filtering is handled by addFilter/removeFilter
  // };

  // Handle sort changes (placeholder for future client-side sorting)
  // const handleSortChange = (_newSorts: TableSortConfig[]) => {
  //   // This is called from the table component for client-side sorting
  //   // The actual server-side sorting is handled by addSort/removeSort
  // };

  // Load schema on mount
  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Title and Mode Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSearchMode(searchMode === 'standard' ? 'fuzzy' : 'standard')}
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                  searchMode === 'fuzzy'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <SparklesIcon className="h-4 w-4 mr-1" />
                {searchMode === 'fuzzy' ? 'Fuzzy Mode' : 'Standard Mode'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                  showFilters
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <AdjustmentsIcon className="h-4 w-4 mr-1" />
                Filters {filters.length > 0 && `(${filters.length})`}
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleSearch}
                disabled={!searchInput.trim() || loading}
                className="mr-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Search Info */}
          {(query || totalCount > 0) && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                {query && `Searched for: "${query}"`}
                {totalCount > 0 && ` • ${totalCount} results`}
                {queryTime > 0 && ` • ${queryTime}ms`}
                {tablesSearched.length > 0 && ` • ${tablesSearched.length} tables`}
              </div>
              {(query || filters.length > 0 || sorts.length > 0) && (
                <button
                  onClick={() => {
                    reset();
                    setSearchInput('');
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Search Mode Info */}
          <div className="text-xs text-gray-500">
            {searchMode === 'fuzzy' ? (
              <span>🌟 Fuzzy search finds similar matches even with typos (Levenshtein distance)</span>
            ) : (
              <span>🔍 Standard search with intelligent SQL interpretation and natural language processing</span>
            )}
            {fuzzyMatches.length > 0 && (
              <span> • {fuzzyMatches.length} fuzzy matches found</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Builder */}
      {showFilters && (
        <FilterBuilder
          availableColumns={tableColumns}
          availableTables={availableTables}
          currentFilters={filters}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {(results.length > 0 || loading) && (
        <div className="results-placeholder">
          <p>Results table temporarily disabled - {results.length} results found</p>
          {results.map((result, index) => (
            <div key={index} className="result-item">
              {JSON.stringify(result, null, 2)}
            </div>
          ))}
        </div>
        // <AdvancedSearchTable
        //   data={results}
        //   columns={tableColumns}
        //   loading={loading}
        //   searchQuery={query}
        //   onRowClick={onRowSelect}
        //   onFilterChange={handleFilterChange}
        //   onSortChange={handleSortChange}
        // />
      )}

      {/* Empty State */}
      {!loading && !error && query && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your search terms or using fuzzy search mode
          </p>
          <button
            onClick={() => setSearchMode('fuzzy')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <SparklesIcon className="h-4 w-4 mr-1" />
            Try Fuzzy Search
          </button>
        </div>
      )}

      {/* Welcome State */}
      {!loading && !error && !query && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <SparklesIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Powerful Advanced Search</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-2xl mx-auto">
            Search across all your data with natural language queries. Use fuzzy matching for typos, 
            add dynamic filters, sort by multiple columns, and get comprehensive results from all tables.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-xs text-gray-600">
            <div className="text-center">
              <div className="font-medium mb-1">🧠 Natural Language</div>
              <div>"Show me all customers from NYC"</div>
            </div>
            <div className="text-center">
              <div className="font-medium mb-1">🌟 Fuzzy Matching</div>
              <div>Finds "John" when you type "Jon"</div>
            </div>
            <div className="text-center">
              <div className="font-medium mb-1">🔧 Dynamic Filtering</div>
              <div>Add filters and sorts in real-time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchInterface;
