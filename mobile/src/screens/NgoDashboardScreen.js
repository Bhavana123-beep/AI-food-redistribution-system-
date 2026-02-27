import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS, STATUS_COLORS, SHADOWS } from '../theme';

const NEXT_STATUS = {
  'Pending AI Match': 'Accepted',
  'Accepted': 'In Transit',
  'In Transit': 'Delivered',
};

export default function NgoDashboardScreen() {
  const { user, signOut } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await client.get('/donations');
      setDonations(data.donations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (id, newStatus) => {
    try {
      await client.patch(`/donations/${id}/status`, { status: newStatus });
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update status.');
    }
  };

  const confirmUpdate = (item) => {
    const next = NEXT_STATUS[item.status];
    if (!next) { Alert.alert('Done', 'This donation is already delivered.'); return; }
    Alert.alert(`Update to "${next}"?`, `Mark "${item.foodItem}" as ${next}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(item.id, next) },
    ]);
  };

  const pending = donations.filter(d => d.status !== 'Delivered');

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Pending AI Match'];
    const canAdvance = !!NEXT_STATUS[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.foodName}>{item.foodItem}</Text>
            <Text style={styles.sub}>Qty: {item.quantity} · Session: {item.session || '—'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        {canAdvance && (
          <TouchableOpacity style={styles.advanceBtn} onPress={() => confirmUpdate(item)}>
            <Ionicons name="arrow-forward-circle-outline" size={16} color="#fff" />
            <Text style={styles.advanceBtnText}>Move to {NEXT_STATUS[item.status]}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NGO Dashboard</Text>
          <Text style={styles.sub2}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut}><Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} /></TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={styles.statNum}>{pending.filter(d => d.status === 'Pending AI Match').length}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#cce5ff' }]}>
          <Text style={[styles.statNum, { color: COLORS.blue }]}>{pending.filter(d => d.status === 'In Transit').length}</Text>
          <Text style={styles.statLbl}>In Transit</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#d4edda' }]}>
          <Text style={[styles.statNum, { color: '#155724' }]}>{donations.filter(d => d.status === 'Delivered').length}</Text>
          <Text style={styles.statLbl}>Delivered</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Donations ({pending.length})</Text>
      <FlatList
        data={pending}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No active donations right now.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  sub2: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', ...SHADOWS.card },
  statNum: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  statLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.card },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  sub: { fontSize: 12, color: COLORS.textMuted },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  advanceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, marginTop: 10, alignSelf: 'flex-start',
  },
  advanceBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
});
