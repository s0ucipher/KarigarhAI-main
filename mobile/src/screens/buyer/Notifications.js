import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { AppHeader, EmptyState, Screen } from '../../components/ui';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    const { data } = await api.get('/api/notifications').catch(() => ({ data: {} }));
    setItems(data.notifications || []);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <Screen>
      <AppHeader title="Notifications" subtitle="Updates from KalaSetu AI" />
      {items.length === 0 ? <EmptyState emoji="" title="You are all caught up" subtitle="Order and enquiry updates will appear here." /> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          renderItem={({ item }) => <View style={styles.card}><Text style={styles.title}>{item.title}</Text><Text style={styles.message}>{item.message}</Text></View>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginBottom: 10 },
  title: { fontWeight: '800', color: Colors.charcoal },
  message: { color: Colors.brown, marginTop: 5, lineHeight: 20 },
});
