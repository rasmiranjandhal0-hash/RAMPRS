-- ==============================================================================
-- RAMPRS SEED SCRIPT
-- Categories, Products, XS-XXL Variants, Coupons, and Initial CMS Settings
-- ==============================================================================

-- 1. CMS Settings & Announcement Bar
INSERT INTO public.cms_settings (
  id,
  hero_title,
  hero_subtitle,
  hero_image_url,
  hero_cta_link,
  announcement_bar_text,
  is_announcement_active,
  featured_lookbook_slug
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'AUTUMN / WINTER 2026 DROP',
  'Heavyweight Streetwear, Tailored Denim & Pure Festive Linens. Designed in India for the Modern Wardrobe.',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2076&auto=format&fit=crop',
  '/collections/oversized-tees',
  '✨ FREE EXPRESS SHIPPING ACROSS INDIA ON ALL ORDERS ABOVE ₹999 | USE CODE RAMPRS15 FOR 15% OFF ✨',
  true,
  'autumn-winter-2026'
)
ON CONFLICT (id) DO UPDATE SET
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  hero_image_url = EXCLUDED.hero_image_url,
  announcement_bar_text = EXCLUDED.announcement_bar_text;

-- 2. Categories
INSERT INTO public.categories (id, name, slug, image_url, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Men', 'men', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop', true),
  ('c0000000-0000-0000-0000-000000000002', 'Women', 'women', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop', true),
  ('c0000000-0000-0000-0000-000000000003', 'Oversized Tees', 'oversized-tees', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop', true),
  ('c0000000-0000-0000-0000-000000000004', 'Cargo & Denim', 'cargo-denim', 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop', true),
  ('c0000000-0000-0000-0000-000000000005', 'Festive Linen', 'festive-linen', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop')
ON CONFLICT (slug) DO NOTHING;

-- 3. Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_paise, max_discount_paise, usage_limit, used_count, is_active) VALUES
  ('RAMPRS15', 'PERCENTAGE', 15.00, 149900, 50000, 1000, 14, true),
  ('FESTIVE500', 'FLAT', 500.00, 299900, 50000, 500, 23, true),
  ('WELCOME10', 'PERCENTAGE', 10.00, 99900, 30000, 5000, 112, true)
ON CONFLICT (code) DO NOTHING;

-- 4. Products & Full XS-XXL Variants

-- 4.1 Product 1: RAMPRS Heavyweight Boxy Oversized Tee - Phantom Black
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'Heavyweight Boxy Oversized Tee',
  'heavyweight-boxy-oversized-tee-black',
  'Crafted from luxury 240 GSM combed single jersey cotton, the RAMPRS Heavyweight Boxy Tee delivers an effortlessly dropped shoulder silhouette. Finished with a dense ribbed crewneck that retains shape wash after wash.',
  '100% Combed Cotton. 240 GSM. Machine wash cold with similar colors. Do not iron directly on graphics. Flat dry in shade.',
  'OVERSIZED',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 40, "waist_in": 39, "length_in": 27, "shoulder_in": 19.5, "chest_cm": 101.6, "waist_cm": 99.0, "length_cm": 68.5, "shoulder_cm": 49.5},
      {"size": "S", "chest_in": 42, "waist_in": 41, "length_in": 28, "shoulder_in": 20.5, "chest_cm": 106.6, "waist_cm": 104.1, "length_cm": 71.1, "shoulder_cm": 52.0},
      {"size": "M", "chest_in": 44, "waist_in": 43, "length_in": 29, "shoulder_in": 21.5, "chest_cm": 111.7, "waist_cm": 109.2, "length_cm": 73.6, "shoulder_cm": 54.6},
      {"size": "L", "chest_in": 46, "waist_in": 45, "length_in": 30, "shoulder_in": 22.5, "chest_cm": 116.8, "waist_cm": 114.3, "length_cm": 76.2, "shoulder_cm": 57.1},
      {"size": "XL", "chest_in": 48, "waist_in": 47, "length_in": 31, "shoulder_in": 23.5, "chest_cm": 121.9, "waist_cm": 119.3, "length_cm": 78.7, "shoulder_cm": 59.6},
      {"size": "XXL", "chest_in": 50, "waist_in": 49, "length_in": 32, "shoulder_in": 24.5, "chest_cm": 127.0, "waist_cm": 124.4, "length_cm": 81.2, "shoulder_cm": 62.2}
    ],
    "model_height": "6 ft 1 in",
    "model_wearing_size": "L",
    "fit_notes": "Cut for a relaxed, slouchy look. Size down if you prefer a classic fit."
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000003',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-XS', 'XS', 'Phantom Black', '#0a0a0a', 199900, 149900, 15, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-S', 'S', 'Phantom Black', '#0a0a0a', 199900, 149900, 25, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-M', 'M', 'Phantom Black', '#0a0a0a', 199900, 149900, 40, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-L', 'L', 'Phantom Black', '#0a0a0a', 199900, 149900, 30, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-XL', 'XL', 'Phantom Black', '#0a0a0a', 199900, 149900, 18, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000001', 'RAMPRS-TEE-BLK-XXL', 'XXL', 'Phantom Black', '#0a0a0a', 199900, 149900, 8, ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

-- 4.2 Product 2: RAMPRS Vintage Wash Acid Oversized Tee - Concrete Grey
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000002',
  'Vintage Mineral Wash Oversized Tee',
  'vintage-mineral-wash-tee-grey',
  'Each piece undergoes an authentic artisanal mineral wash process, giving each t-shirt unique tonal highs and lows. Pre-shrunk 260 GSM French terry jersey.',
  '100% French Terry Cotton. Dry clean or cold delicate cycle inside out. Do not tumble dry.',
  'OVERSIZED',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 41, "waist_in": 40, "length_in": 27.5, "shoulder_in": 20, "chest_cm": 104.1, "waist_cm": 101.6, "length_cm": 69.8, "shoulder_cm": 50.8},
      {"size": "S", "chest_in": 43, "waist_in": 42, "length_in": 28.5, "shoulder_in": 21, "chest_cm": 109.2, "waist_cm": 106.6, "length_cm": 72.3, "shoulder_cm": 53.3},
      {"size": "M", "chest_in": 45, "waist_in": 44, "length_in": 29.5, "shoulder_in": 22, "chest_cm": 114.3, "waist_cm": 111.7, "length_cm": 74.9, "shoulder_cm": 55.8},
      {"size": "L", "chest_in": 47, "waist_in": 46, "length_in": 30.5, "shoulder_in": 23, "chest_cm": 119.3, "waist_cm": 116.8, "length_cm": 77.4, "shoulder_cm": 58.4},
      {"size": "XL", "chest_in": 49, "waist_in": 48, "length_in": 31.5, "shoulder_in": 24, "chest_cm": 124.4, "waist_cm": 121.9, "length_cm": 80.0, "shoulder_cm": 60.9},
      {"size": "XXL", "chest_in": 51, "waist_in": 50, "length_in": 32.5, "shoulder_in": 25, "chest_cm": 129.5, "waist_cm": 127.0, "length_cm": 82.5, "shoulder_cm": 63.5}
    ],
    "model_height": "5 ft 11 in",
    "model_wearing_size": "M"
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000003',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-XS', 'XS', 'Concrete Grey', '#5c5f62', 229900, 169900, 10, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-S', 'S', 'Concrete Grey', '#5c5f62', 229900, 169900, 20, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-M', 'M', 'Concrete Grey', '#5c5f62', 229900, 169900, 35, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-L', 'L', 'Concrete Grey', '#5c5f62', 229900, 169900, 25, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-XL', 'XL', 'Concrete Grey', '#5c5f62', 229900, 169900, 12, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000002', 'RAMPRS-TEE-GRY-XXL', 'XXL', 'Concrete Grey', '#5c5f62', 229900, 169900, 5, ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

