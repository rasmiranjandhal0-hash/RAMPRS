import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, ShoppingBag } from 'lucide-react-native';
import { MobileStorage } from '../../lib/store';
import { Product, formatRupees } from '@ramprs/shared';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const loadWishlist = async () => {
    const list = await MobileStorage.getWishlist();
    setWishlist(list);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    const updated = wishlist.filter((p) => p.id !== productId);
    setWishlist(updated);
    await MobileStorage.saveWishlist(updated);
  };

  const handleMoveToBag = (product: Product) => {
    router.push(`/product/${product.slug}`);
  };

  if (wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>NO SAVED SILHOUETTES</Text>
        <Text style={styles.emptySubtitle}>Tap the heart on any drop to save garments for later review.</Text>
        <TouchableOpacity onPress={() => router.push('/shop')} style={styles.browseButton}>
          <Text style={styles.browseButtonText}>BROWSE CATALOG</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const variant = item.variants?.[0];
          const imgUrl = variant?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518';
          const price = variant?.sale_price_paise || 149900;

          return (
            <View style={styles.card}>
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: imgUrl }} style={styles.cardImage} />
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.price}>{formatRupees(price)}</Text>

              <TouchableOpacity
                onPress={() => handleMoveToBag(item)}
                style={styles.moveToBagButton}
              >
                <ShoppingBag size={12} color="#000000" />
                <Text style={styles.moveToBagText}>SELECT SIZE</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
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
  listContent: {
    padding: 8,
  },
  card: {
    width: (width - 24) / 2,
    margin: 4,
    marginBottom: 16,
  },
  cardImageContainer: {
    height: 220,
    backgroundColor: '#171717',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  price: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  moveToBagButton: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  moveToBagText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

