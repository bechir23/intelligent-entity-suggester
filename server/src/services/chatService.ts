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
  extractEntities(query: string): EntityMatch[] {
    const entities: EntityMatch[] = [];
    const words = query.toLowerCase().split(/\s+/);
    const currentDate = new Date().toISOString().split('T')[0]; // 2025-08-03
    
    console.log(`🔍 Entity extraction for: "${query}"`);
    console.log(`🔍 Words: [${words.join(', ')}]`);
    
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
    const customerPatterns = ['ahmed', 'john', 'jane', 'sarah', 'michael', 'lisa', 'david', 'emma', 'alex'];
    
    // Skip words that are prepositions or connectors
    const skipWords = ['of', 'for', 'with', 'by', 'at', 'on', 'the', 'a', 'an', 'and', 'or', 'in'];
    
    // Numeric patterns for detecting numeric filters
    const numericPatterns = ['above', 'below', 'less', 'than', 'greater', 'more', 'under', 'over'];
    
    let currentIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const originalText = query.split(/\s+/)[i]; // preserve original case
      
      console.log(`🔍 Processing word: "${word}" (original: "${originalText}")`);
      
      // Skip common prepositions and connectors
      if (skipWords.includes(word)) {
        console.log(`  ⏭️ Skipping skip word: ${word}`);
        currentIndex += originalText.length + 1;
        continue;
      }
      
      let entityFound = false;
      
      // Check for numeric filters first (multi-word patterns)
      if (numericPatterns.includes(word)) {
        let numericExpression = word;
        let numericText = originalText;
        let endIndex = i;
        
        // Look ahead for complete numeric expressions
        if (word === 'less' && i + 1 < words.length && words[i + 1] === 'than') {
          numericExpression += ' than';
          numericText += ` ${query.split(/\s+/)[i + 1]}`;
          endIndex = i + 1;
        } else if (word === 'greater' && i + 1 < words.length && words[i + 1] === 'than') {
          numericExpression += ' than';
          numericText += ` ${query.split(/\s+/)[i + 1]}`;
          endIndex = i + 1;
        } else if (word === 'more' && i + 1 < words.length && words[i + 1] === 'than') {
          numericExpression += ' than';
          numericText += ` ${query.split(/\s+/)[i + 1]}`;
          endIndex = i + 1;
        }
        
        // Look for the number that follows
        let numberFound = false;
        for (let j = endIndex + 1; j < Math.min(endIndex + 3, words.length); j++) {
          if (/^\d+$/.test(words[j])) {
            numericExpression += ` ${words[j]}`;
            numericText += ` ${query.split(/\s+/)[j]}`;
            endIndex = j;
            numberFound = true;
            break;
          }
        }
        
        if (numberFound) {
          entities.push({
            text: numericText,
            type: 'numeric_filter',
            value: numericExpression,
            color: this.getEntityColor('numeric_filter'),
            startIndex: currentIndex,
            endIndex: currentIndex + numericText.length,
            confidence: 0.9,
            isFilter: true,
            hoverText: `Numeric filter: ${numericText}`
          });
          console.log(`  ✅ Numeric filter: ${numericExpression}`);
          entityFound = true;
          i = endIndex; // Skip processed words
        }
      }
      
      // Table entities
      if (!entityFound && tableEntities.includes(word)) {
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
        console.log(`  ✅ Table entity: ${word}`);
        entityFound = true;
      }
      // Temporal entities with actual resolution - Enhanced for multi-word patterns
      else if (!entityFound && (Object.keys(temporalPatterns).includes(word) || word === 'today' || word === 'yesterday' || word === 'this' || word === 'last')) {
        let temporalKey = word;
        let temporalText = originalText;
        let skipNext = false;
        
        // Handle multi-word temporal expressions
        if (word === 'this' && i + 1 < words.length && ['week', 'month', 'year'].includes(words[i + 1])) {
          temporalKey = `${word} ${words[i + 1]}`;
          temporalText = `${originalText} ${query.split(/\s+/)[i + 1]}`;
          skipNext = true;
        } else if (word === 'last' && i + 1 < words.length && ['week', 'month', 'year'].includes(words[i + 1])) {
          temporalKey = `${word} ${words[i + 1]}`;
          temporalText = `${originalText} ${query.split(/\s+/)[i + 1]}`;
          skipNext = true;
        }
        
        // Only proceed if we have a valid temporal pattern or it's a standalone temporal word
        if (temporalPatterns[temporalKey as keyof typeof temporalPatterns] || word === 'today' || word === 'yesterday') {
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
          console.log(`  ✅ Temporal entity: ${temporalKey} -> ${actualValue}`);
          entityFound = true;
          
          if (skipNext) {
            i++; // skip next word since we processed it
          }
        }
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
        console.log(`  ✅ Pronoun entity: ${word} -> ${resolvedUser}`);
        entityFound = true;
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
        console.log(`  ✅ Status filter: ${word}`);
        entityFound = true;
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
        console.log(`  ✅ Location filter: ${word}`);
        entityFound = true;
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
        console.log(`  ✅ Product info: ${word}`);
        entityFound = true;
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
        console.log(`  ✅ Customer info: ${word}`);
        entityFound = true;
      }
      
      if (!entityFound) {
        console.log(`  ❌ No entity found for: ${word}`);
      }
      
      currentIndex += originalText.length + 1;
    }
    
    console.log(`📊 Total entities extracted: ${entities.length}`);
    entities.forEach((e, i) => console.log(`  ${i + 1}. ${e.text} (${e.type}) -> ${e.actualValue || e.value}`));
    
    return entities;
  }

  // Enhanced SQL generation with proper JOINs and multi-table support
  private generateSQL(entities: EntityMatch[]): string {
    // Better primary table detection - prioritize explicit table entities
    let primaryTable = 'products'; // default
    const tableEntities = entities.filter(e => e.type === 'entity');
    
    if (tableEntities.length > 0) {
      // If we have multiple table entities, prioritize based on common patterns
      if (tableEntities.find(e => e.table === 'sales')) primaryTable = 'sales';
      else if (tableEntities.find(e => e.table === 'tasks')) primaryTable = 'tasks';
      else if (tableEntities.find(e => e.table === 'stock')) primaryTable = 'stock';
      else if (tableEntities.find(e => e.table === 'customers')) primaryTable = 'customers';
      else primaryTable = tableEntities[0].table || 'products';
    } else {
      // Infer primary table from context when no explicit table entity
      const hasCustomer = entities.some(e => e.table === 'customers');
      const hasProduct = entities.some(e => e.table === 'products');
      const hasPronoun = entities.some(e => e.type === 'pronoun');
      
      if (hasCustomer && hasProduct) primaryTable = 'sales'; // Customer + Product suggests sales
      else if (hasPronoun) primaryTable = 'tasks'; // Pronoun suggests tasks (assigned_to user)
      else if (hasProduct && entities.some(e => e.type === 'numeric_filter')) primaryTable = 'stock'; // Product + Numeric suggests stock
      else if (hasCustomer) primaryTable = 'customers';
      else if (hasProduct) primaryTable = 'products';
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Detect required tables for JOINs
    const requiredTables = new Set<string>([primaryTable]);
    const joins: string[] = [];
    const conditions: string[] = [];
    
    // Analyze entities to determine required JOINs
    entities.forEach(entity => {
      if (entity.type === 'info' && entity.table && entity.table !== primaryTable) {
        requiredTables.add(entity.table);
      }
      // Also consider location filters that might need customer joins
      if (entity.type === 'location_filter' && primaryTable !== 'customers' && primaryTable !== 'stock') {
        requiredTables.add('customers');
      }
    });
    
    // Start building SQL
    let sql = `SELECT ${primaryTable}.*`;
    
    // Add JOINs based on detected relationships
    if (requiredTables.has('products') && primaryTable !== 'products') {
      if (primaryTable === 'sales') {
        joins.push('LEFT JOIN products ON sales.product_id = products.id');
        sql += ', products.name as product_name, products.description as product_description';
      } else if (primaryTable === 'stock') {
        joins.push('LEFT JOIN products ON stock.product_id = products.id');
        sql += ', products.name as product_name, products.description as product_description';
      }
    }
    
    if (requiredTables.has('customers') && primaryTable !== 'customers') {
      if (primaryTable === 'sales') {
        joins.push('LEFT JOIN customers ON sales.customer_id = customers.id');
        sql += ', customers.name as customer_name, customers.email as customer_email';
      } else if (primaryTable === 'tasks') {
        // Tasks table doesn't have customer_id, only assigned_to (user)
        // If we need customer info for tasks, we'd need a different relationship
        console.log('⚠️ Tasks table does not have customer_id field');
      } else if (primaryTable === 'stock') {
        // For location filters on stock, we might need customers through sales
        joins.push('LEFT JOIN sales ON stock.product_id = sales.product_id');
        joins.push('LEFT JOIN customers ON sales.customer_id = customers.id');
        sql += ', customers.name as customer_name, customers.email as customer_email';
      }
    }
    
    if (requiredTables.has('users') && primaryTable !== 'users') {
      if (primaryTable === 'tasks') {
        joins.push('LEFT JOIN users ON tasks.assigned_to = users.id');
        sql += ', users.full_name as assigned_user_name';
      } else if (primaryTable === 'sales') {
        // Sales table doesn't have salesperson_id field
        console.log('⚠️ Sales table does not have salesperson_id field');
      }
    }
    
    sql += ` FROM ${primaryTable}`;
    
    // Add all JOINs
    if (joins.length > 0) {
      sql += ' ' + joins.join(' ');
    }
    
    // Process each entity for conditions
    entities.forEach(entity => {
      switch (entity.type) {
        case 'temporal':
          if (entity.text.toLowerCase() === 'today') {
            conditions.push(`DATE(${primaryTable}.created_at) = '${currentDate}'`);
          } else if (entity.text.toLowerCase() === 'yesterday') {
            conditions.push(`DATE(${primaryTable}.created_at) = '${currentDate}'::date - INTERVAL '1 day'`);
          } else if (entity.actualValue && entity.actualValue.includes('DATE_TRUNC')) {
            conditions.push(`${primaryTable}.created_at ${entity.actualValue}`);
          }
          break;
          
        case 'pronoun':
          if (entity.actualValue === 'Ahmed Hassan') {
            if (primaryTable === 'tasks') {
              conditions.push(`${primaryTable}.assigned_to = (SELECT id FROM users WHERE full_name = 'Ahmed Hassan')`);
            } else if (primaryTable === 'sales') {
              // Sales table doesn't have salesperson_id, so we can't filter by user
              // We could potentially filter by customer if the user is also a customer
              console.log('⚠️ Sales table does not have salesperson_id field');
            }
          }
          break;
          
        case 'status_filter':
          conditions.push(`${primaryTable}.status = '${entity.value}'`);
          break;
          
        case 'location_filter':
          if (primaryTable === 'customers') {
            conditions.push(`${primaryTable}.address ILIKE '%${entity.value}%'`);
          } else if (primaryTable === 'stock') {
            conditions.push(`${primaryTable}.warehouse_location ILIKE '%${entity.value}%'`);
          } else if (requiredTables.has('customers')) {
            conditions.push(`customers.address ILIKE '%${entity.value}%'`);
          }
          break;
          
        case 'numeric_filter':
          if (entity.value?.includes('above')) {
            const num = entity.value.match(/\d+/)?.[0];
            if (primaryTable === 'sales') {
              conditions.push(`${primaryTable}.total_amount > ${num}`);
            } else if (primaryTable === 'stock') {
              conditions.push(`${primaryTable}.quantity_available > ${num}`);
            } else if (primaryTable === 'products') {
              conditions.push(`${primaryTable}.price > ${num}`);
            }
          } else if (entity.value?.includes('below') || entity.value?.includes('less than')) {
            const num = entity.value.match(/\d+/)?.[0];
            if (primaryTable === 'sales') {
              conditions.push(`${primaryTable}.total_amount < ${num}`);
            } else if (primaryTable === 'stock') {
              conditions.push(`${primaryTable}.quantity_available < ${num}`);
            } else if (primaryTable === 'products') {
              conditions.push(`${primaryTable}.price < ${num}`);
            }
          }
          break;
          
        case 'info':
          if (entity.table === 'products') {
            if (requiredTables.has('products')) {
              conditions.push(`products.name ILIKE '%${entity.value}%'`);
            } else {
              conditions.push(`${primaryTable}.name ILIKE '%${entity.value}%'`);
            }
          } else if (entity.table === 'customers') {
            if (requiredTables.has('customers')) {
              conditions.push(`customers.name ILIKE '%${entity.actualValue || entity.value}%'`);
            } else {
              conditions.push(`${primaryTable}.name ILIKE '%${entity.actualValue || entity.value}%'`);
            }
          }
          break;
      }
    });
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    console.log(`🗄️ Generated SQL with ${joins.length} JOINs: ${sql}`);
    return sql;
  }

  // Simple data fetching without complex caching
  async fetchData(tableName: string, entities: EntityMatch[]): Promise<any[]> {
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
            query = query.ilike('address', `%${entity.value}%`);
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

// Create a singleton instance for export compatibility
const chatServiceInstance = new ChatService();

// Export both the class and an instance for compatibility
export const chatService = {
  processQuery: chatServiceInstance.processQuery.bind(chatServiceInstance),
  extractEntitiesAndInfo: chatServiceInstance.extractEntities.bind(chatServiceInstance),
  buildDynamicQuery: async (tableName: string, filters: EntityMatch[]) => {
    return chatServiceInstance.fetchData(tableName, filters);
  },
  getSearchableFieldNames: (entityType: string): string[] => {
    return ['id', 'name', 'email', 'description'];
  },
  getDisplayFieldNames: (entityType: string) => {
    return { id: 'ID', name: 'Name', email: 'Email' };
  },
  generateTableSuggestion: (text: string): string[] => {
    return [];
  },
  generateTableSuggestionAsync: async (text: string): Promise<string[]> => {
    const entities = chatServiceInstance.extractEntities(text);
    return [entities.find(e => e.type === 'entity')?.table || 'products'];
  },
  getSuggestions: async (query: string, entityType?: string) => {
    return [];
  }
};

export default chatService;
