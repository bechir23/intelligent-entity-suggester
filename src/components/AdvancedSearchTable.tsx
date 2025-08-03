import React, { useState, useMemo } from 'react';

// Simple icon components
const ChevronUpIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FunnelIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean';
  sortable: boolean;
  filterable: boolean;
  width?: string;
}

interface TableRow {
  id: string;
  _table: string;
  _search_score?: number;
  _fuzzy_score?: number;
  [key: string]: any;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  column: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between';
  value: string | number;
  value2?: string | number; // For 'between' operator
}

interface AdvancedSearchTableProps {
  data: TableRow[];
  columns: TableColumn[];
  loading?: boolean;
  searchQuery?: string;
  onRowClick?: (row: TableRow) => void;
  onFilterChange?: (filters: FilterConfig[]) => void;
  onSortChange?: (sorts: SortConfig[]) => void;
  className?: string;
}

const AdvancedSearchTable: React.FC<AdvancedSearchTableProps> = ({
  data,
  columns,
  loading = false,
  searchQuery = '',
  onRowClick,
  onFilterChange,
  onSortChange,
  className = ''
}) => {
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  // Format cell value based on column type
  const formatCellValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value) || 0);
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'number':
        return Number(value).toLocaleString();
      
      case 'email':
        return `<a href="mailto:${value}" class="text-blue-600 hover:text-blue-800">${value}</a>`;
      
      case 'phone':
        return `<a href="tel:${value}" class="text-blue-600 hover:text-blue-800">${value}</a>`;
      
      case 'boolean':
        return value ? '✅' : '❌';
      
      default:
        return String(value);
    }
  };

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const existingSortIndex = sorts.findIndex(sort => sort.key === columnKey);
    let newSorts: SortConfig[];

    if (existingSortIndex >= 0) {
      // Toggle direction or remove sort
      const currentSort = sorts[existingSortIndex];
      if (currentSort.direction === 'asc') {
        newSorts = sorts.map((sort, index) => 
          index === existingSortIndex ? { ...sort, direction: 'desc' } : sort
        );
      } else {
        newSorts = sorts.filter((_, index) => index !== existingSortIndex);
      }
    } else {
      // Add new sort
      newSorts = [{ key: columnKey, direction: 'asc' }, ...sorts];
    }

    setSorts(newSorts);
    onSortChange?.(newSorts);
  };

  // Handle filter addition (called from filter UI component)
  // const addFilter = (column: string, operator: FilterConfig['operator'], value: string | number) => {
  //   const newFilter: FilterConfig = { column, operator, value };
  //   const newFilters = [...filters, newFilter];
  //   setFilters(newFilters);
  //   onFilterChange?.(newFilters);
  // };

  // Remove filter
  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Filter and sort data locally for immediate UI feedback
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global filter
    if (globalFilter) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }

    // Apply column filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const cellValue = row[filter.column];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return String(cellValue).toLowerCase() === String(filterValue).toLowerCase();
          case 'contains':
            return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'greater_than':
            return Number(cellValue) > Number(filterValue);
          case 'less_than':
            return Number(cellValue) < Number(filterValue);
          case 'between':
            return Number(cellValue) >= Number(filterValue) && 
                   Number(cellValue) <= Number(filter.value2 || filterValue);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const aVal = a[sort.key];
          const bVal = b[sort.key];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [data, globalFilter, filters, sorts]);

  const getSortIcon = (columnKey: string) => {
    const sort = sorts.find(s => s.key === columnKey);
    if (!sort) return null;
    
    return sort.direction === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4 text-blue-600" /> :
      <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  const getSortPriority = (columnKey: string) => {
    const index = sorts.findIndex(s => s.key === columnKey);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with search and controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results {searchQuery && `for "${searchQuery}"`}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {processedData.length} of {data.length} results
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters {filters.length > 0 && `(${filters.length})`}
            </button>
          </div>
        </div>

        {/* Global search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter results..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Active filters */}
        {filters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter.column} {filter.operator} {filter.value}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex items-center">
                        {getSortIcon(column.key)}
                        {getSortPriority(column.key) && (
                          <span className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5">
                            {getSortPriority(column.key)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading results...</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                  {data.length === 0 ? 'No results found' : 'No results match your filters'}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.type === 'email' || column.type === 'phone' ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatCellValue(row[column.key], column.type)
                          }}
                        />
                      ) : (
                        formatCellValue(row[column.key], column.type)
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col space-y-1">
                      {row._search_score !== undefined && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Search: {(row._search_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {row._fuzzy_score !== undefined && row._fuzzy_score > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Fuzzy: {(row._fuzzy_score * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {row._table}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination could go here */}
      {processedData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {processedData.length} of {data.length} results
            </div>
            <div className="text-xs text-gray-500">
              {sorts.length > 0 && `Sorted by ${sorts.length} column${sorts.length > 1 ? 's' : ''}`}
              {filters.length > 0 && ` • ${filters.length} filter${filters.length > 1 ? 's' : ''} applied`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchTable;
