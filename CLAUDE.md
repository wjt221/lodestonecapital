# Lodestone Capital — Investment Management Platform

## Project Overview
Private equity investment management platform for Lodestone Capital (lodestoneglobal.com).
Built with Next.js 15 App Router, tRPC v11, Prisma 5, NextAuth v5, Tailwind CSS.

## Live Deployment
- **Production**: https://lodestonecapital.vercel.app (or similar *.vercel.app URL)
- **GitHub**: https://github.com/wjt221/lodestonecapital
- **Branch**: `claude/build-lodestone-platform-OE2yy`
- **Database**: Neon PostgreSQL (free tier)

## Key Environment Variables (set in Vercel)
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string (no -pooler in hostname)
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — random 32-char secret
- `NEXTAUTH_URL` — https://your-app.vercel.app

## Tech Stack
- **Framework**: Next.js 15 App Router (`src/app/`)
- **API**: tRPC v11 with React Query (`/api/trpc`)
- **Auth**: NextAuth v5 JWT strategy (15-min inactivity, 8-hr absolute timeout)
- **ORM**: Prisma 5 with Neon PostgreSQL
- **UI**: Tailwind CSS + Plus Jakarta Sans font + custom compass SVG logo
- **Colors**: Navy `#0F172A` + Gold `#C9A84C`

## Route Structure
```
/login                          Public login (split-screen branded layout)
/register                       Public registration (first user → SUPER_ADMIN)
/dashboard                      Main dashboard (KPI cards, deal pipeline, activity)
/dashboard/crm/deals            Deal pipeline list
/dashboard/crm/deals/new        Create new deal
/dashboard/crm/deals/[id]       Deal detail (stage change, team, history)
/dashboard/crm/contacts         Contact list
/dashboard/crm/contacts/new     Create new contact
/dashboard/crm/contacts/[id]    Contact detail (info, interactions)
/dashboard/crm/companies        Company list
/dashboard/crm/companies/new    Create new company
/dashboard/portfolio            Portfolio overview
/dashboard/portfolio/[id]       Portfolio company detail (KPIs, valuations, alerts)
/dashboard/dataroom             Data rooms
/dashboard/reporting            Investor reports
/dashboard/audit                Audit log (immutable 7-year retention)
/dashboard/admin/users          User management (Add User modal)
/api/trpc/[trpc]                tRPC endpoint
/api/auth/[...nextauth]         NextAuth endpoint
/api/bootstrap                  One-time role elevation (requires BOOTSTRAP_SECRET env var)
```

## Key Files
- `src/server/api/root.ts` — tRPC router aggregator
- `src/server/api/routers/` — one file per domain (deal, contact, company, fund, portfolio, dataroom, reporting, audit, dashboard, user)
- `src/server/auth/rbac.ts` — 11 roles, 50+ permissions, SUPER_ADMIN has all permissions
- `src/server/auth/config.ts` — NextAuth configuration (bcrypt + optional OIDC)
- `src/components/layout/sidebar.tsx` — Nav sidebar with compass logo + signOut()
- `src/app/(dashboard)/layout.tsx` — Auth guard (redirects to /login if no session)
- `prisma/schema.prisma` — Full Prisma schema (~1100 lines)
- `prisma/seed.ts` — Demo data seed (run: `npm run db:seed`)
- `scripts/setup-db.mjs` — Neon serverless schema setup (runs during build)
- `vercel.json` — Vercel config (tRPC 30s timeout, auth 15s)

## RBAC Roles
11 roles: `SUPER_ADMIN` (all perms) → `MANAGING_PARTNER` → `PARTNER` → `PRINCIPAL` → `ASSOCIATE` → `ANALYST` → `INVESTOR_RELATIONS` → `COMPLIANCE` → `FUND_ACCOUNTANT` → `LP_VIEWER` → `READ_ONLY`

## Build & Deploy
```bash
npm run build          # prisma generate + setup-db + next build
npm run db:seed        # Seed demo data (users, deals, companies, contacts)
npm run db:migrate     # Run Prisma migrations (dev)
npm run db:studio      # Open Prisma Studio
```

## Demo Accounts (after seeding)
Password for all: `Lodestone2025!`
- `admin@lodestonecapital.com` — SUPER_ADMIN
- `partner@lodestonecapital.com` — MANAGING_PARTNER
- `analyst@lodestonecapital.com` — ANALYST

## Current Status
- All 9 dashboard pages working with real tRPC data
- New Deal / New Contact / New Company create forms live
- Sign-out uses `signOut()` from next-auth/react
- Database tables created automatically during Vercel build via `setup-db.mjs`
- Neon database connected (requires DATABASE_URL in Vercel env vars)
- Role SQL: `UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'william@lodestoneglobal.com';`
