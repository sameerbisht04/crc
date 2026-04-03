# Supabase database for Campus Delivery

Your app uses **PostgreSQL** with these tables (Prisma models):

| Table    | Purpose |
|----------|---------|
| **User**   | Students & admins (`email`, `studentId`, `passwordHash`, `name`, `role`, `createdAt`) |
| **Partner**| Couriers (`email`, `name`, `phone`, `passwordHash`, `approved`, `earnings`, `createdAt`) |
| **Order**  | Deliveries (`type`, locations, `notes`, `payment`, `status`, `studentId`, `partnerId`, `amount`, `createdAt`) |

Enums: `Role`, `OrderType`, `PaymentMethod`, `OrderStatus`.

---

## Recommended: Prisma migrations (keeps history in sync)

1. In [Supabase](https://supabase.com): **Project Settings → Database** → copy:
   - **URI** (direct, port **5432**) → use as `DIRECT_URL`
   - **Pooler** / Session mode (port **6543**) → use as `DATABASE_URL` with  
     `?pgbouncer=true&connection_limit=1` appended (if using PgBouncer)

2. In `backend/.env` set both URLs (see root `.env.example`).

3. From the **`backend`** folder:

```bash
npx prisma generate
npx prisma migrate deploy
```

That creates all enums, tables, indexes, and foreign keys from `prisma/migrations/`.

4. Optional seed admin user:

```bash
npm run prisma:seed
```

---

## Alternative: Run raw SQL in Supabase

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste contents of **`schema.sql`** in this folder (only on an **empty** DB; drop conflicting objects first if you retry).
3. If you use raw SQL **instead of** `migrate deploy`, Prisma’s migration table may be out of sync — prefer **`migrate deploy`** when possible.

---

## Row Level Security (RLS)

These tables are meant for your **Express API** (server) using the Postgres connection string.  
If you later use Supabase **client** directly on tables, enable RLS and add policies.  
For API-only access with the DB password, many teams leave RLS off on app-specific tables or use a service role only on the server.

---

## Auth users (Supabase) vs app tables

- **auth.users** is managed by Supabase Auth (signup/login in the app).
- **User** / **Partner** / **Order** are your app’s business tables; Prisma fills them when users call your backend.
