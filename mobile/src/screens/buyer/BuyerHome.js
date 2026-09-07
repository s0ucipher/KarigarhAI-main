import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import api from '../../api/client';
import { Colors, Radius, Categories } from '../../theme';
import { Screen, AppHeader, SearchBar, Chip, ProductCard, EmptyState } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function BuyerHome({ navigation }) {
  const { lang, switchLang } = useAuth();
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const load = async (params = {}) => {
    try {
      const { data } = await api.get('/api/products', { params });
      setProducts(data.products || data || []);
    } catch { setProducts([]); }
  };
  useEffect(() => { load(); }, []);

  return (
    <Screen>
      <AppHeader
        title="Discover handmade crafts"
        subtitle="Directly from Indian artisans"
        right={<View style={styles.headerActions}>
          <TouchableOpacity accessibilityLabel="Notifications" onPress={() => navigation.navigate('Notifications')} style={styles.notification}>
            <Text style={styles.notificationT}>●</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchLang(lang === 'en' ? 'hi' : lang === 'hi' ? 'bn' : 'en')} style={styles.lang}>
            <Text style={styles.langT}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>}
      />
      <SearchBar value={q} onChangeText={setQ} onSubmit={() => navigation.navigate('Search', { q })} />
      <TouchableOpacity style={styles.promo} onPress={() => navigation.navigate('ExploreTab')}>
        <Text style={styles.promoT}>✨ AI-assisted artisan catalogues — every listing reviewed by its maker</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
        {Categories.map((c) => (
          <Chip key={c.slug} icon={c.icon} label={c.label} active={cat === c.slug}
            onPress={() => { setCat(c.slug); navigation.navigate('CategoryResults', { slug: c.slug, label: c.label }); }} />
        ))}
      </ScrollView>
      <Text style={styles.section}>Featured crafts</Text>
      {products.length === 0 ? (
        <EmptyState title="No crafts yet" subtitle="Pull together the backend seed data, then browse again." />
      ) : (
        <FlatList data={products.slice(0, 10)} numColumns={2} keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  notification: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  notificationT: { color: Colors.terracotta, fontSize: 20, lineHeight: 20 },
  lang: { backgroundColor: Colors.sageDeep, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  langT: { color: '#fff', fontWeight: '700' },
  promo: { backgroundColor: Colors.cream, borderRadius: Radius.md, padding: 12, marginTop: 10, borderWidth: 1, borderColor: Colors.line },
  promoT: { fontSize: 13, color: Colors.brown, fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '800', color: Colors.charcoal, marginVertical: 8 },
});
