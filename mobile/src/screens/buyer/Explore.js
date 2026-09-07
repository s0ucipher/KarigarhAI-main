import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import api from '../../api/client';
import { Categories } from '../../theme';
import { Screen, AppHeader, Chip, ProductCard, EmptyState } from '../../components/ui';
import { View } from 'react-native';

export default function Explore({ navigation }) {
  const [cat, setCat] = useState(null);
  const [products, setProducts] = useState([]);
  const load = async () => {
    const { data } = await api.get('/api/products', { params: cat ? { category: cat } : {} }).catch(() => ({ data: [] }));
    setProducts(data.products || data || []);
  };
  useEffect(() => { load(); }, [cat]);
  return (
    <Screen>
      <AppHeader title="Explore" subtitle="Browse by craft tradition" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Categories.map((c) => (
          <View key={c.slug} style={{ marginBottom: 8 }}>
            <Chip icon={c.icon} label={c.label} active={cat === c.slug} onPress={() => setCat(cat === c.slug ? null : c.slug)} />
          </View>
        ))}
      </View>
      {products.length === 0 ? <EmptyState title="No crafts in this view" subtitle="Try another category." /> : (
        <FlatList data={products} numColumns={2} keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      )}
    </Screen>
  );
}
