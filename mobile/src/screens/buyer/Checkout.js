import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { AppHeader, PrimaryButton, Screen } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

const emptyAddress = { full_name: '', phone: '', street: '', city: '', state: '', pincode: '' };

export default function Checkout({ navigation }) {
  const { user } = useAuth();
  const [address, setAddress] = useState({ ...emptyAddress, full_name: user?.name || '', phone: user?.phone || '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setAddress((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (Object.values(address).some((value) => !value.trim())) {
      Alert.alert('Delivery address needed', 'Please complete all address fields before placing the order.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/api/orders/checkout', { address, payment_method: paymentMethod });
      Alert.alert('Order placed', `Order ${data.order_number} is confirmed. The artisan has been notified.`, [
        { text: 'View cart', onPress: () => navigation.navigate('BuyerApp', { screen: 'CartTab' }) },
      ]);
    } catch (error) {
      Alert.alert('Checkout failed', error.response?.data?.detail || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader title="Checkout" subtitle="Delivery details and payment" />
        {Object.entries({ full_name: 'Full name', phone: 'Phone number', street: 'Street address', city: 'City', state: 'State', pincode: 'PIN code' }).map(([key, label]) => (
          <View key={key} style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <TextInput value={address[key]} onChangeText={(value) => update(key, value)} style={styles.input} keyboardType={key === 'phone' || key === 'pincode' ? 'phone-pad' : 'default'} />
          </View>
        ))}
        <Text style={styles.label}>Payment</Text>
        {['Cash on Delivery', 'UPI / QR', 'Card'].map((method) => (
          <TouchableOpacity key={method} style={[styles.method, paymentMethod === method && styles.selected]} onPress={() => setPaymentMethod(method)}>
            <Text style={styles.methodText}>{method}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 12 }} />
        <PrimaryButton title={busy ? 'Placing order...' : 'Place Order'} onPress={submit} disabled={busy} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 10 },
  label: { color: Colors.charcoal, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 50, paddingHorizontal: 14, color: Colors.charcoal },
  method: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginBottom: 8 },
  selected: { borderColor: Colors.terracotta, backgroundColor: Colors.cream },
  methodText: { color: Colors.charcoal, fontWeight: '600' },
});