-- 4.3 Product 3: RAMPRS Tactical Multi-Pocket Cargo Trouser - Olive Drab
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000003',
  'Tactical Relaxed Fit Cargo Trousers',
  'tactical-relaxed-cargo-trousers-olive',
  'Engineered with heavy-duty ripstop twill, reinforced knee articulation, deep gusseted 3D cargo pockets, and adjustable bungee cuffs.',
  '98% Cotton Ripstop, 2% Spandex. Machine wash 30°C. Do not bleach. Warm iron.',
  'RELAXED',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 28, "waist_in": 29, "length_in": 39, "shoulder_in": 16, "chest_cm": 71.1, "waist_cm": 73.6, "length_cm": 99.0, "shoulder_cm": 40.6},
      {"size": "S", "chest_in": 30, "waist_in": 31, "length_in": 40, "shoulder_in": 16.5, "chest_cm": 76.2, "waist_cm": 78.7, "length_cm": 101.6, "shoulder_cm": 41.9},
      {"size": "M", "chest_in": 32, "waist_in": 33, "length_in": 41, "shoulder_in": 17, "chest_cm": 81.2, "waist_cm": 83.8, "length_cm": 104.1, "shoulder_cm": 43.1},
      {"size": "L", "chest_in": 34, "waist_in": 35, "length_in": 41.5, "shoulder_in": 17.5, "chest_cm": 86.3, "waist_cm": 88.9, "length_cm": 105.4, "shoulder_cm": 44.4},
      {"size": "XL", "chest_in": 36, "waist_in": 37, "length_in": 42, "shoulder_in": 18, "chest_cm": 91.4, "waist_cm": 93.9, "length_cm": 106.6, "shoulder_cm": 45.7},
      {"size": "XXL", "chest_in": 38, "waist_in": 39, "length_in": 42.5, "shoulder_in": 18.5, "chest_cm": 96.5, "waist_cm": 99.0, "length_cm": 107.9, "shoulder_cm": 46.9}
    ],
    "fit_notes": "Built with an elasticated waistband and internal drawcord for adjustable waist tension."
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000004',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-XS', 'XS', 'Olive Drab', '#4b5320', 349900, 279900, 8, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-S', 'S', 'Olive Drab', '#4b5320', 349900, 279900, 18, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-M', 'M', 'Olive Drab', '#4b5320', 349900, 279900, 30, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-L', 'L', 'Olive Drab', '#4b5320', 349900, 279900, 22, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-XL', 'XL', 'Olive Drab', '#4b5320', 349900, 279900, 10, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000003', 'RAMPRS-CRG-OLV-XXL', 'XXL', 'Olive Drab', '#4b5320', 349900, 279900, 4, ARRAY['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

