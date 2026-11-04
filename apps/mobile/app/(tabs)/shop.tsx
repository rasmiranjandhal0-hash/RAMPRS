import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { formatRupees, ClothingSize } from '@ramprs/shared';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFit, setSelectedFit] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchesSize =
      !selectedSize ||
      p.variants?.some((v: any) => v.size === selectedSize);

    const matchesFit = !selectedFit || p.fit_type === selectedFit;

    return matchesSearch && matchesSize && matchesFit;
  });

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const fits = ['OVERSIZED', 'RELAXED', 'REGULAR', 'SLIM'];

  return (
    <View style={styles.container}>
      {/* Search & Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color="#737373" />
          <TextInput
            placeholder="Search silhouettes, fabrics..."
            placeholderTextColor="#737373"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color="#737373" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setFilterModalOpen(true)}
          style={[styles.filterButton, (selectedSize || selectedFit) && styles.filterButtonActive]}
        >
          <SlidersHorizontal size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const variant = item.variants?.[0];
          const imgUrl = variant?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518';
          const price = variant?.sale_price_paise || 149900;
          const mrp = variant?.mrp_paise || 199900;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${item.slug}`)}
              style={styles.card}
            >
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: imgUrl }} style={styles.cardImage} />
                <View style={styles.fitTag}>
                  <Text style={styles.fitText}>{item.fit_type}</Text>
                </View>
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.salePrice}>{formatRupees(price)}</Text>
                {mrp > price && <Text style={styles.mrpPrice}>{formatRupees(mrp)}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Filter Modal */}
      <Modal visible={filterModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTERS & ATTRIBUTES</Text>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Size Filter */}
            <Text style={styles.filterSectionTitle}>SIZE</Text>
            <View style={styles.pillRow}>
              {sizes.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSize(selectedSize === s ? null : s)}
                  style={[styles.sizePill, selectedSize === s && styles.pillActive]}
                >
                  <Text style={[styles.pillText, selectedSize === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fit Filter */}
            <Text style={styles.filterSectionTitle}>FIT SILHOUETTE</Text>
            <View style={styles.pillRow}>
              {fits.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setSelectedFit(selectedFit === f ? null : f)}
                  style={[styles.fitPill, selectedFit === f && styles.pillActive]}
                >
                  <Text style={[styles.pillText, selectedFit === f && styles.pillTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSize(null);
                  setSelectedFit(null);
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                style={styles.applyButton}
              >
                <Text style={styles.applyText}>VIEW ({filteredProducts.length})</Text>
              </TouchableOpacity>
            </View>
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
  searchBarContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 10,
  },
  filterButton: {
    backgroundColor: '#171717',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterButtonActive: {
    borderColor: '#ffffff',
    backgroundColor: '#262626',
  },
  listContent: {
    padding: 8,
  },
  card: {
    width: (width - 24) / 2,
    margin: 4,
    marginBottom: 16,
  },
  cardImageContainer: {
    height: 240,
    backgroundColor: '#171717',
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardImage: {
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
  fitText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  priceContainer: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  filterSectionTitle: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1c1c1c',
  },
  fitPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1c1c1c',
  },
  pillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  pillText: {
    color: '#e5e5e5',
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    alignItems: 'center',
  },
  resetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    alignItems: 'center',
  },
  applyText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

