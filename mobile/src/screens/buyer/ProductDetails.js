import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import api, { imgUrl } from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, PrimaryButton } from '../../components/ui';

export default function ProductDetails({ navigation, route }) {
  const { id } = route.params;
  const [p, setP] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/api/products/${id}`).catch(() => ({}));
      setP(data.product || data || null);
    })();
  }, [id]);
  if (!p) return <Screen><Text style={{ color: Colors.muted }}>Loading craft…</Text></Screen>;
  const uri = imgUrl(p.enhanced_image_url || p.original_image_url);

  const addToCart = async () => {
    try {
      await api.post('/api/cart/add', { product_id: p.id, quantity: 1 });
      Alert.alert('Added to cart', p.title || p.name);
    } catch (e) { Alert.alert('Cart unavailable', e.response?.data?.detail || 'Please log in as a buyer.'); }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photo}>{uri ? <Image source={{ uri }} style={styles.img} /> : <Text style={styles.emoji}>🏺</Text>}</View>
        <Text style={styles.title}>{p.title || p.name}</Text>
        <Text style={styles.price}>₹{p.price}</Text>
        {p.material ? <Text style={styles.meta}>Material: {p.material}</Text> : null}
        {p.craft_details ? <Text style={styles.meta}>Technique: {p.craft_details}</Text> : null}
        <Text style={styles.desc}>{p.description}</Text>
        {p.seller_id ? (
          <TouchableOpacity style={styles.artisan} onPress={() => navigation.navigate('ArtisanProfile', { id: p.seller_id })}>
            <Text style={styles.artisanT}>👩‍🎨  Meet the maker →</Text>
          </TouchableOpacity>
        ) : null}
        <View style={{ height: 12 }} />
        <PrimaryButton title="Send Enquiry" onPress={() => navigation.navigate('EnquiryCreate', { product: p })} />
        <View style={{ height: 10 }} />
        <TouchableOpacity style={styles.secondary} onPress={addToCart}>
          <Text style={styles.secondaryT}>Add to Cart</Text>
        </TouchableOpacity>
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  photo: { height: 280, borderRadius: Radius.lg, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  emoji: { fontSize: 72 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.charcoal, marginTop: 12 },
  price: { fontSize: 22, fontWeight: '800', color: Colors.terracottaDeep, marginTop: 6 },
  meta: { fontSize: 13, color: Colors.brown, marginTop: 4 },
  desc: { fontSize: 14, color: Colors.charcoal, marginTop: 10, lineHeight: 21 },
  artisan: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14 },
  artisanT: { fontWeight: '700', color: Colors.sageDeep },
  secondary: { borderWidth: 1.5, borderColor: Colors.terracotta, borderRadius: Radius.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  secondaryT: { color: Colors.terracottaDeep, fontWeight: '700', fontSize: 16 },
});
