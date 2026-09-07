import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import api from '../../api/client';
import { Screen, AppHeader, SearchBar, ProductCard, EmptyState } from '../../components/ui';

export default function Search({ navigation, route }) {
  const [q, setQ] = useState(route.params?.q || '');
  const [results, setResults] = useState([]);
  const run = async () => {
    const { data } = await api.get('/api/products', { params: q ? { q } : {} }).catch(() => ({ data: [] }));
    setResults(data.products || data || []);
  };
  useEffect(() => { run(); }, []);
  return (
    <Screen>
      <AppHeader title="Search" subtitle="Find pottery, textiles, metal craft…" />
      <SearchBar value={q} onChangeText={setQ} onSubmit={run} />
      {results.length === 0 ? <EmptyState title="No matches" subtitle="Try ‘vase’, ‘silk’ or ‘brass’." /> : (
        <FlatList data={results} numColumns={2} keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      )}
    </Screen>
  );
}
