This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Auth Boilerplate

Clean-architecture register/login (`pure typescript`) with Supabase used only as the Postgres database (no `supabase-auth`), argon2 password hashing, and JWT-based sessions (httpOnly cookie). Auth is **purely server-side** via Server Actions — form submissions never hit a client-facing API.

### Setup

1. Install dependencies: `npm install`
2. Copy the env template and fill in real values: `cp .env.example .env`
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Project Settings → API
   - `JWT_SECRET`: any string ≥ 32 chars, e.g. `openssl rand -base64 32`
3. Create the `users` table by running [`database/schema.sql`](database/schema.sql) in the Supabase SQL Editor
4. Start the dev server: `npm run dev`

### Pages

| Route        | Description                                      |
| ------------ | ------------------------------------------------ |
| `/login`     | log in form (`app/actions/auth.ts` → `login`)    |
| `/register`  | sign-up form (auto logs in)                      |
| `/dashboard` | protected page; shows the current user + log out |

Registration and login run entirely on the server: the form posts to a Server Action which validates input, runs the use-case, sets the JWT session cookie, and `redirect()`s to `/dashboard`.

### Layout

- `src/domain/` — entities (`User`)
- `src/application/` — ports (interfaces), errors, and use-cases
- `src/infrastructure/` — adapters: Supabase user repository, argon2, jose (JWT), env
- `src/server/` — composition root (`container.ts`), session cookie helpers
- `app/actions/auth.ts` — Server Actions (`register`, `login`, `logout`)
- `app/auth/auth-form.tsx` + `app/login` / `app/register` / `app/dashboard` — UI

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
