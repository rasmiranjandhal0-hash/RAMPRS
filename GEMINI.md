# RAMPRS Workspace Constitution & Core Engineering Directives

This document defines the strict, non-negotiable architectural, security, and design invariants for the **RAMPRS Omni-Channel Clothing E-Commerce Platform** (`ramprs-commerce`).

---

## 1. Brand Identity & Global Constants
- **Brand Name**: `RAMPRS`
- **SKU Prefix**: `RAMPRS-` (All product variant SKUs must match `^RAMPRS-[A-Z0-9-]+$`, e.g., `RAMPRS-TEE-BLK-M`)
- **Deep-Link Scheme**: `ramprs://` (`ramprs://product/[slug]`, `ramprs://orders/[id]`)
- **Shared Monorepo Package**: `@ramprs/shared`

---

## 2. Monorepo Topology
The monorepo uses **pnpm workspaces** and **Turborepo**:
- `packages/shared`: Shared Zod validation schemas, inferred TypeScript types, and universal business helpers.
- `apps/api`: Node.js / Express backend with Supabase Service Role integration, Razorpay payment processing, and Resend transactional emails. Target deploy: **Render**.
- `apps/web`: Next.js App Router full-stack web application containing both the customer-facing storefront and the staff/admin back-office. Target deploy: **Vercel**.
- `apps/mobile`: Cross-platform iOS and Android mobile app built with React Native, Expo Router, NativeWind, and Supabase client with secure storage. Target deploy: **Expo EAS**.

---

## 3. Financial Integrity & Currency Handling (Zero Decimal Flaws)
1. **Paise Representation**:
   - Every price, subtotal, discount, tax (GST), shipping fee, and grand total MUST be computed and stored as an integer number of **paise** (`mrp_paise`, `sale_price_paise`, `subtotal_paise`, etc.).
   - Example: ₹999.00 is strictly represented as `99900` paise. No floating-point currencies are permitted in databases or network transfer payloads.
2. **Server-Side Pricing Authority**:
   - Clients (web or mobile) NEVER dictate prices or total calculations.
   - When an order request is received by `apps/api`, the API looks up the current verified prices and stock directly from Supabase, calculates applicable discounts, 12%/18% apparel GST, and shipping fees.
3. **Atomic Stock Decrement and Restoration**:
   - Order confirmation and inventory decrement MUST occur in an atomic PostgreSQL transaction using row-level locking (`FOR UPDATE`) via `confirm_order_and_decrement_stock`.
   - In cancellations or approved returns, inventory must be restored via `restore_order_stock`.

---

## 4. Security & Credential Hygiene
- **Strict Secret Boundary**:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `RAZORPAY_KEY_SECRET` / `PAYMENT_KEY_SECRET`
  - `PAYMENT_WEBHOOK_SECRET`
  MUST strictly reside in `apps/api` environment variables. They must NEVER be leaked to `apps/web` (never in `NEXT_PUBLIC_*`) or `apps/mobile` (never in `EXPO_PUBLIC_*`).
- **Client Security**:
  - Clients only interact with Supabase using the public anonymous key (`SUPABASE_ANON_KEY`) subject to Row-Level Security (RLS).
  - Admin endpoints require JWT authentication verified by Supabase Admin, matching `profiles.role IN ('admin', 'staff')`.

---

## 5. Coding Standards & Integrity
- **No Mocking or Placeholders**: All endpoints, models, queries, and UI components must be fully implemented.
- **Strict Typing**: No `any` types. All shared contracts, API request bodies, and responses must be typed via `@ramprs/shared`.
- **Pre-Commit Verification**: `pnpm typecheck` must pass cleanly across all workspaces without warnings or errors.

