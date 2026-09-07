import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../../api/client';
import { Colors } from '../../theme';
import { Screen, AppHeader, ProductCard } from '../../components/ui';

export default function ArtisanProfile({ navigation, route }) {
  const { id } = route.params;
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/api/seller/artisan/${id}`).catch(() => ({}));
      setProfile(data);
    })();
  }, [id]);
  const products = profile?.products || [];
  return (
    <Screen>
      <AppHeader title={profile?.artisan?.name || 'Artisan'} subtitle={profile?.artisan?.craft_specialization || ''} />
      {profile?.artisan?.story_bio ? <Text style={styles.bio}>{profile.artisan.story_bio}</Text> : null}
      <Text style={styles.section}>Crafts by this maker</Text>
      <FlatList data={products} numColumns={2} keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />} />
      <View style={{ height: 90 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  bio: { fontSize: 14, color: Colors.charcoal, lineHeight: 21, marginBottom: 10 },
  section: { fontSize: 16, fontWeight: '800', color: Colors.charcoal, marginVertical: 8 },
});
