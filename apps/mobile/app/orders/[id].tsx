import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Truck, Package, RefreshCw, X, ShieldCheck } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { formatRupees, ClothingSize } from '@ramprs/shared';

export default function MobileOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [rmaModalOpen, setRmaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rmaType, setRmaType] = useState<'EXCHANGE' | 'RETURN'>('EXCHANGE');
  const [requestedSize, setRequestedSize] = useState<ClothingSize>('L');
  const [reason, setReason] = useState('');
  const [submittingRma, setSubmittingRma] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data);
      });
  }, [id]);

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>LOADING ORDER RECORD...</Text>
      </View>
    );
  }

  const getStep = (st: string) => {
    switch (st) {
      case 'PENDING':
      case 'PAID':
        return 1;
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStep(order.status);

  const handleOpenRma = (it: any) => {
    setSelectedItem(it);
    setRmaType('EXCHANGE');
    setRequestedSize('L');
    setReason('');
    setRmaModalOpen(true);
  };

  const handleSubmitRma = async () => {
    if (!reason) {
      Alert.alert('Required Field', 'Please provide a brief reason for the size exchange/return.');
      return;
    }

    try {
      setSubmittingRma(true);
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/rma/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || 'simulated_token'}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          order_item_id: selectedItem.id,
          type: rmaType,
          reason,
          requested_size: rmaType === 'EXCHANGE' ? requestedSize : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setRmaModalOpen(false);
      Alert.alert('Request Submitted', 'Our atelier logistics desk has received your request.');
    } catch (err: any) {
      Alert.alert('Submission Error', err.message);
    } finally {
      setSubmittingRma(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* Order Summary Header */}
      <View style={styles.headerCard}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.statusBadge}>{order.status}</Text>
        <Text style={styles.orderDate}>
          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </Text>
      </View>

      {/* Visual Tracking Timeline */}
      <View style={styles.trackingCard}>
        <Text style={styles.cardTitle}>DISPATCH & DELIVERY TIMELINE</Text>
        <View style={styles.stepLabels}>
          <Text style={[styles.stepText, currentStep >= 1 && styles.stepActive]}>1. PLACED</Text>
          <Text style={[styles.stepText, currentStep >= 2 && styles.stepActive]}>2. PACKED</Text>
          <Text style={[styles.stepText, currentStep >= 3 && styles.stepActive]}>3. SHIPPED</Text>
          <Text style={[styles.stepText, currentStep >= 4 && styles.stepActive]}>4. DELIVERED</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>

        {order.awb_tracking_number && (
          <View style={styles.awbBox}>
            <Truck size={14} color="#ffffff" />
            <Text style={styles.awbText}>
              {order.courier_name} AWB: <Text style={{ fontFamily: 'monospace', fontWeight: '800' }}>{order.awb_tracking_number}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Garments in Order */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ORDERED GARMENTS</Text>
        {order.items?.map((it: any) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{it.title_snapshot}</Text>
              <Text style={styles.itemSpecs}>
                Size: {it.size_snapshot} | Color: {it.color_snapshot} | Qty: {it.quantity}
              </Text>
              <Text style={styles.itemSku}>{it.sku_snapshot}</Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.itemPrice}>{formatRupees(it.total_price_paise)}</Text>
              <TouchableOpacity onPress={() => handleOpenRma(it)}>
                <Text style={styles.rmaLink}>Exchange / Return</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Price Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FINANCIAL SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryVal}>{formatRupees(order.subtotal_paise)}</Text>
        </View>
        {order.discount_paise > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#10b981' }]}>Discount</Text>
            <Text style={[styles.summaryVal, { color: '#10b981' }]}>-{formatRupees(order.discount_paise)}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST (12% Apparel Tax)</Text>
          <Text style={styles.summaryVal}>{formatRupees(order.gst_paise)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryVal}>{order.shipping_paise === 0 ? 'FREE' : formatRupees(order.shipping_paise)}</Text>
        </View>
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 8, marginTop: 4 }]}>
          <Text style={[styles.summaryLabel, { color: '#ffffff', fontWeight: '900' }]}>Total Paid ({order.payment_method})</Text>
          <Text style={[styles.summaryVal, { fontSize: 15, fontWeight: '900' }]}>{formatRupees(order.total_paise)}</Text>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>DELIVERY ADDRESS</Text>
        <Text style={styles.addressLine}>{order.shipping_address?.full_name}</Text>
        <Text style={styles.addressLine}>{order.shipping_address?.line1}</Text>
        <Text style={styles.addressLine}>
          {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
        </Text>
        <Text style={styles.addressLine}>Phone: +91 {order.shipping_address?.phone}</Text>
      </View>

      {/* Self-serve RMA Modal */}
      <Modal visible={rmaModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>7-DAY SIZE EXCHANGE / RETURN</Text>
              <TouchableOpacity onPress={() => setRmaModalOpen(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.itemTitle}>{selectedItem?.title_snapshot}</Text>
            <Text style={styles.itemSpecs}>Current Size: {selectedItem?.size_snapshot}</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setRmaType('EXCHANGE')}
                style={[styles.typeBtn, rmaType === 'EXCHANGE' && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, rmaType === 'EXCHANGE' && styles.typeBtnTextActive]}>
                  Size Exchange
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRmaType('RETURN')}
                style={[styles.typeBtn, rmaType === 'RETURN' && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, rmaType === 'RETURN' && styles.typeBtnTextActive]}>
                  Item Return
                </Text>
              </TouchableOpacity>
            </View>

            {rmaType === 'EXCHANGE' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Select Replacement Size</Text>
                <View style={styles.sizePillsRow}>
                  {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setRequestedSize(s)}
                      style={[styles.sizePill, requestedSize === s && styles.sizePillActive]}
                    >
                      <Text style={[styles.sizePillText, requestedSize === s && styles.sizePillTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Reason for Exchange or Return</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Chest is too loose, exchanging for size M."
              placeholderTextColor="#737373"
              style={styles.reasonInput}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              disabled={submittingRma}
              onPress={handleSubmitRma}
              style={styles.submitRmaBtn}
            >
              <Text style={styles.submitRmaText}>
                {submittingRma ? 'SUBMITTING...' : 'CONFIRM REQUEST'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  headerCard: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  orderNumber: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
  },
  statusBadge: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4,
  },
  orderDate: {
    color: '#737373',
    fontSize: 11,
    marginTop: 4,
  },
  trackingCard: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  cardTitle: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepText: {
    color: '#525252',
    fontSize: 10,
    fontWeight: '800',
  },
  stepActive: {
    color: '#ffffff',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  awbBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#1c1c1c',
    borderRadius: 4,
  },
  awbText: {
    color: '#ffffff',
    fontSize: 11,
  },
  card: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemSpecs: {
    color: '#a3a3a3',
    fontSize: 11,
    marginTop: 2,
  },
  itemSku: {
    color: '#525252',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  itemPrice: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  rmaLink: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#a3a3a3',
    fontSize: 12,
  },
  summaryVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addressLine: {
    color: '#d4d4d4',
    fontSize: 12,
    lineHeight: 18,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  typeBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  typeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  typeBtnTextActive: {
    color: '#000000',
  },
  label: {
    color: '#a3a3a3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sizePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    alignItems: 'center',
  },
  sizePillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sizePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  sizePillTextActive: {
    color: '#000000',
  },
  reasonInput: {
    backgroundColor: '#1c1c1c',
    color: '#ffffff',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    fontSize: 12,
    textAlignVertical: 'top',
  },
  submitRmaBtn: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitRmaText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

