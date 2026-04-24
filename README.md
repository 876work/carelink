# CareLink Caribbean MVP

Remix + TypeScript + Tailwind + Supabase full-stack MVP for a babysitting marketplace.

## Features
- Parent, babysitter, and admin roles.
- Auth with Supabase.
- Babysitter profile submission with government ID + selfie upload.
- Admin approval workflow.
- Parent babysitter search (approved only).
- Booking requests and babysitter accept/reject.
- Protected dashboards and role-based redirects.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Run migration in Supabase SQL editor:
   - `supabase/migrations/20260424093000_carelink_mvp.sql`
4. Create Supabase storage buckets:
   - `ids` (private)
   - `selfies` (private)
   - `profile_photos` (public read, owner write)
5. Start app:
   ```bash
   npm run dev
   ```

## Routes
- `/` landing
- `/signup` sign up
- `/login` login
- `/dashboard/parent`
- `/dashboard/babysitter`
- `/dashboard/admin`
- `/babysitter/profile/new`
- `/search`
- `/booking/request`
- `/booking/:bookingId`

## Notes
- Stripe, messaging, and advanced scheduling intentionally excluded for MVP scope.

## Netlify deploy notes
- This project uses the Netlify Remix adapter (`@netlify/remix-adapter`) via `vite.config.ts`.
- `netlify.toml` routes all requests to `/.netlify/functions/server` so deploy previews resolve Remix routes instead of returning a static 404 page.

## Build troubleshooting (Netlify)
If Netlify fails with `EJSONPARSE` for `package.json`, validate locally before pushing:

```bash
npm run validate:package-json
```

This checks the root `package.json` is strict JSON (no trailing commas/comments/conflict markers).
