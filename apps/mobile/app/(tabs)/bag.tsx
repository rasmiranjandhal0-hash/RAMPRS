import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Minus, Lock, Tag, ShieldCheck } from 'lucide-react-native';
import { MobileStorage, MobileCartItem, computeCartFinancials } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { formatRupees, Coupon } from '@ramprs/shared';

export default function BagScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<MobileCartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Address form fields
  const [fullName, setFullName] = useState('Arjun Mehta');
  const [phone, setPhone] = useState('9876543210');
  const [line1, setLine1] = useState('1402 Tower B, Lodha Park, Worli');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400018');

  const loadCart = async () => {
    const items = await MobileStorage.getCart();
    setCart(items);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (variantId: string, qty: number) => {
    let updated;
    if (qty <= 0) {
      updated = cart.filter((i) => i.variant.id !== variantId);
    } else {
      updated = cart.map((i) => (i.variant.id === variantId ? { ...i, quantity: qty } : i));
    }
    setCart(updated);
    await MobileStorage.saveCart(updated);
  };

  const removeItem = async (variantId: string) => {
    const updated = cart.filter((i) => i.variant.id !== variantId);
    setCart(updated);
    await MobileStorage.saveCart(updated);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'RAMPRS15') {
      setAppliedCoupon({
        id: 'c1',
        code: 'RAMPRS15',
        discount_type: 'PERCENTAGE',
        discount_value: 15,
        min_order_paise: 149900,
        max_discount_paise: 50000,
        used_count: 0,
        is_active: true,
      });
      setCouponCode('');
    } else {
      Alert.alert('Invalid Code', 'Try RAMPRS15 for 15% off.');
    }
  };

  const financials = computeCartFinancials(cart, appliedCoupon);

  const handleCheckout = async () => {
    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

      // 1. Create Order via Express API
      const res = await fetch(`${apiUrl}/api/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || 'simulated_mobile_token'}`,
        },
        body: JSON.stringify({
          items: cart.map((i) => ({
            variant_id: i.variant.id,
            quantity: i.quantity,
          })),
          shipping_address: {
            full_name: fullName,
            phone,
            line1,
            line2: '',
            city,
            state,
            pincode,
            country: 'India',
          },
          payment_method: 'PREPAID',
          coupon_code: appliedCoupon?.code,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to place order');
      }

      // 2. Mobile Instant Verification
      await fetch(`${apiUrl}/api/checkout/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || 'simulated_mobile_token'}`,
        },
        body: JSON.stringify({
          order_id: orderData.order_id,
          gateway_order_id: orderData.gateway_order_id || 'ORDER_MOBILE',
          gateway_payment_id: `pay_mobile_${Date.now()}`,
          gateway_signature: 'simulated_success',
        }),
      });

      // Clear cart
      await MobileStorage.saveCart([]);
      setCart([]);

      Alert.alert(
        'Order Confirmed! 🎉',
        `Your order #${orderData.order_number} has been placed. Tap below to track its atelier status.`,
        [
          {
            text: 'Track Order',
            onPress: () => router.push(`/orders/${orderData.order_id}`),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Payment simulation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>YOUR SHOPPING BAG IS EMPTY</Text>
        <Text style={styles.emptySubtitle}>Explore our seasonal streetwear archives to begin.</Text>
        <TouchableOpacity onPress={() => router.push('/shop')} style={styles.browseButton}>
          <Text style={styles.browseButtonText}>DISCOVER DROPS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Items List */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionHeader}>BAG ITEMS ({cart.reduce((s, i) => s + i.quantity, 0)})</Text>
        {cart.map(({ product, variant, quantity }) => (
          <View key={variant.id} style={styles.itemRow}>
            <Image
              source={{ uri: variant.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <TouchableOpacity onPress={() => removeItem(variant.id)}>
                  <Trash2 size={15} color="#737373" />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemVariantText}>
                Size: {variant.size} | Color: {variant.color_name}
              </Text>
              <Text style={styles.itemSku}>{variant.sku}</Text>

              <View style={styles.itemBottomRow}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity onPress={() => updateQuantity(variant.id, quantity - 1)} style={styles.qtyBtn}>
                    <Minus size={12} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(variant.id, quantity + 1)} style={styles.qtyBtn}>
                    <Plus size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemPrice}>{formatRupees(variant.sale_price_paise * quantity)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Coupon Application */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeader}>PROMOTIONS & PRIVILEGE CODES</Text>
        {appliedCoupon ? (
          <View style={styles.appliedCouponRow}>
            <Text style={styles.couponAppliedText}>
              ✓ {appliedCoupon.code} Applied (-{formatRupees(financials.discountPaise)})
            </Text>
            <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
              <Text style={styles.removeCouponText}>REMOVE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponInputRow}>
            <TextInput
              placeholder="Promo Code (e.g. RAMPRS15)"
              placeholderTextColor="#737373"
              value={couponCode}
              onChangeText={setCouponCode}
              style={styles.couponInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity onPress={handleApplyCoupon} style={styles.applyCouponBtn}>
              <Text style={styles.applyCouponText}>APPLY</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Shipping Address Summary */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeader}>DELIVERING TO</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.addressInput}
          placeholder="Full Name"
          placeholderTextColor="#737373"
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.addressInput}
          placeholder="Phone Number"
          placeholderTextColor="#737373"
          keyboardType="phone-pad"
        />
        <TextInput
          value={line1}
          onChangeText={setLine1}
          style={styles.addressInput}
          placeholder="Address Line 1"
          placeholderTextColor="#737373"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={city}
            onChangeText={setCity}
            style={[styles.addressInput, { flex: 1 }]}
            placeholder="City"
            placeholderTextColor="#737373"
          />
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            style={[styles.addressInput, { flex: 1 }]}
            placeholder="PIN Code"
            placeholderTextColor="#737373"
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Price Summary */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionHeader}>ORDER TOTALS</Text>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Subtotal</Text>
          <Text style={styles.calcVal}>{formatRupees(financials.subtotalPaise)}</Text>
        </View>
        {financials.discountPaise > 0 && (
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: '#10b981' }]}>Discount</Text>
            <Text style={[styles.calcVal, { color: '#10b981' }]}>-{formatRupees(financials.discountPaise)}</Text>
          </View>
        )}
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>GST (12% Included)</Text>
          <Text style={styles.calcVal}>{formatRupees(financials.gstPaise)}</Text>
        </View>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Shipping</Text>
          <Text style={styles.calcVal}>{financials.shippingPaise === 0 ? 'FREE' : formatRupees(financials.shippingPaise)}</Text>
        </View>
        <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 10, marginTop: 4 }]}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalVal}>{formatRupees(financials.totalPaise)}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity
          disabled={submitting}
          onPress={handleCheckout}
          style={styles.checkoutButton}
        >
          <Lock size={16} color="#000" />
          <Text style={styles.checkoutButtonText}>
            {submitting ? 'PROCESSING...' : `PLACE ORDER (${formatRupees(financials.totalPaise)})`}
          </Text>
        </TouchableOpacity>
        <View style={styles.secureTextRow}>
          <ShieldCheck size={12} color="#737373" />
          <Text style={styles.secureText}>256-Bit SSL Encrypted Native UPI / Card Checkout</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  emptySubtitle: {
    color: '#737373',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  browseButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  itemsSection: {
    padding: 16,
  },
  sectionHeader: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  itemImage: {
    width: 70,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#1f1f1f',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    flex: 1,
  },
  itemVariantText: {
    color: '#a3a3a3',
    fontSize: 11,
    marginTop: 2,
  },
  itemSku: {
    color: '#525252',
    fontFamily: 'monospace',
    fontSize: 9,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#262626',
  },
  qtyBtn: {
    padding: 6,
  },
  qtyNum: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  itemPrice: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  cardSection: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626',
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    padding: 10,
    borderRadius: 4,
  },
  couponAppliedText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '800',
  },
  removeCouponText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    fontSize: 12,
  },
  applyCouponBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  applyCouponText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  addressInput: {
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    color: '#a3a3a3',
    fontSize: 12,
  },
  calcVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  grandTotalVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  checkoutButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  secureTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  secureText: {
    color: '#737373',
    fontSize: 10,
  },
});

