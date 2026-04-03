# Deploy this database to remote Supabase

Your schema is defined in Prisma (`prisma/schema.prisma`). The **correct** way to create it on Supabase is to point Prisma at Supabase and run migrations (not only paste `schema.sql`, unless you know what you’re doing).

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) → **New project**.
2. Choose region, set a **strong database password**, wait until the project is healthy.

## 2. Get connection strings

In Supabase: **Project Settings → Database → Connection string**.

| Variable | What to use |
|----------|-------------|
| **`DIRECT_URL`** | **Direct connection** — host like `db.<ref>.supabase.co`, port **5432**, user `postgres`, your DB password, database `postgres`. Append **`?sslmode=require`** if Prisma complains about SSL. |
| **`DATABASE_URL`** | **Session pooler** (recommended for the app runtime) — often host `aws-0-...pooler.supabase.com`, port **6543**, user like `postgres.<project_ref>`. Append **`?pgbouncer=true&connection_limit=1`** (and `&sslmode=require` if needed). |

Example shapes (replace placeholders):

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

Copy the **exact** URIs from the dashboard when possible.

## 3. Configure `backend/.env`

Set at least:

```env
DATABASE_URL="...pooled URI..."
DIRECT_URL="...direct 5432 URI..."

JWT_SECRET="long-random-string"

# Supabase → Project Settings → API → JWT Secret
SUPABASE_JWT_SECRET="your-jwt-secret"

# Admin emails for API (comma-separated, same idea as frontend)
ADMIN_EMAILS="you@example.com"
```

## 4. Apply schema (create tables on Supabase)

From your machine, in the **`backend`** folder:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

This creates **`User`**, **`Partner`**, **`Order`**, and all enums on the **remote** Supabase Postgres database.

If `migrate deploy` fails:

- Confirm **IPv4** or use Supabase’s instructions if your network blocks IPv6.
- Try adding **`?sslmode=require`** to both URLs.
- Ensure the password has no unescaped special characters in the URL (URL-encode if needed).

## 5. Optional: seed an admin user in **your** tables

```bash
npm run prisma:seed
```

That creates a row in **`User`** (e.g. `admin@campus.local`).  
**Note:** Your web **login** may use Supabase Auth; that user still needs to exist in **auth.users** separately if you want Supabase login with that email.

## 6. Optional: paste SQL instead of Prisma

Only if you **cannot** run Prisma against Supabase:

1. **SQL Editor** in Supabase → paste `supabase/schema.sql` → Run.  
2. Prisma migration history will **not** match; prefer **`migrate deploy`** for ongoing work.

## 7. Point your backend at Supabase

Once `migrate deploy` succeeds, start the API with the same `.env`. All Prisma queries use `DATABASE_URL` (pooler is fine for the Node server).

---

**Summary:** Create project → copy **direct + pooled** URLs into **`backend/.env`** → run **`npx prisma migrate deploy`** from **`backend`**. That builds the full remote database for this project.
