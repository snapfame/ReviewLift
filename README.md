# ReviewLift

Multi-tenant SaaS that helps genuine customers write and publish their own Google reviews. Built with TanStack Start (Vite + React SSR), TypeScript, Tailwind CSS, and Supabase.

This is **not** a Next.js app. Lovable generated a TanStack Start full-stack application. The Vite/Nitro build already targets **Cloudflare Workers** (not a static Cloudflare Pages SPA).

## Local development

1. Copy `.env.example` to `.env` and fill in your Supabase project values.
2. Apply SQL migrations in `supabase/migrations/` to that project (Lovable Cloud applies the first ones automatically; run the latest file in the Supabase SQL editor if RPCs are missing).
3. Install and run:

```sh
npm install
npm run dev
```

4. Open the printed local URL (usually `http://localhost:5173`).
5. Customer demo (after seed data exists): `/r/jangid-carwala`

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser + Vite | Supabase API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser + Vite | Publishable / anon key |
| `SUPABASE_URL` | Server | Same URL for SSR / server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Same publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Optional. Never expose to the client. Used when present for admin-bypass server functions. The public review flow also works without it via RLS + RPCs. |

Do not put a service-role key in any `VITE_*` variable.

## First super admin

Sign up at `/signup`, then in the Supabase SQL editor:

```sql
update public.profiles
set system_role = 'super_admin'
where email = 'you@example.com';
```

Jangid Carwala is seeded as an active tenant (`slug = jangid-carwala`) with no owner. Assign an owner from `/admin` after you are a super admin.

## Deploy (Cloudflare Workers)

Do not deploy until you are ready. This app uses SSR and server functions, so it belongs on **Cloudflare Workers** (Nitro preset), not a static Pages-only upload.

```sh
npm run build
npx wrangler deploy
```

`@lovable.dev/vite-tanstack-config` already sets Nitro’s default target to Cloudflare. Bind the same environment variables in the Worker as in `.env.example`.

## Scripts

- `npm run dev` — local Vite / TanStack Start
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — ESLint
