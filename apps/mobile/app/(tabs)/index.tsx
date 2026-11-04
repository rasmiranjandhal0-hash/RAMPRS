import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, Truck } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { formatRupees, Product } from '@ramprs/shared';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState('✨ FREE SHIPPING ON ORDERS ABOVE ₹999 | CODE: RAMPRS15 ✨');
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  const loadData = async () => {
    try {
      // 1. Fetch CMS
      const { data: cms } = await supabase.from('cms_settings').select('*').single();
      if (cms?.announcement_bar_text) {
        setAnnouncement(cms.announcement_bar_text);
      }

      // 2. Fetch Categories
      const { data: cats } = await supabase.from('categories').select('*').eq('is_active', true);
      if (cats) setCategories(cats);

      // 3. Fetch Featured Products
      const { data: prods } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('is_active', true)
        .limit(8);

      if (prods) setFeaturedProducts(prods);
    } catch (err) {
      console.error('Error loading mobile home data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Top Announcement Bar */}
      <View style={styles.announcementBar}>
        <Text style={styles.announcementText}>{announcement}</Text>
      </View>

      {/* Hero Lookbook Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/shop')}
        style={styles.heroCard}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <Sparkles size={12} color="#fbbf24" />
            <Text style={styles.badgeText}>AUTUMN / WINTER 2026</Text>
          </View>
          <Text style={styles.heroTitle}>HEAVYWEIGHT SILHOUETTES</Text>
          <Text style={styles.heroSubtitle}>240+ GSM dropped shoulder tees & relaxed tailoring.</Text>
          <View style={styles.heroCta}>
            <Text style={styles.heroCtaText}>EXPLORE THE DROP</Text>
            <ArrowRight size={14} color="#000" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Category Pills */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionSubtitle}>CURATED DROPS</Text>
        <Text style={styles.sectionTitle}>COLLECTIONS</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => router.push('/shop')}
            style={styles.categoryPill}
          >
            <Text style={styles.categoryText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Products Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionSubtitle}>SIGNATURE FITS</Text>
        <Text style={styles.sectionTitle}>NEW RELEASES</Text>
      </View>

      <View style={styles.productGrid}>
        {featuredProducts.map((p) => {
          const variant = p.variants?.[0];
          const imgUrl = variant?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518';
          const price = variant?.sale_price_paise || 149900;
          const mrp = variant?.mrp_paise || 199900;

          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${p.slug}`)}
              style={styles.productCard}
            >
              <View style={styles.productImageWrapper}>
                <Image source={{ uri: imgUrl }} style={styles.productImage} />
                <View style={styles.fitTag}>
                  <Text style={styles.fitTagText}>{p.fit_type}</Text>
                </View>
              </View>
              <Text style={styles.productTitle} numberOfLines={1}>
                {p.title}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.salePrice}>{formatRupees(price)}</Text>
                {mrp > price && <Text style={styles.mrpPrice}>{formatRupees(mrp)}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Trust Banner */}
      <View style={styles.trustBanner}>
        <Truck size={20} color="#a3a3a3" />
        <Text style={styles.trustTitle}>Free Express Shipping Across India</Text>
        <Text style={styles.trustSubtitle}>7-Day Doorstep Size Exchange Guarantee</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  announcementBar: {
    backgroundColor: '#171717',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  announcementText: {
    color: '#e5e5e5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroCard: {
    height: 420,
    width: width - 24,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    padding: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: '#d4d4d4',
    fontSize: 12,
    marginTop: 4,
  },
  heroCta: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  categoryScroll: {
    paddingLeft: 12,
  },
  categoryPill: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
  },
  productCard: {
    width: (width - 24) / 2,
    marginBottom: 16,
  },
  productImageWrapper: {
    height: 240,
    backgroundColor: '#171717',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fitTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  fitTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  salePrice: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  mrpPrice: {
    color: '#737373',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  trustBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: '#171717',
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 40,
  },
  trustTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  trustSubtitle: {
    color: '#737373',
    fontSize: 11,
  },
});

