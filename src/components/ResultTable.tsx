import React from 'react';
import './ResultTable.css';

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status';
  width?: string;
}

interface ResultTableProps {
  data: any[];
  entityType: string;
  title?: string;
  className?: string;
}

// Define column configurations for each entity type with proper balanced widths
// Based on actual database schema from Supabase
const COLUMN_CONFIGS: Record<string, TableColumn[]> = {
  customer: [
    { key: 'name', label: 'Customer Name', type: 'text', width: '160px' },
    { key: 'email', label: 'Email', type: 'text', width: '180px' },
    { key: 'phone', label: 'Phone', type: 'text', width: '120px' },
    { key: 'company', label: 'Company', type: 'text', width: '140px' },
    { key: 'address', label: 'Address', type: 'text', width: '160px' },
    { key: 'created_at', label: 'Created', type: 'date', width: '100px' }
  ],
  customers: [
    { key: 'name', label: 'Customer Name', type: 'text', width: '160px' },
    { key: 'email', label: 'Email', type: 'text', width: '180px' },
    { key: 'phone', label: 'Phone', type: 'text', width: '120px' },
    { key: 'company', label: 'Company', type: 'text', width: '140px' },
    { key: 'address', label: 'Address', type: 'text', width: '160px' },
    { key: 'created_at', label: 'Created', type: 'date', width: '100px' }
  ],
  product: [
    { key: 'name', label: 'Product Name', type: 'text', width: '160px' },
    { key: 'description', label: 'Description', type: 'text', width: '200px' },
    { key: 'price', label: 'Price', type: 'currency', width: '90px' },
    { key: 'stock_quantity', label: 'Stock', type: 'number', width: '70px' },
    { key: 'category', label: 'Category', type: 'text', width: '100px' },
    { key: 'sku', label: 'SKU', type: 'text', width: '90px' }
  ],
  products: [
    { key: 'name', label: 'Product Name', type: 'text', width: '160px' },
    { key: 'description', label: 'Description', type: 'text', width: '200px' },
    { key: 'price', label: 'Price', type: 'currency', width: '90px' },
    { key: 'stock_quantity', label: 'Stock', type: 'number', width: '70px' },
    { key: 'category', label: 'Category', type: 'text', width: '100px' },
    { key: 'sku', label: 'SKU', type: 'text', width: '90px' }
  ],
  sale: [
    { key: 'customer_id', label: 'Customer ID', type: 'text', width: '90px' },
    { key: 'product_id', label: 'Product ID', type: 'text', width: '90px' },
    { key: 'quantity', label: 'Qty', type: 'number', width: '50px' },
    { key: 'unit_price', label: 'Unit Price', type: 'currency', width: '90px' },
    { key: 'total_amount', label: 'Total', type: 'currency', width: '90px' },
    { key: 'sale_date', label: 'Sale Date', type: 'date', width: '100px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' },
    { key: 'notes', label: 'Notes', type: 'text', width: '120px' }
  ],
  sales: [
    { key: 'customer_id', label: 'Customer ID', type: 'text', width: '90px' },
    { key: 'product_id', label: 'Product ID', type: 'text', width: '90px' },
    { key: 'quantity', label: 'Qty', type: 'number', width: '50px' },
    { key: 'unit_price', label: 'Unit Price', type: 'currency', width: '90px' },
    { key: 'total_amount', label: 'Total', type: 'currency', width: '90px' },
    { key: 'sale_date', label: 'Sale Date', type: 'date', width: '100px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' },
    { key: 'notes', label: 'Notes', type: 'text', width: '120px' }
  ],
  user: [
    { key: 'full_name', label: 'Full Name', type: 'text', width: '150px' },
    { key: 'email', label: 'Email', type: 'text', width: '180px' },
    { key: 'role', label: 'Role', type: 'text', width: '90px' },
    { key: 'created_at', label: 'Joined', type: 'date', width: '100px' }
  ],
  users: [
    { key: 'full_name', label: 'Full Name', type: 'text', width: '150px' },
    { key: 'email', label: 'Email', type: 'text', width: '180px' },
    { key: 'role', label: 'Role', type: 'text', width: '90px' },
    { key: 'created_at', label: 'Joined', type: 'date', width: '100px' }
  ],
  task: [
    { key: 'title', label: 'Task Title', type: 'text', width: '160px' },
    { key: 'description', label: 'Description', type: 'text', width: '200px' },
    { key: 'assigned_to', label: 'Assigned To', type: 'text', width: '110px' },
    { key: 'priority', label: 'Priority', type: 'status', width: '80px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' },
    { key: 'due_date', label: 'Due Date', type: 'date', width: '100px' }
  ],
  tasks: [
    { key: 'title', label: 'Task Title', type: 'text', width: '160px' },
    { key: 'description', label: 'Description', type: 'text', width: '200px' },
    { key: 'assigned_to', label: 'Assigned To', type: 'text', width: '110px' },
    { key: 'priority', label: 'Priority', type: 'status', width: '80px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' },
    { key: 'due_date', label: 'Due Date', type: 'date', width: '100px' }
  ],
  stock: [
    { key: 'product_id', label: 'Product ID', type: 'text', width: '120px' },
    { key: 'warehouse_location', label: 'Location', type: 'text', width: '120px' },
    { key: 'quantity_on_hand', label: 'On Hand', type: 'number', width: '80px' },
    { key: 'quantity_reserved', label: 'Reserved', type: 'number', width: '80px' },
    { key: 'reorder_level', label: 'Reorder Level', type: 'number', width: '90px' },
    { key: 'last_restocked', label: 'Last Restocked', type: 'date', width: '110px' }
  ],
  shift: [
    { key: 'user_id', label: 'Employee ID', type: 'text', width: '100px' },
    { key: 'shift_date', label: 'Date', type: 'date', width: '100px' },
    { key: 'shift_type', label: 'Type', type: 'text', width: '80px' },
    { key: 'start_time', label: 'Start', type: 'text', width: '70px' },
    { key: 'end_time', label: 'End', type: 'text', width: '70px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' }
  ],
  shifts: [
    { key: 'user_id', label: 'Employee ID', type: 'text', width: '100px' },
    { key: 'shift_date', label: 'Date', type: 'date', width: '100px' },
    { key: 'shift_type', label: 'Type', type: 'text', width: '80px' },
    { key: 'start_time', label: 'Start', type: 'text', width: '70px' },
    { key: 'end_time', label: 'End', type: 'text', width: '70px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' }
  ],
  attendance: [
    { key: 'user_id', label: 'Employee ID', type: 'text', width: '100px' },
    { key: 'shift_id', label: 'Shift ID', type: 'text', width: '100px' },
    { key: 'clock_in', label: 'Clock In', type: 'text', width: '90px' },
    { key: 'clock_out', label: 'Clock Out', type: 'text', width: '90px' },
    { key: 'total_hours', label: 'Hours', type: 'number', width: '70px' },
    { key: 'status', label: 'Status', type: 'status', width: '80px' }
  ]
};

