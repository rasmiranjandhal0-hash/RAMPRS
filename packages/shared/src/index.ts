import { z } from 'zod';

// ==============================================================================
// 1. Core Enumerations & Constants
// ==============================================================================

export const BRAND_NAME = 'RAMPRS' as const;
export const SKU_REGEX = /^RAMPRS-[A-Z0-9-]+$/;
export const DEEP_LINK_SCHEME = 'ramprs://' as const;

export const UserRoleEnum = z.enum(['customer', 'admin', 'staff']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ClothingSizeEnum = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
export type ClothingSize = z.infer<typeof ClothingSizeEnum>;

export const FitTypeEnum = z.enum(['SLIM', 'REGULAR', 'OVERSIZED', 'RELAXED']);
export type FitType = z.infer<typeof FitTypeEnum>;

export const OrderStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'RETURN_REQUESTED',
  'EXCHANGE_APPROVED',
  'REFUNDED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentMethodEnum = z.enum(['PREPAID', 'COD']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FLAT']);
export type DiscountType = z.infer<typeof DiscountTypeEnum>;

export const RmaTypeEnum = z.enum(['EXCHANGE', 'RETURN']);
export type RmaType = z.infer<typeof RmaTypeEnum>;

export const RmaStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'PICKUP_SCHEDULED',
  'COMPLETED',
  'REJECTED',
]);
export type RmaStatus = z.infer<typeof RmaStatusEnum>;

// ==============================================================================
// 2. Size Chart Contract
// ==============================================================================

export const SizeMeasurementSchema = z.object({
  size: ClothingSizeEnum,
  chest_in: z.number().positive(),
  waist_in: z.number().positive(),
  length_in: z.number().positive(),
  shoulder_in: z.number().positive(),
  chest_cm: z.number().positive(),
  waist_cm: z.number().positive(),
  length_cm: z.number().positive(),
  shoulder_cm: z.number().positive(),
});
export type SizeMeasurement = z.infer<typeof SizeMeasurementSchema>;

export const SizeChartSchema = z.object({
  measurements: z.array(SizeMeasurementSchema),
  model_height: z.string().optional(),
  model_wearing_size: ClothingSizeEnum.optional(),
  fit_notes: z.string().optional(),
});
export type SizeChart = z.infer<typeof SizeChartSchema>;

// ==============================================================================
// 3. Category & Catalog Schemas
// ==============================================================================

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  sku: z.string().regex(SKU_REGEX, 'SKU must match format RAMPRS-[A-Z0-9-]+'),
  size: ClothingSizeEnum,
  color_name: z.string().min(1, 'Color name is required'),
  color_hex: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Valid hex color required'),
  mrp_paise: z.number().int().positive('MRP must be positive integer paise'),
  sale_price_paise: z.number().int().positive('Sale price must be positive integer paise'),
  stock_quantity: z.number().int().nonnegative('Stock cannot be negative'),
  images: z.array(z.string().url()).min(1, 'At least one variant image is required'),
  created_at: z.string().optional(),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Product title is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().min(1, 'Description is required'),
  fabric_care: z.string().min(1, 'Fabric & care instructions are required'),
  fit_type: FitTypeEnum,
  size_chart_json: SizeChartSchema,
  category_id: z.string().uuid(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  category: CategorySchema.optional(),
  variants: z.array(ProductVariantSchema).optional(),
});
export type Product = z.infer<typeof ProductSchema>;

// ==============================================================================
// 4. Coupons & Promotions
// ==============================================================================

export const CouponSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(3).max(30).transform((val) => val.toUpperCase()),
  discount_type: DiscountTypeEnum,
  discount_value: z.number().positive(),
  min_order_paise: z.number().int().nonnegative().default(0),
  max_discount_paise: z.number().int().positive().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  used_count: z.number().int().nonnegative().default(0),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});
export type Coupon = z.infer<typeof CouponSchema>;

// ==============================================================================
// 5. Customer Profile & Addresses
// ==============================================================================

export const ShippingAddressSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian phone number required'),
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional().default(''),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required'),
  country: z.string().default('India'),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: UserRoleEnum.default('customer'),
  default_address: ShippingAddressSchema.nullable().optional(),
  created_at: z.string().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ==============================================================================
