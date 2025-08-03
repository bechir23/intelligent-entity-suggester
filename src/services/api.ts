import type { Suggestion, SuggestionResponse, AuditTrailEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Suggestion endpoints
  async getSuggestions(
    text: string, 
    position: number, 
    options: {
      entityTypes?: string[];
      userId?: string;
      documentId?: string;
    } = {}
  ): Promise<SuggestionResponse> {
    const params = new URLSearchParams({
      text,
      position: position.toString(),
    });

    if (options.entityTypes?.length) {
      params.append('entityTypes', options.entityTypes.join(','));
    }
    if (options.userId) {
      params.append('userId', options.userId);
    }
    if (options.documentId) {
      params.append('documentId', options.documentId);
    }

    return this.request<SuggestionResponse>(`/suggestions?${params}`);
  }

  async searchDirect(
    query: string,
    options: {
      entityTypes?: string[];
      userId?: string;
      limit?: number;
    } = {}
  ): Promise<{
    query: string;
    suggestions: Suggestion[];
    response_time: number;
    timestamp: string;
  }> {
    const params = new URLSearchParams();
    
    if (options.entityTypes?.length) {
      params.append('entityTypes', options.entityTypes.join(','));
    }
    if (options.userId) {
      params.append('userId', options.userId);
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const queryParams = params.toString() ? `?${params}` : '';
    return this.request(`/suggestions/search/${encodeURIComponent(query)}${queryParams}`);
  }

  async validateMetadata(metadata: any): Promise<{
    valid: boolean;
    metadata: any;
    required_fields: string[];
    timestamp: string;
  }> {
    return this.request('/suggestions/validate', {
      method: 'POST',
      body: JSON.stringify({ metadata }),
    });
  }

  async clearCache(): Promise<{ message: string; timestamp: string }> {
    return this.request('/suggestions/cache', {
      method: 'DELETE',
    });
  }

  // Audit trail endpoints
  async createAuditEntry(entry: AuditTrailEntry): Promise<{
    success: boolean;
    audit_entry: AuditTrailEntry;
    message: string;
  }> {
    return this.request('/audit', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async getDocumentAuditTrail(
    documentId: string, 
    userId?: string
  ): Promise<{
    document_id: string;
    audit_entries: AuditTrailEntry[];
    count: number;
    timestamp: string;
  }> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request(`/audit/document/${encodeURIComponent(documentId)}${params}`);
  }

  async getEntityAuditTrail(
    table: string, 
    id: string
  ): Promise<{
    entity_table: string;
    entity_id: string;
    entity_data: any;
    audit_entries: AuditTrailEntry[];
    count: number;
    timestamp: string;
  }> {
    return this.request(`/audit/entity/${encodeURIComponent(table)}/${encodeURIComponent(id)}`);
  }

  async getUserAuditTrail(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    user_id: string;
    audit_entries: AuditTrailEntry[];
    count: number;
    limit: number;
    offset: number;
    timestamp: string;
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const queryParams = params.toString() ? `?${params}` : '';
    return this.request(`/audit/user/${encodeURIComponent(userId)}${queryParams}`);
  }

  async createBatchAuditEntries(entries: AuditTrailEntry[]): Promise<{
    success: boolean;
    audit_entries: AuditTrailEntry[];
    count: number;
    message: string;
  }> {
    return this.request('/audit/batch', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  }

  async getAuditStats(): Promise<{
    total_entries: number;
    entries_today: number;
    entity_type_counts: Record<string, number>;
    timestamp: string;
  }> {
    return this.request('/audit/stats');
  }

  // Test query endpoint for examples
  async testQuery(query: string, mode: string = 'auto'): Promise<any> {
    return this.request('/api/test-query', {
      method: 'POST',
      body: JSON.stringify({ query, mode })
    });
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
