# 🔍 Suparisma Full-Text Search Documentation

## Overview

Suparisma now includes powerful, type-safe full-text search capabilities powered by PostgreSQL's built-in full-text search engine. This implementation follows Supabase's full-text search patterns and provides both single-field and multi-field search functionality.

## Features

### ✅ Core Features
- **Type-Safe Search API**: Full TypeScript support with IntelliSense
- **PostgreSQL Full-Text Search**: Uses `to_tsvector` and `to_tsquery` for advanced text matching
- **Partial/Prefix Matching**: Search with `:*` operator for partial matches
- **GIN Indexes**: Automatically created for optimal performance
- **Multi-Field Search**: Search across multiple fields simultaneously
- **Real-time Results**: Search results update in real-time
- **Error Handling**: Robust error handling with fallback behavior
- **Debounced Queries**: 300ms debounce to prevent excessive API calls

### 🎯 Search Types

#### 1. Single Field Search
```typescript
// Search in a specific field
searchThings.searchField("name", "john");

// Or use the addQuery method
searchThings.addQuery({ field: "name", value: "john" });
```

#### 2. Multi-Field Search
```typescript
// Search across all searchable fields
searchThings.searchMultiField("john doe");

// Equivalent to:
searchThings.addQuery({ field: "multi", value: "john doe" });
```

#### 3. Manual Query Management
```typescript
// Set multiple queries at once
searchThings.setQueries([
  { field: "name", value: "john" },
  { field: "description", value: "developer" }
]);

// Remove specific field search
searchThings.removeQuery("name");

// Clear all searches
searchThings.clearQueries();
```

## Setup Instructions

### 1. Enable Search in Prisma Schema

Add the `// @enableSearch` comment above any field you want to make searchable:

```prisma
model User {
  id        String   @id @default(uuid())
  // @enableSearch
  name      String
  // @enableSearch  
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Thing {
  id        String   @id @default(uuid())
  // @enableSearch
  name      String? 
  // @enableSearch
  description String?
  someNumber Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Generate Hooks

Run the generation command:

```bash
npm run generate-hooks-dev
```

This will automatically:
- ✅ Create individual RPC functions for each searchable field
- ✅ Create multi-field RPC functions when multiple fields are searchable
- ✅ Generate GIN indexes for optimal performance
- ✅ Update TypeScript types with search capabilities

### 3. Database Functions Created

For each searchable field, the generator creates:

```sql
-- Individual field search function
CREATE OR REPLACE FUNCTION "public"."search_thing_by_name_prefix"(search_prefix text)
RETURNS SETOF "public"."Thing" AS $$
BEGIN
  -- Handle empty or null search terms
  IF search_prefix IS NULL OR trim(search_prefix) = '' THEN
    RETURN;
  END IF;
  
  -- Return query with proper error handling
  RETURN QUERY
  SELECT * FROM "public"."Thing"
  WHERE 
    "name" IS NOT NULL 
    AND "name" != ''
    AND to_tsvector('english', "name") @@ to_tsquery('english', search_prefix || ':*');
EXCEPTION
  WHEN others THEN
    -- Log error and return empty result set instead of failing
    RAISE NOTICE 'Search function error: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Multi-field search function (when multiple fields are searchable)
CREATE OR REPLACE FUNCTION "public"."search_thing_multi_field"(search_prefix text)
RETURNS SETOF "public"."Thing" AS $$
BEGIN
  -- Handle empty or null search terms
  IF search_prefix IS NULL OR trim(search_prefix) = '' THEN
    RETURN;
  END IF;
  
  -- Return query searching across all searchable fields
  RETURN QUERY
  SELECT * FROM "public"."Thing"
  WHERE 
    to_tsvector('english', 
      COALESCE("name", '') || ' ' || COALESCE("description", '')
    ) @@ to_tsquery('english', search_prefix || ':*');
EXCEPTION
  WHEN others THEN
    -- Log error and return empty result set instead of failing
    RAISE NOTICE 'Multi-field search function error: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4. GIN Indexes Created

```sql
-- Individual field indexes
CREATE INDEX "idx_gin_search_thing_name" ON "public"."Thing" 
USING GIN (to_tsvector('english', "name"));

CREATE INDEX "idx_gin_search_thing_description" ON "public"."Thing" 
USING GIN (to_tsvector('english', "description"));

-- Multi-field index
CREATE INDEX "idx_gin_search_thing_multi_field" ON "public"."Thing" 
USING GIN (to_tsvector('english', 
  COALESCE("name", '') || ' ' || COALESCE("description", '')
));
```

## Usage Examples

### Basic Usage

