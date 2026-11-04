import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ruler, ShoppingBag, Heart, ShieldCheck, RefreshCw, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { MobileStorage } from '../../lib/store';
import { formatRupees, ClothingSize } from '@ramprs/shared';

const { width } = Dimensions.get('window');

export default function MobileProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      });
  }, [slug]);

  if (!product || !selectedVariant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>LOADING GARMENT...</Text>
      </View>
    );
  }

  const images = selectedVariant.images || ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518'];
  const variants = product.variants || [];

  const colors = Array.from(
    new Map(variants.map((v: any) => [v.color_name, { name: v.color_name, hex: v.color_hex }])).values()
  );

  const sizesForColor = variants.filter((v: any) => v.color_name === selectedVariant.color_name);

  const handleAddToCart = async () => {
    const cart = await MobileStorage.getCart();
    const existingIndex = cart.findIndex((i) => i.variant.id === selectedVariant.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ product, variant: selectedVariant, quantity: 1 });
    }
    await MobileStorage.saveCart(cart);
    Alert.alert('Added to Bag', `${product.title} (Size ${selectedVariant.size}) is in your shopping bag.`, [
      { text: 'Continue Shopping' },
      { text: 'View Bag', onPress: () => router.push('/bag') },
    ]);
  };

  const handleToggleWishlist = async () => {
    const list = await MobileStorage.getWishlist();
    const exists = list.some((p) => p.id === product.id);
    let updated;
    if (exists) {
      updated = list.filter((p) => p.id !== product.id);
      setIsWishlisted(false);
    } else {
      updated = [...list, product];
      setIsWishlisted(true);
    }
    await MobileStorage.saveWishlist(updated);
  };

  const isLowStock = selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 3;
  const isOutOfStock = selectedVariant.stock_quantity <= 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full-width Swipeable Gallery */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {images.map((img: string, index: number) => (
            <Image key={index} source={{ uri: img }} style={styles.galleryImage} />
          ))}
        </ScrollView>

        <View style={styles.detailsContainer}>
          <View style={styles.badgeRow}>
            <Text style={styles.fitBadge}>{product.fit_type} SILHOUETTE</Text>
            <Text style={styles.skuText}>SKU: {selectedVariant.sku}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          {/* Pricing */}
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{formatRupees(selectedVariant.sale_price_paise)}</Text>
            {selectedVariant.mrp_paise > selectedVariant.sale_price_paise && (
              <Text style={styles.mrpPrice}>{formatRupees(selectedVariant.mrp_paise)}</Text>
            )}
            <Text style={styles.taxText}>(Inclusive of all taxes)</Text>
          </View>

          {/* Color Switcher */}
          <Text style={styles.label}>COLOR: {selectedVariant.color_name}</Text>
          <View style={styles.colorRow}>
            {colors.map((c: any) => (
              <TouchableOpacity
                key={c.name}
                onPress={() => {
                  const matched = variants.find((v: any) => v.color_name === c.name);
                  if (matched) setSelectedVariant(matched);
                }}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.hex },
                  selectedVariant.color_name === c.name && styles.colorDotActive,
                ]}
              />
            ))}
          </View>

          {/* Size Selector + Size Guide */}
          <View style={styles.sizeHeader}>
            <Text style={styles.label}>SIZE: {selectedVariant.size}</Text>
            <TouchableOpacity onPress={() => setSizeGuideOpen(true)} style={styles.sizeGuideButton}>
              <Ruler size={13} color="#ffffff" />
              <Text style={styles.sizeGuideText}>SIZE & FIT GUIDE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sizeGrid}>
            {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((sz) => {
              const v = sizesForColor.find((item: any) => item.size === sz);
              const isAvailable = v && v.stock_quantity > 0;
              const isSelected = selectedVariant.size === sz;

              return (
                <TouchableOpacity
                  key={sz}
                  disabled={!isAvailable}
                  onPress={() => {
                    if (v) setSelectedVariant(v);
                  }}
                  style={[
                    styles.sizeBox,
                    isSelected && styles.sizeBoxSelected,
                    !isAvailable && styles.sizeBoxDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeBoxText,
                      isSelected && styles.sizeBoxTextSelected,
                      !isAvailable && styles.sizeBoxTextDisabled,
                    ]}
                  >
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stock Indicator */}
          {isOutOfStock ? (
            <Text style={styles.outOfStock}>Sold Out</Text>
          ) : isLowStock ? (
            <Text style={styles.lowStock}>⚠️ Only {selectedVariant.stock_quantity} left in stock</Text>
          ) : (
            <Text style={styles.inStock}>● In Stock - Dispatches within 24 Hours</Text>
          )}

          {/* Fabric & Wash Care */}
          <View style={styles.accordion}>
            <Text style={styles.accordionTitle}>FABRIC & CARE SPECIFICATIONS</Text>
            <Text style={styles.accordionBody}>{product.fabric_care}</Text>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.trustItemText}>7-Day Size Exchange</Text>
            </View>
            <View style={styles.trustItem}>
              <ShieldCheck size={16} color="#ffffff" />
              <Text style={styles.trustItemText}>100% Luxury Indian Craft</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleToggleWishlist} style={styles.wishlistBarButton}>
          <Heart size={20} color={isWishlisted ? '#e11d48' : '#ffffff'} fill={isWishlisted ? '#e11d48' : 'none'} />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isOutOfStock}
          onPress={handleAddToCart}
          style={[styles.addToBagButton, isOutOfStock && styles.addToBagDisabled]}
        >
          <ShoppingBag size={16} color="#000000" />
          <Text style={styles.addToBagText}>
            {isOutOfStock ? 'OUT OF STOCK' : `ADD TO BAG (${formatRupees(selectedVariant.sale_price_paise)})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Size Guide Modal */}
      <Modal visible={sizeGuideOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RAMPRS SIZE & FIT GUIDE</Text>
              <TouchableOpacity onPress={() => setSizeGuideOpen(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.unitToggle}>
              <TouchableOpacity
                onPress={() => setUnit('inches')}
                style={[styles.unitButton, unit === 'inches' && styles.unitActive]}
              >
                <Text style={styles.unitText}>Inches</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUnit('cm')}
                style={[styles.unitButton, unit === 'cm' && styles.unitActive]}
              >
                <Text style={styles.unitText}>Centimeters</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {product.size_chart_json?.measurements?.map((m: any) => (
                <View key={m.size} style={styles.measurementRow}>
                  <Text style={styles.sizeCol}>{m.size}</Text>
                  <Text style={styles.measureCol}>Chest: {unit === 'inches' ? `${m.chest_in}"` : `${m.chest_cm} cm`}</Text>
                  <Text style={styles.measureCol}>Length: {unit === 'inches' ? `${m.length_in}"` : `${m.length_cm} cm`}</Text>
                  <Text style={styles.measureCol}>Shoulder: {unit === 'inches' ? `${m.shoulder_in}"` : `${m.shoulder_cm} cm`}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setSizeGuideOpen(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  gallery: {
    width,
    height: 480,
  },
  galleryImage: {
    width,
    height: 480,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fitBadge: {
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  skuText: {
    color: '#737373',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 12,
  },
  salePrice: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  mrpPrice: {
    color: '#737373',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  taxText: {
    color: '#737373',
    fontSize: 11,
  },
  label: {
    color: '#a3a3a3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#404040',
  },
  colorDotActive: {
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  sizeGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeGuideText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sizeBox: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    alignItems: 'center',
  },
  sizeBoxSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sizeBoxDisabled: {
    opacity: 0.3,
  },
  sizeBoxText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sizeBoxTextSelected: {
    color: '#000000',
  },
  sizeBoxTextDisabled: {
    color: '#737373',
    textDecorationLine: 'line-through',
  },
  inStock: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },
  lowStock: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },
  outOfStock: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
  },
  accordion: {
    backgroundColor: '#141414',
    padding: 14,
    borderRadius: 6,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  accordionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  accordionBody: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 18,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustItemText: {
    color: '#d4d4d4',
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  wishlistBarButton: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToBagButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToBagDisabled: {
    backgroundColor: '#404040',
  },
  addToBagText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    borderRadius: 6,
    padding: 2,
    marginBottom: 16,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 4,
  },
  unitActive: {
    backgroundColor: '#ffffff',
  },
  unitText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  measurementRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  sizeCol: {
    width: 50,
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  measureCol: {
    flex: 1,
    color: '#a3a3a3',
    fontSize: 11,
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  doneText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
});

