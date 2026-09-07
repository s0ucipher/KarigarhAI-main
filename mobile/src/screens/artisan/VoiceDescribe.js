import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

// Step 3: "Tell us about your product" — voice-first. The artisan speaks or
// types a short note; it becomes the `hint` for catalogue generation.
// Device STT is via the native keyboard mic; TTS playback via expo-speech.
export default function VoiceDescribe({ navigation, route }) {
  const { image, aiResult } = route.params;
  const { lang } = useAuth();
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);

  const listen = () => Speech.speak(hint || 'Please describe your product. For example: this is a handmade terracotta vase made with local clay over two days.', { language: lang === 'hi' ? 'hi' : lang === 'bn' ? 'bn' : 'en' });

  const generate = async () => {
    setBusy(true);
    try {
      // Reuse existing backend: regenerate-text with the voice/text hint.
      const image_url = aiResult?.image_enhancement?.original_url;
      const { data } = await api.post('/api/ai/regenerate-text', { image_url, language: lang, hint: hint || undefined });
      navigation.navigate('CatalogueReview', { image, aiResult, catalog: data.ai_catalog, hint });
    } catch (e) {
      // Offline fallback: continue with the first-pass catalog.
      if (aiResult?.ai_catalog) navigation.navigate('CatalogueReview', { image, aiResult, catalog: aiResult.ai_catalog, hint });
      else Alert.alert('Generation failed', e.response?.data?.detail || e.message);
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Describe your product" subtitle="Step 3 of 5 — speak or type, no long forms" />
        <View style={styles.example}>
          <Text style={styles.exT}>Try saying: “This is a handmade terracotta vase. I made it using local clay and it took me two days.”</Text>
        </View>
        <TextInput style={styles.box} multiline numberOfLines={5} value={hint} onChangeText={setHint}
          placeholder="Speak into your keyboard mic, or type here…" />
        <TouchableOpacity style={styles.listen} onPress={listen}>
          <Text style={styles.listenT}>🔊  Listen to instructions</Text>
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <PrimaryButton title={busy ? 'Generating…' : '✨ Generate Catalogue'} onPress={generate} disabled={busy} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  example: { backgroundColor: Colors.cream, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.line, marginBottom: 12 },
  exT: { color: Colors.brown, fontSize: 14, lineHeight: 20 },
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, fontSize: 16, minHeight: 140, textAlignVertical: 'top' },
  listen: { marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  listenT: { fontWeight: '700', color: Colors.sageDeep },
});
