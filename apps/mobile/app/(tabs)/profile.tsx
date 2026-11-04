import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Package, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { formatRupees } from '@ramprs/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserOrders(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserOrders(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
  };

  const handleSendOtp = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign-In Error', error.message);
    } else {
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Check your email inbox for the 6-digit login token.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Verification Failed', error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setOrders([]);
  };

  if (!session) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.brandTitle}>RAMPRS ATELIER</Text>
        <Text style={styles.brandSubtitle}>MEMBER SIGN-IN & PRIVILEGE ACCESS</Text>

        {!otpSent ? (
          <View style={styles.authForm}>
            <TextInput
              placeholder="Enter your email address"
              placeholderTextColor="#737373"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              disabled={loading}
              onPress={handleSendOtp}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>
                {loading ? 'SENDING CODE...' : 'SEND MAGIC CODE'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authForm}>
            <TextInput
              placeholder="Enter 6-Digit OTP Code"
              placeholderTextColor="#737373"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              style={styles.input}
            />
            <TouchableOpacity
              disabled={loading}
              onPress={handleVerifyOtp}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>
                {loading ? 'VERIFYING...' : 'CONFIRM & ENTER'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#a3a3a3', fontSize: 11 }}>Use Different Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* User Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={24} color="#000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{session.user.email}</Text>
          <Text style={styles.userTier}>RAMPRS Verified Member</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <LogOut size={16} color="#737373" />
        </TouchableOpacity>
      </View>

      {/* Orders Section */}
      <Text style={styles.sectionTitle}>MY ORDERS & ATELIER TRACKING</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Package size={24} color="#525252" />
          <Text style={styles.emptyOrdersText}>No past orders found</Text>
        </View>
      ) : (
        orders.map((o) => (
          <TouchableOpacity
            key={o.id}
            activeOpacity={0.8}
            onPress={() => router.push(`/orders/${o.id}`)}
            style={styles.orderCard}
          >
            <View style={styles.orderCardHeader}>
              <Text style={styles.orderNumber}>{o.order_number}</Text>
              <Text style={styles.orderStatus}>{o.status}</Text>
            </View>

            <Text style={styles.orderDate}>
              Placed on {new Date(o.created_at).toLocaleDateString('en-IN')}
            </Text>

            <View style={styles.orderItemsPreview}>
              {o.items?.map((it: any) => (
                <Text key={it.id} style={styles.itemLine}>
                  • {it.quantity}x {it.title_snapshot} ({it.size_snapshot})
                </Text>
              ))}
            </View>

            <View style={styles.orderCardFooter}>
              <Text style={styles.totalText}>Total: {formatRupees(o.total_paise)}</Text>
              <View style={styles.viewDetailsRow}>
                <Text style={styles.viewDetailsText}>Track & Details</Text>
                <ArrowRight size={12} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.supportBox}>
        <ShieldCheck size={16} color="#ffffff" />
        <Text style={styles.supportText}>
          Need help? Concierge available at concierge@ramprs.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 24,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  authForm: {
    gap: 12,
  },
  input: {
    backgroundColor: '#171717',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626',
    fontSize: 13,
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  userTier: {
    color: '#737373',
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    padding: 8,
  },
  sectionTitle: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  emptyOrders: {
    padding: 24,
    backgroundColor: '#141414',
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  emptyOrdersText: {
    color: '#737373',
    fontSize: 12,
  },
  orderCard: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 12,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 13,
  },
  orderStatus: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 11,
  },
  orderDate: {
    color: '#737373',
    fontSize: 11,
    marginTop: 4,
  },
  orderItemsPreview: {
    marginVertical: 10,
    gap: 2,
  },
  itemLine: {
    color: '#d4d4d4',
    fontSize: 11,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 10,
    marginTop: 4,
  },
  totalText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#141414',
    borderRadius: 6,
  },
  supportText: {
    color: '#a3a3a3',
    fontSize: 11,
  },
});

