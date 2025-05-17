# Suparisma Example with Next.js

This example demonstrates how to use Suparisma with a Next.js application. It shows how to use the generated hooks with Supabase's realtime functionality.

## Features

- Next.js App Router
- Supabase for authentication and database
- Suparisma for type-safe database access with realtime updates
- Prisma schema as the source of truth

## Key Points

- **Realtime Updates**: All models have realtime updates enabled by default, making your app reactive without additional code
- **Type Safety**: All database operations are fully typed based on your Prisma schema
- **Familiar API**: If you know Prisma, you'll feel right at home with Suparisma's API

## Getting Started

1. Clone the repository
2. Create a `.env.local` file with the following variables:
   ```
   DATABASE_URL="your-postgres-database-url"
   DIRECT_URL="your-direct-postgres-url" 
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
4. Generate the Suparisma hooks:
   ```bash
   npx suparisma generate
   ```
5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

## Prisma Schema

The Prisma schema in this example demonstrates how to use Suparisma's annotations:

```prisma
// Realtime is enabled by default (no annotation needed)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?  // @enableSearch (enables search on this field)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// @disableRealtime (explicitly disables realtime for this model)
model AuditLog {
  id        String   @id @default(uuid())
  action    String
  details   String?
  createdAt DateTime @default(now())
}
```

## How It Works

Open multiple browser windows to see realtime updates in action. Any changes made in one window will automatically appear in the other windows without manual refreshing.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
