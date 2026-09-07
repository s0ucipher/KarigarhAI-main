import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import api from '../../api/client';
import { Screen, AppHeader, ProductCard, EmptyState } from '../../components/ui';

export default function CategoryResults({ navigation, route }) {
  const { slug, label } = route.params || {};
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/api/products', { params: { category: slug } }).catch(() => ({ data: [] }));
      setItems(data.products || data || []);
    })();
  }, [slug]);
  return (
    <Screen>
      <AppHeader title={label || 'Category'} subtitle="Crafts in this tradition" />
      {items.length === 0 ? <EmptyState title="Empty shelf" subtitle="No products listed here yet." /> : (
        <FlatList data={items} numColumns={2} keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      )}
    </Screen>
  );
}
