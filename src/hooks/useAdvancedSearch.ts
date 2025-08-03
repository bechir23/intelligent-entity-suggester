import { useState, useCallback, useEffect } from 'react';
import AdvancedSearchService from '../services/advancedSearch';
import type { 
  AdvancedSearchOptions, 
  FilterConfig, 
  SortConfig, 
  SearchResult, 
  AdvancedSearchResponse 
} from '../services/advancedSearch';

interface UseAdvancedSearchOptions {
  autoSearch?: boolean;
  debounceMs?: number;
  defaultFilters?: FilterConfig[];
  defaultSorts?: SortConfig[];
  defaultFuzzyThreshold?: number;
  defaultLimit?: number;
}

interface UseAdvancedSearchReturn {
  // State
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  filters: FilterConfig[];
  sorts: SortConfig[];
  totalCount: number;
  queryTime: number;
  tablesSearched: string[];
  fuzzyMatches: any[];
  schema: Record<string, any>;
  
  // Actions
  search: (searchQuery: string, options?: AdvancedSearchOptions) => Promise<void>;
  setQuery: (query: string) => void;
  addFilter: (filter: FilterConfig) => Promise<void>;
  removeFilter: (index: number) => Promise<void>;
  clearFilters: () => void;
  addSort: (sort: SortConfig) => Promise<void>;
  removeSort: (index: number) => Promise<void>;
  clearSorts: () => void;
  fuzzySearch: (searchQuery: string, threshold?: number) => Promise<void>;
  getSuggestions: (searchQuery: string, limit?: number) => Promise<any[]>;
  loadSchema: (table?: string) => Promise<void>;
  reset: () => void;
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn => {
  const {
    autoSearch = false,
    debounceMs = 300,
    defaultFilters = [],
    defaultSorts = [],
    defaultFuzzyThreshold = 0.7,
    defaultLimit = 50
  } = options;

  // Core state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [filters, setFilters] = useState<FilterConfig[]>(defaultFilters);
  const [sorts, setSorts] = useState<SortConfig[]>(defaultSorts);
  
  // Search metadata
  const [totalCount, setTotalCount] = useState(0);
  const [queryTime, setQueryTime] = useState(0);
  const [tablesSearched, setTablesSearched] = useState<string[]>([]);
  const [fuzzyMatches, setFuzzyMatches] = useState<any[]>([]);
  const [schema, setSchema] = useState<Record<string, any>>({});

  // Service instance
  const [searchService] = useState(() => new AdvancedSearchService());

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Main search function
  const search = useCallback(async (searchQuery: string, searchOptions?: AdvancedSearchOptions) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Advanced search: "${searchQuery}"`);
      const startTime = Date.now();

      const response: AdvancedSearchResponse = await searchService.search(searchQuery, {
        filters: searchOptions?.filters || filters,
        sorting: searchOptions?.sorting || sorts,
        fuzzyThreshold: searchOptions?.fuzzyThreshold || defaultFuzzyThreshold,
        limit: searchOptions?.limit || defaultLimit,
        ...searchOptions
      });

      setResults(response.data);
      setTotalCount(response.total_count);
      setQueryTime(response.query_time);
      setTablesSearched(response.tables_searched);
      setFuzzyMatches(response.fuzzy_matches);

      console.log(`✅ Search completed in ${Date.now() - startTime}ms`);
      console.log(`📊 Found ${response.data.length} results across ${response.tables_searched.length} tables`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Advanced search error:', err);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sorts, defaultFuzzyThreshold, defaultLimit, searchService]);

  // Set query with optional auto-search
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    if (autoSearch && newQuery.trim().length >= 2) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        search(newQuery);
      }, debounceMs);

      setDebounceTimer(timer);
    }
  }, [autoSearch, debounceMs, search, debounceTimer]);

  // Filter management
  const addFilter = useCallback(async (filter: FilterConfig) => {
    const newFilters = [...filters, filter];
    setFilters(newFilters);

    if (query.trim()) {
      await search(query, { filters: newFilters });
    }
  }, [filters, query, search]);

  const removeFilter = useCallback(async (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);

    if (query.trim()) {
      await search(query, { filters: newFilters });
    }
  }, [filters, query, search]);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Sort management
  const addSort = useCallback(async (sort: SortConfig) => {
    // Remove existing sort for the same column, then add new one at the beginning
    const newSorts = [sort, ...sorts.filter(s => s.column !== sort.column)];
    setSorts(newSorts);

    if (query.trim()) {
      await search(query, { sorting: newSorts });
    }
  }, [sorts, query, search]);

  const removeSort = useCallback(async (index: number) => {
    const newSorts = sorts.filter((_, i) => i !== index);
    setSorts(newSorts);

    if (query.trim()) {
      await search(query, { sorting: newSorts });
    }
  }, [sorts, query, search]);

  const clearSorts = useCallback(() => {
    setSorts([]);
  }, []);

  // Fuzzy search
  const fuzzySearch = useCallback(async (searchQuery: string, threshold: number = defaultFuzzyThreshold) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchService.fuzzySearch(searchQuery, threshold);
      setResults(response.fuzzy_data);
      setFuzzyMatches(response.fuzzy_matches);
      setTotalCount(response.total_fuzzy_matches);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fuzzy search failed';
      setError(errorMessage);
      console.error('Fuzzy search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchService, defaultFuzzyThreshold]);

  // Get suggestions
  const getSuggestions = useCallback(async (searchQuery: string, limit: number = 10) => {
    try {
      const response = await searchService.getSuggestions(searchQuery, limit);
      return response.suggestions;
    } catch (err) {
      console.error('Get suggestions error:', err);
      return [];
    }
  }, [searchService]);

  // Load database schema
  const loadSchema = useCallback(async (table?: string) => {
    try {
      const schemaResponse = await searchService.getSchema(table);
      setSchema(schemaResponse.schema);
    } catch (err) {
      console.error('Schema load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    }
  }, [searchService]);

  // Reset all state
  const reset = useCallback(() => {
    setResults([]);
    setLoading(false);
    setError(null);
    setQueryState('');
    setFilters(defaultFilters);
    setSorts(defaultSorts);
    setTotalCount(0);
    setQueryTime(0);
    setTablesSearched([]);
    setFuzzyMatches([]);
    setSchema({});
  }, [defaultFilters, defaultSorts]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Load schema on mount
  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  return {
    // State
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

    // Actions
    search,
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    addSort,
    removeSort,
    clearSorts,
    fuzzySearch,
    getSuggestions,
    loadSchema,
    reset
  };
};

export default useAdvancedSearch;
