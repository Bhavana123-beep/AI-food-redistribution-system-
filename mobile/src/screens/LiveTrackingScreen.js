import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { COLORS, STATUS_COLORS, SHADOWS } from '../theme';

const STEPS = ['Pending AI Match', 'Accepted', 'In Transit', 'Delivered'];

export default function LiveTrackingScreen() {
  const [inTransit, setInTransit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/donations');
      const active = (data.donations || []).filter(d => d.status !== 'Delivered');
      setInTransit(active);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (id) => {
    Alert.alert('Complete Delivery?', 'Mark this donation as Delivered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          try {
            await client.patch(`/donations/${id}/status`, { status: 'Delivered' });
            await load();
          } catch (e) { Alert.alert('Error', 'Could not update.'); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const stepIdx = STEPS.indexOf(item.status);
    return (
      <View style={styles.card}>
        <Text style={styles.foodName}>{item.foodItem}</Text>
        <Text style={styles.sub}>Qty: {item.quantity} · {item.type || 'Other'}</Text>

        {/* Progress Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]}>
                {i < stepIdx
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Text style={[styles.stepDotText, i <= stepIdx && { color: '#fff' }]}>{i + 1}</Text>}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < stepIdx && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.stepLabel}>{item.status}</Text>

        {item.status === 'In Transit' && (
          <TouchableOpacity style={styles.completeBtn} onPress={() => complete(item.id)}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.completeBtnText}>Simulate Delivery Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Live Tracking</Text>
      <Text style={styles.sub2}>{inTransit.length} active donation{inTransit.length !== 1 ? 's' : ''}</Text>
      <FlatList
        data={inTransit}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No active deliveries right now.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  sub2: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOWS.card },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  sub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center'
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 10 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  completeBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50 },
});
