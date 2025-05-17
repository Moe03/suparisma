# Suparisma

A React hook generator for Supabase that is driven by your Prisma schema, giving you type-safe, real-time enabled hooks to interact with your Supabase database.

## Why?
CRUD typesafetey with Supabase should be easy, currently it is not with a lot of issues that can rise easily espeically if you're not using Prisma.

Prisma solved supabase typesafely issue on the server, and TRPC helped making the client even more type safe but realtime capabilites from the DB to the browser was still lacking and that lead to a lot of unnecessary GET, POST requests if you just simply need to have realtime support.

Supabase's rules are also powerful and if you're using TRPC or any server solution you're easily missing out on them.

This package solves all this focusing, it lets you:
- Create typesafe CRUD hooks for all your supabase tables.
- Enables you to easily paginate, search and query in each table.
- Uses Prisma and Supabase official SDKs.
- Respects Supabase's auth rules enabling an easy way to secure your DB.
- Works with any React env. like NextJS/Remix/Tanstack Start/Router/etc..

## Features

- 🚀 **Auto-generated React hooks** based on your Prisma schema
- 🔄 **Real-time updates by default** for all tables (opt-out available)
- 🔒 **Type-safe interfaces** for all database operations
- 🔍 **Full-text search** capabilities with optional annotations
- 🔄 **Prisma-like API** that feels familiar if you use Prisma

## Installation

```bash
npm install suparisma
# or
yarn add suparisma
# or
pnpm install suparisma
```

## Quick Start

1. **Add a Prisma schema**: Make sure you have a valid `prisma/schema.prisma` file in your project.

2. **Set up required environment variables** in a `.env` file:

```
# Required for Prisma and Supabase
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"  # Direct Postgres connection
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

3. **Generate hooks** with a single command:

```bash
npx suparisma generate
```

This will:
- Read your Prisma schema from the current directory
- Configure your database for realtime functionality and search
- Generate type-safe React hooks in `src/suparisma/generated` (configurable)

4. **Use the hooks** in your React components:

```tsx
import useSuparisma from './src/suparisma/generated';

function UserList() {
  const users = useSuparisma.user();
  
  if (users.loading) return <div>Loading...</div>;
  if (users.error) return <div>Error: {users.error.message}</div>;
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.data?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      
      <button onClick={() => users.create({ name: "New User" })}>
        Add User
      </button>
    </div>
  );
}
```

## Annotations in Your Prisma Schema

Add annotations directly in your Prisma schema as comments:

```prisma
// Realtime is enabled by default for this model
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?  // @enableSearch
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

## Stale Models Cleanup

When you delete a model from your Prisma schema and run the generation command, Suparisma automatically:
- Detects changes to your schema
- Deletes the entire generated directory
- Regenerates all hooks and types based on your current schema

This ensures you don't have stale files lingering around for models that no longer exist in your schema.

## CLI Commands

Suparisma provides a simple CLI with the following commands:

```bash
# Generate hooks based on your Prisma schema
npx suparisma generate

# Show help information
npx suparisma help
```

## Configuration

You can customize the behavior using environment variables:

```
# Optional: Customize output directory
SUPARISMA_OUTPUT_DIR="src/hooks/generated"

# Optional: Specify custom schema path 
SUPARISMA_PRISMA_SCHEMA_PATH="path/to/schema.prisma"
```

## Environment Variables

The following environment variables are required:

- `DATABASE_URL` - Your Postgres database URL (used by Prisma)
- `DIRECT_URL` - Direct URL to your Postgres database (for setting up realtime)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## License

MIT