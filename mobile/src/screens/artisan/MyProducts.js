import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors } from '../../theme';
import { Screen, AppHeader, ProductCard, EmptyState } from '../../components/ui';

export default function MyProducts({ navigation }) {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    const { data } = await api.get('/api/seller/dashboard').catch(() => null);
    const list = data?.all_products || data?.recent_products || [];
    setItems(list);
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  return (
    <Screen>
      <AppHeader title="My Products" subtitle="Published crafts — tap to view" />
      {items.length === 0 ? <EmptyState emoji="🏺" title="No products yet" subtitle="Tap Create to list your first craft." /> : (
        <FlatList data={items} numColumns={2} keyExtractor={(i) => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
