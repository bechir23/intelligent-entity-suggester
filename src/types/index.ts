export interface Suggestion {
  entity_type: string;
  entity_id: string;
  display_label: string;
  entity_data: any;
  highlighted_text: string;
  confidence: number;
  suggestion_type: 'entity' | 'date' | 'pronoun';
  search_rank?: number;
  metadata?: {
    sql_query?: string;
    interpretation?: string;
    source?: string;
    table?: string;
    search_score?: number;
    fuzzy_score?: number;
    fuzzy_matches?: any[];
    tables_searched?: string[];
  };
  date_info?: {
    parsed_date: string;
    original_text: string;
    absolute_date: string;
  };
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
  responseTime: number;
  query: string;
  position: number;
  mode?: 'basic_suggestions' | 'intelligent_sql' | 'advanced_search';
  search_metadata?: {
    total_results?: number;
    tables_searched?: string[];
    fuzzy_matches?: number;
    query_time?: number;
  };
}

export interface EntityMetadata {
  entity_table: string;
  entity_id: string;
  offset_start: number;
  offset_end: number;
  display_label: string;
  entity_data: any;
  confidence?: number;
}

export interface AuditTrailEntry {
  id?: string;
  token_id: string;
  entity_table: string;
  entity_id: string;
  offset_start: number;
  offset_end: number;
  user_id?: string;
  document_id?: string;
  metadata?: any;
  created_at?: string;
}

export interface User {
  id: string;
  auth_uid: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface WebSocketEvents {
  // Client to server
  request_suggestions: {
    text: string;
    position: number;
    entityTypes?: string[];
    userId?: string;
    documentId?: string;
    room?: string;
  };
  
  join_document: string; // documentId
  leave_document: string; // documentId
  
  cursor_update: {
    documentId: string;
    position: number;
    userId?: string;
  };
  
  selection_update: {
    documentId: string;
    start: number;
    end: number;
    userId?: string;
    selectedText?: string;
  };
  
  metadata_inserted: {
    documentId: string;
    tokenId: string;
    entityType: string;
    entityId: string;
    offsetStart: number;
    offsetEnd: number;
    userId?: string;
  };

  // Server to client
  suggestions_response: SuggestionResponse & { requestId: string };
  suggestions_error: { error: string; message: string };
  
  user_joined: { userId: string; timestamp: string };
  user_left: { userId: string; timestamp: string };
  user_typing: { userId: string; query: string; position: number };
  
  cursor_position: { userId: string; position: number; timestamp: string };
  selection_changed: { 
    userId: string; 
    start: number; 
    end: number; 
    selectedText?: string; 
    timestamp: string; 
  };
  
  metadata_added: {
    documentId: string;
    tokenId: string;
    entityType: string;
    entityId: string;
    offsetStart: number;
    offsetEnd: number;
    userId: string;
    timestamp: string;
  };
}
