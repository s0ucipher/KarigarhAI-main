import React, { useState } from 'react';
import { TextInput, StyleSheet, Alert } from 'react-native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';

export default function EnquiryCreate({ navigation, route }) {
  const { product } = route.params || {};
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!message.trim()) return Alert.alert('Add a message', 'Tell the artisan what you’d like to know.');
    setBusy(true);
    try {
      await api.post('/api/enquiries', {
        product_id: product?.id,
        seller_id: product?.seller_id,
        message: message.trim(),
        quantity: parseInt(qty, 10) || 1,
      });
      navigation.navigate('BuyerApp', { screen: 'EnquiriesTab' });
    } catch (e) {
      Alert.alert('Could not send', e.response?.data?.detail || e.message);
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppHeader title="Send enquiry" subtitle={product?.title || product?.name || ''} />
      <TextInput style={styles.box} multiline numberOfLines={5} placeholder="Namaste! I love this piece. Is it available in blue? What is delivery time to Pune?" value={message} onChangeText={setMessage} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Quantity" value={qty} onChangeText={setQty} />
      <PrimaryButton title={busy ? 'Sending…' : 'Send to Artisan'} onPress={send} disabled={busy} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, fontSize: 15, minHeight: 130, textAlignVertical: 'top', marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 52, paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
});
