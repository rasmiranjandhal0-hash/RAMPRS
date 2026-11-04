# RAMPRS Omni-Channel Clothing E-Commerce Platform (`ramprs-commerce`)

> **Contemporary Indian Luxury Streetwear & Bespoke Tailoring Platform**  
> Complete monorepo powered by **Turborepo**, **pnpm workspaces**, **Express (Render)**, **Next.js App Router (Vercel)**, **React Native Expo (iOS & Android)**, and **Supabase (PostgreSQL + RLS)**.

---

## 🏛 Architecture & Invariants

1. **Brand Standard**:
   - Brand Name: `RAMPRS`
   - SKU Prefix: Enforced regex `^RAMPRS-[A-Z0-9-]+$` (e.g., `RAMPRS-TEE-BLK-M`)
   - Deep Linking: `ramprs://` (`ramprs://product/[slug]`, `ramprs://orders/[id]`)
   - Monorepo Topology:
     - `packages/shared` (`@ramprs/shared`): Shared TypeScript contracts and Zod validation schemas
     - `apps/api`: Node.js / Express backend with Supabase Admin, Razorpay, and Resend
     - `apps/web`: Full-stack customer storefront and staff/admin back-office in Next.js App Router
     - `apps/mobile`: React Native Expo Router iOS & Android app with secure credentials storage
2. **Zero-Decimal Financial Integrity**:
   - All currencies, prices, subtotals, GST (12%/18%), and discounts are stored and computed in **integer paise** (`mrp_paise`, `sale_price_paise`, `total_paise`). Example: ₹999.00 = `99900` paise.
   - Client applications never dictate prices or totals; cart valuations are calculated on `apps/api` directly against verified database rows.
   - Stock deduction and order confirmations are performed in atomic PostgreSQL transactions with row-level locking (`FOR UPDATE`) via `confirm_order_and_decrement_stock` and restored via `restore_order_stock`.
3. **Secret Boundary**:
   - `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RAZORPAY_KEY_SECRET`, and `PAYMENT_WEBHOOK_SECRET` are strictly kept on `apps/api`.
   - Storefront and Mobile clients access Supabase exclusively using the public `SUPABASE_ANON_KEY` subject to Row-Level Security (RLS).

---

## 📦 Monorepo Directory Structure

```text
RAMPRS/
├── .agents/                                # ECC Agents, Skills & Rules integration
├── GEMINI.md                               # Workspace constitution & invariants
├── turbo.json                              # Turborepo task pipelines
├── pnpm-workspace.yaml                     # pnpm monorepo workspace configuration
├── tsconfig.base.json                      # Strict base TypeScript configuration
├── package.json                            # Monorepo root scripts & dev tools
│
├── packages/
│   └── shared/                             # @ramprs/shared
│       ├── src/index.ts                    # Zod schemas, types, and money utils
│       └── package.json
│
├── apps/
│   ├── api/                                # Render Express Backend
│   │   ├── src/
│   │   │   ├── config/env.ts               # Validated server environment
│   │   │   ├── emails/                     # Resend React Email templates
│   │   │   │   ├── RamprsOrderConfirmation.tsx
│   │   │   │   ├── RamprsOrderShipped.tsx
│   │   │   │   └── RamprsRmaStatus.tsx
│   │   │   ├── lib/                        # Supabase Admin, Razorpay, Resend clients
│   │   │   ├── middleware/auth.ts          # Bearer JWT & Admin role verification
│   │   │   ├── routes/                     # checkout, webhooks, rma, admin
│   │   │   └── server.ts                   # Express server & /health check
│   │   └── package.json
│   │
│   ├── web/                                # Vercel Next.js App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (store)/                # Customer Storefront
│   │   │   │   │   ├── page.tsx            # Hero, campaigns & trending fits
│   │   │   │   │   ├── shop/page.tsx       # Faceted catalog (Size, Fit, Price)
│   │   │   │   │   ├── products/[slug]/    # PDP with gallery, Size Guide, SKU selector
│   │   │   │   │   ├── checkout/page.tsx   # Razorpay script checkout & address validation
│   │   │   │   │   ├── account/page.tsx    # Order tracker, printable invoices & RMA modal
│   │   │   │   │   └── login/page.tsx      # Email OTP & Google OAuth
│   │   │   │   └── (admin)/admin/          # Back-Office Admin Panel
│   │   │   │       ├── page.tsx            # Executive KPI dashboard & low-stock alerts
│   │   │   │       ├── products/page.tsx   # Automated Variant Matrix Builder
│   │   │   │       ├── orders/page.tsx     # Order fulfillment & AWB dispatch desk
│   │   │   │       ├── returns/page.tsx    # RMA size exchange & refund manager
│   │   │   │       ├── coupons/page.tsx    # Promo codes & discount thresholds
│   │   │   │       └── cms/page.tsx        # Live homepage & announcement bar editor
│   │   │   ├── components/                 # Storefront & Admin modular components
│   │   │   ├── lib/store/useRamprsStore.ts # Persistent Zustand cart & wishlist store
│   │   │   └── middleware.ts               # Admin role guard & session refresher
│   │   └── package.json
│   │
│   └── mobile/                             # Expo EAS iOS & Android Mobile App
│       ├── app/
│       │   ├── (tabs)/                     # Home, Shop, Bag, Wishlist, Profile tabs
│       │   ├── product/[slug].tsx          # Mobile PDP with swipeable gallery & size guide
│       │   └── orders/[id].tsx             # Visual tracking timeline & mobile RMA modal
│       ├── lib/                            # Supabase with expo-secure-store & AsyncStorage
│       └── app.json                        # ramprs:// deep linking & Expo configuration
│
└── supabase/
    ├── migrations/
    │   └── 0001_ramprs_full_schema.sql     # PostgreSQL tables, RLS policies & atomic RPC
    └── seed.sql                            # Sample categories, XS-XXL garments & banners
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20+` or `v24+` (Installed: `v24.18.0`)
- **pnpm**: `v12+` (Installed: `v12.16.1`)
- **Git**

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase, Razorpay, and Resend keys.

