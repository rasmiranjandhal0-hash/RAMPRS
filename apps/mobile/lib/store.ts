import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Product,
  ProductVariant,
  Coupon,
  calculateGstPaise,
  calculateShippingPaise,
} from '@ramprs/shared';

export interface MobileCartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

const CART_STORAGE_KEY = 'ramprs_mobile_cart_v1';
const WISHLIST_STORAGE_KEY = 'ramprs_mobile_wishlist_v1';

export class MobileStorage {
  static async getCart(): Promise<MobileCartItem[]> {
    try {
      const data = await AsyncStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveCart(cart: MobileCartItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }

  static async getWishlist(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveWishlist(wishlist: Product[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.error('Failed to save wishlist:', err);
    }
  }
}

export function computeCartFinancials(cart: MobileCartItem[], coupon: Coupon | null) {
  const subtotalPaise = cart.reduce(
    (sum, item) => sum + item.variant.sale_price_paise * item.quantity,
    0
  );

  let discountPaise = 0;
  if (coupon && subtotalPaise >= coupon.min_order_paise) {
    if (coupon.discount_type === 'PERCENTAGE') {
      const raw = Math.round((subtotalPaise * Number(coupon.discount_value)) / 100);
      discountPaise = coupon.max_discount_paise ? Math.min(raw, coupon.max_discount_paise) : raw;
    } else {
      discountPaise = Math.round(Number(coupon.discount_value) * 100);
    }
  }

  const taxable = Math.max(0, subtotalPaise - discountPaise);
  const gstPaise = calculateGstPaise(taxable, 12);
  const shippingPaise = calculateShippingPaise(taxable);
  const totalPaise = taxable + shippingPaise;

  return {
    subtotalPaise,
    discountPaise,
    gstPaise,
    shippingPaise,
    totalPaise,
  };
}

