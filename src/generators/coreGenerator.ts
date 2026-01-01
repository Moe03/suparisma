import fs from 'fs';
import path from 'path';
import { UTILS_DIR } from '../config';

/**
 * Generate core hook factory file
 */
export function generateCoreFile(): void {
  const coreContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

import { useEffect, useState, useCallback, useRef } from 'react';
// This import should be relative to its new location in utils/
import { supabase } from './supabase-client'; 

/**
 * Represents a single search query against a field
 * @example
 * // Search for users with names containing "john"
 * const query = { field: "name", value: "john" };
 * 
 * @example
 * // Search across multiple fields
 * const query = { field: "multi", value: "john" };
 */
export type SearchQuery = {
  /** The field name to search in, or "multi" for multi-field search */
  field: string;
  /** The search term/value to look for */
  value: string;
};

// Define type for Supabase query builder
export type SupabaseQueryBuilder = ReturnType<ReturnType<typeof supabase.from>['select']>;

/**
 * Utility function to escape regex special characters for safe RegExp usage
 * Prevents "Invalid regular expression" errors when search terms contain special characters
 */
export function escapeRegexCharacters(str: string): string {
  // Escape all special regex characters: ( ) [ ] { } + * ? ^ $ | . \\
  return str.replace(/[()\\[\\]{}+*?^$|.\\\\]/g, '\\\\\\\\$&');
}

/**
 * Generate a UUID v4, with fallback for environments without crypto.randomUUID()
 * Works in: browsers, Node.js, and React Native (with react-native-get-random-values polyfill)
 * 
 * For React Native, ensure you have installed and imported the polyfill:
 * - pnpm install react-native-get-random-values
 * - Import at app entry point: import 'react-native-get-random-values';
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID() first (modern browsers & Node.js 16.7+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback using crypto.getRandomValues() (works with react-native-get-random-values polyfill)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant (RFC 4122)
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
    
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return \`\${hex.slice(0, 8)}-\${hex.slice(8, 12)}-\${hex.slice(12, 16)}-\${hex.slice(16, 20)}-\${hex.slice(20)}\`;
  }
  
  // Last resort fallback using Math.random() (not cryptographically secure)
  console.warn('[Suparisma] crypto API not available, using Math.random() fallback for UUID generation');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Advanced filter operators for complex queries
 * @example
 * // Users older than 21
 * { age: { gt: 21 } }
 * 
 * @example
 * // Posts with titles containing "news"
 * { title: { contains: "news" } }
 * 
 * @example
 * // Array contains ANY of these items (overlaps)
 * { tags: { has: ["typescript", "react"] } }
 * 
 * @example
 * // Array contains ALL of these items (contains)
 * { categories: { hasEvery: ["tech", "programming"] } }
 * 
 * @example
 * // Array contains ANY of these items (same as 'has')
 * { tags: { hasSome: ["javascript", "python"] } }
 */
export type FilterOperators<T> = {
  /** Equal to value */
  equals?: T;
  /** Not equal to value */
  not?: T;
  /** Value is in the array */
  in?: T[];
  /** Value is not in the array */
  notIn?: T[];
  /** Less than value */
  lt?: T;
  /** Less than or equal to value */
  lte?: T;
  /** Greater than value */
  gt?: T;
  /** Greater than or equal to value */
  gte?: T;
  /** String contains value (case insensitive) */
  contains?: string;
  /** String starts with value (case insensitive) */
  startsWith?: string;
  /** String ends with value (case insensitive) */
  endsWith?: string;
  
  // Array-specific operators
  /** Array contains ANY of the specified items (for array fields) */
  has?: T extends Array<infer U> ? U[] : never;
  /** Array contains ANY of the specified items (alias for 'has') */
  hasSome?: T extends Array<infer U> ? U[] : never;
  /** Array contains ALL of the specified items (for array fields) */
  hasEvery?: T extends Array<infer U> ? U[] : never;
  /** Array is empty (for array fields) */
  isEmpty?: T extends Array<any> ? boolean : never;
};

// Type for a single field in an advanced where filter with OR/AND support
export type AdvancedWhereInput<T> = {
  [K in keyof T]?: T[K] | FilterOperators<T[K]>;
} & {
  /** Match ANY of the provided conditions */
  OR?: AdvancedWhereInput<T>[];
  /** Match ALL of the provided conditions */
  AND?: AdvancedWhereInput<T>[];
};

/**
 * Configuration options for the Suparisma hooks
 * @example
 * // Basic usage
 * const { data } = useSuparismaUser();
 * 
 * @example
 * // With filtering
 * const { data } = useSuparismaUser({
 *   where: { age: { gt: 21 } }
 * });
 * 
 * @example
 * // With ordering and limits
 * const { data } = useSuparismaUser({
 *   orderBy: { created_at: 'desc' },
 *   limit: 10
 * });
 */
/**
 * Select input type - specify which fields to return
 * Use true to include a field, or use an object for relations
 * @example
 * // Select specific fields
 * { id: true, name: true, email: true }
 * 
 * @example
 * // Select fields with relations
 * { id: true, name: true, posts: true }
 */
export type SelectInput<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Include input type - specify which relations to include
 * @example
 * // Include a relation with all fields
 * { posts: true }
 * 
 * @example
 * // Include a relation with specific fields
 * { posts: { select: { id: true, title: true } } }
 */
export type IncludeValue = boolean | { select?: Record<string, boolean> };

export type SuparismaOptions<
  TWhereInput,
  TOrderByInput,
  TSelectInput = Record<string, boolean>,
  TIncludeInput = Record<never, never>
> = {
  /** Whether to enable realtime updates (default: true) */
  realtime?: boolean;
  /** Custom channel name for realtime subscription */
  channelName?: string;
  /** Type-safe filter for queries and realtime events */
  where?: TWhereInput;
  /** Legacy string filter (use 'where' instead for type safety) */
  realtimeFilter?: string;
  /** Type-safe ordering for queries */
  orderBy?: TOrderByInput;
  /** Limit the number of records returned */
  limit?: number;
  /** Offset for pagination (skip records) */
  offset?: number;
  /** 
   * Select specific fields to return. Reduces payload size.
   * @example { id: true, name: true, email: true }
   */
  select?: TSelectInput;
  /**
   * Include related records (foreign key relations).
   * @example { posts: true } or { posts: { select: { id: true, title: true } } }
   */
  include?: TIncludeInput;
  /**
   * Whether to enable the hook (default: true).
   * When false, the hook will not fetch data or set up realtime subscriptions.
   * Useful for conditional fetching, e.g., waiting for auth/user data to be ready.
   * @example enabled: !!user?.id
   */
  enabled?: boolean;
};

/**
 * Return type for database operations
 * @example
 * const result = await users.create({ name: "John" });
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data);
 * }
 */
export type ModelResult<T> = Promise<{
  data: T;
  error: null;
} | {
  data: null;
  error: Error;
}>;

/**
 * Complete search state and methods for searchable models
 * @example
 * // Search for users with name containing "john"
 * users.search.addQuery({ field: "name", value: "john" });
 * 
 * @example
 * // Search across multiple fields
 * users.search.searchMultiField("john doe");
 * 
 * @example
 * // Check if search is loading
 * if (users.search.loading) {
 *   return <div>Searching...</div>;
 * }
 * 
 * @example
 * // Get current search terms for highlighting
 * const searchTerms = users.search.getCurrentSearchTerms();
 * 
 * @example
 * // Safely escape regex characters
 * const escaped = users.search.escapeRegex("user@example.com");
 */
export type SearchState = {
  /** Current active search queries */
  queries: SearchQuery[];
  /** Whether a search is currently in progress */
  loading: boolean;
  /** Replace all search queries with a new set */
  setQueries: (queries: SearchQuery[]) => void;
  /** Add a new search query (replaces existing query for same field) */
  addQuery: (query: SearchQuery) => void;
  /** Remove a search query by field name */
  removeQuery: (field: string) => void;
  /** Clear all search queries and return to normal data fetching */
  clearQueries: () => void;
  /** Search across multiple fields (convenience method) */
  searchMultiField: (value: string) => void;
  /** Search in a specific field (convenience method) */
  searchField: (field: string, value: string) => void;
  /** Get current search terms for custom highlighting */
  getCurrentSearchTerms: () => string[];
  /** Safely escape regex special characters */
  escapeRegex: (text: string) => string;
};

/**
 * Compare two values for sorting with proper type handling
 */
function compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
  // Handle undefined/null values
  if (a === undefined || a === null) return direction === 'asc' ? -1 : 1;
  if (b === undefined || b === null) return direction === 'asc' ? 1 : -1;
  
  // Handle numbers properly to ensure numeric comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' 
      ? a - b
      : b - a;
  }
  
  // Handle dates (convert to timestamps for comparison)
  if (a instanceof Date && b instanceof Date) {
    return direction === 'asc' 
      ? a.getTime() - b.getTime()
      : b.getTime() - a.getTime();
  }
  
  // Handle strings or mixed types with string conversion
  const aStr = String(a);
  const bStr = String(b);
  
  return direction === 'asc'
    ? aStr.localeCompare(bStr)
    : bStr.localeCompare(aStr);
}

