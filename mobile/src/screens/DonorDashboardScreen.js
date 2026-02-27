import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS, STATUS_COLORS, SHADOWS } from '../theme';

const SESSION_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Closed: '🔒' };

export default function DonorDashboardScreen() {
  const { user, signOut } = useAuth();
  const [donations, setDonations] = useState([]);
  const [session, setSession] = useState({ allowed: false, session: 'Loading...' });
  const [stats, setStats] = useState({ meals: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ foodItem: '', type: '', quantity: '', expiryTime: '' });

  const loadData = useCallback(async () => {
    try {
      const [donRes, sessRes] = await Promise.all([
        client.get('/donations'),
        client.get('/session-status'),
      ]);
      const list = donRes.data.donations || [];
      setDonations(list);
      setSession(sessRes.data);
      const meals = list.reduce((acc, d) => acc + (parseInt(d.quantity) || 0), 0);
      const active = list.filter(d => ['Pending AI Match', 'Accepted', 'In Transit'].includes(d.status)).length;
      setStats({ meals: Math.floor(meals * 0.8), active });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll session every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try { const r = await client.get('/session-status'); setSession(r.data); } catch (_) {}
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => {
    if (!session.allowed) {
      Alert.alert('Donations Closed', 'Food donation is allowed only during Breakfast (7-10 AM), Lunch (12-2 PM), and Dinner (7-10 PM).');
      return;
    }
    setModalVisible(true);
  };

  const submitDonation = async () => {
    if (!form.foodItem || !form.quantity) {
      Alert.alert('Missing fields', 'Please fill in at least Food Item and Quantity.'); return;
    }
    setSubmitting(true);
    try {
      await client.post('/donate', {
        foodItem: form.foodItem, type: form.type || 'Other',
        quantity: form.quantity, expiryTime: form.expiryTime,
        status: 'Pending AI Match',
      });
      setModalVisible(false);
      setForm({ foodItem: '', type: '', quantity: '', expiryTime: '' });
      await loadData();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to log donation.';
      Alert.alert('Error', msg);
    } finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Pending AI Match'];
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.foodName}>{item.foodItem || 'Unknown'}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardSub}>Qty: {item.quantity} · Session: {item.session || '—'}</Text>
        <Text style={styles.cardSub}>Expiry: {item.expiryTime || 'N/A'}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Donor'} 👋</Text>
          <Text style={styles.sessionRow}>
            {SESSION_ICONS[session.session] || '🕐'} Session: <Text style={{ color: session.allowed ? COLORS.primary : COLORS.danger, fontWeight: '700' }}>{session.session}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={styles.statNum}>{stats.meals}</Text>
          <Text style={styles.statLabel}>Meals Donated</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff3cd' }]}>
          <Text style={[styles.statNum, { color: '#856404' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
      </View>

      {/* Log Food Button */}
      <TouchableOpacity
        style={[styles.logBtn, !session.allowed && styles.logBtnDisabled]}
        onPress={openModal}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.logBtnText}>Log New Food</Text>
      </TouchableOpacity>

      {/* Listings */}
      <Text style={styles.sectionTitle}>Active Listings</Text>
      <FlatList
        data={donations}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No donations found. Log your first food item!</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Log Food Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log New Food Donation</Text>

            <TextInput style={styles.mInput} placeholder="Food item title" placeholderTextColor={COLORS.textMuted} value={form.foodItem} onChangeText={v => setForm(p => ({ ...p, foodItem: v }))} />
            <TextInput style={styles.mInput} placeholder="Type (e.g. Prepared Food)" placeholderTextColor={COLORS.textMuted} value={form.type} onChangeText={v => setForm(p => ({ ...p, type: v }))} />
            <TextInput style={styles.mInput} placeholder="Quantity (e.g. 20 servings)" placeholderTextColor={COLORS.textMuted} value={form.quantity} onChangeText={v => setForm(p => ({ ...p, quantity: v }))} />
            <TextInput style={styles.mInput} placeholder="Expiry time (e.g. 10:00 PM)" placeholderTextColor={COLORS.textMuted} value={form.expiryTime} onChangeText={v => setForm(p => ({ ...p, expiryTime: v }))} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitDonation} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  sessionRow: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn: { padding: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 16, ...SHADOWS.card },
  statNum: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    borderRadius: 12, height: 48, alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 20, ...SHADOWS.card
  },
  logBtnDisabled: { backgroundColor: '#95a5a6' },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.card },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 12, color: COLORS.textMuted },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  mInput: {
    backgroundColor: COLORS.bg, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, padding: 12, marginBottom: 10,
    fontSize: 14, color: COLORS.text
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  submitBtn: { flex: 1, height: 46, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});
