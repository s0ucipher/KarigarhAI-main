import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api, { imgUrl } from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

// Step 2: AI Image Studio — POST /api/ai/upload-and-enhance (existing backend).
// Shows Original vs AI Enhanced. Enhancement never alters the product itself,
// only lighting / sharpness / vibrance via the Pillow pipeline.
export default function ImageStudio({ navigation, route }) {
  const { image } = route.params;
  const { lang } = useAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const enhance = async () => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: image.uri,
        name: image.fileName || 'craft.jpg',
        type: image.mimeType || 'image/jpeg',
      });
      form.append('language', lang);
      const { data } = await api.post('/api/ai/upload-and-enhance', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (e) {
      Alert.alert('Enhancement failed', e.response?.data?.detail || e.message);
    } finally { setBusy(false); }
  };

  const enh = result?.image_enhancement;
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="AI Image Studio" subtitle="Step 2 of 5 — original vs enhanced" />
        <Text style={styles.label}>Original</Text>
        <Image source={{ uri: image.uri }} style={styles.img} />
        {busy && <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.terracotta} />}
        {enh && (
          <>
            <Text style={styles.label}>✨ AI Enhanced</Text>
            <Image source={{ uri: imgUrl(enh.enhanced_url) }} style={styles.img} />
            <Text style={styles.metrics}>
              {enh.metrics?.lighting_improvement || '+24% lighting'} · {enh.metrics?.sharpness_gain || '+35% clarity'} · {enh.metrics?.studio_grade || 'Marketplace grade'}
            </Text>
          </>
        )}
        {!result
          ? <PrimaryButton title={busy ? 'Enhancing…' : '✨ Enhance Photo'} onPress={enhance} disabled={busy} />
          : <PrimaryButton title="Continue → Describe Product" onPress={() => navigation.navigate('VoiceDescribe', { image, aiResult: result })} />}
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { fontWeight: '800', color: Colors.charcoal, marginVertical: 8 },
  img: { width: '100%', height: 280, borderRadius: Radius.lg, backgroundColor: Colors.cream },
  metrics: { color: Colors.sageDeep, fontWeight: '600', marginVertical: 8 },
});
