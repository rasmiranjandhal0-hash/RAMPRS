-- ==============================================================================
-- RAMPRS OMNI-CHANNEL CLOTHING PLATFORM
-- FULL DATABASE SCHEMA, RLS POLICIES, STORAGE BUCKETS & ATOMIC STOCK RPC
-- Migration Version: 0001_ramprs_full_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.clothing_size AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fit_type AS ENUM ('SLIM', 'REGULAR', 'OVERSIZED', 'RELAXED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PAID',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'RETURN_REQUESTED',
    'EXCHANGE_APPROVED',
    'REFUNDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('PREPAID', 'COD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('PERCENTAGE', 'FLAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rma_type AS ENUM ('EXCHANGE', 'RETURN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rma_status AS ENUM (
    'PENDING',
    'APPROVED',
    'PICKUP_SCHEDULED',
    'COMPLETED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- 2.1 Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'customer',
  default_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 2.3 Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  fabric_care TEXT NOT NULL,
  fit_type public.fit_type NOT NULL,
  size_chart_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_active = true;

-- 2.4 Product Variants (SKU, Size, Color, Stock, Paise Prices)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  size public.clothing_size NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  mrp_paise INT NOT NULL CHECK (mrp_paise > 0),
  sale_price_paise INT NOT NULL CHECK (sale_price_paise > 0 AND sale_price_paise <= mrp_paise),
  stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- 2.5 Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_paise INT NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
  max_discount_paise INT CHECK (max_discount_paise IS NULL OR max_discount_paise > 0),
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 2.6 Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  payment_method public.payment_method NOT NULL DEFAULT 'PREPAID',
  subtotal_paise INT NOT NULL CHECK (subtotal_paise >= 0),
  discount_paise INT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  gst_paise INT NOT NULL DEFAULT 0 CHECK (gst_paise >= 0),
  shipping_paise INT NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  total_paise INT NOT NULL CHECK (total_paise > 0),
  coupon_code TEXT,
  shipping_address JSONB NOT NULL,
  gateway_order_id TEXT UNIQUE,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  courier_name TEXT,
  awb_tracking_number TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- 2.7 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  sku_snapshot TEXT NOT NULL,
  title_snapshot TEXT NOT NULL,
  size_snapshot public.clothing_size NOT NULL,
  color_snapshot TEXT NOT NULL,
  unit_price_paise INT NOT NULL CHECK (unit_price_paise > 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price_paise INT NOT NULL CHECK (total_price_paise > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 2.8 RMA Requests (Exchange / Return)
CREATE TABLE IF NOT EXISTS public.rma_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type public.rma_type NOT NULL,
  reason TEXT NOT NULL,
  requested_size public.clothing_size,
  status public.rma_status NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rma_user ON public.rma_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rma_order ON public.rma_requests(order_id);

-- 2.9 CMS Settings & Announcement Bar
CREATE TABLE IF NOT EXISTS public.cms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  hero_image_url TEXT NOT NULL,
  hero_cta_link TEXT NOT NULL DEFAULT '/shop',
  announcement_bar_text TEXT NOT NULL,
  is_announcement_active BOOLEAN NOT NULL DEFAULT true,
  featured_lookbook_slug TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 3.1 New User Trigger to create public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 Helper: Check if authenticated user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
  );
$$;

-- 3.3 Atomic Stock Decrement & Order Confirmation
CREATE OR REPLACE FUNCTION public.confirm_order_and_decrement_stock(
  p_order_id UUID,
  p_gateway_payment_id TEXT,
  p_gateway_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_variant RECORD;
BEGIN
  -- 1. Lock the order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- 2. Idempotency: if already PAID, return success immediately
  IF v_order.status = 'PAID' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'already_paid', true,
      'status', 'PAID'
    );
  END IF;

  IF v_order.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'Cannot confirm cancelled order: %', p_order_id;
  END IF;

  -- 3. Loop over items and decrement stock with row locking
  FOR v_item IN
    SELECT variant_id, quantity, sku_snapshot
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    SELECT * INTO v_variant
    FROM public.product_variants
    WHERE id = v_item.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found for order item', v_item.variant_id;
    END IF;

    IF v_variant.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for SKU %: requested %, available %',
        v_variant.sku, v_item.quantity, v_variant.stock_quantity;
    END IF;

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 4. Increment coupon usage count if coupon was applied
  IF v_order.coupon_code IS NOT NULL AND v_order.coupon_code <> '' THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = v_order.coupon_code;
  END IF;

  -- 5. Mark order as PAID
  UPDATE public.orders
  SET
    status = 'PAID',
    gateway_payment_id = p_gateway_payment_id,
    gateway_signature = p_gateway_signature,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'PAID'
  );
END;
$$;

-- 3.4 Atomic Stock Restoration on Order Cancellation / Refund
CREATE OR REPLACE FUNCTION public.restore_order_stock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Restore stock for each item
  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.variant_id;
  END LOOP;

  -- Decrement coupon used_count if previously incremented
  IF v_order.coupon_code IS NOT NULL AND v_order.coupon_code <> '' AND v_order.status = 'PAID' THEN
    UPDATE public.coupons
    SET used_count = GREATEST(0, used_count - 1)
    WHERE code = v_order.coupon_code;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'stock_restored', true);
END;
$$;

-- ==============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.2 Categories
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.3 Products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.4 Product Variants
CREATE POLICY "product_variants_public_read" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "product_variants_admin_all" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.5 Coupons
CREATE POLICY "coupons_read_active" ON public.coupons
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin());

CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.6 Orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.7 Order Items
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.8 RMA Requests
CREATE POLICY "rma_requests_select_own" ON public.rma_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "rma_requests_insert_own" ON public.rma_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rma_requests_admin_all" ON public.rma_requests
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4.9 CMS Settings
CREATE POLICY "cms_settings_public_read" ON public.cms_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "cms_settings_admin_all" ON public.cms_settings
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 5. STORAGE BUCKETS SETUP & POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('ramprs-products', 'ramprs-products', true),
  ('ramprs-invoices', 'ramprs-invoices', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 5.1 ramprs-products policies (Public Read, Admin Write)
CREATE POLICY "ramprs_products_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'ramprs-products');

CREATE POLICY "ramprs_products_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ramprs-products' AND public.is_admin());

CREATE POLICY "ramprs_products_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ramprs-products' AND public.is_admin());

CREATE POLICY "ramprs_products_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ramprs-products' AND public.is_admin());

-- 5.2 ramprs-invoices policies (Owner / Admin Read, Admin / Service Write)
CREATE POLICY "ramprs_invoices_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ramprs-invoices' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
    )
  );

CREATE POLICY "ramprs_invoices_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ramprs-invoices' AND public.is_admin());

