import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, EmptyState } from '../../components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    const dash = await api.get('/api/seller/dashboard').catch(() => null);
    const enq = await api.get('/api/enquiries').catch(() => ({ data: { enquiries: [] } }));
    setData({ dash: dash?.data, enquiries: enq?.data?.enquiries || enq?.data || [] });
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const stats = data?.dash?.stats || {};
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <AppHeader title="Dashboard" subtitle="Earnings, orders, enquiries" />
        <View style={styles.grid}>
          {[['Earnings ₹', stats.total_earnings ?? '–'], ['Total sales', stats.total_sales_count ?? '–'], ['Active orders', stats.active_orders_count ?? '–'], ['Products', stats.total_products ?? '–']].map(([l, v]) => (
            <View key={l} style={styles.stat}><Text style={styles.v}>{v}</Text><Text style={styles.l}>{l}</Text></View>
          ))}
        </View>
        <Text style={styles.section}>Recent enquiries</Text>
        {(data?.enquiries || []).length === 0 ? <EmptyState emoji="💬" title="No enquiries" subtitle="New buyer messages appear here." /> :
          (data.enquiries.slice(0, 5)).map((e) => (
            <View key={e.id} style={styles.card}><Text style={styles.msg}>{e.message}</Text><Text style={styles.meta}>{e.status || 'sent'}</Text></View>
          ))}
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16, margin: '1.5%' },
  v: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  l: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  section: { fontSize: 16, fontWeight: '800', color: Colors.charcoal, marginVertical: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginBottom: 10 },
  msg: { color: Colors.charcoal },
  meta: { color: Colors.muted, fontSize: 12, marginTop: 4 },
});
