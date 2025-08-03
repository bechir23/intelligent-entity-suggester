// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdvancedSearchOptions {
  filters?: FilterConfig[];
  sorting?: SortConfig[];
  fuzzyThreshold?: number;
  limit?: number;
}

interface FilterConfig {
  table?: string;
  column: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between';
  value: string | number;
  value2?: string | number;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
  table?: string;
}

interface SearchResult {
  id: string;
  _table: string;
  _search_score?: number;
  _fuzzy_score?: number;
  [key: string]: any;
}

interface AdvancedSearchResponse {
  data: SearchResult[];
  total_count: number;
  query_time: number;
  tables_searched: string[];
  fuzzy_matches: Array<{
    term: string;
    matches: Array<{
      value: string;
      similarity: number;
      table: string;
      column: string;
    }>;
  }>;
  query: string;
  timestamp: string;
  search_metadata?: {
    total_results: number;
    tables_searched: string[];
    fuzzy_matches: number;
    query_time: number;
  };
}

interface SchemaResponse {
  tables: string[];
  schema: Record<string, Array<{
    column_name: string;
    data_type: string;
    is_nullable: boolean;
  }>>;
  total_tables: number;
}

interface SuggestionsResponse {
  suggestions: Array<{
    entity_id: string;
    entity_type: string;
    display_label: string;
    entity_data: SearchResult;
    highlighted_text: string;
    confidence: number;
    suggestion_type: string;
    metadata: {
      table: string;
      search_score: number;
      fuzzy_score: number;
      source: string;
    };
  }>;
  total_results: number;
  query_time: number;
  tables_searched: string[];
  fuzzy_matches: number;
  timestamp: string;
}

class AdvancedSearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/advanced-search`;
  }

  /**
   * Perform advanced search with all features
   */
  async search(query: string, options: AdvancedSearchOptions = {}): Promise<AdvancedSearchResponse> {
    try {
      console.log(`🔍 Advanced search: "${query}"`, options);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Advanced search completed: ${data.data.length} results`);
      
      return data;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * Get database schema information
   */
  async getSchema(table?: string): Promise<SchemaResponse> {
    try {
      const url = table ? `${this.baseUrl}/schema?table=${encodeURIComponent(table)}` : `${this.baseUrl}/schema`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Schema fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Schema fetch error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch schema');
    }
  }

  /**
   * Add dynamic filter to search
   */
  async addFilter(
    query: string,
    filter: FilterConfig,
    existingFilters: FilterConfig[] = []
  ): Promise<AdvancedSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...filter,
          existing_filters: existingFilters
        })
      });

      if (!response.ok) {
        throw new Error(`Filter application failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Filter application error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to apply filter');
    }
  }

  /**
   * Apply dynamic sorting to search
   */
  async addSort(
    query: string,
    sort: SortConfig,
    existingSorts: SortConfig[] = []
  ): Promise<AdvancedSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...sort,
          existing_sorting: existingSorts
        })
      });

      if (!response.ok) {
        throw new Error(`Sort application failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Sort application error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to apply sort');
    }
  }

  /**
   * Perform fuzzy search with Levenshtein distance
   */
  async fuzzySearch(
    query: string,
    threshold: number = 0.7,
    limit: number = 20
  ): Promise<{
    query: string;
    fuzzy_matches: any[];
    fuzzy_data: SearchResult[];
    threshold: number;
    total_fuzzy_matches: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fuzzy/${encodeURIComponent(query)}?threshold=${threshold}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Fuzzy search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fuzzy search error:', error);
      throw new Error(error instanceof Error ? error.message : 'Fuzzy search failed');
    }
  }

  /**
   * Get search suggestions (for autocomplete/typeahead)
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SuggestionsResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/suggestions/${encodeURIComponent(query)}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Suggestions fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Suggestions fetch error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get suggestions');
    }
  }

  /**
   * Generate table columns configuration from schema
   */
  generateTableColumns(schema: Record<string, any>): Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean';
    sortable: boolean;
    filterable: boolean;
    width?: string;
  }> {
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
  }

  /**
   * Extract available filters from data
   */
  extractAvailableFilters(data: SearchResult[]): Record<string, Set<any>> {
    const filters: Record<string, Set<any>> = {};

    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (key.startsWith('_')) return; // Skip metadata fields
        
        if (!filters[key]) {
          filters[key] = new Set();
        }
        
        if (value !== null && value !== undefined) {
          filters[key].add(value);
        }
      });
    });

    return filters;
  }
}

export default AdvancedSearchService;
export type { 
  AdvancedSearchOptions, 
  FilterConfig, 
  SortConfig, 
  SearchResult, 
  AdvancedSearchResponse,
  SuggestionsResponse,
  SchemaResponse
};
