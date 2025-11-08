# Vercel deployment checklist

The project is now configured to run inside a single Vercel serverless function that
wraps the Express application. Follow these steps to ensure production builds work
and that authentication state, user accounts, and CRM data continue to persist in
your PostgreSQL database.

## 1. Build output

The Vite client build emits into `server/public`, and the Vercel function includes
those files automatically. Keep the default `npm run build` command so that `vite`
finishes before the server bundle is produced.

## 2. Environment variables

Configure the deployment with the same values you use locally:

- `DATABASE_URL` – PostgreSQL connection string (Supabase-compatible). Required
  for all queries and for the session store.
- `SESSION_SECRET` – secret used to sign session cookies. Needed so login and
  registration continue to work between requests.
- `TWILIO_*`, `NEXT_PUBLIC_*`, or any other third-party keys you rely on in the
  client or server runtime.

These variables must be added in the Vercel dashboard under **Settings → Environment
Variables** for the project. Re-deploy after saving changes.

## 3. Database persistence

Users, leads, activities, and related CRM records are inserted via the
`DatabaseStorage` class in `server/storage.ts`, which uses Drizzle ORM on top of
the pooled PostgreSQL connection provided by `server/db.ts`. As long as the
`DATABASE_URL` points to the same database, accounts created in Vercel are stored
persistently, and login/auth flows will read/write data just like in local
development.

## 4. Static asset handling

`vercel.json` rewrites every request to `api/index`, and `api/index.ts` exports the
Express app. On the Vercel platform `process.env.VERCEL` is set, so
`server/index.ts` skips booting an HTTP listener and instead serves pre-built
static assets directly from `server/public` inside the function. No additional
routing rules are necessary for client-side navigation.

## 5. Limitations

The WebSocket bootstrap is disabled in serverless mode, so any realtime features
that rely on the long-lived socket will not be available on Vercel. For those
features you will need a separate service that supports persistent connections.