-- 4.4 Product 4: RAMPRS Pure Belgian Linen Resort Shirt - Ivory Cream
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000004',
  'Pure Belgian Linen Resort Shirt',
  'pure-belgian-linen-resort-shirt-ivory',
  'Woven from 100% natural European flax linen. Cut with an airy Cuban collar, genuine mother-of-pearl buttons, and a clean straight hem with side vents.',
  '100% Linen. Gentle cold hand wash or machine cycle. Line dry in shade. Iron damp with high steam.',
  'REGULAR',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 38, "waist_in": 36, "length_in": 27, "shoulder_in": 17, "chest_cm": 96.5, "waist_cm": 91.4, "length_cm": 68.5, "shoulder_cm": 43.1},
      {"size": "S", "chest_in": 40, "waist_in": 38, "length_in": 28, "shoulder_in": 18, "chest_cm": 101.6, "waist_cm": 96.5, "length_cm": 71.1, "shoulder_cm": 45.7},
      {"size": "M", "chest_in": 42, "waist_in": 40, "length_in": 29, "shoulder_in": 19, "chest_cm": 106.6, "waist_cm": 101.6, "length_cm": 73.6, "shoulder_cm": 48.2},
      {"size": "L", "chest_in": 44, "waist_in": 42, "length_in": 30, "shoulder_in": 20, "chest_cm": 111.7, "waist_cm": 106.6, "length_cm": 76.2, "shoulder_cm": 50.8},
      {"size": "XL", "chest_in": 46, "waist_in": 44, "length_in": 31, "shoulder_in": 21, "chest_cm": 116.8, "waist_cm": 111.7, "length_cm": 78.7, "shoulder_cm": 53.3},
      {"size": "XXL", "chest_in": 48, "waist_in": 46, "length_in": 32, "shoulder_in": 22, "chest_cm": 121.9, "waist_cm": 116.8, "length_cm": 81.2, "shoulder_cm": 55.8}
    ]
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000005',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-XS', 'XS', 'Ivory Cream', '#fdfbf7', 299900, 249900, 12, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-S', 'S', 'Ivory Cream', '#fdfbf7', 299900, 249900, 20, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-M', 'M', 'Ivory Cream', '#fdfbf7', 299900, 249900, 32, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-L', 'L', 'Ivory Cream', '#fdfbf7', 299900, 249900, 28, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-XL', 'XL', 'Ivory Cream', '#fdfbf7', 299900, 249900, 14, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000004', 'RAMPRS-SHRT-IVR-XXL', 'XXL', 'Ivory Cream', '#fdfbf7', 299900, 249900, 6, ARRAY['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

