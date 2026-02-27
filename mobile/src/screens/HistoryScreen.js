import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { COLORS, STATUS_COLORS, SHADOWS } from '../theme';

export default function HistoryScreen() {
  const [donations, setDonations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/donations');
      const delivered = (data.donations || []).filter(d => d.status === 'Delivered');
      setDonations(delivered);
      setFiltered(delivered);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(donations); return; }
    const q = search.toLowerCase();
    setFiltered(donations.filter(d => d.foodItem?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q)));
  }, [search, donations]);

  const totalMeals = donations.reduce((acc, d) => acc + Math.floor((parseInt(d.quantity) || 0) * 0.8), 0);

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Delivered'];
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.foodName}>{item.foodItem}</Text>
            <Text style={styles.sub}>Qty: {item.quantity} · {item.type || 'Other'}</Text>
            <Text style={styles.sub}>Session: {item.session || '—'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>✓ Delivered</Text>
          </View>
        </View>
        <Text style={styles.date}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Donation History</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={styles.statNum}>{donations.length}</Text>
          <Text style={styles.statLbl}>Completed</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#d4edda' }]}>
          <Text style={[styles.statNum, { color: '#155724' }]}>{totalMeals}</Text>
          <Text style={styles.statLbl}>Meals Saved</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No delivery history yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, borderRadius: 12, padding: 14, ...SHADOWS.card },
  statNum: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  statLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 12, height: 44,
    marginBottom: 14, ...SHADOWS.card
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOWS.card },
  cardRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  sub: { fontSize: 12, color: COLORS.textMuted },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50 },
});
