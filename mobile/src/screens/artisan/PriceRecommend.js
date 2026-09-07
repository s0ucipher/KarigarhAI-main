import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';

// Step 5: AI-Assisted Price Recommendation — labelled as a recommendation,
// never a guaranteed market price. Considers material + labour + time +
// margin; AI range seeds the defaults.
export default function PriceRecommend({ navigation, route }) {
  const { image, aiResult, catalog, form } = route.params;
  const [material, setMaterial] = useState('');
  const [labour, setLabour] = useState('');
  const [days, setDays] = useState('');
  const [price, setPrice] = useState(form.price || String(catalog?.suggested_max_price || ''));
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    if (!price) return Alert.alert('Set a price', 'Enter or accept the recommended price.');
    setBusy(true);
    try {
      const { data } = await api.post('/api/products', {
        name: form.name, title: form.title, description: form.description,
        category_id: catalog?.category_id || aiResult?.ai_catalog?.category_id || 1,
        material: form.material, craft_details: form.craft_details,
        tags: catalog?.tags || [], price: parseFloat(price),
        quantity: parseInt(qty, 10) || 1,
        original_image_url: aiResult?.image_enhancement?.original_url,
        enhanced_image_url: aiResult?.image_enhancement?.enhanced_url,
        ai_generated_meta: { ...(catalog || {}), price_basis: { material, labour, days } },
      });
      navigation.navigate('PublishedSuccess', { product: data.product || data });
    } catch (e) { Alert.alert('Publish failed', e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Fair price" subtitle="Step 5 of 5 — recommendation, you decide" />
        <View style={styles.rec}>
          <Text style={styles.recT}>🤖 AI-Assisted Price Recommendation</Text>
          <Text style={styles.recV}>₹{catalog?.suggested_min_price || '–'} – ₹{catalog?.suggested_max_price || '–'}</Text>
          {catalog?.ai_rationale ? <Text style={styles.recS}>{catalog.ai_rationale}</Text> : null}
          <Text style={styles.recS}>A suggestion based on craft type and your costs — not a guaranteed market price.</Text>
        </View>
        {[['Material cost ₹', material, setMaterial], ['Labour cost ₹', labour, setLabour], ['Days spent', days, setDays]].map(([ph, v, fn]) => (
          <TextInput key={ph} style={styles.input} keyboardType="numeric" placeholder={ph} value={v} onChangeText={fn} />
        ))}
        <Text style={styles.label}>Final price ₹</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
        <Text style={styles.label}>Stock quantity</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={qty} onChangeText={setQty} />
        <View style={{ height: 12 }} />
        <PrimaryButton title={busy ? 'Publishing…' : 'Publish Product'} onPress={publish} disabled={busy} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  rec: { backgroundColor: Colors.cream, borderRadius: Radius.md, padding: 16, borderWidth: 1, borderColor: Colors.line, marginBottom: 12 },
  recT: { fontWeight: '800', color: Colors.sageDeep },
  recV: { fontSize: 22, fontWeight: '800', color: Colors.terracottaDeep, marginVertical: 6 },
  recS: { fontSize: 13, color: Colors.brown, marginTop: 4 },
  label: { fontWeight: '700', color: Colors.charcoal, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 52, paddingHorizontal: 14, fontSize: 15, marginBottom: 4 },
});