-- 4.5 Product 5: RAMPRS Heavy Selvedge Denim Jacket - Indigo
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000005',
  'Heavyweight Selvedge Trucker Jacket',
  'heavyweight-selvedge-trucker-jacket-indigo',
  'Woven on vintage shuttle looms from 14.5 oz unwashed red-line selvedge denim. Solid antiqued brass hardware, dual chest flap pockets, and reinforced flat-felled seams.',
  '100% Cotton Selvedge Denim. Cold soak only. Hang dry. Indigo may crock during initial wears.',
  'REGULAR',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 39, "waist_in": 37, "length_in": 25, "shoulder_in": 17.5, "chest_cm": 99.0, "waist_cm": 93.9, "length_cm": 63.5, "shoulder_cm": 44.4},
      {"size": "S", "chest_in": 41, "waist_in": 39, "length_in": 26, "shoulder_in": 18.5, "chest_cm": 104.1, "waist_cm": 99.0, "length_cm": 66.0, "shoulder_cm": 46.9},
      {"size": "M", "chest_in": 43, "waist_in": 41, "length_in": 27, "shoulder_in": 19.5, "chest_cm": 109.2, "waist_cm": 104.1, "length_cm": 68.5, "shoulder_cm": 49.5},
      {"size": "L", "chest_in": 45, "waist_in": 43, "length_in": 28, "shoulder_in": 20.5, "chest_cm": 114.3, "waist_cm": 109.2, "length_cm": 71.1, "shoulder_cm": 52.0},
      {"size": "XL", "chest_in": 47, "waist_in": 45, "length_in": 29, "shoulder_in": 21.5, "chest_cm": 119.3, "waist_cm": 114.3, "length_cm": 73.6, "shoulder_cm": 54.6},
      {"size": "XXL", "chest_in": 49, "waist_in": 47, "length_in": 30, "shoulder_in": 22.5, "chest_cm": 124.4, "waist_cm": 119.3, "length_cm": 76.2, "shoulder_cm": 57.1}
    ]
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000004',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-XS', 'XS', 'Raw Indigo', '#1a2942', 499900, 399900, 7, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-S', 'S', 'Raw Indigo', '#1a2942', 499900, 399900, 15, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-M', 'M', 'Raw Indigo', '#1a2942', 499900, 399900, 24, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-L', 'L', 'Raw Indigo', '#1a2942', 499900, 399900, 20, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-XL', 'XL', 'Raw Indigo', '#1a2942', 499900, 399900, 10, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000005', 'RAMPRS-JCK-IND-XXL', 'XXL', 'Raw Indigo', '#1a2942', 499900, 399900, 4, ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

-- 4.6 Product 6: RAMPRS Women Tailored Oversized Poplin Shirt - Crisp White
INSERT INTO public.products (
  id, title, slug, description, fabric_care, fit_type, size_chart_json, category_id, is_featured, is_active
) VALUES (
  'p0000000-0000-0000-0000-000000000006',
  'Tailored Oversized Cotton Poplin Shirt',
  'tailored-oversized-cotton-poplin-shirt-white',
  'Spun from 100% high-thread Egyptian cotton poplin with a silky hand feel. Features exaggerated cuffs, curved high-low shirttail hem, and clean back box pleat.',
  '100% Egyptian Cotton Poplin. Machine wash warm with like whites. Warm iron with spray for crisp finish.',
  'OVERSIZED',
  '{
    "measurements": [
      {"size": "XS", "chest_in": 40, "waist_in": 39, "length_in": 28, "shoulder_in": 18, "chest_cm": 101.6, "waist_cm": 99.0, "length_cm": 71.1, "shoulder_cm": 45.7},
      {"size": "S", "chest_in": 42, "waist_in": 41, "length_in": 29, "shoulder_in": 19, "chest_cm": 106.6, "waist_cm": 104.1, "length_cm": 73.6, "shoulder_cm": 48.2},
      {"size": "M", "chest_in": 44, "waist_in": 43, "length_in": 30, "shoulder_in": 20, "chest_cm": 111.7, "waist_cm": 109.2, "length_cm": 76.2, "shoulder_cm": 50.8},
      {"size": "L", "chest_in": 46, "waist_in": 45, "length_in": 31, "shoulder_in": 21, "chest_cm": 116.8, "waist_cm": 114.3, "length_cm": 78.7, "shoulder_cm": 53.3},
      {"size": "XL", "chest_in": 48, "waist_in": 47, "length_in": 32, "shoulder_in": 22, "chest_cm": 121.9, "waist_cm": 119.3, "length_cm": 81.2, "shoulder_cm": 55.8},
      {"size": "XXL", "chest_in": 50, "waist_in": 49, "length_in": 33, "shoulder_in": 23, "chest_cm": 127.0, "waist_cm": 124.4, "length_cm": 83.8, "shoulder_cm": 58.4}
    ]
  }'::jsonb,
  'c0000000-0000-0000-0000-000000000002',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, size, color_name, color_hex, mrp_paise, sale_price_paise, stock_quantity, images) VALUES
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-XS', 'XS', 'Crisp White', '#ffffff', 279900, 219900, 10, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-S', 'S', 'Crisp White', '#ffffff', 279900, 219900, 22, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-M', 'M', 'Crisp White', '#ffffff', 279900, 219900, 30, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-L', 'L', 'Crisp White', '#ffffff', 279900, 219900, 18, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-XL', 'XL', 'Crisp White', '#ffffff', 279900, 219900, 12, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop']),
  ('p0000000-0000-0000-0000-000000000006', 'RAMPRS-WPO-WHT-XXL', 'XXL', 'Crisp White', '#ffffff', 279900, 219900, 5, ARRAY['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1200&auto=format&fit=crop'])
ON CONFLICT (sku) DO NOTHING;