```typescript
import useSuparisma from './generated';

function SearchExample() {
  const things = useSuparisma.thing();
  
  const handleSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      // Search in name field only
      things.search.searchField("name", searchTerm);
    } else {
      things.search.clearQueries();
    }
  };
  
  const handleMultiSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      // Search across all searchable fields
      things.search.searchMultiField(searchTerm);
    } else {
      things.search.clearQueries();
    }
  };
  
  return (
    <div>
      <input 
        placeholder="Search name..." 
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <input 
        placeholder="Search all fields..." 
        onChange={(e) => handleMultiSearch(e.target.value)}
      />
      
      {things.search.loading && <div>Searching...</div>}
      
      {things.data.map(thing => (
        <div key={thing.id}>
          <h3>{thing.name}</h3>
          <p>{thing.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Advanced Search Management

```typescript
function AdvancedSearchExample() {
  const things = useSuparisma.thing();
  
  // Check current search state
  const isSearching = things.search.queries.length > 0;
  const currentQueries = things.search.queries;
  
  // Add multiple search criteria
  const handleComplexSearch = () => {
    things.search.setQueries([
      { field: "name", value: "john" },
      { field: "description", value: "developer" }
    ]);
  };
  
  // Remove specific search
  const removeNameSearch = () => {
    things.search.removeQuery("name");
  };
  
  return (
    <div>
      {isSearching && (
        <div>
          <p>Active searches: {currentQueries.length}</p>
          <button onClick={() => things.search.clearQueries()}>
            Clear All
          </button>
        </div>
      )}
      
      <button onClick={handleComplexSearch}>
        Search Multiple Fields
      </button>
      
      <button onClick={removeNameSearch}>
        Remove Name Search
      </button>
    </div>
  );
}
```

### Search with Filtering

```typescript
function SearchWithFilters() {
  const things = useSuparisma.thing({
    // Combine search with other filters
    where: {
      someNumber: { gt: 50 } // Only show items with number > 50
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Search will be applied on top of the where filter
  const handleSearch = (term: string) => {
    things.search.searchMultiField(term);
  };
  
  return (
    <div>
      <input 
        placeholder="Search (filtered results)..." 
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <p>Showing {things.count} results</p>
      
      {things.data.map(thing => (
        <div key={thing.id}>
          <h3>{thing.name}</h3>
          <p>Number: {thing.someNumber}</p>
        </div>
      ))}
    </div>
  );
}
```

## Search State API

The search object provides the following interface:

```typescript
interface SearchState {
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
}
```

## Performance Considerations

### 1. GIN Indexes
- Automatically created for each searchable field
- Provides fast full-text search performance
- Indexes are updated automatically when data changes

### 2. Debouncing
- 300ms debounce prevents excessive API calls
- Search requests are automatically batched

### 3. Client-Side Filtering
- Search results are further filtered client-side if additional `where` conditions are applied
- Maintains real-time updates and complex filter combinations

### 4. Error Handling
- RPC functions include error handling to prevent crashes
- Failed searches return empty results instead of throwing errors
- Client shows partial results if some searches fail

## Real-Time Integration

Search functionality integrates seamlessly with Suparisma's real-time features:

- **Real-time Updates**: Search results update automatically when underlying data changes
- **Live Filtering**: Real-time events are filtered to match current search criteria
- **Consistent State**: Search state is maintained during real-time updates

## Migration from Simple Search

If you're upgrading from a simpler search implementation:

1. **Add `// @enableSearch` comments** to your Prisma schema
2. **Run the generator** to create RPC functions and indexes
3. **Update your UI** to use the new search methods:

```typescript
// Old approach (if you had custom search)
const handleSearch = (term) => {
  // Custom search logic
};

// New approach
const handleSearch = (term) => {
  things.search.searchMultiField(term);
};
```

## Troubleshooting

### Common Issues

1. **RPC Function Not Found**
   - Ensure you've run the generator after adding `// @enableSearch`
   - Check that the field exists in your database table

2. **No Search Results**
   - Verify GIN indexes were created successfully
   - Check that search terms are not empty
   - Ensure fields contain text data

3. **TypeScript Errors**
   - Re-run the generator to update type definitions
   - Ensure you're importing from the correct generated file

### Debug Logging

The search implementation includes extensive console logging:

```typescript
// Enable in development to see search activity
console.log('🔍 Executing search: search_thing_by_name_prefix(search_prefix: "john")');
console.log('🔍 Search results for "name": 5 items');
console.log('🔍 Combined search results: 8 unique items');
```

## Best Practices

1. **Use Multi-Field Search** for general search boxes
2. **Use Field-Specific Search** for targeted filtering
3. **Combine with where filters** for complex queries
4. **Clear searches** when navigating away from search views
5. **Show loading states** during search operations
6. **Debounce user input** to prevent excessive API calls (handled automatically)

---

## Next Steps

The search functionality is now fully integrated with Suparisma. You can:

- ✅ Add more searchable fields by adding `// @enableSearch` comments
- ✅ Combine search with complex filtering and sorting
- ✅ Build sophisticated search UIs with real-time updates
- ✅ Scale to handle large datasets with PostgreSQL's full-text search performance 