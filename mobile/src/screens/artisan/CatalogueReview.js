import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

// Step 4: review / edit every AI field + translate (en/hi/bn) via regenerate-text.
// Unknowns stay editable-empty; nothing fabricated (no GI/award/origin claims).
export default function CatalogueReview({ navigation, route }) {
  const { image, aiResult, catalog, hint } = route.params;
  const { lang } = useAuth();
  const [form, setForm] = useState({
    name: catalog?.name || '',
    title: catalog?.title || '',
    description: catalog?.description || '',
    material: catalog?.material || '',
    craft_details: catalog?.craft_details || '',
    price: String(catalog?.suggested_max_price || catalog?.suggested_min_price || ''),
    quantity: '1',
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const translate = async (l) => {
    setBusy(true);
    try {
      const { data } = await api.post('/api/ai/regenerate-text', {
        image_url: aiResult?.image_enhancement?.original_url, language: l, hint,
      });
      const c = data.ai_catalog;
      setForm((f) => ({ ...f, name: c.name || f.name, title: c.title || f.title, description: c.description || f.description }));
    } catch (e) { Alert.alert('Translation failed', e.response?.data?.detail || e.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Review catalogue" subtitle="Step 4 of 5 — edit anything, translate anytime" />
        {[['name', 'Product name'], ['title', 'Marketplace title'], ['description', 'Description', true], ['material', 'Material'], ['craft_details', 'Craft technique', true]].map(([k, label, big]) => (
          <View key={k} style={{ marginBottom: 10 }}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={[styles.input, big && { minHeight: 90, textAlignVertical: 'top' }]} multiline={!!big}
              value={form[k]} onChangeText={(v) => set(k, v)} />
          </View>
        ))}
        <Text style={styles.label}>Translate listing</Text>
        <View style={styles.langRow}>
          {[['en', 'English'], ['hi', 'हिन्दी'], ['bn', 'বাংলা']].map(([l, label]) => (
            <TouchableOpacity key={l} style={[styles.lang, lang === l && styles.langActive]} onPress={() => translate(l)}>
              <Text style={styles.langT}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 12 }} />
        <PrimaryButton title="Continue → Fair Price" onPress={() => navigation.navigate('PriceRecommend', { image, aiResult, catalog, form })} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { fontWeight: '700', color: Colors.charcoal, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 52, paddingHorizontal: 14, fontSize: 15 },
  langRow: { flexDirection: 'row' },
  lang: { borderWidth: 1, borderColor: Colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, backgroundColor: '#fff' },
  langActive: { borderColor: Colors.terracotta },
  langT: { fontWeight: '600' },
});
