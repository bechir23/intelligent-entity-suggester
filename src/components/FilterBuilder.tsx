import React, { useState } from 'react';
import type { FilterConfig } from '../services/advancedSearch';

// Simple icon components
const PlusIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 8.1A2 2 0 0116.138 17H7.862a2 2 0 01-1.995-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface FilterBuilderProps {
  availableColumns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean';
  }>;
  availableTables: string[];
  currentFilters: FilterConfig[];
  onAddFilter: (filter: FilterConfig) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
  className?: string;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  availableColumns,
  availableTables,
  currentFilters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  className = ''
}) => {
  const [newFilter, setNewFilter] = useState<Partial<FilterConfig>>({
    column: '',
    operator: 'contains',
    value: '',
    table: ''
  });

  const operatorOptions = [
    { value: 'equals', label: 'Equals', supportedTypes: ['text', 'number', 'email', 'phone', 'boolean'] },
    { value: 'contains', label: 'Contains', supportedTypes: ['text', 'email', 'phone'] },
    { value: 'starts_with', label: 'Starts with', supportedTypes: ['text', 'email', 'phone'] },
    { value: 'greater_than', label: 'Greater than', supportedTypes: ['number', 'date', 'currency'] },
    { value: 'less_than', label: 'Less than', supportedTypes: ['number', 'date', 'currency'] },
    { value: 'between', label: 'Between', supportedTypes: ['number', 'date', 'currency'] }
  ];

  const getColumnType = (columnKey: string): string => {
    const column = availableColumns.find(col => col.key === columnKey);
    return column?.type || 'text';
  };

  const getAvailableOperators = (columnKey: string) => {
    const columnType = getColumnType(columnKey);
    return operatorOptions.filter(op => op.supportedTypes.includes(columnType));
  };

  const handleAddFilter = () => {
    if (!newFilter.column || !newFilter.operator || newFilter.value === '' || newFilter.value === undefined) {
      return;
    }

    const filter: FilterConfig = {
      column: newFilter.column,
      operator: newFilter.operator as FilterConfig['operator'],
      value: newFilter.value,
      table: newFilter.table || undefined
    };

    // Add value2 for 'between' operator
    if (newFilter.operator === 'between' && newFilter.value2) {
      filter.value2 = newFilter.value2;
    }

    onAddFilter(filter);

    // Reset form
    setNewFilter({
      column: '',
      operator: 'contains',
      value: '',
      table: ''
    });
  };

  const formatFilterDisplay = (filter: FilterConfig): string => {
    const column = availableColumns.find(col => col.key === filter.column);
    const columnLabel = column?.label || filter.column;
    const operatorLabel = operatorOptions.find(op => op.value === filter.operator)?.label || filter.operator;
    
    if (filter.operator === 'between' && filter.value2) {
      return `${columnLabel} ${operatorLabel} ${filter.value} and ${filter.value2}`;
    }
    
    return `${columnLabel} ${operatorLabel} ${filter.value}`;
  };

  const getInputType = (columnKey: string): string => {
    const columnType = getColumnType(columnKey);
    switch (columnType) {
      case 'number':
      case 'currency':
        return 'number';
      case 'date':
        return 'date';
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Filters</h4>
        {currentFilters.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Current Filters */}
      {currentFilters.length > 0 && (
        <div className="mb-4 space-y-2">
          {currentFilters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2"
            >
              <span className="text-sm text-blue-800">
                {formatFilterDisplay(filter)}
                {filter.table && (
                  <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded">
                    {filter.table}
                  </span>
                )}
              </span>
              <button
                onClick={() => onRemoveFilter(index)}
                className="text-blue-400 hover:text-red-600 ml-2"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Filter */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Table Selection */}
          {availableTables.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Table (optional)
              </label>
              <select
                value={newFilter.table || ''}
                onChange={(e) => setNewFilter({ ...newFilter, table: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All tables</option>
                {availableTables.map(table => (
                  <option key={table} value={table}>
                    {table.charAt(0).toUpperCase() + table.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Column Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Column
            </label>
            <select
              value={newFilter.column || ''}
              onChange={(e) => setNewFilter({ 
                ...newFilter, 
                column: e.target.value,
                operator: 'contains' // Reset operator when column changes
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select column...</option>
              {availableColumns.map(column => (
                <option key={column.key} value={column.key}>
                  {column.label} ({column.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Operator Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Operator
            </label>
            <select
              value={newFilter.operator || 'contains'}
              onChange={(e) => setNewFilter({ 
                ...newFilter, 
                operator: e.target.value as FilterConfig['operator']
              })}
              disabled={!newFilter.column}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {getAvailableOperators(newFilter.column || '').map(operator => (
                <option key={operator.value} value={operator.value}>
                  {operator.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Value
            </label>
            <input
              type={getInputType(newFilter.column || '')}
              value={newFilter.value || ''}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              placeholder="Enter value..."
              disabled={!newFilter.column}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Second Value Input (for 'between' operator) */}
          {newFilter.operator === 'between' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Value
              </label>
              <input
                type={getInputType(newFilter.column || '')}
                value={newFilter.value2 || ''}
                onChange={(e) => setNewFilter({ ...newFilter, value2: e.target.value })}
                placeholder="Enter end value..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Add Filter Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAddFilter}
            disabled={!newFilter.column || !newFilter.operator || newFilter.value === ''}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBuilder;
