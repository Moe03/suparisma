(BETA) - USE IN PRODUCTION AT YOUR OWN RISK.

# Suparisma
Supabase + Prisma!

![Suparisma Logo](https://vg-bunny-cdn.b-cdn.net/random/suparisma-banner.png)

A powerful, typesafe React hook generator for Supabase, driven by your Prisma schema. Suparisma provides you with real-time enabled CRUD hooks to interact with your Supabase database without writing any boilerplate code.

[![npm version](https://img.shields.io/npm/v/suparisma.svg?style=flat-square)](https://www.npmjs.com/package/suparisma)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Why Suparisma?](#why-suparisma)
- [Features](#features)
- [Installation](#installation)
- [React Native / Expo Setup](#react-native--expo-setup)
- [Quick Start](#quick-start)
- [Detailed Usage](#detailed-usage)
  - [Basic CRUD Operations](#basic-crud-operations)
  - [Realtime Updates](#realtime-updates)
  - [Filtering Data](#filtering-data)
  - [⚠️ IMPORTANT: Using Dynamic Filters with React](#️-important-using-dynamic-filters-with-react)
  - [Array Filtering](#array-filtering)
  - [Sorting Data](#sorting-data)
  - [Pagination](#pagination)
  - [Search Functionality](#search-functionality)
    - [Enabling Search](#enabling-search)
    - [Search Methods](#search-methods)
    - [Basic Search Examples](#basic-search-examples)
    - [JSON Field Search](#json-field-search)
    - [Advanced Search Features](#advanced-search-features)
    - [Real-World Search Examples](#real-world-search-examples)
    - [Search Implementation Details](#search-implementation-details)
- [Schema Annotations](#schema-annotations)
- [Building UI Components](#building-ui-components)
  - [Table with Filtering, Sorting, and Pagination](#table-with-filtering-sorting-and-pagination)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [CLI Commands](#cli-commands)
- [Advanced Usage](#advanced-usage)
  - [Custom Hooks](#custom-hooks)
  - [Error Handling](#error-handling)
  - [Performance Optimization](#performance-optimization)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Why Suparisma?

I love Supabase and Prisma and use them extensively in my projects, but combining them effectively for frontend development has always been frustrating. The typical solutions involve either setting up tRPC with constant refetching or implementing complex websocket solutions that often feel like overkill.

While Prisma gives me perfect type safety on the server, and Supabase offers great realtime capabilities, bridging these two worlds has remained a pain point. I've struggled to maintain type safety across the stack while efficiently leveraging Supabase's realtime features without resorting to excessive API calls or overly complex architectures.

Suparisma bridges this gap by:

- Creating **typesafe CRUD hooks** for all your Supabase tables
- Enabling easy **pagination, filtering, and search** on your data
- Leveraging both **Prisma** and **Supabase** official SDKs
- Respecting **Supabase's auth rules** for secure database access
- Working seamlessly with any React environment (Next.js, Remix, Tanstack Router, React Native, etc.)

## Features

- 🚀 **Auto-generated React hooks** based on your Prisma schema
- 🔄 **Real-time updates by default** for all tables (with opt-out capability)
- 🔒 **Type-safe interfaces** for all database operations
- 🔍 **Full-text search** with configurable annotations *(currently under maintenance)*
- 🔢 **Pagination and sorting** built into every hook
- 🧩 **Prisma-like API** that feels familiar if you already use Prisma
- 📱 **Works with any React framework** including Next.js, Remix, React Native, and Expo
- 🛠️ **Simple CLI** to generate hooks with a single command

## Installation

```bash
# Using npm
npm install suparisma

# Using yarn
yarn add suparisma

# Using pnpm
pnpm install suparisma
```

## React Native / Expo Setup

Suparisma fully supports React Native and Expo projects. Follow these additional steps for mobile development:

### 1. Install Dependencies

```bash
# Install Suparisma and required dependencies
pnpm install suparisma @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# For UUID generation support (recommended)
pnpm install react-native-get-random-values
```

### 2. Add Polyfills

Add these imports at the very top of your app's entry point (e.g., `App.tsx` or `index.js`):

```tsx
// App.tsx or index.js - Add these at the VERY TOP before any other imports
import 'react-native-get-random-values'; // Required for UUID generation
import 'react-native-url-polyfill/auto'; // Required for Supabase
```

### 3. Set Environment Variables

For **Expo** projects, use the `EXPO_PUBLIC_` prefix in your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

For **bare React Native** projects, use `react-native-dotenv` or similar.

### 4. Generate Hooks for React Native

Set the `SUPARISMA_PLATFORM` environment variable when generating:

```bash
# Generate hooks for React Native / Expo
SUPARISMA_PLATFORM=react-native npx suparisma generate
```

Or add it to your `package.json` scripts:

```json
{
  "scripts": {
    "suparisma:generate": "SUPARISMA_PLATFORM=react-native npx suparisma generate"
  }
}
```

### 5. Use the Hooks

The hooks work exactly the same as in web projects:

```tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import useSuparisma from './src/suparisma/generated';

function ThingList() {
  const { 
    data: things,
    loading,
    error,
    create: createThing
  } = useSuparisma.thing();
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <View>
      <FlatList
        data={things}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>{item.name} (Number: {item.someNumber})</Text>
        )}
      />
      
      <TouchableOpacity 
        onPress={() => createThing({ 
          name: "New Thing", 
          someNumber: Math.floor(Math.random() * 100)
        })}
      >
        <Text>Add Thing</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Platform Detection

The generated Supabase client automatically configures itself for React Native with:
- **AsyncStorage** for auth persistence
- **Session detection** disabled (not applicable in mobile)
- **Auto refresh token** enabled

## Quick Start

1. **Add a Prisma schema**: Ensure you have a valid `prisma/schema.prisma` file in your project

```prisma
// This is a sample Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Realtime is enabled by default
model Thing {
  id        String   @id @default(uuid())
  name      String?  // @enableSearch
  someNumber Int     @default(0)
  someEnum  String   @default("ONE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// @disableRealtime - Opt out of realtime for this model
model AuditLog {
  id        String   @id @default(uuid())
  action    String
  details   String?
  createdAt DateTime @default(now())
}
```

2. **Set up required environment variables** in a `.env` file:

```
# Required for Prisma and Supabase
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

3. **Generate hooks** with a single command:

```bash
npx suparisma generate
```
Note: you can adjust the prisma schema path and the generated files output path with these ENV variables:
```bash
SUPARISMA_PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
SUPARISMA_OUTPUT_DIR="./src/suparisma/generated"
SUPARISMA_PLATFORM="web" # or "react-native" for React Native/Expo projects
```
Also make sure to not change any of these generated files directly as **they will always be overwritten**

4. **Use the hooks** in your React components:

```tsx
import useSuparisma from './src/suparisma/generated';

function ThingList() {
  const { 
    data: things,
    loading,
    error,
    create: createThing
  } = useSuparisma.thing();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Things</h1>
      <ul>
        {things?.map(thing => (
          <li key={thing.id}>{thing.name} (Number: {thing.someNumber})</li>
        ))}
      </ul>
      
      <button onClick={() => createThing({ 
        name: "New Thing", 
        someNumber: Math.floor(Math.random() * 100)
      })}>
        Add Thing
      </button>
    </div>
  );
}
```

## Detailed Usage

### Basic CRUD Operations

Every generated hook provides a complete set of CRUD operations:

```tsx
const { 
  // State
  data,              // Array of records
  loading,           // Boolean loading state
  error,             // Error object if any
  
  // Actions
  create,            // Create a new record
  update,            // Update existing record(s)
  delete,            // Delete a record
  upsert,            // Create or update a record
  
  // Helpers
  count,             // Get count of records (respects where filters)
  refresh,           // Manually refresh data
} = useSuparisma.modelName();
```

#### Creating Records

```tsx
const { create: createThing } = useSuparisma.thing();

// Create a single record
await createThing({ name: "Cool Thing", someNumber: 42 });

// Create with nested data if your schema supports it
await createThing({
  name: "Cool Thing",
  someNumber: 42,
  // If you had relations defined:
  // tags: {
  //   create: [
  //     { name: "Important" },
  //     { name: "Featured" }
  //   ]
  // }
});
```

#### Reading Records

```tsx
// Get all records with default pagination (first 10)
const { data: things } = useSuparisma.thing();

// With filtering
const { data: importantThings } = useSuparisma.thing({
  where: { someEnum: "ONE" }
});

// With custom pagination
const { data: recentThings } = useSuparisma.thing({
  orderBy: { createdAt: "desc" },
  limit: 5
});
```

#### Updating Records

```tsx
const { update: updateThing } = useSuparisma.thing();

// Update by ID
await updateThing({ 
  where: { id: "thing-id-123" },
  data: { name: "Updated Thing" }
});

// Update many records matching a filter
await updateThing({
  where: { someEnum: "ONE" },
  data: { someEnum: "TWO" }
});
```

#### Deleting Records

```tsx
const { delete: deleteThing } = useSuparisma.thing();

// Delete by ID
await deleteThing({ id: "thing-id-123" });

// Delete with more complex filter
await deleteThing({ someNumber: 0 });
```

### Realtime Updates

Realtime updates are enabled by default for all models. The `data` will automatically update when changes occur in the database.

```tsx
// Enable realtime (default)
const { data: things } = useSuparisma.thing({ realtime: true });

// Disable realtime for this particular hook instance
const { data: logsNoRealtime } = useSuparisma.auditLog({ realtime: false });
```

### Filtering Data

Filter data using Prisma-like syntax:

```tsx
// Basic equality
const { data } = useSuparisma.thing({ 
  where: { someEnum: "ONE" } 
});

// Multiple conditions (AND)
const { data } = useSuparisma.thing({
  where: {
    someEnum: "ONE",
    someNumber: { gt: 10 }
  }
});

// Using operators
const { data } = useSuparisma.thing({
  where: {
    createdAt: { gte: new Date('2023-01-01') },
    name: { contains: "cool" }
  }
});
```

### ⚠️ IMPORTANT: Using Dynamic Filters with React

**You MUST use `useMemo` for dynamic where filters to prevent constant re-subscriptions!**

When creating `where` filters based on state variables, React will create a new object reference on every render, causing the realtime subscription to restart constantly and **breaking realtime updates**.

❌ **WRONG - This breaks realtime:**
```tsx
function MyComponent() {
  const [filter, setFilter] = useState("active");
  
  const { data } = useSuparisma.thing({
    where: filter ? { status: filter } : undefined // ❌ New object every render!
  });
}
```

✅ **CORRECT - Use useMemo:**
```tsx
import { useMemo } from 'react';

function MyComponent() {
  const [filter, setFilter] = useState("active");
  const [arrayFilter, setArrayFilter] = useState(["item1"]);
  
  // Create stable object reference that only changes when dependencies change
  const whereFilter = useMemo(() => {
    if (filter) {
      return { status: filter };
    }
    return undefined;
  }, [filter]); // Only recreate when filter actually changes
  
  const { data } = useSuparisma.thing({
    where: whereFilter // ✅ Stable reference!
  });
}
```

✅ **Complex example with multiple filters:**
```tsx
const whereFilter = useMemo(() => {
  if (arrayFilterValue && arrayOperator) {
    return {
      tags: arrayOperator === 'has' 
        ? { has: [arrayFilterValue] }
        : arrayOperator === 'hasEvery'
        ? { hasEvery: ["required", "tag", arrayFilterValue] }
        : { isEmpty: false }
    };
  } else if (statusFilter) {
    return { status: statusFilter };
  }
  return undefined;
}, [arrayFilterValue, arrayOperator, statusFilter]); // Dependencies

const { data } = useSuparisma.thing({ where: whereFilter });
```

**Why this matters:**
- Without `useMemo`, the subscription restarts on EVERY render
- This causes realtime events to be lost during reconnection
- You'll see constant "Unsubscribing/Subscribing" messages in the console
- Realtime updates will appear to be broken

**The same applies to `orderBy` if it's dynamic:**
```tsx
const orderByConfig = useMemo(() => ({
  [sortField]: sortDirection
}), [sortField, sortDirection]);

const { data } = useSuparisma.thing({ 
  where: whereFilter,
  orderBy: orderByConfig
});
```

### Array Filtering

Suparisma provides powerful operators for filtering array fields (e.g., `String[]`, `Int[]`, etc.):

```prisma
model Post {
  id       String   @id @default(uuid())
  title    String
  tags     String[] // Array field
  ratings  Int[]    // Array field
  // ... other fields
}
```

#### Array Operators

| Operator | Description | Example Usage |
|----------|-------------|---------------|
| `has` | Array contains **ANY** of the specified items | `tags: { has: ["react", "typescript"] }` |
| `hasSome` | Array contains **ANY** of the specified items (alias for `has`) | `tags: { hasSome: ["react", "vue"] }` |
| `hasEvery` | Array contains **ALL** of the specified items | `tags: { hasEvery: ["react", "typescript"] }` |
| `isEmpty` | Array is empty or not empty | `tags: { isEmpty: false }` |

#### Array Filtering Examples

```tsx
// Find posts that have ANY of these tags
const { data: reactOrVuePosts } = useSuparisma.post({
  where: {
    tags: { has: ["react", "vue", "angular"] }
  }
});
// Returns posts with tags like: ["react"], ["vue"], ["react", "typescript"], etc.

// Find posts that have ALL of these tags
const { data: fullStackPosts } = useSuparisma.post({
  where: {
    tags: { hasEvery: ["react", "typescript", "nodejs"] }
  }
});
// Returns posts that contain all three tags (and possibly more)

// Find posts with any of these ratings
const { data: highRatedPosts } = useSuparisma.post({
  where: {
    ratings: { hasSome: [4, 5] }
  }
});
// Returns posts with arrays containing 4 or 5: [3, 4], [5], [1, 2, 4, 5], etc.

// Find posts with no tags
const { data: untaggedPosts } = useSuparisma.post({
  where: {
    tags: { isEmpty: true }
  }
});

// Find posts that have tags (non-empty)
const { data: taggedPosts } = useSuparisma.post({
  where: {
    tags: { isEmpty: false }
  }
});

// Combine array filtering with other conditions
const { data: featuredReactPosts } = useSuparisma.post({
  where: {
    tags: { has: ["react"] },
    featured: true,
    ratings: { hasEvery: [4, 5] } // Must have both 4 AND 5 ratings
  }
});

// Exact array match (regular equality)
const { data: exactMatch } = useSuparisma.post({
  where: {
    tags: ["react", "typescript"] // Exact match: only this array
  }
});
```

#### Real-World Array Filtering Scenarios

```tsx
// E-commerce: Find products by multiple categories
const { data: products } = useSuparisma.product({
  where: {
    categories: { has: ["electronics", "gaming"] } // Any of these categories
  }
});

// Social Media: Find posts with specific hashtags
const { data: trendingPosts } = useSuparisma.post({
  where: {
    hashtags: { hasSome: ["trending", "viral", "popular"] }
  }
});

// Project Management: Find tasks assigned to specific team members
const { data: myTasks } = useSuparisma.task({
  where: {
    assignedTo: { has: ["john@company.com"] } // Tasks assigned to John
  }
});

// Content Management: Find articles with all required tags
const { data: completeArticles } = useSuparisma.article({
  where: {
    requiredTags: { hasEvery: ["reviewed", "approved", "published"] }
  }
});
```

#### Interactive Array Filtering Component

```tsx
import { useState } from "react";
import useSuparisma from '../generated';

function ProductFilter() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'any' | 'all'>('any');

  const { data: products, loading } = useSuparisma.product({
    where: selectedCategories.length > 0 ? {
      categories: filterMode === 'any' 
        ? { has: selectedCategories }           // ANY of selected categories
        : { hasEvery: selectedCategories }      // ALL of selected categories
    } : undefined
  });

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div>
      {/* Filter Mode Toggle */}
      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            value="any"
            checked={filterMode === 'any'}
            onChange={(e) => setFilterMode(e.target.value as 'any')}
          />
          Match ANY categories
        </label>
        <label>
          <input
            type="radio"
            value="all"
            checked={filterMode === 'all'}
            onChange={(e) => setFilterMode(e.target.value as 'all')}
          />
          Match ALL categories
        </label>
      </div>

      {/* Category Checkboxes */}
      <div className="mb-4">
        {['electronics', 'clothing', 'books', 'home', 'sports'].map(category => (
          <label key={category} className="mr-4">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryToggle(category)}
            />
            {category}
          </label>
        ))}
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div>
            <h3>Found {products?.length || 0} products</h3>
            {products?.map(product => (
              <div key={product.id}>
                <h4>{product.name}</h4>
                <p>Categories: {product.categories.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Sorting Data

Sort data using Prisma-like ordering:

```tsx
// Single field sort
const { data } = useSuparisma.thing({
  orderBy: { createdAt: "desc" }
});

// Multiple field sort
const { data } = useSuparisma.thing({
  orderBy: [
    { someEnum: "asc" },
    { createdAt: "desc" }
  ]
});
```

### Pagination

Suparisma supports offset-based pagination:

```tsx
// Offset-based pagination (page 1, 10 items per page)
const { data } = useSuparisma.thing({
  offset: 0,
  limit: 10
});

// Next page
const { data: page2 } = useSuparisma.thing({
  offset: 10,
  limit: 10
});

// Get total count
const { data, count } = useSuparisma.thing();
```

### Search Functionality

Suparisma provides powerful PostgreSQL full-text search capabilities with automatic RPC function generation and type-safe search methods. Search is enabled per field using annotations in your Prisma schema.

#### Enabling Search

Add search annotations to your Prisma schema fields:

```prisma
model Post {
  id          String   @id @default(uuid())
  // @enableSearch - applies to the next field (inline)
  title       String
  // @enableSearch - applies to the next field (standalone)
  content     String?
  tags        String[]
  
  /// @enableSearch - applies to the NEXT field that comes after this comment
  metadata    Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Three ways to enable search:**

1. **Inline comment**: `title String // @enableSearch`
2. **Standalone comment**: Place `// @enableSearch` on a line above the field
3. **Directive comment**: Place `/// @enableSearch` on a line, applies to the next field definition

#### Search Methods

Every searchable model provides comprehensive search functionality:

```tsx
const { 
  data: posts,
  search: searchPosts,
  loading,
  error 
} = useSuparisma.post();

// The search object provides:
// - queries: SearchQuery[]           // Current active search queries
// - loading: boolean                 // Search loading state
// - setQueries: (queries) => void    // Set multiple search queries
// - addQuery: (query) => void        // Add a single search query
// - removeQuery: (field) => void     // Remove search by field
// - clearQueries: () => void         // Clear all searches
// - searchMultiField: (value) => void    // Search across all searchable fields
// - searchField: (field, value) => void // Search specific field
// - getCurrentSearchTerms: () => string[] // Get terms for highlighting
// - escapeRegex: (text) => string    // Safely escape special characters
```

#### Basic Search Examples

```tsx
import useSuparisma from '../generated';

function PostSearch() {
  const { data: posts, search: searchPosts } = useSuparisma.post();
  
  return (
    <div>
      {/* Search in a specific field */}
      <input
        placeholder="Search titles..."
        onChange={(e) => {
          if (e.target.value.trim()) {
            searchPosts.searchField("title", e.target.value);
          } else {
            searchPosts.clearQueries();
          }
        }}
      />
      
      {/* Search across all searchable fields */}
      <input
        placeholder="Search everywhere..."
        onChange={(e) => {
          if (e.target.value.trim()) {
            searchPosts.searchMultiField(e.target.value);
          } else {
            searchPosts.clearQueries();
          }
        }}
      />
      
      {/* Display results */}
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

#### JSON Field Search

Suparisma supports full-text search on JSON fields when annotated with `/// @enableSearch`:

```prisma
model Document {
  id       String @id @default(uuid())
  title    String // @enableSearch
  
  /// @enableSearch - Enable search on the next JSON field
  metadata Json?   // Will be searchable as text
  
  /// @enableSearch
  content  Json?   // Complex JSON structures are converted to searchable text
}
```

JSON fields are automatically converted to searchable text during indexing:

```tsx
function DocumentSearch() {
  const { data: documents, search } = useSuparisma.document();
  
  return (
    <div>
      {/* Search within JSON metadata */}
      <input
        placeholder="Search metadata..."
        onChange={(e) => {
          if (e.target.value.trim()) {
            search.searchField("metadata", e.target.value);
          } else {
            search.clearQueries();
          }
        }}
      />
      
      {/* Search across all fields including JSON */}
      <input
        placeholder="Search everything (including JSON)..."
        onChange={(e) => {
          if (e.target.value.trim()) {
            search.searchMultiField(e.target.value);
          } else {
            search.clearQueries();
          }
        }}
      />
      
      {documents?.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <pre>{JSON.stringify(doc.metadata, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
```

**JSON Search Examples:**
```tsx
// Search for documents with specific metadata values
search.searchField("metadata", "author");  // Finds JSON containing "author"
search.searchField("content", "typescript"); // Finds JSON containing "typescript"

// Multi-field search includes JSON fields
search.searchMultiField("react tutorial"); // Searches title, metadata, content
```

#### Advanced Search Features

**Multi-word Search with AND Logic**
```tsx
// Searching "react typescript" finds posts containing BOTH words
searchPosts.searchField("title", "react typescript");
// Internally converts to: "react & typescript" for PostgreSQL
```

**Search Highlighting**
```tsx
function PostList() {
  const { data: posts, search } = useSuparisma.post();
  
  // Get current search terms for highlighting
  const searchTerms = search.getCurrentSearchTerms();
  
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    // Use the built-in regex escaping
    const escapedTerm = search.escapeRegex(searchTerm);
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
    
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : part
    );
  };
  
  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h3>
            {searchTerms.length > 0 
              ? highlightText(post.title, searchTerms[0])
              : post.title
            }
          </h3>
        </div>
      ))}
    </div>
  );
}
```

**Multiple Search Queries**
```tsx
// Search multiple fields simultaneously
search.setQueries([
  { field: "title", value: "react" },
  { field: "content", value: "tutorial" }
]);

// Add individual searches
search.addQuery({ field: "title", value: "javascript" });
search.addQuery({ field: "tags", value: "frontend" });

// Remove specific search
search.removeQuery("title");
```

**Search State Management**
```tsx
function SearchComponent() {
  const { search } = useSuparisma.post();
  
  // Monitor search state
  if (search.loading) {
    return <div>Searching...</div>;
  }
  
  // Display active searches
  if (search.queries.length > 0) {
    return (
      <div>
        <p>Active searches:</p>
        {search.queries.map((query, index) => (
          <span key={index} className="tag">
            {query.field}: "{query.value}"
            <button onClick={() => search.removeQuery(query.field)}>
              ×
            </button>
          </span>
        ))}
        <button onClick={search.clearQueries}>Clear All</button>
      </div>
    );
  }
  
  return <div>No active searches</div>;
}
```

#### Real-World Search Examples

**E-commerce Product Search**
```tsx
function ProductSearch() {
  const { data: products, search } = useSuparisma.product();
  const [searchType, setSearchType] = useState<'name' | 'description' | 'multi'>('multi');
  
  const handleSearch = (value: string) => {
    if (!value.trim()) {
      search.clearQueries();
      return;
    }
    
    switch (searchType) {
      case 'name':
        search.searchField('name', value);
        break;
      case 'description':
        search.searchField('description', value);
        break;
      case 'multi':
        search.searchMultiField(value);
        break;
    }
  };
  
  return (
    <div>
      {/* Search type selector */}
      <div className="search-controls">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="multi">Search All Fields</option>
          <option value="name">Product Name Only</option>
          <option value="description">Description Only</option>
        </select>
        
        <input
          placeholder={`Search ${searchType === 'multi' ? 'products' : searchType}...`}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      
      {/* Results with highlighting */}
      <div className="results">
        {search.loading && <div>Searching...</div>}
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

**Content Management Search**
```tsx
function ArticleSearch() {
  const { data: articles, search } = useSuparisma.article();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const performSearch = (term: string) => {
    if (term.trim()) {
      search.searchMultiField(term);
      // Add to history (avoid duplicates)
      setSearchHistory(prev => 
        [term, ...prev.filter(t => t !== term)].slice(0, 5)
      );
    } else {
      search.clearQueries();
    }
  };
  
  return (
    <div>
      <div className="search-box">
        <input
          placeholder="Search articles..."
          onChange={(e) => performSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.value = '';
              search.clearQueries();
            }
          }}
        />
        
        {/* Search suggestions from history */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <small>Recent searches:</small>
            {searchHistory.map((term, index) => (
              <button 
                key={index}
                onClick={() => performSearch(term)}
                className="suggestion"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Search stats */}
      {search.queries.length > 0 && (
        <div className="search-stats">
          Found {articles?.length || 0} articles for "{search.getCurrentSearchTerms().join(', ')}"
          {search.loading && <span> (searching...)</span>}
        </div>
      )}
    </div>
  );
}
```

#### Search Implementation Details

**PostgreSQL Full-Text Search**
- Uses `to_tsvector` and `to_tsquery` for efficient full-text search
- Automatically creates GIN indexes for searchable fields (recommended)
- Supports partial matching with prefix search (`:*`)
- Multi-word queries use AND logic (`&`) for better precision

**Generated RPC Functions**
Suparisma automatically generates PostgreSQL RPC functions for search:
- `search_{model}_by_{field}_prefix` - Single field search
- `search_{model}_multi_field` - Multi-field search

**Performance Considerations**
- Search queries are debounced (300ms) to prevent excessive API calls
- Results are cached and updated via realtime subscriptions
- Large datasets benefit from database-level GIN indexes:

```sql
-- Recommended indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_posts_title_gin 
ON posts USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_posts_content_gin 
ON posts USING gin(to_tsvector('english', content));
```

**Error Handling**
```tsx
function SearchWithErrorHandling() {
  const { data, search, error } = useSuparisma.post();
  
  useEffect(() => {
    if (error) {
      console.error('Search error:', error);
      // Fallback to basic filtering
      search.clearQueries();
    }
  }, [error]);
  
  // Component implementation...
}
```

## Schema Annotations

Suparisma uses comments in your Prisma schema to configure behavior:

```prisma
// Model level annotations

// @disableRealtime - Opt out of realtime for this model
model AuditLog {
  // ...fields
}

// Field level annotations

model Thing {
  id        String  @id @default(uuid())
  name      String? // @enableSearch - Enable full-text search for this field (inline)
  // @enableSearch - Enable search for the field above (standalone)
  description String? 
  someNumber Int
  
  /// @enableSearch - Enable search for the NEXT field that comes after this comment
  metadata Json?
}
```

Available annotations:

| Annotation | Description | Location | Example |
|------------|-------------|----------|---------|
| `@disableRealtime` | Disables real-time updates for this model | Model (before definition) | `// @disableRealtime`<br>`model AuditLog { ... }` |
| `// @enableSearch` | Enables full-text search (inline) | Field (after definition) | `name String // @enableSearch` |
| `// @enableSearch` | Enables full-text search (standalone) | Line above field | `// @enableSearch`<br>`name String` |
| `/// @enableSearch` | Enables full-text search (directive) | Applies to next field | `/// @enableSearch`<br>`metadata Json?` |

## Building UI Components

### Table with Filtering, Sorting, and Pagination

Here's a complete example of a data table with filtering, sorting, and pagination:

```tsx
import { useState } from "react";
import useSuparisma from '../generated';

export default function ThingTable() {
  const itemsPerPage = 10;
  const [page, setPage] = useState(0);
  const [enumFilter, setEnumFilter] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const { 
    data: things,
    loading: isLoading,
    error,
    create: createThing,
    update: updateThing,
    delete: deleteThing,
    count: thingCount,
  } = useSuparisma.thing({
    realtime: true,
    limit: itemsPerPage,
    offset: page * itemsPerPage,
    where: enumFilter ? {
      someEnum: enumFilter
    } : undefined,
    orderBy: {
      [sortField]: sortDirection
    }
  });

  if(error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Thing List</h1>
        <button 
          onClick={() => createThing({ 
            name: 'New Thing', 
            someNumber: Math.floor(Math.random() * 100) 
          })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Thing
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="enumFilter" className="block text-sm font-medium mb-1">
            Filter by Enum
          </label>
          <select
            value={enumFilter}
            onChange={(e) => {
              setEnumFilter(e.target.value);
              setPage(0); // Reset to first page when filter changes
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All</option>
            <option value="ONE">ONE</option>
            <option value="TWO">TWO</option>
            <option value="THREE">THREE</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortField" className="block text-sm font-medium mb-1">
            Sort By
          </label>
          <select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              setPage(0);
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="someNumber">Number</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortDirection" className="block text-sm font-medium mb-1">
            Direction
          </label>
          <select
            value={sortDirection}
            onChange={(e) => {
              setSortDirection(e.target.value);
              setPage(0);
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Number</th>
              <th className="py-2 px-4 border-b text-left">Enum</th>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center">Loading...</td>
              </tr>
            ) : things?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              things?.map((thing) => (
                <tr key={thing.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{thing.name}</td>
                  <td className="py-2 px-4 border-b">{thing.someNumber}</td>
                  <td className="py-2 px-4 border-b">{thing.someEnum}</td>
                  <td className="py-2 px-4 border-b">{thing.id}</td>
                  <td className="py-2 px-4 border-b">
                    <button 
                      onClick={() => updateThing({ 
                        where: { id: thing.id }, 
                        data: { name: `Updated ${thing.name}` } 
                      })}
                      className="bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded mr-2 text-sm"
                    >
                      Update
                    </button>
                    <button 
                      onClick={() => deleteThing({ id: thing.id })}
                      className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center">
        <button
          onClick={() => setPage(prev => Math.max(0, prev - 1))}
          disabled={page === 0}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-l disabled:opacity-50"
        >
          Previous
        </button>
        <span className="py-2 px-4">
          Page {page + 1}
          {thingCount && ` of ${Math.ceil(Number(thingCount) / itemsPerPage)}`}
        </span>
        <button
          onClick={() => setPage(prev => prev + 1)}
          disabled={!things || things.length < itemsPerPage}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-r disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Postgres database URL used by Prisma | `postgresql://user:pass@host:port/db` |
| `DIRECT_URL` | Yes | Direct URL to Postgres DB for realtime setup | `postgresql://user:pass@host:port/db` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (Web) | Your Supabase project URL (Next.js) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (Web) | Supabase anonymous key (Next.js) | `eyJh...` |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes (RN) | Your Supabase project URL (Expo) | `https://xyz.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes (RN) | Supabase anonymous key (Expo) | `eyJh...` |
| `SUPARISMA_OUTPUT_DIR` | No | Custom output directory | `src/lib/suparisma` |
| `SUPARISMA_PRISMA_SCHEMA_PATH` | No | Custom schema path | `db/schema.prisma` |
| `SUPARISMA_PLATFORM` | No | Target platform: `web` or `react-native` | `react-native` |

### CLI Commands

Suparisma provides a simple command-line interface:

```bash
# Generate hooks based on your Prisma schema
npx suparisma generate

# Show help information
npx suparisma help
```

## Stale Models Cleanup

When you delete a model from your Prisma schema and run the generation command, Suparisma automatically:
- Detects changes to your schema
- Deletes the entire generated directory
- Regenerates all hooks and types based on your current schema

This ensures you never have stale files lingering around for models that no longer exist in your schema.

## Advanced Usage

### Custom Hooks

You can combine Suparisma hooks with your own custom hooks for advanced use cases:

```tsx
import { useState } from 'react';
import useSuparisma from '../generated';

// Custom hook for managing important things
function useImportantThings() {
  const [category, setCategory] = useState<string>("ONE");
  
  const {
    data: things,
    loading,
    error,
    create: createThing,
    update: updateThing,
  } = useSuparisma.thing({
    where: { someEnum: category },
    orderBy: { someNumber: "desc" }
  });

  const addThing = (name: string, number: number) => {
    return createThing({
      name,
      someNumber: number,
      someEnum: category
    });
  };
  
  const changeCategory = (newCategory: string) => {
    setCategory(newCategory);
  };
  
  return {
    things,
    loading,
    error,
    addThing,
    updateThing,
    currentCategory: category,
    changeCategory
  };
}
```

### Error Handling

Handle errors gracefully with try/catch blocks:

```tsx
const { create, error } = useSuparisma.thing();

async function handleSubmit(event) {
  event.preventDefault();
  try {
    const result = await create({
      name: formData.name,
      someNumber: parseInt(formData.number)
    });
    console.log('Created!', result);
  } catch (err) {
    console.error('Failed to create thing:', err);
  }
}
```

### Performance Optimization

Optimize performance by:

1. Disabling realtime when not needed
2. Using pagination to limit data size
3. Using precise filter conditions

```tsx
// Only get what you need
const { data } = useSuparisma.thing({
  realtime: false, // Disable realtime if not needed
  where: { someEnum: "ONE" }, // Only get specific items
  select: { id: true, name: true, someNumber: true }, // Only select needed fields
  limit: 10 // Limit results
});
```

## API Reference

### Hook Options

| Option | Type | Description |
|--------|------|-------------|
| `where` | `object` | Filter conditions for the query |
| `orderBy` | `object \| array` | Sorting options |
| `limit` | `number` | Maximum number of records to return |
| `offset` | `number` | Number of records to skip for pagination |
| `realtime` | `boolean` | Enable/disable real-time updates |
| `select` | `object` | Fields to include in the response |
| `include` | `object` | Related records to include |
| `search` | `object` | Full-text search configuration |

### Hook Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `array` | Array of records matching the query |
| `loading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error object if request failed |
| `create` | `function` | Create a new record |
| `update` | `function` | Update existing record(s) |
| `delete` | `function` | Delete a record |
| `upsert` | `function` | Create or update a record |
| `count` | `function` | Get count of records |
| `refresh` | `function` | Manually refresh data |

## Troubleshooting

### Common Issues

**Realtime not working**
- First, make sure you have ran npx suparisma generate as that will automatically add all your tables to the realtime supabase publication.
- Second, Make sure to have realtime: true in the hook usage and also in supabase go to tables > publications > supabase_realtime and there you must find the tables you created in prisma in there or the realtime is not working properly.

**No permissions/this table doesn't exist**
- If you ever run into such issue make sure the **anon** has suffiecient permissions to access your tables, this issue especially is common when you do prisma migrate.
```sql
-- Replace YOUR_TABLE_NAME with the actual table names affected by your migration

-- Grant usage on the schema to anon
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT, INSERT, UPDATE, DELETE on tables to anon
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables also grant these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

-- Grant usage on sequences to anon (if using auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure future sequences also grant usage to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon;
```
 
You could also try debugging on a table, the following is NOT recommended but you can debug permissions given to anon, service_account and give all access to anon key to make sure that's not the issue:
```sql
GRANT ALL ON TABLE "(tableName)" TO anon;
GRANT ALL ON TABLE "(tableName)" TO authenticated;
```

**"Unknown command: undefined"**

This happens when running the CLI without specifying a command. Use `npx suparisma generate` instead.

**"DIRECT_URL environment variable not found"**

You need to provide a direct PostgreSQL connection URL in your `.env` file for realtime functionality.

**"Table X was already in supabase_realtime publication"**

This is just an informational message, not an error. Your table is already configured for realtime updates.

**Hook data doesn't update in real-time**

Check:
1. The model doesn't have `@disableRealtime` annotation
2. The hook is called with `realtime: true` (default)
3. Your Supabase project has realtime enabled in the dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
