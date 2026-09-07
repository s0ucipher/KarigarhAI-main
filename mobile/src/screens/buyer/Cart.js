import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton, EmptyState } from '../../components/ui';

export default function Cart({ navigation }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, delivery_fee: 0, total: 0 });
  const load = async () => {
    const { data } = await api.get('/api/cart').catch(() => null);
    if (data) setCart({ items: data.items || [], subtotal: data.subtotal || 0, delivery_fee: data.delivery_fee || 0, total: data.total || 0 });
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <Screen>
      <AppHeader title="Cart" subtitle="Free delivery over ₹999" />
      {cart.items.length === 0 ? <EmptyState emoji="🧺" title="Cart is empty" subtitle="Discover handmade crafts and add them here." /> : (
        <>
          <FlatList data={cart.items} keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={2}>{item.product_name || item.title}</Text>
                <Text style={styles.qty}>× {item.quantity} · ₹{item.unit_price || item.price}</Text>
              </View>
            )} />
          <Text style={styles.total}>Subtotal ₹{cart.subtotal} · Delivery ₹{cart.delivery_fee} · Total ₹{cart.total}</Text>
          <PrimaryButton title="Checkout" onPress={() => navigation.navigate('Checkout')} />
        </>
      )}
      <View style={{ height: 90 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginBottom: 10 },
  name: { fontWeight: '700', color: Colors.charcoal },
  qty: { color: Colors.muted, marginTop: 4 },
  total: { fontWeight: '800', color: Colors.charcoal, marginVertical: 12 },
});