/**
 * Convert a type-safe where filter to Supabase filter string
 * Note: Complex OR/AND operations may not be fully supported in realtime filters
 * and will fall back to client-side filtering
 */
export function buildFilterString<T>(where?: T): string | undefined {
  if (!where) return undefined;
  
  const whereObj = where as any;
  
  // Check for OR/AND operations - these are complex for realtime filters
  if (whereObj.OR || whereObj.AND) {
    console.log('⚠️ Complex OR/AND filters detected - realtime will use client-side filtering');
    // For complex logical operations, we'll rely on client-side filtering
    // Return undefined to indicate no database-level filter should be applied
    return undefined;
  }
  
  const filters: string[] = [];
  
  for (const [key, value] of Object.entries(whereObj)) {
    if (value !== undefined && key !== 'OR' && key !== 'AND') {
      if (typeof value === 'object' && value !== null) {
        // Handle advanced operators
        const advancedOps = value as unknown as FilterOperators<any>;
        
        if ('equals' in advancedOps && advancedOps.equals !== undefined) {
          filters.push(\`\${key}=eq.\${advancedOps.equals}\`);
        }
        
        if ('not' in advancedOps && advancedOps.not !== undefined) {
          filters.push(\`\${key}=neq.\${advancedOps.not}\`);
        }
        
        if ('gt' in advancedOps && advancedOps.gt !== undefined) {
          const value = advancedOps.gt instanceof Date ? advancedOps.gt.toISOString() : advancedOps.gt;
          filters.push(\`\${key}=gt.\${value}\`);
        }
        
        if ('gte' in advancedOps && advancedOps.gte !== undefined) {
          const value = advancedOps.gte instanceof Date ? advancedOps.gte.toISOString() : advancedOps.gte;
          filters.push(\`\${key}=gte.\${value}\`);
        }
        
        if ('lt' in advancedOps && advancedOps.lt !== undefined) {
          const value = advancedOps.lt instanceof Date ? advancedOps.lt.toISOString() : advancedOps.lt;
          filters.push(\`\${key}=lt.\${value}\`);
        }
        
        if ('lte' in advancedOps && advancedOps.lte !== undefined) {
          const value = advancedOps.lte instanceof Date ? advancedOps.lte.toISOString() : advancedOps.lte;
          filters.push(\`\${key}=lte.\${value}\`);
        }
        
        if ('in' in advancedOps && advancedOps.in?.length) {
          filters.push(\`\${key}=in.(\${advancedOps.in.join(',')})\`);
        }
        
        if ('contains' in advancedOps && advancedOps.contains !== undefined) {
          filters.push(\`\${key}=ilike.*\${advancedOps.contains}*\`);
        }
        
        if ('startsWith' in advancedOps && advancedOps.startsWith !== undefined) {
          filters.push(\`\${key}=ilike.\${advancedOps.startsWith}%\`);
        }
        
        if ('endsWith' in advancedOps && advancedOps.endsWith !== undefined) {
          filters.push(\`\${key}=ilike.%\${advancedOps.endsWith}\`);
        }
        
        // Array-specific operators
        if ('has' in advancedOps && advancedOps.has !== undefined) {
          // Array contains ANY of the specified items (overlaps)
          const arrayValue = JSON.stringify(advancedOps.has);
          filters.push(\`\${key}=ov.\${arrayValue}\`);
        }
        
        if ('hasEvery' in advancedOps && advancedOps.hasEvery !== undefined) {
          // Array contains ALL of the specified items (contains)
          const arrayValue = JSON.stringify(advancedOps.hasEvery);
          filters.push(\`\${key}=cs.\${arrayValue}\`);
        }
        
        if ('hasSome' in advancedOps && advancedOps.hasSome !== undefined) {
          // Array contains ANY of the specified items (overlaps)
          const arrayValue = JSON.stringify(advancedOps.hasSome);
          filters.push(\`\${key}=ov.\${arrayValue}\`);
        }
        
        if ('isEmpty' in advancedOps && advancedOps.isEmpty !== undefined) {
          if (advancedOps.isEmpty) {
            // Check if array is empty
            filters.push(\`\${key}=eq.{}\`);
          } else {
            // Check if array is not empty
            filters.push(\`\${key}=neq.{}\`);
          }
        }
      } else {
        // Simple equality
        filters.push(\`\${key}=eq.\${value}\`);
      }
    }
  }
  
  return filters.length > 0 ? filters.join(',') : undefined;
}

/**
 * Apply a single condition group to the query builder
 */
function applyConditionGroup<T>(
  query: SupabaseQueryBuilder, 
  conditions: T
): SupabaseQueryBuilder {
  if (!conditions) return query;

  let filteredQuery = query;
  
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && key !== 'OR' && key !== 'AND') {
      if (typeof value === 'object' && value !== null) {
        // Handle advanced operators
        const advancedOps = value as unknown as FilterOperators<any>;
        
        if ('equals' in advancedOps && advancedOps.equals !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.eq(key, advancedOps.equals);
        }
        
        if ('not' in advancedOps && advancedOps.not !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.neq(key, advancedOps.not);
        }
        
        if ('gt' in advancedOps && advancedOps.gt !== undefined) {
          // Convert Date objects to ISO strings for Supabase
          const value = advancedOps.gt instanceof Date ? advancedOps.gt.toISOString() : advancedOps.gt;
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.gt(key, value);
        }
        
        if ('gte' in advancedOps && advancedOps.gte !== undefined) {
          // Convert Date objects to ISO strings for Supabase
          const value = advancedOps.gte instanceof Date ? advancedOps.gte.toISOString() : advancedOps.gte;
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.gte(key, value);
        }
        
        if ('lt' in advancedOps && advancedOps.lt !== undefined) {
          // Convert Date objects to ISO strings for Supabase
          const value = advancedOps.lt instanceof Date ? advancedOps.lt.toISOString() : advancedOps.lt;
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.lt(key, value);
        }
        
        if ('lte' in advancedOps && advancedOps.lte !== undefined) {
          // Convert Date objects to ISO strings for Supabase
          const value = advancedOps.lte instanceof Date ? advancedOps.lte.toISOString() : advancedOps.lte;
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.lte(key, value);
        }
        
        if ('in' in advancedOps && advancedOps.in?.length) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.in(key, advancedOps.in);
        }
        
        if ('contains' in advancedOps && advancedOps.contains !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.ilike(key, \`*\${advancedOps.contains}*\`);
        }
        
        if ('startsWith' in advancedOps && advancedOps.startsWith !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.ilike(key, \`\${advancedOps.startsWith}%\`);
        }
        
        if ('endsWith' in advancedOps && advancedOps.endsWith !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.ilike(key, \`%\${advancedOps.endsWith}\`);
        }
        
        // Array-specific operators
        if ('has' in advancedOps && advancedOps.has !== undefined) {
          // Array contains ANY of the specified items (overlaps)
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.overlaps(key, advancedOps.has);
        }
        
        if ('hasEvery' in advancedOps && advancedOps.hasEvery !== undefined) {
          // Array contains ALL of the specified items (contains)
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.contains(key, advancedOps.hasEvery);
        }
        
        if ('hasSome' in advancedOps && advancedOps.hasSome !== undefined) {
          // Array contains ANY of the specified items (overlaps)
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.overlaps(key, advancedOps.hasSome);
        }
        
        if ('isEmpty' in advancedOps && advancedOps.isEmpty !== undefined) {
          if (advancedOps.isEmpty) {
            // Check if array is empty
            // @ts-ignore: Supabase typing issue
            filteredQuery = filteredQuery.eq(key, []);
          } else {
            // Check if array is not empty
            // @ts-ignore: Supabase typing issue  
            filteredQuery = filteredQuery.neq(key, []);
          }
        }
      } else {
        // Simple equality
        // @ts-ignore: Supabase typing issue
        filteredQuery = filteredQuery.eq(key, value);
      }
    }
  }
  
  return filteredQuery;
}

/**
 * Apply filter to the query builder with OR/AND support
 */
export function applyFilter<T>(
  query: SupabaseQueryBuilder, 
  where: T
): SupabaseQueryBuilder {
  if (!where) return query;

  const whereObj = where as any;
  let filteredQuery = query;
  
  // Handle regular conditions first (these are implicitly AND-ed)
  filteredQuery = applyConditionGroup(filteredQuery, whereObj);
  
  // Handle OR conditions
  if (whereObj.OR && Array.isArray(whereObj.OR) && whereObj.OR.length > 0) {
    // @ts-ignore: Supabase typing issue
    filteredQuery = filteredQuery.or(
      whereObj.OR.map((orCondition: any, index: number) => {
        // Convert each OR condition to a filter string
        const orFilters: string[] = [];
        
        for (const [key, value] of Object.entries(orCondition)) {
          if (value !== undefined && key !== 'OR' && key !== 'AND') {
            if (typeof value === 'object' && value !== null) {
              const advancedOps = value as unknown as FilterOperators<any>;
              
              if ('equals' in advancedOps && advancedOps.equals !== undefined) {
                orFilters.push(\`\${key}.eq.\${advancedOps.equals}\`);
              } else if ('not' in advancedOps && advancedOps.not !== undefined) {
                orFilters.push(\`\${key}.neq.\${advancedOps.not}\`);
              } else if ('gt' in advancedOps && advancedOps.gt !== undefined) {
                const value = advancedOps.gt instanceof Date ? advancedOps.gt.toISOString() : advancedOps.gt;
                orFilters.push(\`\${key}.gt.\${value}\`);
              } else if ('gte' in advancedOps && advancedOps.gte !== undefined) {
                const value = advancedOps.gte instanceof Date ? advancedOps.gte.toISOString() : advancedOps.gte;
                orFilters.push(\`\${key}.gte.\${value}\`);
              } else if ('lt' in advancedOps && advancedOps.lt !== undefined) {
                const value = advancedOps.lt instanceof Date ? advancedOps.lt.toISOString() : advancedOps.lt;
                orFilters.push(\`\${key}.lt.\${value}\`);
              } else if ('lte' in advancedOps && advancedOps.lte !== undefined) {
                const value = advancedOps.lte instanceof Date ? advancedOps.lte.toISOString() : advancedOps.lte;
                orFilters.push(\`\${key}.lte.\${value}\`);
              } else if ('in' in advancedOps && advancedOps.in?.length) {
                orFilters.push(\`\${key}.in.(\${advancedOps.in.join(',')})\`);
              } else if ('contains' in advancedOps && advancedOps.contains !== undefined) {
                orFilters.push(\`\${key}.ilike.*\${advancedOps.contains}*\`);
              } else if ('startsWith' in advancedOps && advancedOps.startsWith !== undefined) {
                orFilters.push(\`\${key}.ilike.\${advancedOps.startsWith}%\`);
              } else if ('endsWith' in advancedOps && advancedOps.endsWith !== undefined) {
                orFilters.push(\`\${key}.ilike.%\${advancedOps.endsWith}\`);
              } else if ('has' in advancedOps && advancedOps.has !== undefined) {
                orFilters.push(\`\${key}.ov.\${JSON.stringify(advancedOps.has)}\`);
              } else if ('hasEvery' in advancedOps && advancedOps.hasEvery !== undefined) {
                orFilters.push(\`\${key}.cs.\${JSON.stringify(advancedOps.hasEvery)}\`);
              } else if ('hasSome' in advancedOps && advancedOps.hasSome !== undefined) {
                orFilters.push(\`\${key}.ov.\${JSON.stringify(advancedOps.hasSome)}\`);
              } else if ('isEmpty' in advancedOps && advancedOps.isEmpty !== undefined) {
                if (advancedOps.isEmpty) {
                  orFilters.push(\`\${key}.eq.{}\`);
                } else {
                  orFilters.push(\`\${key}.neq.{}\`);
                }
              }
            } else {
              // Simple equality
              orFilters.push(\`\${key}.eq.\${value}\`);
            }
          }
        }
        
        return orFilters.join(',');
      }).join(',')
    );
  }
  
  // Handle AND conditions (these are applied in addition to regular conditions)
  if (whereObj.AND && Array.isArray(whereObj.AND) && whereObj.AND.length > 0) {
    for (const andCondition of whereObj.AND) {
      filteredQuery = applyConditionGroup(filteredQuery, andCondition);
    }
  }
  
  return filteredQuery;
}

/**
 * Evaluate if a record matches filter criteria (including OR/AND logic)
 */
function matchesFilter<T>(record: any, filter: T): boolean {
  if (!filter) return true;
  
  const filterObj = filter as any;
  
  // Separate regular conditions from OR/AND
  const hasOr = filterObj.OR && Array.isArray(filterObj.OR) && filterObj.OR.length > 0;
  const hasAnd = filterObj.AND && Array.isArray(filterObj.AND) && filterObj.AND.length > 0;
  
  // Check regular field conditions (these are implicitly AND-ed)
  const regularConditions: any = {};
  for (const [key, value] of Object.entries(filterObj)) {
    if (value !== undefined && key !== 'OR' && key !== 'AND') {
      regularConditions[key] = value;
    }
  }
  
  // Helper function to convert values to comparable format for date/time comparisons
  const getComparableValue = (value: any): any => {
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // ISO date string
      return new Date(value).getTime();
    }
    return value;
  };

  // Helper function to check individual field conditions
  const checkFieldConditions = (conditions: any): boolean => {
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined) {
        const recordValue = record[key];
        
        if (typeof value === 'object' && value !== null) {
          // Handle advanced operators
          const advancedOps = value as unknown as FilterOperators<any>;
          
          if ('equals' in advancedOps && advancedOps.equals !== undefined) {
            if (recordValue !== advancedOps.equals) return false;
          }
          
          if ('not' in advancedOps && advancedOps.not !== undefined) {
            if (recordValue === advancedOps.not) return false;
          }
          
          if ('gt' in advancedOps && advancedOps.gt !== undefined) {
            const recordComparable = getComparableValue(recordValue);
            const filterComparable = getComparableValue(advancedOps.gt);
            if (!(recordComparable > filterComparable)) return false;
          }
          
          if ('gte' in advancedOps && advancedOps.gte !== undefined) {
            const recordComparable = getComparableValue(recordValue);
            const filterComparable = getComparableValue(advancedOps.gte);
            if (!(recordComparable >= filterComparable)) return false;
          }
          
          if ('lt' in advancedOps && advancedOps.lt !== undefined) {
            const recordComparable = getComparableValue(recordValue);
            const filterComparable = getComparableValue(advancedOps.lt);
            if (!(recordComparable < filterComparable)) return false;
          }
          
          if ('lte' in advancedOps && advancedOps.lte !== undefined) {
            const recordComparable = getComparableValue(recordValue);
            const filterComparable = getComparableValue(advancedOps.lte);
            if (!(recordComparable <= filterComparable)) return false;
          }
          
          if ('in' in advancedOps && advancedOps.in?.length) {
            if (!advancedOps.in.includes(recordValue)) return false;
          }
          
          if ('contains' in advancedOps && advancedOps.contains !== undefined) {
            if (!recordValue || !String(recordValue).toLowerCase().includes(String(advancedOps.contains).toLowerCase())) return false;
          }
          
          if ('startsWith' in advancedOps && advancedOps.startsWith !== undefined) {
            if (!recordValue || !String(recordValue).toLowerCase().startsWith(String(advancedOps.startsWith).toLowerCase())) return false;
          }
          
          if ('endsWith' in advancedOps && advancedOps.endsWith !== undefined) {
            if (!recordValue || !String(recordValue).toLowerCase().endsWith(String(advancedOps.endsWith).toLowerCase())) return false;
          }
          
          // Array-specific operators
          if ('has' in advancedOps && advancedOps.has !== undefined) {
            if (!Array.isArray(recordValue) || !advancedOps.has.some((item: any) => recordValue.includes(item))) return false;
          }
          
          if ('hasEvery' in advancedOps && advancedOps.hasEvery !== undefined) {
            if (!Array.isArray(recordValue) || !advancedOps.hasEvery.every((item: any) => recordValue.includes(item))) return false;
          }
          
          if ('hasSome' in advancedOps && advancedOps.hasSome !== undefined) {
            if (!Array.isArray(recordValue) || !advancedOps.hasSome.some((item: any) => recordValue.includes(item))) return false;
          }
          
          if ('isEmpty' in advancedOps && advancedOps.isEmpty !== undefined) {
            const isEmpty = !Array.isArray(recordValue) || recordValue.length === 0;
            if (isEmpty !== advancedOps.isEmpty) return false;
          }
        } else {
          // Simple equality
          if (recordValue !== value) return false;
        }
      }
    }
    return true;
  };
  
  // All conditions that must be true
  const conditions: boolean[] = [];
  
  // Regular field conditions (implicitly AND-ed)
  if (Object.keys(regularConditions).length > 0) {
    conditions.push(checkFieldConditions(regularConditions));
  }
  
  // AND conditions (all must be true)
  if (hasAnd) {
    const andResult = filterObj.AND.every((andCondition: any) => matchesFilter(record, andCondition));
    conditions.push(andResult);
  }
  
  // OR conditions (at least one must be true)
  if (hasOr) {
    const orResult = filterObj.OR.some((orCondition: any) => matchesFilter(record, orCondition));
    conditions.push(orResult);
  }
  
  // All conditions must be true
  return conditions.every(condition => condition);
}

/**
 * Build a Supabase select string from select and include options.
 * 
 * @param select - Object specifying which fields to select { field: true }
 * @param include - Object specifying which relations to include { relation: true }
 * @returns A Supabase-compatible select string
 * 
 * @example
 * // Select specific fields
 * buildSelectString({ id: true, name: true }) // Returns "id,name"
 * 
 * @example
 * // Include relations
 * buildSelectString(undefined, { posts: true }) // Returns "*,posts(*)"
 * 
 * @example
 * // Select fields and include relations with specific fields
 * buildSelectString({ id: true, name: true }, { posts: { select: { id: true, title: true } } })
 * // Returns "id,name,posts(id,title)"
 */
export function buildSelectString<TSelect, TInclude>(
  select?: TSelect,
  include?: TInclude,
  relationMappings?: Record<string, string>
): string {
  const parts: string[] = [];
  
  // Handle select - if provided, only return specified fields
  if (select && typeof select === 'object') {
    const selectedFields = Object.entries(select)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
    
    if (selectedFields.length > 0) {
      parts.push(...selectedFields);
    }
  }
  
  // Handle include - add related records
  if (include && typeof include === 'object') {
    for (const [relationName, relationValue] of Object.entries(include)) {
      const relatedTableName = relationMappings?.[relationName] || relationName;
      // If mapping exists, use PostgREST alias syntax: alias:foreignTable(...)
      const embedName =
        relationMappings?.[relationName] && relatedTableName !== relationName
          ? \`\${relationName}:\${relatedTableName}\`
          : relationName;

      if (relationValue === true) {
        // Include all fields from the relation
        parts.push(\`\${embedName}(*)\`);
      } else if (typeof relationValue === 'object' && relationValue !== null) {
        // Include specific fields from the relation
        const relationOptions = relationValue as { select?: Record<string, boolean> };
        if (relationOptions.select) {
          const relationFields = Object.entries(relationOptions.select)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
          
          if (relationFields.length > 0) {
            parts.push(\`\${embedName}(\${relationFields.join(',')})\`);
          } else {
            parts.push(\`\${embedName}(*)\`);
          }
        } else {
          parts.push(\`\${embedName}(*)\`);
        }
      }
    }
  }
  
  // If no select specified but include is, we need to include base table fields too
  if (parts.length === 0) {
    return '*';
  }
  
  // If only include was specified (no select), we need all base fields plus relations
  if (!select && include) {
    return '*,' + parts.join(',');
  }
  
  return parts.join(',');
}

/**
 * Apply order by to the query builder
 */
export function applyOrderBy<T>(
  query: SupabaseQueryBuilder,
  orderBy?: T,
  hasCreatedAt?: boolean,
  createdAtField: string = 'createdAt'
): SupabaseQueryBuilder {
  if (!orderBy) {
    // By default, sort by createdAt if available, using the actual field name from Prisma
    if (hasCreatedAt) {
      // @ts-ignore: Supabase typing issue
      return query.order(createdAtField, { ascending: false });
    }
    return query;
  }
  
  // Apply each order by clause
  let orderedQuery = query;
  
  // Handle orderBy as array or single object
  const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
  
  for (const orderByClause of orderByArray) {
    for (const [key, direction] of Object.entries(orderByClause)) {
      // @ts-ignore: Supabase typing issue
      orderedQuery = orderedQuery.order(key, {
        ascending: direction === 'asc'
      });
    }
  }
  
  return orderedQuery;
}

/**
 * Core hook factory function that creates a type-safe realtime hook for a specific model.
 * This is the foundation for all Suparisma hooks.
 */
export function createSuparismaHook<
  TModel,
  TWithRelations,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TWhereUniqueInput,
  TOrderByInput
>(config: {
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  searchFields?: string[];
  defaultValues?: Record<string, string>;
  createdAtField?: string;
  updatedAtField?: string;
  relationMappings?: Record<string, string>;
}) {
  const { 
    tableName, 
    hasCreatedAt, 
    hasUpdatedAt, 
    searchFields = [], 
    defaultValues = {},
    createdAtField = 'createdAt',
    updatedAtField = 'updatedAt',
    relationMappings = {}
  } = config;
  
  /**
   * The main hook function that provides all data access methods for a model.
   * 
   * @param options - Optional configuration for data fetching, filtering, and realtime
   * 
   * @returns An API object with data state and CRUD methods
   * 
   * @example
   * // Basic usage
   * const users = useSuparismaUser();
   * const { data, loading, error } = users;
   * 
   * @example
   * // With filtering
   * const users = useSuparismaUser({ 
   *   where: { role: 'admin' },
   *   orderBy: { created_at: 'desc' }
   * });
   */
  return function useSuparismaHook(options: SuparismaOptions<TWhereInput, TOrderByInput> = {}) {
    const {
      realtime = true,
      channelName,
      where,
      realtimeFilter,
      orderBy,
      limit,
      offset,
      select,
      include,
      enabled = true,
    } = options;
    
    // Build the select string once for reuse
    const selectString = buildSelectString(select, include, relationMappings);
    
    // Refs to store the latest options for realtime handlers
    const whereRef = useRef(where);
    const orderByRef = useRef(orderBy);
    const limitRef = useRef(limit);
    const offsetRef = useRef(offset);
    const selectStringRef = useRef(selectString);
    const enabledRef = useRef(enabled);

    // Update refs whenever options change
    useEffect(() => {
      whereRef.current = where;
    }, [where]);

    useEffect(() => {
      orderByRef.current = orderBy;
    }, [orderBy]);

    useEffect(() => {
      limitRef.current = limit;
    }, [limit]);

    useEffect(() => {
      offsetRef.current = offset;
    }, [offset]);

    useEffect(() => {
      selectStringRef.current = selectString;
    }, [selectString]);

    useEffect(() => {
      enabledRef.current = enabled;
    }, [enabled]);

    // Single data collection for holding results
    const [data, setData] = useState<TWithRelations[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // This is the total count, unaffected by pagination limits
    const [count, setCount] = useState<number>(0);
    
    // Search state
    const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    
    const initialLoadRef = useRef(false);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSearchingRef = useRef<boolean>(false);

    // Function to fetch the total count from Supabase with current filters.
    // IMPORTANT: do NOT capture unstable objects (where/orderBy/etc) in deps.
    // Read the latest values from refs to avoid effect→setState→rerender loops.
    const fetchTotalCount = useCallback(async () => {
      try {
        // Skip count updates when disabled or during search
        if (!enabledRef.current) return;
        if (isSearchingRef.current) return;
        
        let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
        
        // Apply current where conditions via ref (NOT the captured 'where')
        const currentWhere = whereRef.current;
        if (currentWhere) {
          countQuery = applyFilter(countQuery, currentWhere);
        }
        
        const { count: totalCount, error: countError } = await countQuery;
        
        if (!countError) {
          const nextCount = totalCount || 0;
          // Cheap guard to reduce churn
          setCount((prev) => (prev === nextCount ? prev : nextCount));
        }
      } catch (err) {
        console.error(\`Error fetching count for \${tableName}:\`, err);
      }
    }, [tableName]);
    
    // Create the search state object with all required methods
    const search: SearchState = {
      queries: searchQueries,
      loading: searchLoading,
      
      // Set all search queries at once
      setQueries: useCallback((queries: SearchQuery[]) => {
        // Validate that all fields are searchable
        const validQueries = queries.filter(query => 
          searchFields.includes(query.field) && query.value.trim() !== ''
        );
        
        setSearchQueries(validQueries);
        
        // Execute search if there are valid queries
        if (validQueries.length > 0) {
          executeSearch(validQueries);
        } else {
          // If no valid queries, reset to normal data fetching
          isSearchingRef.current = false;
          findMany({ where, orderBy, take: limit, skip: offset });
        }
      }, [where, orderBy, limit, offset]),
      
      // Add a single search query
      addQuery: useCallback((query: SearchQuery) => {
        // Validate that the field is searchable
        if (!searchFields.includes(query.field) || query.value.trim() === '') {
          return;
        }
        
        setSearchQueries(prev => {
          // Replace if query for this field already exists, otherwise add
          const exists = prev.some(q => q.field === query.field);
          const newQueries = exists 
            ? prev.map(q => q.field === query.field ? query : q)
            : [...prev, query];
            
          // Execute search with updated queries
          executeSearch(newQueries);
          
          return newQueries;
        });
      }, []),
      
      // Remove a search query by field
      removeQuery: useCallback((field: string) => {
        setSearchQueries(prev => {
          const newQueries = prev.filter(q => q.field !== field);
          
          // If we still have queries, execute search with remaining queries
          if (newQueries.length > 0) {
            executeSearch(newQueries);
          } else {
            // If no queries left, reset to normal data fetching
            isSearchingRef.current = false;
            findMany({ where, orderBy, take: limit, skip: offset });
          }
          
          return newQueries;
        });
      }, [where, orderBy, limit, offset]),
      
      // Clear all search queries
      clearQueries: useCallback(() => {
        setSearchQueries([]);
        isSearchingRef.current = false;
        findMany({ where, orderBy, take: limit, skip: offset });
      }, [where, orderBy, limit, offset]),
      
      // Search across multiple fields (convenience method)
      searchMultiField: useCallback((value: string) => {
        if (searchFields.length <= 1) {
          console.warn('Multi-field search requires at least 2 searchable fields');
          return;
        }
        
        setSearchQueries([{ field: 'multi', value }]);
        executeSearch([{ field: 'multi', value }]);
      }, [searchFields.length]),
      
      // Search in a specific field (convenience method)
      searchField: useCallback((field: string, value: string) => {
        if (!searchFields.includes(field)) {
          console.warn(\`Field "\${field}" is not searchable. Available fields: \${searchFields.join(', ')}\`);
          return;
        }
        
        setSearchQueries([{ field, value }]);
        executeSearch([{ field, value }]);
      }, [searchFields]),
      
      // Get current search terms for custom highlighting
      getCurrentSearchTerms: useCallback(() => {
        return searchQueries.map(q => q.value.trim());
      }, [searchQueries]),
      
      // Safely escape regex special characters
      escapeRegex: useCallback((text: string) => {
        return escapeRegexCharacters(text);
      }, [])
    };
    
    // Execute search based on queries
    const executeSearch = useCallback(async (queries: SearchQuery[]) => {
      // Clear the previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Skip if no searchable fields or no valid queries
      if (searchFields.length === 0 || queries.length === 0) {
        return;
      }
      
      setSearchLoading(true);
      isSearchingRef.current = true;
      
      // Use debounce to prevent rapid searches
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          let results: TWithRelations[] = [];
          
          // Validate search queries
          const validQueries = queries.filter(query => {
            if (!query.field || !query.value) {
              console.warn('Invalid search query - missing field or value:', query);
              return false;
            }
            // Allow "multi" as a special field for multi-field search
            if (query.field === 'multi' && searchFields.length > 1) {
              return true;
            }
            if (!searchFields.includes(query.field)) {
              console.warn(\`Field "\${query.field}" is not searchable. Available fields: \${searchFields.join(', ')}, or "multi" for multi-field search\`);
              return false;
            }
            return true;
          });
          
          if (validQueries.length === 0) {
            console.log('No valid search queries found');
            setData([]);
            setCount(0);
            return;
          }
          
          // Execute RPC function for each query using Promise.all
          const searchPromises = validQueries.map(query => {
            // Build function name based on field type
            const functionName = query.field === 'multi' 
              ? \`search_\${tableName.toLowerCase()}_multi_field\`
              : \`search_\${tableName.toLowerCase()}_by_\${query.field.toLowerCase()}_prefix\`;
            
            console.log(\`🔍 Executing search: \${functionName}(search_prefix: "\${query.value.trim()}")\`);
            
            // Call RPC function with proper error handling
            return Promise.resolve(supabase.rpc(functionName, { search_prefix: query.value.trim() }))
              .then((result: any) => ({
                ...result,
                queryField: query.field,
                queryValue: query.value
              }))
              .catch((error: any) => ({
                data: null,
                error: error,
                queryField: query.field,
                queryValue: query.value
              }));
          });
          
          // Execute all search queries in parallel
          const searchResults = await Promise.all(searchPromises);
          
          // Combine and deduplicate results
          const allResults: Record<string, TWithRelations> = {};
          let hasErrors = false;
          
          // Process each search result
          searchResults.forEach((result: any, index: number) => {
            if (result.error) {
              console.error(\`🔍 Search error for field "\${result.queryField}" with value "\${result.queryValue}":\`, result.error);
              hasErrors = true;
              return;
            }
            
            if (result.data && Array.isArray(result.data)) {
              console.log(\`🔍 Search results for "\${result.queryField}": \${result.data.length} items\`);
              
              // Add each result, using id as key to deduplicate
              for (const item of result.data as TWithRelations[]) {
                // @ts-ignore: Assume item has an id property
                if (item && typeof item === 'object' && 'id' in item && item.id) {
                  // @ts-ignore: Add to results using id as key
                  allResults[item.id] = item;
                }
              }
            } else if (result.data) {
              console.warn(\`🔍 Unexpected search result format for "\${result.queryField}":\`, typeof result.data);
            }
          });
          
          // Convert back to array
          results = Object.values(allResults);
          console.log(\`🔍 Combined search results: \${results.length} unique items\`);
          
          // Apply any where conditions client-side (now using the proper filter function)
          if (where) {
            const originalCount = results.length;
            results = results.filter((item) => matchesFilter(item, where));
            console.log(\`🔍 After applying where filter: \${results.length}/\${originalCount} items\`);
          }
          
          // Set count directly for search results
          setCount(results.length);
          
          // Apply ordering if needed (using the proper compare function)
          if (orderBy) {
            const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
              results = [...results].sort((a, b) => {
              for (const orderByClause of orderByArray) {
                for (const [field, direction] of Object.entries(orderByClause)) {
                  const aValue = a[field as keyof typeof a];
                  const bValue = b[field as keyof typeof b];
                
                  if (aValue === bValue) continue;
                  
                  return compareValues(aValue, bValue, direction as 'asc' | 'desc');
                }
              }
              return 0;
            });
          }
          
          // Apply pagination if needed
          let paginatedResults = results;
          if (offset && offset > 0) {
            paginatedResults = paginatedResults.slice(offset);
          }
          
          if (limit && limit > 0) {
            paginatedResults = paginatedResults.slice(0, limit);
          }
          
          console.log(\`🔍 Final search results: \${paginatedResults.length} items (total: \${results.length})\`);
          
          // Update data with search results
          setData(paginatedResults);
          
          // Show error if there were issues but still show partial results
          if (hasErrors && results.length === 0) {
            setError(new Error('Search failed - please check if search functions are properly configured'));
          }
        } catch (err) {
          console.error('🔍 Search error:', err);
          setError(err as Error);
          setData([]);
          setCount(0);
        } finally {
          setSearchLoading(false);
        }
      }, 300); // 300ms debounce
    }, [tableName, searchFields, where, orderBy, limit, offset]);

    /**
     * Fetch multiple records with support for filtering, sorting, and pagination.
     * 
     * @param params - Query parameters for filtering and ordering records
     * @returns A promise with the fetched data or error
     * 
     * @example
     * // Get all active users
     * const result = await users.findMany({
     *   where: { active: true }
     * });
     * 
     * @example
     * // Get 10 most recent posts with pagination
     * const page1 = await posts.findMany({
     *   orderBy: { created_at: 'desc' },
     *   take: 10,
     *   skip: 0
     * });
     * 
     * const page2 = await posts.findMany({
     *   orderBy: { created_at: 'desc' },
     *   take: 10,
     *   skip: 10
     * });
     */
    const findMany = useCallback(async (params?: {
      where?: TWhereInput;
      orderBy?: TOrderByInput;
      take?: number;
      skip?: number;
    }): ModelResult<TWithRelations[]> => {
      try {
        setLoading(true);
        setError(null);
        
        // Use selectString for field selection (includes relations if specified)
        let query = supabase.from(tableName).select(selectString);
        
        // Apply where conditions if provided
        if (params?.where) {
          query = applyFilter(query, params.where);
        }
        
        // Apply order by if provided
        if (params?.orderBy) {
          query = applyOrderBy(query, params.orderBy, hasCreatedAt, createdAtField);
        } else if (hasCreatedAt) {
          // Use the actual createdAt field name from Prisma
          // @ts-ignore: Supabase typing issue
          query = query.order(createdAtField, { ascending: false });
        }
        
        // Apply limit if provided
        if (params?.take) {
          query = query.limit(params.take);
        }
        
        // Apply offset if provided (for pagination)
        if (params?.skip !== undefined && params.skip >= 0) {
          query = query.range(params.skip, params.skip + (params.take || 10) - 1);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const typedData = (data || []) as TWithRelations[];
        
        // Only update data if not currently searching
        if (!isSearchingRef.current) {
          setData(typedData);
          
          // If the where filter changed, update the total count
          if (JSON.stringify(params?.where) !== JSON.stringify(where)) {
            // Use our standard count fetching function instead of duplicating logic
            setTimeout(() => fetchTotalCount(), 0);
          }
        }
        
        return { data: typedData, error: null };
      } catch (err: any) {
        console.error('Error finding records:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, [fetchTotalCount, where, tableName, hasCreatedAt, createdAtField]);

    /**
     * Find a single record by its unique identifier (usually ID).
     * 
     * @param where - The unique identifier to find the record by
     * @returns A promise with the found record or error
     * 
     * @example
     * // Find user by ID
     * const result = await users.findUnique({ id: "123" });
     * if (result.data) {
     *   console.log("Found user:", result.data.name);
     * }
     */
    const findUnique = useCallback(async (
      where: TWhereUniqueInput
    ): ModelResult<TWithRelations> => {
      try {
        setLoading(true);
        setError(null);
        
        // Find the primary field (usually 'id')
        // @ts-ignore: Supabase typing issue
        const primaryKey = Object.keys(where)[0];
        if (!primaryKey) {
          throw new Error('A unique identifier is required');
        }
        
        const value = where[primaryKey as keyof typeof where];
        if (value === undefined) {
          throw new Error('A unique identifier is required');
        }
        
        const { data, error } = await supabase
          .from(tableName)
          .select(selectString)
          .eq(primaryKey, value)
          .maybeSingle();
        
        if (error) throw error;
        
        return { data: data as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error finding unique record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, []);

        // Set up realtime subscription for the list - ONCE and listen to ALL events
    const channelIdRef = useRef<string | null>(null);

    useEffect(() => {
      // Skip subscription if not enabled or realtime is off
      if (!enabled || !realtime) return;
      
      // Stable channel id per hook instance (unless user explicitly provides channelName)
      const channelId =
        channelName ??
        channelIdRef.current ??
        (channelIdRef.current = \`changes_to_\${tableName}_\${generateUUID()}\`);
      
      // ALWAYS listen to ALL events and filter client-side for maximum reliability
      let subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table: tableName,
      };
      
      console.log(\`Setting up subscription for \${tableName} - listening to ALL events (client-side filtering)\`);
      
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          subscriptionConfig,
          (payload) => {
            console.log(\`🔥 REALTIME EVENT RECEIVED for \${tableName}:\`, payload.eventType, payload);
            
            // Access current options via refs inside the event handler
            const currentWhere = whereRef.current;
            const currentOrderBy = orderByRef.current;
            const currentLimit = limitRef.current;
            const currentOffset = offsetRef.current; // Not directly used in handlers but good for consistency

            // Skip realtime updates when search is active
            if (isSearchingRef.current) {
              console.log('⏭️ Skipping realtime update - search is active');
              return;
            }
            
            if (payload.eventType === 'INSERT') {
              // Process insert event
              setData((prev) => {
                try {
                  const newRecord = payload.new as TWithRelations;
                  console.log(\`Processing INSERT for \${tableName}\`, { newRecord });
                  
                  // ALWAYS check if this record matches our filter client-side
                  // This is especially important for complex OR/AND/array filters
                  if (currentWhere && !matchesFilter(newRecord, currentWhere)) {
                      console.log('New record does not match filter criteria, skipping');
                      return prev;
                  }
                  
                  // Check if record already exists (avoid duplicates)
                  const exists = prev.some(item => 
                    // @ts-ignore: Supabase typing issue
                    'id' in item && 'id' in newRecord && item.id === newRecord.id
                  );
                  
                  if (exists) {
                    console.log('Record already exists, skipping insertion');
                    return prev;
                  }
                  
                  // Add the new record to the data
                  let newData = [...prev, newRecord]; // Changed: Use spread on prev for immutability
                  
                  // Apply ordering if specified
                  if (currentOrderBy) { // Use ref value
                    // Convert orderBy to array format for consistency if it's an object
                    const orderByArray = Array.isArray(currentOrderBy) 
                      ? currentOrderBy 
                      : [currentOrderBy];
                      
                    // Apply each sort in sequence
                    newData = [...newData].sort((a, b) => {
                      // Check each orderBy clause in sequence
                      for (const orderByClause of orderByArray) {
                        for (const [field, direction] of Object.entries(orderByClause)) {
                          const aValue = a[field as keyof typeof a];
                          const bValue = b[field as keyof typeof b];
                          
                          // Skip if values are equal and move to next criterion
                          if (aValue === bValue) continue;
                          
                          // Use the compareValues function for proper type handling
                          return compareValues(aValue, bValue, direction as 'asc' | 'desc');
                        }
                      }
                      return 0; // Equal if all criteria match
                    });
                  } else if (hasCreatedAt) {
                    // Default sort by createdAt desc if no explicit sort but has timestamp
                    newData = [...newData].sort((a, b) => {
                      const aValue = a[createdAtField as keyof typeof a];
                      const bValue = b[createdAtField as keyof typeof b];
                      return compareValues(aValue, bValue, 'desc');
                    });
                  }
                  
                  // Apply limit if specified
                  if (currentLimit && currentLimit > 0) { // Use ref value
                    newData = newData.slice(0, currentLimit);
                  }
                  
                  // Fetch the updated count after the data changes
                  setTimeout(() => fetchTotalCount(), 0);
                  
                  return newData;
                } catch (error) {
                  console.error('Error processing INSERT event:', error);
                  return prev;
                }
              });
            } else if (payload.eventType === 'UPDATE') {
              // Process update event 
              setData((prev) => {
                // Access current options via refs
                const currentOrderBy = orderByRef.current; 
                const currentLimit = limitRef.current; // If needed for re-fetch logic on update
                const currentWhere = whereRef.current;

                // Skip if search is active
                if (isSearchingRef.current) {
                  return prev;
                }
                
                const updatedRecord = payload.new as TWithRelations;
                
                // Check if the updated record still matches our current filter
                if (currentWhere && !matchesFilter(updatedRecord, currentWhere)) {
                    console.log('Updated record no longer matches filter, removing from list');
                    return prev.filter((item) =>
                      // @ts-ignore: Supabase typing issue
                      !('id' in item && 'id' in updatedRecord && item.id === updatedRecord.id)
                    );
                }
                
                const newData = prev.map((item) =>
                  // @ts-ignore: Supabase typing issue
                  'id' in item && 'id' in payload.new && item.id === payload.new.id 
                    ? (payload.new as TWithRelations) 
                    : item
                );
                
                // Apply ordering again after update to ensure consistency
                let sortedData = [...newData];
                
                // Apply ordering if specified
                if (currentOrderBy) { // Use ref value
                  // Convert orderBy to array format for consistency if it's an object
                  const orderByArray = Array.isArray(currentOrderBy) 
                    ? currentOrderBy 
                    : [currentOrderBy];
                    
                  // Apply each sort in sequence
                  sortedData = sortedData.sort((a, b) => {
                    // Check each orderBy clause in sequence
                    for (const orderByClause of orderByArray) {
                      for (const [field, direction] of Object.entries(orderByClause)) {
                        const aValue = a[field as keyof typeof a];
                        const bValue = b[field as keyof typeof b];
                        
                        // Skip if values are equal and move to next criterion
                        if (aValue === bValue) continue;
                        
                        // Use the compareValues function for proper type handling
                        return compareValues(aValue, bValue, direction as 'asc' | 'desc');
                      }
                    }
                    return 0; // Equal if all criteria match
                  });
                } else if (hasCreatedAt) {
                  // Default sort by createdAt desc if no explicit sort but has timestamp
                  sortedData = sortedData.sort((a, b) => {
                    const aValue = a[createdAtField as keyof typeof a];
                    const bValue = b[createdAtField as keyof typeof b];
                    return compareValues(aValue, bValue, 'desc');
                  });
                }
                
                // Fetch the updated count after the data changes
                // For updates, the count might not change but we fetch anyway to be consistent
                setTimeout(() => fetchTotalCount(), 0);
                
                return sortedData;
              });
            } else if (payload.eventType === 'DELETE') {
              // Process delete event
              console.log('🗑️ Processing DELETE event for', tableName);
              setData((prev) => {
                console.log('🗑️ DELETE: Current data before deletion:', prev.length, 'items');
                
                // Access current options via refs
                const currentWhere = whereRef.current;
                const currentOrderBy = orderByRef.current;
                const currentLimit = limitRef.current;
                const currentOffset = offsetRef.current;

                // Skip if search is active
                if (isSearchingRef.current) {
                  console.log('⏭️ DELETE: Skipping - search is active');
                  return prev;
                }
                
                // Save the current size before filtering
                const currentSize = prev.length;
                
                // Filter out the deleted item
                const filteredData = prev.filter((item) => {
                  // @ts-ignore: Supabase typing issue
                  const shouldKeep = !('id' in item && 'id' in payload.old && item.id === payload.old.id);
                  if (!shouldKeep) {
                    console.log('🗑️ DELETE: Removing item with ID:', item.id);
                  }
                  return shouldKeep;
                });
                
                console.log('🗑️ DELETE: Data after deletion:', filteredData.length, 'items (was', currentSize, ')');
                
                // Fetch the updated count after the data changes
                setTimeout(() => fetchTotalCount(), 0);
                
                // If we need to maintain the size with a limit
                if (currentLimit && currentLimit > 0 && filteredData.length < currentSize && currentSize === currentLimit) { // Use ref value
                  console.log(\`🗑️ DELETE: Record deleted with limit \${currentLimit}, will fetch additional record to maintain size\`);
                  
                  // Use setTimeout to ensure this state update completes first
                  setTimeout(() => {
                    findMany({
                      where: currentWhere, // Use ref value
                      orderBy: currentOrderBy, // Use ref value
                      take: currentLimit, // Use ref value
                      skip: currentOffset // Use ref value (passed as skip to findMany)
                    });
                  }, 0);
                  
                  // Return the filtered data without resizing for now
                  // The findMany call above will update the data later
                  return filteredData;
                }
                
                // Re-apply ordering to maintain consistency
                let sortedData = [...filteredData];
                
                // Apply ordering if specified
                if (currentOrderBy) { // Use ref value
                  // Convert orderBy to array format for consistency if it's an object
                  const orderByArray = Array.isArray(currentOrderBy) 
                    ? currentOrderBy 
                    : [currentOrderBy];
                    
                  // Apply each sort in sequence
                  sortedData = sortedData.sort((a, b) => {
                    // Check each orderBy clause in sequence
                    for (const orderByClause of orderByArray) {
                      for (const [field, direction] of Object.entries(orderByClause)) {
                        const aValue = a[field as keyof typeof a];
                        const bValue = b[field as keyof typeof b];
                        
                        // Skip if values are equal and move to next criterion
                        if (aValue === bValue) continue;
                        
                        // Use the compareValues function for proper type handling
                        return compareValues(aValue, bValue, direction as 'asc' | 'desc');
                      }
                    }
                    return 0; // Equal if all criteria match
                  });
                } else if (hasCreatedAt) {
                  // Default sort by createdAt desc if no explicit sort but has timestamp
                  sortedData = sortedData.sort((a, b) => {
                    const aValue = a[createdAtField as keyof typeof a];
                    const bValue = b[createdAtField as keyof typeof b];
                    return compareValues(aValue, bValue, 'desc');
                  });
                }
                
                return sortedData;
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(\`Subscription status for \${tableName}\`, status);
        });
      
      // Store the channel ref (for optional introspection)
      channelRef.current = channel;
        
      return () => {
        console.log(\`Unsubscribing from \${channelId}\`);
        // Always remove the exact channel created by this effect instance
        supabase.removeChannel(channel);
        // Only clear the ref if it still matches (avoid races if effect re-runs)
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
        
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }
      };
    }, [realtime, channelName, tableName, enabled]); // NEVER include 'where' - subscription should persist

    // Create a memoized options object to prevent unnecessary re-renders
    const optionsRef = useRef({ where, orderBy, limit, offset, selectString });
    
    // Compare current options with previous options
    const optionsChanged = useCallback(() => {
      // Create stable string representations for deep comparison
      const whereStr = where ? JSON.stringify(where) : '';
      const orderByStr = orderBy ? JSON.stringify(orderBy) : '';
      const prevWhereStr = optionsRef.current.where ? JSON.stringify(optionsRef.current.where) : '';
      const prevOrderByStr = optionsRef.current.orderBy ? JSON.stringify(optionsRef.current.orderBy) : '';
      
      // Compare the stable representations
      const hasChanged = 
        whereStr !== prevWhereStr ||
        orderByStr !== prevOrderByStr ||
        limit !== optionsRef.current.limit ||
        offset !== optionsRef.current.offset ||
        selectString !== optionsRef.current.selectString;
      
      if (hasChanged) {
        // Update the ref with the new values
        optionsRef.current = { where, orderBy, limit, offset, selectString };
        return true;
      }
      
      return false;
    }, [where, orderBy, limit, offset, selectString]);

    // Load initial data and refetch when options change (BUT NEVER TOUCH SUBSCRIPTION)
    useEffect(() => {
      // Skip fetching if not enabled
      if (!enabled) {
        setLoading(false); // Don't show loading spinner when disabled
        return;
      }
      
      // Skip if search is active
      if (isSearchingRef.current) return;
      
      // Skip if we've already loaded or if no filter criteria are provided
      if (initialLoadRef.current) {
        // Only reload if options have changed significantly
        if (optionsChanged()) {
          console.log(\`Options changed for \${tableName}, refetching data (subscription stays alive)\`);
          findMany({
            where,
            orderBy,
            take: limit,
            skip: offset
          });
          
          // Also update the total count
          fetchTotalCount();
        }
        return;
      }
      
      // Initial load
      initialLoadRef.current = true;
      findMany({
        where,
        orderBy,
        take: limit,
        skip: offset
      });
      
      // Initial count fetch
      fetchTotalCount();
    }, [findMany, where, orderBy, limit, offset, optionsChanged, fetchTotalCount, enabled]);

    // Track previous enabled state to detect changes from false to true
    const prevEnabledRef = useRef(enabled);
    
    // Fetch when enabled changes from false to true
    useEffect(() => {
      const wasDisabled = !prevEnabledRef.current;
      const isNowEnabled = enabled;
      
      // Update the previous value
      prevEnabledRef.current = enabled;
      
      // If we just became enabled and have already done initial load, refetch
      if (wasDisabled && isNowEnabled && initialLoadRef.current) {
        console.log(\`Hook enabled for \${tableName}, fetching data\`);
        findMany({
          where,
          orderBy,
          take: limit,
          skip: offset
        });
        fetchTotalCount();
      }
    }, [enabled, findMany, where, orderBy, limit, offset, fetchTotalCount]);

    /**
     * Create a new record with the provided data.
     * Default values from the schema will be applied if not provided.
     * NOTE: This operation does NOT immediately update the local state.
     * The state will be updated when the realtime INSERT event is received.
     * 
     * @param data - The data to create the record with
     * @returns A promise with the created record or error
     * 
     * @example
     * // Create a new user
     * const result = await users.create({
     *   name: "John Doe",
     *   email: "john@example.com"
     * });
     * 
     * @example
     * // Create with custom ID (overriding default)
     * const result = await users.create({
     *   id: "custom-id-123",
     *   name: "John Doe"
     * });
     */
    const create = useCallback(async (
      data: TCreateInput
    ): ModelResult<TWithRelations> => {
      try {
        setLoading(true);
        setError(null);
        
        const now = new Date();
        
        // Helper function to convert Date objects to ISO strings for database
        const convertDatesForDatabase = (obj: any): any => {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value instanceof Date) {
              result[key] = value.toISOString();
            } else {
              result[key] = value;
            }
          }
          return result;
        };
        
        // Apply default values from schema
        const appliedDefaults: Record<string, any> = {};
        
        // Apply all default values that aren't already in the data
        for (const [field, defaultValue] of Object.entries(defaultValues)) {
          // @ts-ignore: Supabase typing issue
          if (!(field in data)) {
            // Parse the default value based on its type
            if (defaultValue.includes('now()') || defaultValue.includes('now')) {
              appliedDefaults[field] = now.toISOString(); // Database expects ISO string
            } else if (defaultValue.includes('uuid()') || defaultValue.includes('uuid')) {
              appliedDefaults[field] = generateUUID();
            } else if (defaultValue.includes('cuid()') || defaultValue.includes('cuid')) {
              // Simple cuid-like implementation for client-side
              appliedDefaults[field] = 'c' + Math.random().toString(36).substring(2, 15);
            } else if (defaultValue.includes('true')) {
              appliedDefaults[field] = true;
            } else if (defaultValue.includes('false')) {
              appliedDefaults[field] = false;
            } else if (!isNaN(Number(defaultValue))) {
              // If it's a number
              appliedDefaults[field] = Number(defaultValue);
            } else {
              // String or other value, remove quotes if present
              const strValue = defaultValue.replace(/^["'](.*)["']$/, '$1');
              appliedDefaults[field] = strValue;
            }
          }
        }
        
        const itemWithDefaults = convertDatesForDatabase({
          ...appliedDefaults, // Apply schema defaults first
          ...data, // Then user data (overrides defaults)
          // Use the actual field names from Prisma - convert Date to ISO string for database
          ...(hasCreatedAt ? { [createdAtField]: now.toISOString() } : {}), 
          ...(hasUpdatedAt ? { [updatedAtField]: now.toISOString() } : {})
        });
        
        const { data: result, error } = await supabase
          .from(tableName)
          .insert([itemWithDefaults])
          .select(selectString);
        
        if (error) throw error;
        
        // DO NOT UPDATE LOCAL STATE HERE - Let realtime INSERT event handle it
        console.log('✅ Created ' + tableName + ' record, waiting for realtime INSERT event to update state');
        
        // Return created record
        return { data: result?.[0] as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error creating record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, []);

    /**
     * Update an existing record identified by a unique identifier.
     * NOTE: This operation does NOT immediately update the local state.
     * The state will be updated when the realtime UPDATE event is received.
     * 
     * @param params - Object containing the identifier and update data
     * @returns A promise with the updated record or error
     * 
     * @example
     * // Update a user's name
     * const result = await users.update({
     *   where: { id: "123" },
     *   data: { name: "New Name" }
     * });
     * 
     * @example
     * // Update multiple fields
     * const result = await users.update({
     *   where: { id: "123" },
     *   data: { 
     *     name: "New Name",
     *     active: false
     *   }
     * });
     */
    const update = useCallback(async (params: {
      where: TWhereUniqueInput;
      data: TUpdateInput;
    }): ModelResult<TWithRelations> => {
      try {
        setLoading(true);
        setError(null);
        
        // Find the primary field (usually 'id')
        // @ts-ignore: Supabase typing issue
        const primaryKey = Object.keys(params.where)[0];
        if (!primaryKey) {
          throw new Error('A unique identifier is required');
        }
        
        const value = params.where[primaryKey as keyof typeof params.where];
        if (value === undefined) {
          throw new Error('A unique identifier is required');
        }
        
        const now = new Date();
        
        // Helper function to convert Date objects to ISO strings for database
        const convertDatesForDatabase = (obj: any): any => {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value instanceof Date) {
              result[key] = value.toISOString();
            } else {
              result[key] = value;
            }
          }
          return result;
        };
        
        // We do not apply default values for updates
        // Default values are only for creation, not for updates,
        // as existing records already have these values set
        
        const itemWithDefaults = convertDatesForDatabase({
          ...params.data,
          // Use the actual updatedAt field name from Prisma - convert Date to ISO string for database
          ...(hasUpdatedAt ? { [updatedAtField]: now.toISOString() } : {})
        });
        
        const { data, error } = await supabase
          .from(tableName)
          .update(itemWithDefaults)
          .eq(primaryKey, value)
          .select(selectString);
        
        if (error) throw error;
        
        // DO NOT UPDATE LOCAL STATE HERE - Let realtime UPDATE event handle it
        console.log('✅ Updated ' + tableName + ' record, waiting for realtime UPDATE event to update state');
        
        // Return updated record
        return { data: data?.[0] as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error updating record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, []);

    /**
     * Delete a record by its unique identifier.
     * NOTE: This operation does NOT immediately update the local state.
     * The state will be updated when the realtime DELETE event is received.
     * 
     * @param where - The unique identifier to delete the record by
     * @returns A promise with the deleted record or error
     * 
     * @example
     * // Delete a user by ID
     * const result = await users.delete({ id: "123" });
     * if (result.data) {
     *   console.log("Deleted user:", result.data.name);
     * }
     */
    const deleteRecord = useCallback(async (
      where: TWhereUniqueInput
    ): ModelResult<TWithRelations> => {
      try {
        setLoading(true);
        setError(null);
        
        // Find the primary field (usually 'id')
        // @ts-ignore: Supabase typing issue
        const primaryKey = Object.keys(where)[0];
        if (!primaryKey) {
          throw new Error('A unique identifier is required');
        }
        
        const value = where[primaryKey as keyof typeof where];
        if (value === undefined) {
          throw new Error('A unique identifier is required');
        }
        
        // First fetch the record to return it
        const { data: recordToDelete } = await supabase
          .from(tableName)
          .select(selectString)
          .eq(primaryKey, value)
          .maybeSingle();
        
        if (!recordToDelete) {
          throw new Error('Record not found');
        }
        
        // Then delete it
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(primaryKey, value);
        
        if (error) throw error;
        
        // DO NOT UPDATE LOCAL STATE HERE - Let realtime DELETE event handle it
        console.log('✅ Deleted ' + tableName + ' record, waiting for realtime DELETE event to update state');
        
        // Return the deleted record
        return { data: recordToDelete as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error deleting record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, []);

    /**
     * Delete multiple records matching the filter criteria.
     * NOTE: This operation does NOT immediately update the local state.
     * The state will be updated when realtime DELETE events are received for each record.
     * 
     * @param params - Query parameters for filtering records to delete
     * @returns A promise with the count of deleted records or error
     * 
     * @example
     * // Delete all inactive users
     * const result = await users.deleteMany({
     *   where: { active: false }
     * });
     * console.log('Deleted ' + result.count + ' inactive users');
     * 
     * @example
     * // Delete all records (use with caution!)
     * const result = await users.deleteMany();
     */
    const deleteMany = useCallback(async (params?: {
      where?: TWhereInput;
    }): Promise<{ count: number; error: Error | null }> => {
      try {
        setLoading(true);
        setError(null);
        
        // First, get the records that will be deleted to count them
        let query = supabase.from(tableName).select('*');
        
        // Apply where conditions if provided
        if (params?.where) {
          query = applyFilter(query, params.where);
        }
        
        // Get records that will be deleted
        const { data: recordsToDelete, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        if (!recordsToDelete?.length) {
          return { count: 0, error: null };
        }
        
        // Build the delete query
        let deleteQuery = supabase.from(tableName).delete();
        
        // Apply the same filter to the delete operation
        if (params?.where) {
          // @ts-ignore: Supabase typing issue
          deleteQuery = applyFilter(deleteQuery, params.where);
        }
        
        // Perform the delete
        const { error: deleteError } = await deleteQuery;
        
        if (deleteError) throw deleteError;
        
        // DO NOT UPDATE LOCAL STATE HERE - Let realtime DELETE events handle it
        console.log('✅ Deleted ' + recordsToDelete.length + ' ' + tableName + ' records, waiting for realtime DELETE events to update state');
        
        // Return the count of deleted records
        return { count: recordsToDelete.length, error: null };
      } catch (err: any) {
        console.error('Error deleting multiple records:', err);
        setError(err);
        return { count: 0, error: err };
      } finally {
        setLoading(false);
      }
    }, []);

    /**
     * Find the first record matching the filter criteria.
     * 
     * @param params - Query parameters for filtering and ordering
     * @returns A promise with the first matching record or error
     * 
     * @example
     * // Find the first admin user
     * const result = await users.findFirst({
     *   where: { role: 'admin' }
     * });
     * 
     * @example
     * // Find the oldest post
     * const result = await posts.findFirst({
     *   orderBy: { created_at: 'asc' }
     * });
     */
    const findFirst = useCallback(async (params?: {
      where?: TWhereInput;
      orderBy?: TOrderByInput;
    }): ModelResult<TWithRelations> => {
      try {
        const result = await findMany({
          ...params,
          take: 1
        });
        
        if (result.error) return { data: null, error: result.error };
        if (!result.data.length) return { data: null, error: new Error('No records found') };
        
        // @ts-ignore: Supabase typing issue
        return { data: result.data[0], error: null };
      } catch (err: any) {
        console.error('Error finding first record:', err);
        return { data: null, error: err };
      }
    }, [findMany]);

    /**
     * Create a record if it doesn't exist, or update it if it does.
     * 
     * @param params - Object containing the identifier, update data, and create data
     * @returns A promise with the created or updated record or error
     * 
     * @example
     * // Upsert a user by ID
     * const result = await users.upsert({
     *   where: { id: "123" },
     *   update: { lastLogin: new Date().toISOString() },
     *   create: { 
     *     id: "123", 
     *     name: "John Doe", 
     *     email: "john@example.com",
     *     lastLogin: new Date().toISOString()
     *   }
     * });
     */
    const upsert = useCallback(async (params: {
      where: TWhereUniqueInput;
      update: TUpdateInput;
      create: TCreateInput;
    }): ModelResult<TWithRelations> => {
      try {
        // Check if record exists
        const { data: existing } = await findUnique(params.where);
        
        // Update if exists, otherwise create
        if (existing) {
          return update({ where: params.where, data: params.update });
        } else {
          return create(params.create);
        }
      } catch (err: any) {
        console.error('Error upserting record:', err);
        return { data: null, error: err };
      }
    }, [findUnique, update, create]);

    /**
     * Count the number of records matching the filter criteria.
     * This is a manual method to get the count with a different filter
     * than the main hook's filter.
     * 
     * @param params - Query parameters for filtering
     * @returns A promise with the count of matching records
     */
    const countFn = useCallback(async (params?: {
      where?: TWhereInput;
    }): Promise<number> => {
      try {
        let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
        
        // Use provided where filter, or fall back to the hook's original where filter
        const effectiveWhere = params?.where ?? where;
        
        if (effectiveWhere) {
          query = applyFilter(query, effectiveWhere);
        }
        
        const { count, error } = await query;
        
        if (error) throw error;
        
        return count || 0;
      } catch (err) {
        console.error('Error counting records:', err);
        return 0;
      }
    }, [where]);

    /**
     * Manually refresh the data with current filter settings.
     * Useful after external operations or when realtime is disabled.
     * 
     * @param params - Optional override parameters for this specific refresh
     * @returns A promise with the refreshed data or error
     * 
     * @example
     * // Refresh with current filter settings
     * await users.refresh();
     * 
     * @example
     * // Refresh with different filters for this call only
     * await users.refresh({
     *   where: { active: true },
     *   orderBy: { name: 'asc' }
     * });
     */
    const refresh = useCallback((params?: {
      where?: TWhereInput;
      orderBy?: TOrderByInput;
      take?: number;
      skip?: number;
    }) => {
      // If search is active, refresh search results
      if (isSearchingRef.current && searchQueries.length > 0) {
        executeSearch(searchQueries);
        return Promise.resolve({ data: data, error: null });
      }
      
      // Otherwise, refresh normal data using original params if not explicitly overridden
      return findMany({
        where: params?.where ?? where,
        orderBy: params?.orderBy ?? orderBy,
        take: params?.take ?? limit,
        skip: params?.skip ?? offset
      });
    }, [findMany, data, searchQueries, where, orderBy, limit, offset]);
    
    // Construct final hook API with or without search
    const api = {
      // State
      data,
      error,
      loading,
      count, // Now including count as a reactive state value
      
      // Finder methods
      findUnique,
      findMany,
      findFirst,
      
      // Mutation methods
      create,
      update,
      delete: deleteRecord,
      deleteMany,
      upsert,
      
      // Manual refresh
      refresh
    };
    
    // Add search object if searchable fields are present
    return searchFields.length > 0 
      ? { 
          ...api, 
          search 
        } 
      : api;
  };
}
`; // Ensure template literal is closed

  // Output to the UTILS_DIR
  const outputPath = path.join(UTILS_DIR, 'core.ts');
  
  if (!fs.existsSync(UTILS_DIR)) {
    fs.mkdirSync(UTILS_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, coreContent);
  console.log(`Generated core utility file at ${outputPath}`);
}
