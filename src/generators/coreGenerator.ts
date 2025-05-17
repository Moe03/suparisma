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
 */
export type SearchQuery = {
  /** The field name to search in */
  field: string;
  /** The search term/value to look for */
  value: string;
};

// Define type for Supabase query builder
export type SupabaseQueryBuilder = ReturnType<ReturnType<typeof supabase.from>['select']>;

/**
 * Advanced filter operators for complex queries
 * @example
 * // Users older than 21
 * { age: { gt: 21 } }
 * 
 * @example
 * // Posts with titles containing "news"
 * { title: { contains: "news" } }
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
};

// Type for a single field in an advanced where filter
export type AdvancedWhereInput<T> = {
  [K in keyof T]?: T[K] | FilterOperators<T[K]>;
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
export type SuparismaOptions<TWhereInput, TOrderByInput> = {
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
 * // Check if search is loading
 * if (users.search.loading) {
 *   return <div>Searching...</div>;
 * }
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
 */
export function buildFilterString<T>(where?: T): string | undefined {
  if (!where) return undefined;
  
  const filters: string[] = [];
  
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined) {
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
          filters.push(\`\${key}=gt.\${advancedOps.gt}\`);
        }
        
        if ('gte' in advancedOps && advancedOps.gte !== undefined) {
          filters.push(\`\${key}=gte.\${advancedOps.gte}\`);
        }
        
        if ('lt' in advancedOps && advancedOps.lt !== undefined) {
          filters.push(\`\${key}=lt.\${advancedOps.lt}\`);
        }
        
        if ('lte' in advancedOps && advancedOps.lte !== undefined) {
          filters.push(\`\${key}=lte.\${advancedOps.lte}\`);
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
      } else {
        // Simple equality
        filters.push(\`\${key}=eq.\${value}\`);
      }
    }
  }
  
  return filters.length > 0 ? filters.join(',') : undefined;
}

/**
 * Apply filter to the query builder
 */
export function applyFilter<T>(
  query: SupabaseQueryBuilder, 
  where: T
): SupabaseQueryBuilder {
  if (!where) return query;

  let filteredQuery = query;
  
  // Apply each filter condition
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined) {
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
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.gt(key, advancedOps.gt);
        }
        
        if ('gte' in advancedOps && advancedOps.gte !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.gte(key, advancedOps.gte);
        }
        
        if ('lt' in advancedOps && advancedOps.lt !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.lt(key, advancedOps.lt);
        }
        
        if ('lte' in advancedOps && advancedOps.lte !== undefined) {
          // @ts-ignore: Supabase typing issue
          filteredQuery = filteredQuery.lte(key, advancedOps.lte);
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
}) {
  const { 
    tableName, 
    hasCreatedAt, 
    hasUpdatedAt, 
    searchFields = [], 
    defaultValues = {},
    createdAtField = 'createdAt',
    updatedAtField = 'updatedAt'
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
    } = options;
    
    // Refs to store the latest options for realtime handlers
    const whereRef = useRef(where);
    const orderByRef = useRef(orderBy);
    const limitRef = useRef(limit);
    const offsetRef = useRef(offset);

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

    // Single data collection for holding results
    const [data, setData] = useState<TWithRelations[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // This is the total count, unaffected by pagination limits
    const [count, setCount] = useState<number>(0);
    
    // Search state
    const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    
    const initialLoadRef = useRef(false);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSearchingRef = useRef<boolean>(false);

    // Function to fetch the total count from Supabase with current filters
    const fetchTotalCount = useCallback(async () => {
      try {
        // Skip count updates during search
        if (isSearchingRef.current) return;
        
        let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
        
        // Apply where conditions if provided
        if (where) {
          countQuery = applyFilter(countQuery, where);
        }
        
        const { count: totalCount, error: countError } = await countQuery;
        
        if (!countError) {
          setCount(totalCount || 0);
        }
      } catch (err) {
        console.error(\`Error fetching count for \${tableName}:\`, err);
      }
    }, [where, tableName]);
    
    // Update total count whenever where filter changes
    useEffect(() => {
      fetchTotalCount();
    }, [fetchTotalCount]);
    
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
      }, [where, orderBy, limit, offset])
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
          
          // Execute RPC function for each query using Promise.all
          const searchPromises = queries.map(query => {
            // Build function name: search_tablename_by_fieldname_prefix
            const functionName = \`search_\${tableName}_by_\${query.field}_prefix\`;
            
            // Call RPC function
            return supabase.rpc(functionName, { prefix: query.value.trim() });
          });
          
          // Execute all search queries in parallel
          const searchResults = await Promise.all(searchPromises);
          
          // Combine and deduplicate results
          const allResults: Record<string, TWithRelations> = {};
          
          // Process each search result
          searchResults.forEach((result, index) => {
            if (result.error) {
              console.error(\`Search error for \${queries[index]?.field}:\`, result.error);
              return;
            }
            
            if (result.data) {
              // Add each result, using id as key to deduplicate
              for (const item of result.data as TWithRelations[]) {
                // @ts-ignore: Assume item has an id property
                if (item.id) {
                  // @ts-ignore: Add to results using id as key
                  allResults[item.id] = item;
                }
              }
            }
          });
          
          // Convert back to array
          results = Object.values(allResults);
          
          // Apply any where conditions client-side
          if (where) {
            results = results.filter((item) => {
              for (const [key, value] of Object.entries(where)) {
                if (typeof value === 'object' && value !== null) {
                  // Skip complex filters for now
                  continue;
                }
                
                if (item[key as keyof typeof item] !== value) {
                  return false;
                }
              }
              return true;
            });
          }
          
          // Set count directly for search results
          setCount(results.length);
          
          // Apply ordering if needed
          if (orderBy) {
            const orderEntries = Object.entries(orderBy);
            if (orderEntries.length > 0) {
              const [orderField, direction] = orderEntries[0] || [];
              results = [...results].sort((a, b) => {
                const aValue = a[orderField as keyof typeof a] ?? '';
                const bValue = b[orderField as keyof typeof b] ?? '';
                
                if (direction === 'asc') {
                  return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                  return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
              });
            }
          }
          
          // Apply pagination if needed
          let paginatedResults = results;
          if (limit && limit > 0) {
            paginatedResults = results.slice(0, limit);
          }
          
          if (offset && offset > 0) {
            paginatedResults = paginatedResults.slice(offset);
          }
          
          // Update data with search results
          setData(paginatedResults);
        } catch (err) {
          console.error('Search error:', err);
          setError(err as Error);
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
        
        let query = supabase.from(tableName).select('*');
        
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
          .select('*')
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

    // Set up realtime subscription for the list
    useEffect(() => {
      if (!realtime) return;
      
      // Clean up previous subscription if it exists
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      const channelId = channelName || \`changes_to_\${tableName}_\${Math.random().toString(36).substring(2, 15)}\`;
      
      // Use a dynamic filter string builder inside the event handler or rely on Supabase
      // For the subscription filter, we must use the initial computedFilter or a stable one.
      // However, for client-side logic (sorting, adding/removing from list), we use refs.
      const initialComputedFilter = where ? buildFilterString(where) : realtimeFilter;
      console.log(\`Setting up subscription for \${tableName} with initial filter: \${initialComputedFilter}\`);
      
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: initialComputedFilter, // Subscription filter uses initial state
          },
          (payload) => {
            console.log(\`Received \${payload.eventType} event for \${tableName}\`, payload);
            
            // Access current options via refs inside the event handler
            const currentWhere = whereRef.current;
            const currentOrderBy = orderByRef.current;
            const currentLimit = limitRef.current;
            const currentOffset = offsetRef.current; // Not directly used in handlers but good for consistency

            // Skip realtime updates when search is active
            if (isSearchingRef.current) return;
            
            if (payload.eventType === 'INSERT') {
              // Process insert event
              setData((prev) => {
                try {
                  const newRecord = payload.new as TWithRelations;
                  console.log(\`Processing INSERT for \${tableName}\`, { newRecord });
                  
                  // Check if this record matches our filter if we have one
                  if (currentWhere) { // Use ref value
                    let matchesFilter = true;
                    
                    // Check each filter condition
                    for (const [key, value] of Object.entries(currentWhere)) {
                      if (typeof value === 'object' && value !== null) {
                        // Complex filter - this is handled by Supabase, assume it matches
                      } else if (newRecord[key as keyof typeof newRecord] !== value) {
                        matchesFilter = false;
                        console.log(\`Filter mismatch on \${key}\`, { expected: value, actual: newRecord[key as keyof typeof newRecord] });
                        break;
                      }
                    }
                    
                    if (!matchesFilter) {
                      console.log('New record does not match filter criteria, skipping');
                      return prev;
                    }
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

                // Skip if search is active
                if (isSearchingRef.current) {
                  return prev;
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
              setData((prev) => {
                // Access current options via refs
                const currentWhere = whereRef.current;
                const currentOrderBy = orderByRef.current;
                const currentLimit = limitRef.current;
                const currentOffset = offsetRef.current;

                // Skip if search is active
                if (isSearchingRef.current) {
                  return prev;
                }
                
                // Save the current size before filtering
                const currentSize = prev.length;
                
                // Filter out the deleted item
                const filteredData = prev.filter((item) => {
                  // @ts-ignore: Supabase typing issue
                  return !('id' in item && 'id' in payload.old && item.id === payload.old.id);
                });
                
                // Fetch the updated count after the data changes
                setTimeout(() => fetchTotalCount(), 0);
                
                // If we need to maintain the size with a limit
                if (currentLimit && currentLimit > 0 && filteredData.length < currentSize && currentSize === currentLimit) { // Use ref value
                  console.log(\`Record deleted with limit \${currentLimit}, will fetch additional record to maintain size\`);
                  
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
      
      // Store the channel ref
      channelRef.current = channel;
        
      return () => {
        console.log(\`Unsubscribing from \${channelId}\`);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current); // Correct way to remove channel
          channelRef.current = null;
        }
        
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }
      };
    }, [realtime, channelName, tableName, initialLoadRef]); // Removed where, orderBy, limit, offset from deps

    // Create a memoized options object to prevent unnecessary re-renders
    const optionsRef = useRef({ where, orderBy, limit, offset });
    
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
        offset !== optionsRef.current.offset;
      
      if (hasChanged) {
        // Update the ref with the new values
        optionsRef.current = { where, orderBy, limit, offset };
        return true;
      }
      
      return false;
    }, [where, orderBy, limit, offset]);

    // Load initial data based on options
    useEffect(() => {
      // Skip if search is active
      if (isSearchingRef.current) return;
      
      // Skip if we've already loaded or if no filter criteria are provided
      if (initialLoadRef.current) {
        // Only reload if options have changed significantly
        if (optionsChanged()) {
          console.log(\`Options changed for \${tableName}, reloading data\`);
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
    }, [findMany, where, orderBy, limit, offset, optionsChanged, fetchTotalCount]);

    /**
     * Create a new record with the provided data.
     * Default values from the schema will be applied if not provided.
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
        
        const now = new Date().toISOString();
        
        // Apply default values from schema
        const appliedDefaults: Record<string, any> = {};
        
        // Apply all default values that aren't already in the data
        for (const [field, defaultValue] of Object.entries(defaultValues)) {
          // @ts-ignore: Supabase typing issue
          if (!(field in data)) {
            // Parse the default value based on its type
            if (defaultValue.includes('now()') || defaultValue.includes('now')) {
              appliedDefaults[field] = now;
            } else if (defaultValue.includes('uuid()') || defaultValue.includes('uuid')) {
              appliedDefaults[field] = crypto.randomUUID();
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
        
        const itemWithDefaults = {
          ...appliedDefaults, // Apply schema defaults first
          ...data, // Then user data (overrides defaults)
          // Use the actual field names from Prisma
          ...(hasCreatedAt ? { [createdAtField]: now } : {}), 
          ...(hasUpdatedAt ? { [updatedAtField]: now } : {})
        };
        
        const { data: result, error } = await supabase
          .from(tableName)
          .insert([itemWithDefaults])
          .select();
        
        if (error) throw error;
        
        // Update the total count after a successful creation
        setTimeout(() => fetchTotalCount(), 0);
        
        // Return created record
        return { data: result?.[0] as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error creating record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, [fetchTotalCount]);

    /**
     * Update an existing record identified by a unique identifier.
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
        
        const now = new Date().toISOString();
        
        // We do not apply default values for updates
        // Default values are only for creation, not for updates,
        // as existing records already have these values set
        
        const itemWithDefaults = {
          ...params.data,
          // Use the actual updatedAt field name from Prisma
          ...(hasUpdatedAt ? { [updatedAtField]: now } : {})
        };
        
        const { data, error } = await supabase
          .from(tableName)
          .update(itemWithDefaults)
          .eq(primaryKey, value)
          .select();
        
        if (error) throw error;
        
        // Update the total count after a successful update
        // This is for consistency with other operations, and because
        // updates can sometimes affect filtering based on updated values
        setTimeout(() => fetchTotalCount(), 0);
        
        // Return updated record
        return { data: data?.[0] as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error updating record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, [fetchTotalCount]);

    /**
     * Delete a record by its unique identifier.
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
          .select('*')
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
        
        // Update the total count after a successful deletion
        setTimeout(() => fetchTotalCount(), 0);
        
        // Return the deleted record
        return { data: recordToDelete as TWithRelations, error: null };
      } catch (err: any) {
        console.error('Error deleting record:', err);
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    }, [fetchTotalCount]);

    /**
     * Delete multiple records matching the filter criteria.
     * 
     * @param params - Query parameters for filtering records to delete
     * @returns A promise with the count of deleted records or error
     * 
     * @example
     * // Delete all inactive users
     * const result = await users.deleteMany({
     *   where: { active: false }
     * });
     * console.log(\`Deleted \${result.count} inactive users\`);
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
        
        // Update the total count after a successful bulk deletion
        setTimeout(() => fetchTotalCount(), 0);
        
        // Return the count of deleted records
        return { count: recordsToDelete.length, error: null };
      } catch (err: any) {
        console.error('Error deleting multiple records:', err);
        setError(err);
        return { count: 0, error: err };
      } finally {
        setLoading(false);
      }
    }, [fetchTotalCount]);

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
