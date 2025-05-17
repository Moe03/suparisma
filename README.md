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

## ENV Variables 
You must set the following ENV variables to properly install suparisma:

```bash
# Supabase, Prisma specific (Required)
DATABASE_URL=""
DIRECT_URL=""
# (Public keys) Should be exposed to browser
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Suparisma specific (Optional)
SUPARISMA_OUTPUT_DIR=
SUPARISMA_PRISMA_SCHEMA_PATH=""
```

## Basic Usage

Add annotations to your Prisma schema:

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

Generate your hooks:

```bash
npx suparisma generate
```

Use the hooks in your React components:

```tsx
import useSuparisma from './suparisma/generated';

function UserList() {
  // Get a hook with realtime updates (enabled by default)
  const users = useSuparisma.user();
  
  // Destructure the data, loading, and error states
  const { data, loading, error } = users;
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {data.map(user => (
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

## Annotations

- **Realtime**: Enabled by default for all models. Use `// @disableRealtime` to opt out.
- **Search**: Add `// @enableSearch` to a string field to enable full-text search.

## Environment Variables

The following environment variables are required:

- `DATABASE_URL` - Your Postgres database URL (used by Prisma)
- `DIRECT_URL` - Direct URL to your Postgres database (for setting up realtime)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## License

MIT