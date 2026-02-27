import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { COLORS, SHADOWS } from '../theme';

const NOTIF_CONFIG = {
  'Accepted':   { icon: 'handshake-outline',     color: COLORS.blue,    title: 'AI Match Found!',         type: 'matches' },
  'In Transit': { icon: 'bicycle-outline',        color: COLORS.accent,  title: 'Volunteer In Transit',    type: 'deliveries' },
  'Delivered':  { icon: 'checkmark-circle-outline', color: COLORS.primary, title: 'Delivered Successfully', type: 'deliveries' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item, index }) => {
    const cfg = NOTIF_CONFIG[item.status];
    if (!cfg) return null;
    const isUnread = index < 2;
    return (
      <View style={[styles.card, isUnread && styles.unread]}>
        <View style={[styles.iconBox, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTop}>
            <Text style={styles.notifTitle}>{cfg.title}</Text>
            {isUnread && <View style={styles.dot} />}
          </View>
          <Text style={styles.notifBody}>
            {item.status === 'Accepted' ? `An NGO accepted your '${item.foodItem}' donation.` :
             item.status === 'In Transit' ? `A volunteer is transporting '${item.foodItem}'.` :
             `Your '${item.foodItem}' donation has been delivered!`}
          </Text>
          <Text style={styles.time}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>All caught up! No notifications yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, ...SHADOWS.card,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  dot: { width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  notifBody: { fontSize: 13, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 50 },
});
