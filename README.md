# YUZU (柚子) — Production Freelance Management Platform

> **Know your work. Know your money.**

YUZU is a production-grade SaaS platform built for freelancers, creators, video editors, designers, and developers who manage multiple clients, deliverable rate cards, earnings, payments, and outstanding balances.

---

## ✦ Key Features

- **Deliverables Ledger**: Generic, multi-disciplinary deliverable tracking (Instagram Reels, YouTube Videos, Shorts, Ads, Thumbnails, Motion Graphics, Design, Development, etc.).
- **Client Workspaces & Rate Cards**: Custom per-client rate cards with automatic rate auto-filling and flexible per-item overrides.
- **Strict Financial Reconciliation**:
  $$\text{Total Earned} = \sum(\text{Deliverables})$$
  $$\text{Total Received} = \sum(\text{Payments})$$
  $$\text{Outstanding} = \text{Total Earned} - \text{Total Received}$$
- **Fast Batch Work Entry**: "Save & Add Another" workflow with smart sticky retention for client and deliverable type, reducing batch logging friction by >70%.
- **Client Statements**: Instant monthly financial statement generator with URL deep-linking (`/statements?client={id}&month={m}&year={y}`).
- **Universal Work Search**: Multi-field, cross-token search across titles, client names, deliverable types, and statuses.
- **Command Menu (`⌘K` / `/`)**: Fast keyboard-driven navigation and quick action triggering.
- **Cloud-Ready & Offline-Resilient**: Supabase PostgreSQL database with Row Level Security (RLS) tenant isolation, automatic user workspace provisioning, and graceful offline localStorage fallback.

---

## ✦ Visual Identity & Design System

YUZU features a custom Japanese-inspired minimalist aesthetic with subtle citrus energy:

- **Yuzu Yellow**: `#F6D94E` (active accents, subtle focus rings)
- **Warm Light Canvas**: `#FAFAF7` (calm editorial surface)
- **Deep Dark Canvas**: `#11110F` (high-contrast dark mode)
- **Typography**: Clean hierarchy with Inter and monospace numbers for ledger precision
- **Geometry**: Restrained 8px grid system, crisp borders (`#E9E9E2` / `#292924`), no gratuitous rounded corners or noisy gradients

---

## ✦ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, SSR Auth)

---

## ✦ Database Architecture & Row Level Security

The PostgreSQL database enforces complete multi-tenant isolation via Supabase RLS.

### Normalized Schema:
1. `profiles`: User identity linked to Supabase Auth (`auth.users`)
2. `workspaces`: Tenant workspaces (supports multi-currency)
3. `workspace_members`: Team and owner roles (`owner`, `admin`, `member`)
4. `clients`: Client directory per workspace
5. `rate_cards`: Per-client deliverable rates
6. `deliverables`: Work ledger entries
7. `payments`: Payment receipts and ledger credits
8. `statements`: Generated client statement snapshots
9. `activities`: Audit and activity trail

### Tenant Isolation:
All database access is constrained through PostgreSQL Row Level Security:
```sql
CREATE POLICY "deliverables_access_policy" ON deliverables
    FOR ALL USING (is_workspace_member(workspace_id));
```
New users are automatically provisioned with a default workspace upon sign-up via PostgreSQL triggers.

---

## ✦ Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn

### 2. Installation
```bash
git clone https://github.com/amrnath005/YUZUU.git
cd YUZUU
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Provide your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lyebhpcnptlxgbzauelw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If no Supabase credentials are provided, YUZU automatically falls back to reactive local persistence mode for offline and local testing).*

### 4. Database Setup
To apply migrations to your Supabase project:
```bash
# Using Supabase CLI:
npx supabase db push

# Or run the SQL migration directly in your Supabase SQL Editor:
# supabase/migrations/20261004180000_init_yuzu_schema.sql
```

### 5. Running the Application
```bash
# Start development server
npm run dev

# Or build and run production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Testing & Verification

YUZU includes automated test suites covering DDL validation, tenant isolation, financial math invariants, batch workflows, and persistence:

```bash
# Run Supabase migration & RLS isolation tests (14 checks)
npm run test:migration

# Run UI workflow & regression tests (against running server)
npm run test:regression
```

---

## ✦ License

MIT
