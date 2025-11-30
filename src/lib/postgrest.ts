/**
 * PostgREST API Client
 * Replaces Supabase client with direct PostgREST API calls
 */

const API_URL = import.meta.env.VITE_SUPABASE_URL;

// Token management
let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    localStorage.setItem('sb-access-token', token);
  } else {
    localStorage.removeItem('sb-access-token');
  }
};

export const getAuthToken = (): string | null => {
  if (currentToken) return currentToken;
  return localStorage.getItem('sb-access-token');
};

// Base fetch function with auth headers
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Only add Authorization header if we have a valid JWT token (contains dots)
  if (token && token.includes('.')) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// RPC function calls
export const rpc = async <T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<{ data: T | null; error: unknown }> => {
  try {
    const response = await apiFetch(`/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      return { data: null, error };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Query builder class
class QueryBuilder<T = unknown> {
  private table: string;
  private selectColumns: string = '*';
  private filters: string[] = [];
  private orderBy: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): this {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push(`${column}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push(`${column}=neq.${encodeURIComponent(String(value))}`);
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push(`${column}=gt.${encodeURIComponent(String(value))}`);
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push(`${column}=gte.${encodeURIComponent(String(value))}`);
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push(`${column}=lt.${encodeURIComponent(String(value))}`);
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push(`${column}=lte.${encodeURIComponent(String(value))}`);
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push(`${column}=like.${encodeURIComponent(pattern)}`);
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push(`${column}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`);
    return this;
  }

  contains(column: string, value: unknown[]): this {
    this.filters.push(`${column}=cs.{${value.join(',')}}`);
    return this;
  }

  overlaps(column: string, value: unknown[]): this {
    this.filters.push(`${column}=ov.{${value.join(',')}}`);
    return this;
  }

  or(conditions: string): this {
    this.filters.push(`or=(${conditions})`);
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    // PostgREST syntax for NOT: column=not.operator.value
    // Example: id=not.is.null
    this.filters.push(`${column}=not.${operator}.${encodeURIComponent(String(value))}`);
    return this;
  }

  is(column: string, value: 'null' | 'true' | 'false'): this {
    this.filters.push(`${column}=is.${value}`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderBy.push(`${column}.${direction}`);
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.singleResult = true;
    this.limitValue = 1;
    return this;
  }

  maybeSingle(): this {
    this.maybeSingleResult = true;
    this.limitValue = 1;
    return this;
  }

  private buildQueryString(): string {
    const params: string[] = [];

    if (this.selectColumns !== '*') {
      // Normalize select string: remove newlines and extra whitespace
      // PostgREST expects compact select without extra whitespace
      const normalizedSelect = this.selectColumns
        .replace(/\s+/g, '') // Remove all whitespace
        .trim();
      params.push(`select=${encodeURIComponent(normalizedSelect)}`);
    }

    params.push(...this.filters);

    if (this.orderBy.length > 0) {
      params.push(`order=${this.orderBy.join(',')}`);
    }

    if (this.limitValue !== null) {
      params.push(`limit=${this.limitValue}`);
    }

    if (this.offsetValue !== null) {
      params.push(`offset=${this.offsetValue}`);
    }

    return params.length > 0 ? `?${params.join('&')}` : '';
  }

  async execute(): Promise<{ data: T | T[] | null; error: unknown }> {
    try {
      const queryString = this.buildQueryString();
      const response = await apiFetch(`/${this.table}${queryString}`);

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }

      let data = await response.json();

      if (this.singleResult || this.maybeSingleResult) {
        data = Array.isArray(data) ? data[0] || null : data;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1 = { data: T | T[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Insert builder
class InsertBuilder<T = unknown> {
  private table: string;
  private data: unknown;
  private returnData: boolean = false;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;

  constructor(table: string, data: unknown) {
    this.table = table;
    this.data = data;
  }

  select(): this {
    this.returnData = true;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): this {
    this.maybeSingleResult = true;
    return this;
  }

  async execute(): Promise<{ data: T | null; error: unknown }> {
    try {
      const headers: HeadersInit = {};
      if (this.returnData) {
        headers['Prefer'] = 'return=representation';
      }

      const response = await apiFetch(`/${this.table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(this.data),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }

      if (!this.returnData) {
        return { data: null, error: null };
      }

      let data = await response.json();

      if (this.singleResult || this.maybeSingleResult) {
        data = Array.isArray(data) ? data[0] || null : data;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1 = { data: T | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Update builder
class UpdateBuilder<T = unknown> {
  private table: string;
  private data: unknown;
  private filters: string[] = [];
  private returnData: boolean = false;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;

  constructor(table: string, data: unknown) {
    this.table = table;
    this.data = data;
  }

  eq(column: string, value: unknown): this {
    this.filters.push(`${column}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  select(): this {
    this.returnData = true;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): this {
    this.maybeSingleResult = true;
    return this;
  }

  async execute(): Promise<{ data: T | null; error: unknown }> {
    try {
      const queryString = this.filters.length > 0 ? `?${this.filters.join('&')}` : '';
      const headers: HeadersInit = {};
      if (this.returnData) {
        headers['Prefer'] = 'return=representation';
      }

      const response = await apiFetch(`/${this.table}${queryString}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(this.data),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }

      if (!this.returnData) {
        return { data: null, error: null };
      }

      let data = await response.json();

      if (this.singleResult || this.maybeSingleResult) {
        data = Array.isArray(data) ? data[0] || null : data;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1 = { data: T | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Delete builder
class DeleteBuilder {
  private table: string;
  private filters: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): this {
    this.filters.push(`${column}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  async execute(): Promise<{ error: unknown }> {
    try {
      const queryString = this.filters.length > 0 ? `?${this.filters.join('&')}` : '';

      const response = await apiFetch(`/${this.table}${queryString}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  then<TResult1 = { error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Table interface (mimics Supabase client)
const createTableInterface = (tableName: string) => ({
  select: (columns: string = '*') => new QueryBuilder(tableName).select(columns),
  insert: (data: unknown) => new InsertBuilder(tableName, data),
  update: (data: unknown) => new UpdateBuilder(tableName, data),
  delete: () => new DeleteBuilder(tableName),
});

// Main client object (compatible with Supabase client API)
export const postgrest = {
  from: (table: string) => createTableInterface(table),
  rpc,

  // Auth-like interface for compatibility
  auth: {
    getSession: async () => {
      const token = getAuthToken();
      if (!token) {
        return { data: { session: null }, error: null };
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          data: {
            session: {
              access_token: token,
              user: {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
              }
            }
          },
          error: null
        };
      } catch {
        return { data: { session: null }, error: null };
      }
    },
    getUser: async () => {
      const token = getAuthToken();
      if (!token) {
        return { data: { user: null }, error: null };
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          data: {
            user: {
              id: payload.sub,
              email: payload.email,
              role: payload.role,
            }
          },
          error: null
        };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
    signOut: async () => {
      setAuthToken(null);
      localStorage.removeItem('sb-user-id');
      return { error: null };
    },
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

// Export as supabase alias for easier migration
export const supabase = postgrest;

export default postgrest;
