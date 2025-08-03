import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';
import type { Suggestion, SuggestionResponse } from '../types';

interface UseSuggestionsOptions {
  userId?: string;
  documentId?: string;
  entityTypes?: string[];
  useWebSocket?: boolean;
  debounceMs?: number;
}

interface UseSuggestionsReturn {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  responseTime: number;
  mode: string | null;
  getSuggestions: (text: string, position: number) => Promise<void>;
  clearSuggestions: () => void;
}

export function useSuggestions(options: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const {
    userId,
    documentId,
    entityTypes,
    useWebSocket = true,
    debounceMs = 150
  } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [mode, setMode] = useState<string | null>(null);

  // Debounced request function
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const getSuggestions = useCallback(async (text: string, position: number) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setError(null);
    setLoading(true);

    // Safety timeout to prevent stuck loading
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Suggestions request timeout, resetting loading state');
      setLoading(false);
      setError('Request timeout');
    }, 10000); // 10 second timeout

    const timer = setTimeout(async () => {
      try {
        if (useWebSocket) {
          // Try WebSocket first, fallback to HTTP if not connected
          try {
            if (!webSocketService.isConnected()) {
              console.log('🔄 WebSocket not connected, attempting to connect...');
              await webSocketService.connect();
            }
            
            webSocketService.requestSuggestions({
              text,
              position,
              entityTypes,
              userId,
              documentId,
              room: documentId
            });
            
            console.log('📡 WebSocket request sent for:', text);
            // Don't clear safetyTimeout here - let WebSocket response handle it
          } catch (wsError) {
            console.warn('⚠️ WebSocket failed, falling back to HTTP:', wsError);
            clearTimeout(safetyTimeout);
            throw wsError; // This will trigger the HTTP fallback
          }
        } else {
          // Use HTTP API directly
          const response = await apiService.getSuggestions(text, position, {
            entityTypes,
            userId,
            documentId
          });

          clearTimeout(safetyTimeout);
          setSuggestions(response.suggestions);
          setResponseTime(response.responseTime);
          setLoading(false);
        }
      } catch (err) {
        // Fallback to HTTP API if WebSocket fails
        try {
          console.log('🔄 Falling back to HTTP API...');
          const response = await apiService.getSuggestions(text, position, {
            entityTypes,
            userId,
            documentId
          });

          clearTimeout(safetyTimeout);
          setSuggestions(response.suggestions);
          setResponseTime(response.responseTime);
          setLoading(false);
        } catch (httpErr) {
          clearTimeout(safetyTimeout);
          setError(httpErr instanceof Error ? httpErr.message : 'Failed to get suggestions');
          setSuggestions([]);
          setLoading(false);
        }
      }
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, useWebSocket, entityTypes, userId, documentId, debounceMs]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLoading(false);
    setResponseTime(0);
  }, []);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!useWebSocket) return;

    const handleSuggestionsResponse = (data: SuggestionResponse & { requestId: string; mode?: string }) => {
      console.log('📨 WebSocket suggestions received:', data.suggestions.length, 'results', 'mode:', data.mode);
      setSuggestions(data.suggestions);
      setResponseTime(data.responseTime);
      setMode(data.mode || 'basic_suggestions');
      setLoading(false); // Ensure loading is reset
      setError(null); // Clear any previous errors
    };

    const handleSuggestionsError = (data: { error: string; message: string }) => {
      console.error('❌ WebSocket suggestions error:', data);
      setError(data.message);
      setSuggestions([]);
      setLoading(false); // Ensure loading is reset
    };

    webSocketService.on('suggestions_response', handleSuggestionsResponse);
    webSocketService.on('suggestions_error', handleSuggestionsError);

    return () => {
      webSocketService.off('suggestions_response', handleSuggestionsResponse);
      webSocketService.off('suggestions_error', handleSuggestionsError);
    };
  }, [useWebSocket]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    suggestions,
    loading,
    error,
    responseTime,
    mode,
    getSuggestions,
    clearSuggestions
  };
}
