import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, EmptyState } from '../../components/ui';

export default function Enquiries() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    const { data } = await api.get('/api/enquiries').catch(() => ({ data: [] }));
    setItems(data.enquiries || data || []);
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  return (
    <Screen>
      <AppHeader title="Enquiries" subtitle="Conversations with makers" />
      {items.length === 0 ? <EmptyState emoji="💬" title="No enquiries yet" subtitle="Open a product and tap ‘Send Enquiry’." /> : (
        <FlatList data={items} keyExtractor={(i) => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.prod}>{item.product_name || `Product #${item.product_id}`}</Text>
              <Text style={styles.msg}>{item.message}</Text>
              <Text style={styles.meta}>{item.status || 'sent'} · qty {item.quantity || 1}</Text>
            </View>
          )} />
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginBottom: 10 },
  prod: { fontWeight: '700', color: Colors.charcoal },
  msg: { color: Colors.charcoal, marginTop: 6, fontSize: 14 },
  meta: { color: Colors.muted, fontSize: 12, marginTop: 6 },
});
