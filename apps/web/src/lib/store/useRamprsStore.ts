import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Product,
  ProductVariant,
  Coupon,
  calculateGstPaise,
  calculateShippingPaise,
} from '@ramprs/shared';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface RamprsState {
  cart: CartItem[];
  wishlist: Product[];
  appliedCoupon: Coupon | null;
  isCartDrawerOpen: boolean;

  // Actions
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;

  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;

  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  applyCoupon: (coupon: Coupon | null) => void;

  // Financial Calculators
  getSubtotalPaise: () => number;
  getDiscountPaise: () => number;
  getGstPaise: () => number;
  getShippingPaise: () => number;
  getTotalPaise: () => number;
}

export const useRamprsStore = create<RamprsState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      appliedCoupon: null,
      isCartDrawerOpen: false,

      openCartDrawer: () => set({ isCartDrawerOpen: true }),
      closeCartDrawer: () => set({ isCartDrawerOpen: false }),
      toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

      addToCart: (product, variant, quantity = 1) => {
        set((state) => {
          const existingIndex = state.cart.findIndex((item) => item.variant.id === variant.id);
          if (existingIndex > -1) {
            const updated = [...state.cart];
            const newQty = Math.min(
              variant.stock_quantity,
              updated[existingIndex].quantity + quantity
            );
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: newQty,
            };
            return { cart: updated, isCartDrawerOpen: true };
          }
          return {
            cart: [...state.cart, { product, variant, quantity }],
            isCartDrawerOpen: true,
          };
        });
      },

      removeFromCart: (variantId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.variant.id !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.variant.id !== variantId),
            };
          }
          return {
            cart: state.cart.map((item) => {
              if (item.variant.id === variantId) {
                const safeQty = Math.min(item.variant.stock_quantity, quantity);
                return { ...item, quantity: safeQty };
              }
              return item;
            }),
          };
        });
      },

      clearCart: () => set({ cart: [], appliedCoupon: null }),

      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.wishlist.some((p) => p.id === product.id);
          if (exists) {
            return { wishlist: state.wishlist.filter((p) => p.id !== product.id) };
          }
          return { wishlist: [...state.wishlist, product] };
        });
      },

      isInWishlist: (productId) => {
        return get().wishlist.some((p) => p.id === productId);
      },

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      getSubtotalPaise: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.variant.sale_price_paise * item.quantity, 0);
      },

      getDiscountPaise: () => {
        const { appliedCoupon } = get();
        const subtotal = get().getSubtotalPaise();
        if (!appliedCoupon) return 0;
        if (subtotal < appliedCoupon.min_order_paise) return 0;

        if (appliedCoupon.discount_type === 'PERCENTAGE') {
          const rawDiscount = Math.round((subtotal * Number(appliedCoupon.discount_value)) / 100);
          return appliedCoupon.max_discount_paise
            ? Math.min(rawDiscount, appliedCoupon.max_discount_paise)
            : rawDiscount;
        } else {
          return Math.round(Number(appliedCoupon.discount_value) * 100);
        }
      },

      getGstPaise: () => {
        const subtotal = get().getSubtotalPaise();
        const discount = get().getDiscountPaise();
        const taxable = Math.max(0, subtotal - discount);
        return calculateGstPaise(taxable, 12);
      },

      getShippingPaise: () => {
        const subtotal = get().getSubtotalPaise();
        const discount = get().getDiscountPaise();
        const taxable = Math.max(0, subtotal - discount);
        return calculateShippingPaise(taxable);
      },

      getTotalPaise: () => {
        const subtotal = get().getSubtotalPaise();
        const discount = get().getDiscountPaise();
        const taxable = Math.max(0, subtotal - discount);
        const shipping = get().getShippingPaise();
        return taxable + shipping;
      },
    }),
    {
      name: 'ramprs-cart-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);