const formatValue = (value: any, type: string = 'text'): string => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(Number(value));
    
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
    
    case 'date':
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return value;
      }
    
    case 'status':
      return value;
    
    default:
      return String(value);
  }
};

const getStatusBadgeClass = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  
  if (['completed', 'active', 'confirmed', 'success'].includes(statusLower)) {
    return 'status-success';
  } else if (['pending', 'processing', 'in-progress', 'partial'].includes(statusLower)) {
    return 'status-warning';
  } else if (['cancelled', 'failed', 'rejected', 'inactive'].includes(statusLower)) {
    return 'status-error';
  } else if (['high', 'urgent', 'critical'].includes(statusLower)) {
    return 'status-high';
  } else if (['medium', 'normal'].includes(statusLower)) {
    return 'status-medium';
  } else if (['low', 'minor'].includes(statusLower)) {
    return 'status-low';
  }
  
  return 'status-default';
};

export const ResultTable: React.FC<ResultTableProps> = ({
  data,
  entityType,
  title,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`result-table-empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Results Found</h3>
          <p>No {entityType} records match your search criteria.</p>
        </div>
      </div>
    );
  }

  const columns = COLUMN_CONFIGS[entityType] || [];
  
  // If no column config exists, create dynamic columns with balanced widths
  if (columns.length === 0 && data.length > 0) {
    const firstRecord = data[0];
    Object.keys(firstRecord).forEach(key => {
      if (!key.includes('_vector') && !key.includes('metadata') && key !== 'search_vector') {
        columns.push({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'text',
          width: '120px'
        });
      }
    });
  }

  const displayTitle = title || `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Results`;

  return (
    <div className={`result-table-container ${className}`}>
      <div className="table-header">
        <h3 className="table-title">{displayTitle}</h3>
        <span className="record-count">{data.length} record{data.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="table-wrapper">
        <table className="result-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  style={{ width: column.width }}
                  className={`column-${column.type}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="data-row">
                {columns.map((column) => (
                  <td 
                    key={`${rowIndex}-${column.key}`}
                    className={`column-${column.type}`}
                    style={{ width: column.width }}
                  >
                    {column.type === 'status' ? (
                      <span className={`status-badge ${getStatusBadgeClass(row[column.key])}`}>
                        {formatValue(row[column.key], column.type)}
                      </span>
                    ) : (
                      formatValue(row[column.key], column.type)
                    )}
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
