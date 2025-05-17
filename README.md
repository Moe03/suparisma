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
- [Quick Start](#quick-start)
- [Detailed Usage](#detailed-usage)
  - [Basic CRUD Operations](#basic-crud-operations)
  - [Realtime Updates](#realtime-updates)
  - [Filtering Data](#filtering-data)
  - [Sorting Data](#sorting-data)
  - [Pagination](#pagination)
  - [Search Functionality](#search-functionality)
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

Achieving typesafe CRUD operations with Supabase can be challenging, especially without tools like Prisma. While Prisma solves typesafety on the server side, and tRPC improves client-side type safety, realtime capabilities from the database to the browser often remain a pain point, leading to unnecessary API requests.

Suparisma bridges this gap by:

- Creating **typesafe CRUD hooks** for all your Supabase tables
- Enabling easy **pagination, filtering, and search** on your data
- Leveraging both **Prisma** and **Supabase** official SDKs
- Respecting **Supabase's auth rules** for secure database access
- Working seamlessly with any React environment (Next.js, Remix, Tanstack Router, etc.)

## Features

- 🚀 **Auto-generated React hooks** based on your Prisma schema
- 🔄 **Real-time updates by default** for all tables (with opt-out capability)
- 🔒 **Type-safe interfaces** for all database operations
- 🔍 **Full-text search** with configurable annotations
- 🔢 **Pagination and sorting** built into every hook
- 🧩 **Prisma-like API** that feels familiar if you already use Prisma
- 📱 **Works with any React framework** including Next.js, Remix, etc.
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

For fields annotated with `// @enableSearch`, you can use full-text search:

```tsx
// Search things by name
const { data: searchResults } = useSuparisma.thing({
  search: {
    query: "cool",
    fields: ["name"]
  }
});
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
  name      String? // @enableSearch - Enable full-text search for this field
  description String? // @enableSearch - Can add to multiple fields
  someNumber Int
}
```

Available annotations:

| Annotation | Description | Location |
|------------|-------------|----------|
| `@disableRealtime` | Disables real-time updates for this model | Model (before definition) |
| `@enableSearch` | Enables full-text search on this field | Field (after definition) |

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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | `eyJh...` |
| `SUPARISMA_OUTPUT_DIR` | No | Custom output directory | `src/lib/suparisma` |
| `SUPARISMA_PRISMA_SCHEMA_PATH` | No | Custom schema path | `db/schema.prisma` |

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