### 3. Database Migration & Seeding
In your Supabase dashboard or local Supabase CLI:
```bash
# Execute the schema migration:
psql -h <host> -d postgres -U postgres -f supabase/migrations/0001_ramprs_full_schema.sql

# Seed sample RAMPRS garments and categories:
psql -h <host> -d postgres -U postgres -f supabase/seed.sql
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Run Typecheck & Build
```bash
# Typecheck all 4 packages simultaneously:
pnpm typecheck

# Build the entire monorepo:
pnpm build
```

### 6. Start Development Servers
```bash
pnpm dev
```
- **Web Storefront & Admin**: `http://localhost:3000`
- **Express API**: `http://localhost:4000`
- **Render Health Monitoring**: `http://localhost:4000/health`
- **Expo Mobile Dev Server**: Run `pnpm --filter mobile start`

---

## 🌐 Production Deployment Guide

### A. Supabase (Database & Storage)
1. Run `supabase/migrations/0001_ramprs_full_schema.sql` via the Supabase SQL Editor.
2. Verify that `ramprs-products` and `ramprs-invoices` storage buckets are created.
3. Run `supabase/seed.sql` to populate initial categories and XS–XXL drops.

### B. Render (`apps/api`)
1. Create a **Web Service** on [Render](https://render.com).
2. Root Directory: `apps/api`
3. Build Command: `pnpm install && pnpm build`
4. Start Command: `node dist/server.js`
5. Health Check Path: `/health`
6. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `PAYMENT_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `FRONTEND_URL`

### C. Vercel (`apps/web`)
1. Import the Git repository to [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**
3. Root Directory: `apps/web`
4. Build Command: `pnpm build`
5. Output Directory: `.next`
6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### D. Expo EAS (`apps/mobile`)
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure build: `eas build:configure`
4. Build for Android APK/AAB or iOS IPA:
   ```bash
   eas build --platform all
   ```
5. Submit to stores: `eas submit --platform all`

---

## 🛡 Security & Verification Highlights
- **Row-Level Security (RLS)** active across 100% of database tables.
- **HMAC-SHA256 Signature Verification** for payment verification and raw webhook events.
- **Atomic Stock Row Locking** via PostgreSQL `FOR UPDATE` prevents overselling during high-concurrency drop launches.
- **Strict TypeScript Zero-Error Guarantee**: Clean compilation across all workspaces without `any` or placeholder types.

