import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseEntity {
  entity_type: string;
  entity_id: string;
  display_label: string;
  entity_data: any;
  search_rank?: number;
}

export interface AuditTrailEntry {
  token_id: string;
  entity_table: string;
  entity_id: string;
  offset_start: number;
  offset_end: number;
  user_id?: string;
  document_id?: string;
  metadata?: any;
}

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://xlvdasysekzforztqlds.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdmRhc3lzZWt6Zm9yenRxbGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjY0OTksImV4cCI6MjA2OTU0MjQ5OX0.kzbZLHGUsX3nf-IfWj2zzSovTbMWjwA4m6463mFbgnU';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and ANON_KEY must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Search entities using the advanced search function
   */
  async searchEntities(
    searchText: string,
    entityTypes: string[] = ['customer', 'product', 'user', 'task', 'sale', 'stock', 'shift', 'attendance', 'date_dimension', 'audit_trail'],
    limitResults: number = 15
  ): Promise<DatabaseEntity[]> {
    try {
      // Enhanced multi-table search with comprehensive field coverage
      const results: DatabaseEntity[] = [];
      const queryLower = searchText.toLowerCase().trim();

      // Search customers across all fields
      if (entityTypes.includes('customer')) {
        const { data: customers } = await this.supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${queryLower}%,email.ilike.%${queryLower}%,company.ilike.%${queryLower}%,phone.ilike.%${queryLower}%,address.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (customers) {
          results.push(...customers.map(c => ({
            entity_id: c.id,
            entity_type: 'customer',
            display_label: c.name,
            entity_data: c,
            search_rank: this.calculateMatchScore(queryLower, [c.name, c.email, c.company, c.phone, c.address])
          })));
        }
      }

      // Search products across all fields
      if (entityTypes.includes('product')) {
        const { data: products } = await this.supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${queryLower}%,description.ilike.%${queryLower}%,category.ilike.%${queryLower}%,sku.ilike.%${queryLower}%,price::text.ilike.%${queryLower}%,stock_quantity::text.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (products) {
          results.push(...products.map(p => ({
            entity_id: p.id,
            entity_type: 'product',
            display_label: p.name,
            entity_data: p,
            search_rank: this.calculateMatchScore(queryLower, [p.name, p.description, p.category, p.sku, p.price?.toString(), p.stock_quantity?.toString()])
          })));
        }
      }

      // Search users across all fields
      if (entityTypes.includes('user')) {
        const { data: users } = await this.supabase
          .from('users')
          .select('*')
          .or(`full_name.ilike.%${queryLower}%,email.ilike.%${queryLower}%,role.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (users) {
          results.push(...users.map(u => ({
            entity_id: u.id,
            entity_type: 'user',
            display_label: u.full_name,
            entity_data: u,
            search_rank: this.calculateMatchScore(queryLower, [u.full_name, u.email, u.role])
          })));
        }
      }

      // Search tasks across all fields
      if (entityTypes.includes('task')) {
        const { data: tasks } = await this.supabase
          .from('tasks')
          .select('*')
          .or(`title.ilike.%${queryLower}%,description.ilike.%${queryLower}%,status.ilike.%${queryLower}%,priority.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (tasks) {
          results.push(...tasks.map(t => ({
            entity_id: t.id,
            entity_type: 'task',
            display_label: t.title,
            entity_data: t,
            search_rank: this.calculateMatchScore(queryLower, [t.title, t.description, t.status, t.priority])
          })));
        }
      }

      // Search sales across all fields
      if (entityTypes.includes('sale')) {
        const { data: sales } = await this.supabase
          .from('sales')
          .select('*')
          .or(`quantity::text.ilike.%${queryLower}%,unit_price::text.ilike.%${queryLower}%,total_amount::text.ilike.%${queryLower}%,status.ilike.%${queryLower}%,notes.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (sales) {
          results.push(...sales.map(s => ({
            entity_id: s.id,
            entity_type: 'sale',
            display_label: `sale ${s.id.substring(0, 8)}`,
            entity_data: s,
            search_rank: this.calculateMatchScore(queryLower, [s.quantity?.toString(), s.unit_price?.toString(), s.total_amount?.toString(), s.status, s.notes])
          })));
        }
      }

      // Search stock across all fields
      if (entityTypes.includes('stock')) {
        const { data: stock } = await this.supabase
          .from('stock')
          .select('*, products(name)')
          .or(`warehouse_location.ilike.%${queryLower}%,quantity_available::text.ilike.%${queryLower}%,reserved_quantity::text.ilike.%${queryLower}%,reorder_level::text.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (stock) {
          results.push(...stock.map(st => ({
            entity_id: st.id,
            entity_type: 'stock',
            display_label: `stock for ${(st.products as any)?.name || 'unknown'}`,
            entity_data: st,
            search_rank: this.calculateMatchScore(queryLower, [st.warehouse_location, st.quantity_available?.toString(), st.reserved_quantity?.toString(), st.reorder_level?.toString()])
          })));
        }
      }

      // Search shifts across all fields
      if (entityTypes.includes('shift')) {
        const { data: shifts } = await this.supabase
          .from('shifts')
          .select('*')
          .or(`start_time::text.ilike.%${queryLower}%,end_time::text.ilike.%${queryLower}%,break_duration::text.ilike.%${queryLower}%,location.ilike.%${queryLower}%,notes.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (shifts) {
          results.push(...shifts.map(sh => ({
            entity_id: sh.id,
            entity_type: 'shift',
            display_label: `shift ${sh.shift_date} ${sh.start_time}`,
            entity_data: sh,
            search_rank: this.calculateMatchScore(queryLower, [sh.start_time?.toString(), sh.end_time?.toString(), sh.break_duration?.toString(), sh.location, sh.notes])
          })));
        }
      }

      // Search attendance across all fields
      if (entityTypes.includes('attendance')) {
        const { data: attendance } = await this.supabase
          .from('attendance')
          .select('*, users(full_name)')
          .or(`clock_in::text.ilike.%${queryLower}%,clock_out::text.ilike.%${queryLower}%,break_start::text.ilike.%${queryLower}%,break_end::text.ilike.%${queryLower}%,status.ilike.%${queryLower}%,notes.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (attendance) {
          results.push(...attendance.map(a => ({
            entity_id: a.id,
            entity_type: 'attendance',
            display_label: `attendance ${(a.users as any)?.full_name || 'unknown'}`,
            entity_data: a,
            search_rank: this.calculateMatchScore(queryLower, [a.clock_in?.toString(), a.clock_out?.toString(), a.break_start?.toString(), a.break_end?.toString(), a.status, a.notes])
          })));
        }
      }

      // Search date dimension
      if (entityTypes.includes('date_dimension')) {
        const { data: dates } = await this.supabase
          .from('date_dimension')
          .select('*')
          .or(`year::text.ilike.%${queryLower}%,month_name.ilike.%${queryLower}%,day_name.ilike.%${queryLower}%,quarter::text.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (dates) {
          results.push(...dates.map(d => ({
            entity_id: d.date_key,
            entity_type: 'date',
            display_label: `${d.month_name?.toLowerCase()} (${d.date_key})`,
            entity_data: d,
            search_rank: this.calculateMatchScore(queryLower, [d.year?.toString(), d.month_name, d.day_name, d.quarter?.toString()])
          })));
        }
      }

      // Search audit trail
      if (entityTypes.includes('audit_trail')) {
        const { data: audit } = await this.supabase
          .from('audit_trail')
          .select('*')
          .or(`entity_table.ilike.%${queryLower}%,action.ilike.%${queryLower}%,document_context.ilike.%${queryLower}%`)
          .limit(limitResults);

        if (audit) {
          results.push(...audit.map(at => ({
            entity_id: at.id,
            entity_type: 'audit_trail',
            display_label: `${at.action} on ${at.entity_table}`,
            entity_data: at,
            search_rank: this.calculateMatchScore(queryLower, [at.entity_table, at.action, at.document_context])
          })));
        }
      }

      // Sort by relevance and remove duplicates
      const uniqueResults = results
        .filter((item, index, self) => 
          index === self.findIndex(t => t.entity_id === item.entity_id && t.entity_type === item.entity_type)
        )
        .sort((a, b) => (b.search_rank || 0) - (a.search_rank || 0))
        .slice(0, limitResults);

      return uniqueResults;

    } catch (error) {
      console.error('Failed to search entities:', error);
      throw error;
    }
  }

  /**
   * Calculate match score based on field matches
   */
  private calculateMatchScore(query: string, fields: (string | null | undefined)[]): number {
    let maxScore = 0;
    const queryWords = query.split(' ').filter(w => w.length > 0);

    for (const field of fields) {
      if (!field) continue;
      
      const fieldLower = field.toLowerCase();
      let fieldScore = 0;

      // Exact match gets highest score
      if (fieldLower === query) {
        fieldScore = 1.0;
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(query)) {
        fieldScore = 0.9;
      }
      // Contains exact query gets good score
      else if (fieldLower.includes(query)) {
        fieldScore = 0.8;
      }
      // Word matches get decent score
      else {
        const matchedWords = queryWords.filter(word => fieldLower.includes(word));
        if (matchedWords.length > 0) {
          fieldScore = 0.5 + (matchedWords.length / queryWords.length) * 0.3;
        }
      }

      maxScore = Math.max(maxScore, fieldScore);
    }

    return maxScore;
  }

  /**
   * Resolve pronouns to actual entities
   */
  async resolvePronoun(pronounText: string, currentUserId: string): Promise<DatabaseEntity[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('resolve_pronoun', {
          pronoun_text: pronounText,
          user_id_param: currentUserId
        });

      if (error) {
        console.error('Pronoun resolution error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to resolve pronoun:', error);
      throw error;
    }
  }

  /**
   * Get user by auth UID
   */
  async getUserByAuthId(authId: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_uid', authId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Get user error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  /**
   * Create audit trail entry
   */
  async createAuditTrail(entry: AuditTrailEntry): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('audit_trail')
        .insert(entry)
        .select()
        .single();

      if (error) {
        console.error('Audit trail creation error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create audit trail:', error);
      throw error;
    }
  }

  /**
   * Get audit trail entries for a document
   */
  async getAuditTrail(documentId: string, userId?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('audit_trail')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get audit trail error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      throw error;
    }
  }

  /**
   * Get entity by table and ID
   */
  async getEntityById(table: string, id: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Get entity error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get entity:', error);
      throw error;
    }
  }

  /**
   * Get all customers (for demo)
   */
  async getCustomers(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Get customers error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get customers:', error);
      throw error;
    }
  }

  /**
   * Get all products (for demo)
   */
  async getProducts(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Get products error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Parse date expressions using Supabase function
   */
  async parseDateExpression(dateText: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .rpc('parse_date_expression', {
          date_text: dateText
        });

      if (error) {
        console.error('Date parsing error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to parse date expression:', error);
      throw error;
    }
  }

}




