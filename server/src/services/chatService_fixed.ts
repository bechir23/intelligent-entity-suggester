import { SupabaseService } from './supabase.js';

interface EntityMatch {
  text: string;
  type: 'entity' | 'info' | 'temporal' | 'pronoun' | 'user_filter' | 'product_filter' | 'status_filter' | 'location_filter' | 'numeric_filter';
  table?: string;
  actualValue?: string;
  value?: string;
  color: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
  hoverText?: string;
  isFilter?: boolean;
  suggestions?: string[];
  field?: string;
  filterType?: string;
  metadata?: any;
}

interface QueryResult {
  response: string;
  responseEntities: EntityMatch[];
  entities: EntityMatch[];
  data: any[];
  query?: { sql?: string };
  summary?: { primaryTable?: string; joinTables?: string[] };
  currentUser?: string;
  currentDate?: string;
  recordCount?: number;
}

export class ChatService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  // Get entity color based on type
  private getEntityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'entity': '#2563EB',        
      'info': '#059669',          
      'temporal': '#7C3AED',      
      'pronoun': '#DC2626',       
      'user_filter': '#DC2626',   
      'product_filter': '#059669', 
      'status_filter': '#EA580C', 
      'location_filter': '#0891B2',
      'numeric_filter': '#F59E0B'
    };
    return colors[type] || '#6B7280';
  }

  // Enhanced entity extraction with proper location/temporal/pronoun handling
  private extractEntities(query: string): EntityMatch[] {
    const entities: EntityMatch[] = [];
    const words = query.toLowerCase().split(/\\s+/);
    const currentDate = new Date().toISOString().split('T')[0]; // 2025-08-03
    
    // Table entities
    const tableEntities = ['sales', 'customers', 'products', 'tasks', 'users', 'stock', 'shifts', 'attendance'];
    
    // Temporal patterns with actual resolution
    const temporalPatterns = {
      'today': currentDate,
      'yesterday': new Date(Date.now() - 86400000).toISOString().split('T')[0],
      'this week': `>= DATE_TRUNC('week', CURRENT_DATE)`,
      'last week': `>= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week') AND < DATE_TRUNC('week', CURRENT_DATE)`,
      'this month': `>= DATE_TRUNC('month', CURRENT_DATE)`,
      'last month': `>= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND < DATE_TRUNC('month', CURRENT_DATE)`
    };
    
    // Status patterns
    const statusPatterns = ['pending', 'completed', 'in_progress', 'not_started', 'cancelled'];
    
    // Location patterns - be very specific about location words
    const locationPatterns = ['paris', 'london', 'new york', 'tokyo', 'berlin', 'madrid', 'warehouse'];
    
    // Pronoun patterns
    const pronounPatterns = {
      'my': 'Ahmed Hassan',
      'me': 'Ahmed Hassan',
      'i': 'Ahmed Hassan'
    };
    
    // Product patterns (simplified)
    const productPatterns = ['laptop', 'mouse', 'keyboard', 'monitor', 'hub', 'webcam'];
    
    // Customer patterns (simplified)
    const customerPatterns = ['ahmed', 'john', 'jane', 'sarah', 'michael', 'lisa'];
    
    // Skip words that are prepositions or connectors
    const skipWords = ['of', 'for', 'with', 'by', 'at', 'on', 'the', 'a', 'an', 'and', 'or'];
    
    let currentIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const originalText = query.split(/\\s+/)[i]; // preserve original case
      
      // Skip common prepositions and connectors
      if (skipWords.includes(word)) {
        currentIndex += originalText.length + 1;
        continue;
      }
      
      // Table entities
      if (tableEntities.includes(word)) {
        entities.push({
          text: originalText,
          type: 'entity',
          table: word,
          value: word,
          color: this.getEntityColor('entity'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 1.0,
          hoverText: `Table: ${word}`
        });
      }
      // Temporal entities with actual resolution
      else if (Object.keys(temporalPatterns).some(pattern => pattern.includes(word) || word === 'today' || word === 'yesterday')) {
        let temporalKey = word;
        let temporalText = originalText;
        
        // Handle multi-word temporal expressions
        if (word === 'this' && i + 1 < words.length && ['week', 'month', 'year'].includes(words[i + 1])) {
          temporalKey = `${word} ${words[i + 1]}`;
          temporalText = `${originalText} ${query.split(/\\s+/)[i + 1]}`;
          i++; // skip next word
        } else if (word === 'last' && i + 1 < words.length && ['week', 'month', 'year'].includes(words[i + 1])) {
          temporalKey = `${word} ${words[i + 1]}`;
          temporalText = `${originalText} ${query.split(/\\s+/)[i + 1]}`;
          i++; // skip next word
        }
        
        const actualValue = temporalPatterns[temporalKey as keyof typeof temporalPatterns] || currentDate;
        
        entities.push({
          text: temporalText,
          type: 'temporal',
          actualValue: actualValue,
          value: temporalKey,
          color: this.getEntityColor('temporal'),
          startIndex: currentIndex,
          endIndex: currentIndex + temporalText.length,
          confidence: 0.9,
          hoverText: `Date: ${temporalText} → ${actualValue} (Resolved)`
        });
      }
      // Pronoun entities with user resolution
      else if (Object.keys(pronounPatterns).includes(word)) {
        const resolvedUser = pronounPatterns[word as keyof typeof pronounPatterns];
        entities.push({
          text: originalText,
          type: 'pronoun',
          actualValue: resolvedUser,
          value: word,
          color: this.getEntityColor('pronoun'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 1.0,
          hoverText: `User: ${originalText} → ${resolvedUser} (Current User)`
        });
      }
      // Status filters
      else if (statusPatterns.includes(word)) {
        entities.push({
          text: originalText,
          type: 'status_filter',
          value: word,
          color: this.getEntityColor('status_filter'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 0.9,
          isFilter: true,
          hoverText: `Status filter: ${word}`
        });
      }
      // Location filters - ONLY detect actual city names, not prepositions like "in"
      else if (locationPatterns.includes(word) && word !== 'in') {
        entities.push({
          text: originalText,
          type: 'location_filter',
          value: word,
          color: this.getEntityColor('location_filter'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 0.8,
          isFilter: true,
          hoverText: `Location filter: ${word}`
        });
      }
      // Product entities
      else if (productPatterns.includes(word)) {
        entities.push({
          text: originalText,
          type: 'info',
          table: 'products',
          value: word,
          color: this.getEntityColor('info'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 0.8,
          hoverText: `Product: ${word}`
        });
      }
      // Customer entities
      else if (customerPatterns.includes(word)) {
        entities.push({
          text: originalText,
          type: 'info',
          table: 'customers',
          value: word,
          actualValue: word === 'ahmed' ? 'ahmed hassan' : word,
          color: this.getEntityColor('info'),
          startIndex: currentIndex,
          endIndex: currentIndex + originalText.length,
          confidence: 0.8,
          hoverText: `Customer: ${word}`
        });
      }
      // Numeric filters
      else if (/^(above|below|less than|greater than|more than)\\s+\\d+$/.test(words.slice(i).join(' ').substring(0, 20))) {
        const numericMatch = words.slice(i).join(' ').match(/^(above|below|less than|greater than|more than)\\s+(\\d+)/);
        if (numericMatch) {
          const operator = numericMatch[1];
          const value = numericMatch[2];
          const fullText = `${operator} ${value}`;
          
          entities.push({
            text: fullText,
            type: 'numeric_filter',
            value: fullText,
            color: this.getEntityColor('numeric_filter'),
            startIndex: currentIndex,
            endIndex: currentIndex + fullText.length,
            confidence: 0.9,
            isFilter: true,
            hoverText: `Numeric filter: ${fullText}`
          });
          i += numericMatch[0].split(' ').length - 1; // skip processed words
        }
      }
      
      currentIndex += originalText.length + 1;
    }
    
    return entities;
  }

  // Generate SQL based on entities
  private generateSQL(entities: EntityMatch[]): string {
    const primaryTable = entities.find(e => e.type === 'entity')?.table || 'products';
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sql = `SELECT * FROM ${primaryTable}`;
    const conditions: string[] = [];
    
    // Process each entity
    entities.forEach(entity => {
      switch (entity.type) {
        case 'temporal':
          if (entity.text.toLowerCase() === 'today') {
            conditions.push(`DATE(created_at) = '${currentDate}'`);
          } else if (entity.text.toLowerCase() === 'yesterday') {
            conditions.push(`DATE(created_at) = '${currentDate}'::date - INTERVAL '1 day'`);
          } else if (entity.actualValue && entity.actualValue.includes('DATE_TRUNC')) {
            conditions.push(`created_at ${entity.actualValue}`);
          }
          break;
          
        case 'pronoun':
          if (entity.actualValue === 'Ahmed Hassan') {
            if (primaryTable === 'tasks') {
              conditions.push(`assigned_to = (SELECT id FROM users WHERE full_name = 'Ahmed Hassan')`);
            } else if (primaryTable === 'sales') {
              conditions.push(`salesperson_id = (SELECT id FROM users WHERE full_name = 'Ahmed Hassan')`);
            }
          }
          break;
          
        case 'status_filter':
          conditions.push(`status = '${entity.value}'`);
          break;
          
        case 'location_filter':
          if (primaryTable === 'customers') {
            conditions.push(`city ILIKE '%${entity.value}%'`);
          } else if (primaryTable === 'stock') {
            conditions.push(`warehouse_location ILIKE '%${entity.value}%'`);
          }
          break;
          
        case 'numeric_filter':
          if (entity.value?.includes('above')) {
            const num = entity.value.match(/\\d+/)?.[0];
            if (primaryTable === 'sales') {
              conditions.push(`total_amount > ${num}`);
            } else if (primaryTable === 'stock') {
              conditions.push(`quantity > ${num}`);
            }
          } else if (entity.value?.includes('below') || entity.value?.includes('less than')) {
            const num = entity.value.match(/\\d+/)?.[0];
            if (primaryTable === 'sales') {
              conditions.push(`total_amount < ${num}`);
            } else if (primaryTable === 'stock') {
              conditions.push(`quantity < ${num}`);
            }
          }
          break;
          
        case 'info':
          if (entity.table === 'products' && entity.value) {
            conditions.push(`name ILIKE '%${entity.value}%'`);
          } else if (entity.table === 'customers' && entity.actualValue) {
            conditions.push(`name ILIKE '%${entity.actualValue}%'`);
          }
          break;
      }
    });
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    return sql;
  }

  // Simple data fetching without complex caching
  private async fetchData(tableName: string, entities: EntityMatch[]): Promise<any[]> {
    try {
      let query = this.supabaseService.getClient().from(tableName).select('*');
      
      // Apply simple filters
      entities.forEach(entity => {
        if (entity.type === 'info' && entity.value) {
          if (tableName === 'products' && entity.value) {
            query = query.or(`name.ilike.%${entity.value}%,description.ilike.%${entity.value}%`);
          } else if (tableName === 'customers' && entity.actualValue) {
            query = query.or(`name.ilike.%${entity.actualValue}%,email.ilike.%${entity.actualValue}%`);
          }
        }
        
        if (entity.type === 'status_filter') {
          query = query.eq('status', entity.value);
        }
        
        if (entity.type === 'location_filter') {
          if (tableName === 'customers') {
            query = query.ilike('city', `%${entity.value}%`);
          }
        }
      });
      
      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('Query error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  }

  async processQuery(message: string, userName: string = 'Ahmed Hassan'): Promise<QueryResult> {
    try {
      console.log(`🚀 Processing query: "${message}"`);
      
      // Extract entities
      const entities = this.extractEntities(message);
      console.log(`✅ Extracted ${entities.length} entities:`, entities.map(e => `${e.text} (${e.type})`));
      
      // Determine primary table
      const primaryTableEntity = entities.find(e => e.type === 'entity');
      const primaryTable = primaryTableEntity?.table || 'products';
      
      // Generate SQL
      const sql = this.generateSQL(entities);
      console.log(`🗄️ Generated SQL: ${sql}`);
      
      // Fetch data
      const data = await this.fetchData(primaryTable, entities);
      console.log(`📊 Fetched ${data.length} records from ${primaryTable}`);
      
      // Build response
      const result: QueryResult = {
        response: `Found ${data.length} ${primaryTable} records`,
        responseEntities: entities,
        entities: entities,
        data: data,
        query: { sql: sql },
        summary: { 
          primaryTable: primaryTable,
          joinTables: [primaryTable]
        },
        currentUser: userName,
        currentDate: new Date().toISOString().split('T')[0],
        recordCount: data.length
      };
      
      return result;
    } catch (error) {
      console.error('❌ Chat service error:', error);
      
      return {
        response: 'Error processing query',
        responseEntities: [],
        entities: [],
        data: [],
        query: { sql: 'ERROR: ' + (error as Error).message },
        summary: { primaryTable: 'error', joinTables: [] },
        currentUser: userName,
        currentDate: new Date().toISOString().split('T')[0],
        recordCount: 0
      };
    }
  }
}