// 6. Orders, Items & Invoices
// ==============================================================================

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  sku_snapshot: z.string(),
  title_snapshot: z.string(),
  size_snapshot: ClothingSizeEnum,
  color_snapshot: z.string(),
  unit_price_paise: z.number().int().positive(),
  quantity: z.number().int().positive(),
  total_price_paise: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  user_id: z.string().uuid(),
  status: OrderStatusEnum,
  payment_method: PaymentMethodEnum,
  subtotal_paise: z.number().int().nonnegative(),
  discount_paise: z.number().int().nonnegative(),
  gst_paise: z.number().int().nonnegative(),
  shipping_paise: z.number().int().nonnegative(),
  total_paise: z.number().int().positive(),
  coupon_code: z.string().nullable().optional(),
  shipping_address: ShippingAddressSchema,
  gateway_order_id: z.string().nullable().optional(),
  gateway_payment_id: z.string().nullable().optional(),
  gateway_signature: z.string().nullable().optional(),
  courier_name: z.string().nullable().optional(),
  awb_tracking_number: z.string().nullable().optional(),
  tracking_url: z.string().url().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  items: z.array(OrderItemSchema).optional(),
});
export type Order = z.infer<typeof OrderSchema>;

// ==============================================================================
// 7. RMA (Exchange / Return)
// ==============================================================================

export const RmaRequestSchema = z.object({
  order_id: z.string().uuid('Order ID must be a valid UUID'),
  order_item_id: z.string().uuid('Order Item ID must be a valid UUID'),
  type: RmaTypeEnum,
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  requested_size: ClothingSizeEnum.optional(),
});
export type RmaRequest = z.infer<typeof RmaRequestSchema>;

export const RmaRecordSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  order_item_id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: RmaTypeEnum,
  reason: z.string(),
  requested_size: ClothingSizeEnum.nullable().optional(),
  status: RmaStatusEnum,
  admin_notes: z.string().nullable().optional(),
  created_at: z.string(),
  order: OrderSchema.optional(),
  item: OrderItemSchema.optional(),
});
export type RmaRecord = z.infer<typeof RmaRecordSchema>;

// ==============================================================================
// 8. CMS & Storefront Settings
// ==============================================================================

export const CmsBannerSchema = z.object({
  id: z.string().uuid().optional(),
  hero_title: z.string().min(1, 'Hero title is required'),
  hero_subtitle: z.string().min(1, 'Hero subtitle is required'),
  hero_image_url: z.string().url('Hero image must be a valid URL'),
  hero_cta_link: z.string().min(1, 'CTA link is required'),
  announcement_bar_text: z.string().min(1, 'Announcement bar text is required'),
  is_announcement_active: z.boolean().default(true),
  featured_lookbook_slug: z.string().optional(),
  updated_at: z.string().optional(),
});
export type CmsBanner = z.infer<typeof CmsBannerSchema>;

// ==============================================================================
// 9. API Request & Response Contracts
// ==============================================================================

export const CartItemRequestSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per item'),
});
export type CartItemRequest = z.infer<typeof CartItemRequestSchema>;

export const CreateOrderRequestSchema = z.object({
  items: z.array(CartItemRequestSchema).min(1, 'Cart cannot be empty'),
  shipping_address: ShippingAddressSchema,
  payment_method: PaymentMethodEnum,
  coupon_code: z.string().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CreateOrderResponseSchema = z.object({
  order_id: z.string().uuid(),
  order_number: z.string(),
  gateway_order_id: z.string().nullable(),
  amount_paise: z.number().int().positive(),
  currency: z.literal('INR'),
  key_id: z.string().nullable(),
  payment_method: PaymentMethodEnum,
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

export const VerifyPaymentRequestSchema = z.object({
  order_id: z.string().uuid(),
  gateway_order_id: z.string().min(1),
  gateway_payment_id: z.string().min(1),
  gateway_signature: z.string().min(1),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestSchema>;

export const OrderStatusUpdateSchema = z.object({
  status: OrderStatusEnum,
  courier_name: z.string().optional(),
  awb_tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional(),
});
export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>;

export const ResolveRmaRequestSchema = z.object({
  status: RmaStatusEnum,
  admin_notes: z.string().optional(),
  exchange_variant_id: z.string().uuid().optional(),
});
export type ResolveRmaRequest = z.infer<typeof ResolveRmaRequestSchema>;

// ==============================================================================
// 10. Financial & Money Utilities
// ==============================================================================

export function formatPaiseToInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(rupees);
}

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function calculateGstPaise(subtotalPaise: number, ratePercent = 12): number {
  return Math.round((subtotalPaise * ratePercent) / 100);
}

export function calculateShippingPaise(subtotalPaise: number, freeShippingThresholdPaise = 99900): number {
  // Free shipping above ₹999.00
  if (subtotalPaise >= freeShippingThresholdPaise) {
    return 0;
  }
  return 9900; // Flat ₹99.00 shipping
}

